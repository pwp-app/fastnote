let wins_newnote = [];

const {
    BrowserWindow
} = require('electron');

//ipc主进程
const ipc = require('electron').ipcMain;
const path = require('path');

function createNewNoteWindow(data) {
    let win_newnote = null;
    let conf = {
        width: 620,
        height: 400,
        minWidth: 520,
        minHeight: 300,
        show: false,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true
        }
    };

    if (process.platform == 'darwin')
        conf.titleBarStyle = 'hiddenInset';
    else
        conf.frame = false;

    win_newnote = new BrowserWindow(conf);
    wins_newnote.push(win_newnote);

    let viewpath;
    if (global.hotfix && global.hotfix.state !== 'close') {
        viewpath = global.hotfix.buildPath('newnote.html');
    } else {
        viewpath = path.resolve(__dirname, '../public/newnote.html');
    }
    win_newnote.loadFile(viewpath);

    win_newnote.on('ready-to-show', () => {
        ipc.once('newnote-window-ready', () => {
            win_newnote.show();
        });
        if (data && data !== 'notalloc'){
            win_newnote.webContents.send('init-category', data);
        }
    });
    win_newnote.on('closed', () => {
        let index = wins_newnote.indexOf(win_newnote);
        wins_newnote[index] = null;
        wins_newnote.splice(index, 1);
    });
}

var newnoteWindow = {
    getWins: function () {
        return wins_newnote;
    },
    create: function (data) {
        createNewNoteWindow(data);
    }
};

module.exports = newnoteWindow;