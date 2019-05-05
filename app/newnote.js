let wins_newnote = [];

const {
    BrowserWindow
} = require('electron');

//ipc主进程
const ipc = require('electron').ipcMain;

const app = require('electron').app;
const path = require('path');

function createNewNoteWindow(data) {
    let win_newnote = null;
    var conf = {
        width: 600,
        height: 430,
        minWidth: 400,
        minHeight: 300,
        show: false
    };

    if (process.platform == 'darwin')
        conf.titleBarStyle = 'hiddenInset';
    else
        conf.frame = false;
}