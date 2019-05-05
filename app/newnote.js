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
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    };

    if (process.platform == 'darwin')
        conf.titleBarStyle = 'hiddenInset';
    else
        conf.frame = false;

    win_newnote = new BrowserWindow(conf);
    wins_newnote.push(win_edit);

    var viewpath = path.resolve(__dirname, '../public/newnote.html');
    win_newnote.loadFile(viewpath);

    if (indebug)
        win_newnote.webContents.openDevTools();
    
    win_newnote.on('closed', () => {
        wins_newnote[wins_newnote.indexOf(win_newnote)] = null;
    })

    ipc.once('newnote-window-ready', () => {
        win_newnote.show();
    });
}

var newnoteWindow = {

}