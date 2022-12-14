const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
    'electron',
    {
        send: (channel, args = null) => ipcRenderer.send(channel, args),
        on: (channel, listener) => ipcRenderer.on(channel, listener),
        invoke: (channel, args = null) => ipcRenderer.invoke(channel, args)
    }
)
