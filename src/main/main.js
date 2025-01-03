const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const {
    app,
    BrowserWindow,
    nativeImage,
    Tray,
    Menu,
    ipcMain,
    Notification,
    dialog
} = require('electron')
const moment = require('moment')

const key = 'dDCuyFQ3ZMHH6APC1EbWaLGaDVUHyrht'
const iv = 'EAlcOwXwYDFL6Zwa'

const Model = require('./Model.js');

class App
{
    constructor()
    {
        this.win = null
        this.tray = null
        this.disableNotification = false
        this.model = new Model()

        app.whenReady().then(() => {
            this.createWindow()
            this.initTray()
            this.initEvents()
        })

        app.on('window-all-closed', () => {
            app.quit()
        })
    }
    initTray()
    {
        this.tray = new Tray(nativeImage.createFromPath(path.join(__dirname, '../../images/icons/16.png')))
        this.tray.setToolTip('EngMem')
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Hide',
                click: () => {
                    this.win.hide()
                }
            },
            {
                label: 'Restore',
                click: () => {
                    this.win.show()
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Quit',
                click: () => {
                    this.win.close()
                }
            }
        ])
        this.tray.setContextMenu(contextMenu)
    }
    createWindow()
    {
        this.win = new BrowserWindow({
            width: 800,
            height: 600,
            icon: nativeImage.createFromPath(path.join(__dirname, '../../images/icons/512.png')),
            webPreferences: {
                preload: path.join(__dirname, '../renderer/scripts/preload.js')
            }
        })
        this.win.removeMenu()
        this.win.loadFile('src/renderer/index.html')
        this.win.webContents.once('did-finish-load', () => {
            this.initSchedule()
        })
    }
    initEvents()
    {
        ipcMain.handle('save-word', async (event, args) => {
            try {
                const res = await this.model.saveWord(args)
                return res
            } catch (e) {
                return false
            }
        })
        ipcMain.handle('get-words', async (event) => {
            try {
                const words = await this.model.getWords()
                return words.rows
            } catch (e) {
                return []
            }
        })
        ipcMain.handle('check-word', async (event, args) => {
            try {
                const res = await this.model.checkWord(args)
                return res
            } catch (e) {
                return false
            }
        })
        ipcMain.handle('get-settings', async (event) => {
            try {
                const settings = await this.model.getSettings()
                return settings
            } catch (e) {
                return {}
            }
        })
        ipcMain.handle('set-settings', async (event, args) => {
            try {
                const res = await this.model.setSettings(args)
                return true
            } catch (e) {
                return false
            }
        })
        ipcMain.handle('export-dump', (event) => {
            let url = dialog.showSaveDialogSync({
                defaultPath: `/engmem__${moment().format('DDMMYYYYHHmmss')}.txt`
            })
            if (url) {
                const fileName = app.getPath('userData') + '/engmem.db'
                const input = fs.createReadStream(fileName)
                const output = fs.createWriteStream(url)
                const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
                input.pipe(cipher).pipe(output)
            }
        })
        ipcMain.handle('import-dump', (event, args) => {
            const fileName = app.getPath('temp') + `/engmem_${moment().format('DDMMYYYYHHmmss')}.db`
            const input = fs.createReadStream(args.path)
            const output = fs.createWriteStream(fileName)
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
            input.pipe(decipher).pipe(output)
            return new Promise((resolve, reject) => {
                decipher.on('error', (err) => {
                    reject(err)
                })
                decipher.on('end', async () => {
                    try {
                        const rows = await this.model.import(fileName)
                        resolve(rows)
                    } catch (e) {
                        reject(e)
                    } finally {
                        fs.unlink(fileName, err => {
                        })
                    }
                })
            })
        })
        ipcMain.handle('start-repeat', async (event) => {
            this.disableNotification = true
        })
        ipcMain.handle('end-repeat', async (event) => {
            try {
                this.tray.setImage(nativeImage.createFromPath(path.join(__dirname, '../../images/icons/16.png')))
                this.disableNotification = false
                await this.model.updateSchedule()
                return true
            } catch (e) {
                return false
            }
        })
    }
    initSchedule()
    {
        const loop = async () => {
            if (this.disableNotification) {
                return
            }
            try {
                const res = await this.model.repeat()
                if (res) {
                    const notification = new Notification(
                        {
                            title: 'EngMem',
                            body: 'Time to repeat words!',
                            icon: nativeImage.createFromPath(path.join(__dirname, '../../images/icons/32.png'))
                        }
                    )
                    notification.on('click', (event, arg) => {
                        this.win.show()
                        this.win.webContents.send('open-repeat-section')
                    })
                    notification.show()
                    this.tray.setImage(nativeImage.createFromPath(path.join(__dirname, '../../images/icons/16a.png')))
                    this.win.webContents.send('time-to-repeat')
                }
            } catch (e) {
            }
        }
        const INTERVAL = 10 * 60 * 1000
        setInterval(loop, INTERVAL)
        loop()
    }
}

new App()
