const sqlite3 = require('sqlite3')
const { access, constants, writeFile } = require('fs')
const { app } = require('electron')
const moment = require('moment')

class Model
{
    constructor()
    {
        this.db = null
        this.settings = {}
        const db = app.getPath('userData') + '/engmem.db'
        access(db, constants.F_OK, (err) => {
            if (err) {
                writeFile(db, '', (err) => {
                    if (!err) {
                        this.db = new sqlite3.Database(db)
                        this.initDB()
                    }
                })
            } else {
                this.db = new sqlite3.Database(db)
                this.initDB()
            }
        })
    }
    initDB()
    {
        this.db.serialize(async () => {
            this.db.prepare(`
                CREATE TABLE IF NOT EXISTS words (
                    id INTEGER PRIMARY KEY,
                    word TEXT NOT NULL UNIQUE,
                    translate TEXT,
                    created DATETIME,
                    updated DATETIME,
                    success INTEGER DEFAULT 0,
                    fail INTEGER DEFAULT 0
                )
            `).run()
            this.db.prepare(`
                CREATE TABLE IF NOT EXISTS schedule (
                    id INTEGER PRIMARY KEY,
                    last DATETIME
                )
            `).run()
            this.db.prepare(`
                CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY,
                    key TEXT NOT NULL UNIQUE,
                    value TEXT NOT NULL
                )
            `).run()
            this.db.prepare(`SELECT count(id) as c FROM schedule`, (err) => null)
                .get((err, row) => {
                    if (row && row.c === 0) {
                        this.db.exec(`INSERT INTO schedule (last) VALUES (datetime('now', 'localtime'))`)
                    }
                })
            this.db.prepare(`SELECT id FROM settings WHERE key = $key`, (err) => null)
                .get({
                    $key: 'frequency'
                }, (err, row) => {
                    if (!row) {
                        this.db.exec(`INSERT INTO settings (key, value) VALUES ('frequency', 'medium')`)
                    }
                })
            this.db.prepare(`SELECT part FROM words`, (err) => {
                if (err) {
                    this.db.exec(`ALTER TABLE words ADD COLUMN part TEXT`)
                }
            })
        })
    }
    saveWord(args)
    {
        return new Promise((resolve, reject) => {
            try {
                this.db.prepare(`SELECT id FROM words WHERE word = $word`).get({
                    $word: args.word
                }, (err, row) => {
                    if (row) {
                        if (args.id !== 0) {
                            this.db.prepare(`UPDATE words SET word = $word, translate = $translate, part = $part WHERE id = $id`).run({
                                $word: args.word,
                                $translate: args.translate,
                                $part: args.part,
                                $id: args.id
                            })
                            resolve(true)
                        } else {
                            resolve(false)
                        }
                    } else {
                        this.db.prepare(`INSERT INTO words (word, translate, part, created, updated) VALUES($word, $translate, $part, datetime('now', 'localtime'), datetime('now', 'localtime'))`).run({
                            $word: args.word,
                            $translate: args.translate,
                            $part: args.part
                        })
                        resolve(true)
                    }
                })
            } catch(e) {
                reject()
            }
        })
    }
    getWordsPriority1()
    {
        return new Promise((resolve, reject) => {
            try {
                this.db.all(`SELECT id, word, translate, part, success, fail,
                    (success - fail) AS n,
                    (julianday('now') - julianday(updated)) AS diff
                    FROM words
                    WHERE n < 3
                    ORDER by n ASC, updated ASC
                    LIMIT ${this.settings['limit']}
                `, (err, rows) => {
                    resolve(rows)
                })
            } catch (e) {
                reject()
            }
        })
    }
    getWordsPriority2()
    {
        return new Promise((resolve, reject) => {
            try {
                this.db.all(`SELECT id, word, translate, part, success, fail,
                    (success - fail) AS n,
                    (julianday('now') - julianday(updated)) AS diff
                    FROM words
                    WHERE n <= 5 AND diff > ${this.settings['priority2']}
                    ORDER by n ASC, updated ASC
                    LIMIT ${this.settings['limit']}
                `, (err, rows) => {
                    resolve(rows)
                })
            } catch (e) {
                reject()
            }
        })
    }
    getWordsPriority3()
    {
        return new Promise((resolve, reject) => {
            try {
                this.db.all(`SELECT id, word, translate, part, success, fail,
                    (success - fail) AS n,
                    (julianday('now') - julianday(updated)) AS diff
                    FROM words
                    WHERE n < 10 AND diff > ${this.settings['priority3']}
                    ORDER by n ASC, updated ASC
                    LIMIT ${this.settings['limit']}
                `, (err, rows) => {
                    resolve(rows)
                })
            } catch (e) {
                reject()
            }
        })
    }
    getWordsPriority4()
    {
        return new Promise((resolve, reject) => {
            try {
                this.db.all(`SELECT id, word, translate, part, success, fail,
                    (success - fail) AS n,
                    (julianday('now') - julianday(updated)) AS diff
                    FROM words
                    ORDER by RANDOM()
                    LIMIT ${this.settings['limit']}
                `, (err, rows) => {
                    resolve(rows)
                })
            } catch (e) {
                reject()
            }
        })
    }
    getWords()
    {
        return new Promise(async (resolve, reject) => {
            let rows = []
            try {
                rows = await this.getWordsPriority1()
                if (rows.length > 0) {
                    resolve({
                        rows,
                        priority: 1
                    })
                    return
                }
                rows = await this.getWordsPriority2()
                if (rows.length > 0) {
                    resolve({
                        rows,
                        priority: 2
                    })
                    return
                }
                rows = await this.getWordsPriority3()
                if (rows.length > 0) {
                    resolve({
                        rows,
                        priority: 3
                    })
                    return
                }
                rows = await this.getWordsPriority4()
                if (rows.length > 0) {
                    resolve({
                        rows,
                        priority: 4
                    })
                    return
                }
                resolve({
                    rows,
                    priority: -1
                })
            } catch (e) {
                reject()
            }
        })
    }
    checkWord(args)
    {
        return new Promise((resolve, reject) => {
            try {
                this.db.prepare(`SELECT id FROM words WHERE id = $id AND translate LIKE $translate`).get({
                    $id: args.id,
                    $translate: `%${args.translate}%`
                }, (err, row) => {
                    if (row) {
                        resolve(true)
                        this.db.prepare(`UPDATE words SET success = success + 1, updated = datetime('now', 'localtime') WHERE id = $id`).run({
                            $id: args.id
                        })
                    } else {
                        resolve(false)
                        this.db.prepare(`UPDATE words SET fail = fail + 1, updated = datetime('now', 'localtime') WHERE id = $id`).run({
                            $id: args.id
                        })
                    }
                })
            } catch(e) {
                reject()
            }
        })
    }
    repeat()
    {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT last FROM schedule ORDER by last DESC LIMIT 1`, async (err, row) => {
                try {
                    if (row) {
                        const last = moment(row.last)
                        const now = moment()
                        const diff = now.diff(last, 'hours')
                        const words = await this.getWords()
                        if ((words.priority === 1 && diff >= this.settings['repeat1']) || (wirds.priority > 1 && diff >= this.settings['repeat2'])) {
                            resolve(true)
                        } else {
                            resolve(false)
                        }
                    } else {
                        resolve(false)
                    }
                } catch (e) {
                    reject()
                }
            })
        })
    }
    updateSchedule()
    {
        return new Promise((resolve, reject) => {
            try {
                this.db.prepare(`INSERT INTO schedule (last) VALUES (datetime('now', 'localtime'))`).run()
                resolve(true)
            } catch(e) {
                reject()
            }
        })
    }
    getSettings()
    {
        return new Promise((resolve, reject) => {
            try {
                this.db.all(`SELECT key, value FROM settings`, (err, rows) => {
                    let settings = rows.reduce((acc, item) => {
                        acc[item.key] = item.value
                        return acc
                    }, {})
                    switch (settings.frequency) {
                        case 'low':
                            this.settings['limit'] = 10
                            this.settings['priority2'] = 1
                            this.settings['priority3'] = 3
                            this.settings['repeat1'] = 3
                            this.settings['repeat2'] = 24
                        break
                        case 'medium':
                            this.settings['limit'] = 20
                            this.settings['priority2'] = 0.8
                            this.settings['priority3'] = 1.5
                            this.settings['repeat1'] = 2
                            this.settings['repeat2'] = 10
                        break
                        case 'high':
                            this.settings['limit'] = 30
                            this.settings['priority2'] = 0.2
                            this.settings['priority3'] = 0.7
                            this.settings['repeat1'] = 1
                            this.settings['repeat2'] = 3
                        break
                    }
                    resolve(settings)
                })
            } catch (e) {
                reject()
            }
        })
    }
    setSettings(args)
    {
        return new Promise((resolve, reject) => {
            try {
                this.db.prepare(`UPDATE settings SET value = $value WHERE $key = $key`).run({
                    $key: args.key,
                    $value: args.value
                })
                this.getSettings()
                resolve()
            } catch(e) {
                reject()
            }
        })
    }
    import(file)
    {
        return new Promise((resolve, reject) => {
            let n = 0
            let i = 0
            const db = new sqlite3.Database(file)
            db.all('SELECT * FROM words', (err, rows) => {
                if (err) {
                    reject(err)
                    return
                }
                if (rows.length === 0) {
                    resolve(0)
                    return
                }
                rows.forEach(async row => {
                    try {
                        const res = await this.saveWord({
                            word: row.word,
                            translate: row.translate
                        })
                        if (res) n++
                        i++
                        if (i === rows.length) resolve(n)
                    } catch (e) {
                        reject(e)
                    }
                })
            })
        })
    }
}

module.exports = Model
