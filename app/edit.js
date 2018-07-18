let win_edit = null;

const {
    BrowserWindow
} = require('electron');

const app = require('electron').app;
const path = require('path');

function createAboutWindow() {
    var conf = {
        width: 600,
        height: 320,
        resizable: false,
        maximazable: false,
        show: false
    };
    //标题栏的选用
    if (process.platform == 'darwin')
        conf.titleBarStyle = 'hiddenInset';
    else
        conf.frame = false;

    win_edit = new BrowserWindow(conf);

    var viewpath = path.resolve(__dirname, '../views/edit.html');
    win_edit.loadFile(viewpath);

    if (indebug)
        win_edit.webContents.openDevTools();

    win_edit.on('closed', () => {
        win_edit = null;
    })
    win_edit.on('ready-to-show', () => {
        win_edit.focus();
        win_edit.show();
    });
}

var editWindow = {
    showWindow: function(){
        if (win_edit !== null) {
            if (win_edit.isMinimized()) {
                win_edit.restore();
            }
            win_edit.focus();
        } else {
            createAboutWindow();
        }
    },
    initContent: function(){

    }
}

module.exports = editWindow;