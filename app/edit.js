let win_edits = [];
let edit_noteid = [];


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
        width: 600,
        height: 430,
        minWidth: 460,
        minHeight: 300,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
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

    var viewpath = path.resolve(__dirname, '../public/edit.html');
    win_edit.loadFile(viewpath);

    win_edit.on('closed', () => {
        let index = win_edits.indexOf(win_edit);
        win_edits[index] = null;
        edit_noteid[index] = null;
    });

    win_edit.on('ready-to-show', () => {
        let type = 'init';
        ipc.once('edit-window-ready', () => {
            win_edit.show();
        });
        win_edit.webContents.send('message', {
            type,
            data
        });
    });

    win_edit.on('minimize', () => {
        var windows = BrowserWindow.getAllWindows();
        for (let i = 0; i < windows.length; i++) {
            if (!windows[i].isMinimized()) {
                return;
            }
        }
        for (let i = 0; i < windows.length; i++) {
            windows[i].webContents.send('enable-lockscreen-minimize');
        }
    });

    win_edit.on('blur', () => {
        var windows = BrowserWindow.getAllWindows();
        if (BrowserWindow.getFocusedWindow() == null) {
            for (var i = 0; i < windows.length; i++) {
                windows[i].webContents.send('enable-lockscreen-blur');
            }
        }
    });
}

const editWindow = {
    getWins: function () {
        return win_edits;
    },
    show: function (data) {
        let index = edit_noteid.indexOf(data.id);
        if (index != -1) {
            if (win_edits[index] == null) {
                edit_noteid[index] = null;
                createEditWindow(data);
            } else {
                win_edits[index].focus();
            }
        } else {
            createEditWindow(data);
        }
    },
    bindEditEvent: function (callback) {
        ipc.on('update-edit-note', function (sender, data) {
            if (typeof (callback) !== 'undefined') {
                callback(data);
            }
        });
    },
    closeAll: () => {
        for (let i = 0; i < win_edits.length; i++) {
            if (win_edits[i] != null) {
                win_edits[i].close();
                win_edits[i] = null;
                edit_noteid[i] = null;
            }
        }
        win_edits = [];
        edit_noteid = [];
    },
    reloadAll: () => {
        for (let i = 0; i < win_edits.length; i++) {
            if (win_edits[i] != null) {
                win_edits[i].webContents.send('readyToReload');
            }
        }
    }
};

ipc.on('closeAllEditWindow', () => {
    editWindow.closeAll();
});

ipc.on('reloadAllEditWindow',() => {
    editWindow.reloadAll();
});

ipc.on('readyToReloadEditWindow', function (event, data) {
    event.sender.reload();
    event.sender.once('did-finish-load', () => {
        let type = 'init';
        event.sender.send('message', {
            type,
            data
        });
    });
});
module.exports = editWindow;