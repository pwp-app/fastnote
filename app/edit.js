let win_edits = new Array();

const {
    BrowserWindow
} = require('electron');

//ipc主进程
const ipc = require('electron').ipcMain;

const app = require('electron').app;
const path = require('path');

function createEditWindow(data) {
    let win_edit = null;
    var conf = {
        width: 800,
        height: 430,
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
    win_edits.push(win_edit);

    var viewpath = path.resolve(__dirname, '../views/edit.html');
    win_edit.loadFile(viewpath);

    if (indebug)
        win_edit.webContents.openDevTools();

    win_edit.on('closed', () => {
        var index = win_edits.indexOf(win_edit);
        win_edits[index] = null; 
    })

    win_edit.on('ready-to-show', () => {
        win_edit.focus();
        win_edit.show();
        type = 'init';
        win_edit.webContents.send('message', {
            type,
            data
        });
    });
}

var editWindow = {
    showWindow: function(data){
        createEditWindow(data);
        ipc.on('editWindow-close',function(sys,data){
            win_edits[data].close();
        });
    },
    bindEditEvent: function(callback){
        ipc.on('update-edit-note',function(sys,data){
            if (typeof(callback)!='undefined'){
                callback(data);
            }
        });
    }
}

module.exports = editWindow;