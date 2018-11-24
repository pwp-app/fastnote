let win_edits = new Array();
let edit_noteid = new Array();

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
        minWidth:480,
        minHeight:200,
        show: false
    };
    //标题栏的选用
    if (process.platform == 'darwin')
        conf.titleBarStyle = 'hiddenInset';
    else
        conf.frame = false;

    win_edit = new BrowserWindow(conf);
    win_edits.push(win_edit);
    //save ids
    edit_noteid.push(data.id);

    var viewpath = path.resolve(__dirname, '../views/edit.html');
    win_edit.loadFile(viewpath);

    if (indebug)
        win_edit.webContents.openDevTools();

    win_edit.on('closed', () => {
        var index = win_edits.indexOf(win_edit);
        win_edits[index] = null;
        edit_noteid[index] = null;
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
    getWins: function(){
        return win_edits;
    },
    showWindow: function(data){
        var index = edit_noteid.indexOf(data.id);
        if (index != -1){
            if (win_edits[index]==null){
                edit_noteid[index] = null;
                createEditWindow(data);
            } else {
                win_edits[index].focus();
            }
        } else {
            createEditWindow(data);
        }
    },
    bindEditEvent: function(callback){
        ipc.on('update-edit-note',function(sys,data){
            if (typeof(callback)!='undefined'){
                callback(data);
            }
        });
    }
};

ipc.on('closeAllEditWindow',function(event,data){
    for (var i=0;i<win_edits.length;i++){
        if (win_edits[i] != null){
            win_edits[i].close();
            win_edits[i] = null;
            edit_noteid[i] = null;
        }
    }
});
ipc.on('reloadAllEditWindow',function(event,data){
    for (var i=0;i<win_edits.length;i++){
        if (win_edits[i] != null){
            win_edits[i].send('readyToReload');
        }
    }
});
ipc.on('readyToReloadEditWindow',function(event,data){
    event.sender.reload();
    event.sender.once('did-finish-load', () => {
        var type = 'init';
        event.sender.send('message', {
            type,
            data
        });
    });
});
module.exports = editWindow;