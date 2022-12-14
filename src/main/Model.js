const sqlite3 = require('sqlite3')
const { access, constants, writeFile } = require('fs')
const { app } = require('electron')
const moment = require('moment')

class Model
{
    constructor()
    {
        this.db = null
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
            }
        })
    }
    initDB()
    {
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
        this.db.exec(`INSERT INTO schedule (last) VALUES (datetime('now', 'localtime'))`)
    }
    saveWord(args)
    {
        return new Promise((resolve, reject) => {
            try {
                this.db.prepare(`SELECT id FROM words WHERE word = $word`).get({
                    $word: args.word
                }, (err, row) => {
                    if (row) {
                        resolve(false)
                    } else {
                        this.db.prepare(`INSERT INTO words (word, translate, created, updated) VALUES($word, $translate, datetime('now', 'localtime'), datetime('now', 'localtime'))`).run({
                            $word: args.word,
                            $translate: args.translate
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
                this.db.prepare(`SELECT id, word, translate,
                    (success - fail) AS n,
                    (julianday('now') - julianday(updated)) AS diff
                    FROM words
                    WHERE n < 3
                    ORDER by updated ASC
                    LIMIT 10
                `)({
                }, (err, rows) => {
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
                this.db.prepare(`SELECT id, word, translate,
                    (success - fail) AS n,
                    (julianday('now') - julianday(updated)) AS diff
                    FROM words
                    WHERE n <= 5 AND diff > 1
                    ORDER by updated ASC
                    LIMIT 10
                `).all({
                }, (err, rows) => {
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
                this.db.prepare(`SELECT id, word, translate,
                    (success - fail) AS n,
                    (julianday('now') - julianday(updated)) AS diff
                    FROM words
                    WHERE n < 10 AND diff > 3
                    ORDER by updated ASC
                    LIMIT 10
                `).all({
                }, (err, rows) => {
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
                this.db.prepare(`SELECT id, word, translate,
                    (success - fail) AS n,
                    (julianday('now') - julianday(updated)) AS diff
                    FROM words
                    ORDER by RANDOM()
                    LIMIT 10
                `).all({
                }, (err, rows) => {
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
                this.db.prepare(`SELECT id FROM words WHERE id = $id AND translate = $translate`).get({
                    $id: args.id,
                    $translate: args.translate
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
            this.db.prepare(`SELECT last FROM schedule ORDER by last DESC LIMIT 1`).get({
            }, async (err, row) => {
                try {
                    if (row) {
                        const last = moment(row.last)
                        const now = moment()
                        const diff = now.diff(last, 'hours')
                        const words = await this.getWords()
                        if (words.priority === 1 && diff >= 3) {
                            this.db.prepare(`INSERT INTO schedule (last) VALUES (datetime('now', 'localtime'))`).run()
                            resolve(true)
                        } else if (words.priority > 1 && words.priority <= 3 && diff >= 24) {
                            this.db.prepare(`INSERT INTO schedule (last) VALUES (datetime('now', 'localtime'))`).run()
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
