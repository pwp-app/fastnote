let win_recycle = null;

//const import
const {
    BrowserWindow
} = require('electron');

//ipc主进程
const ipc = require('electron').ipcMain;

const app = require('electron').app;
const path = require('path');


var RecycleWindow = {
    create: function () {
        var conf = {
            width: 1200,
            height: 720,
            minWidth: 480,
            show: false
        };
        //标题栏的选用
        if (process.platform == 'darwin')
            conf.titleBarStyle = 'hiddenInset';
        else
            conf.frame = false;

        win_recycle = new BrowserWindow(conf);

        var viewpath = path.resolve(__dirname, '../views/recyclebin.html');
        win_recycle.loadFile(viewpath);

        if (indebug)
            win_recycle.webContents.openDevTools();

        win_recycle.on('closed', () => {
            win_recycle = null;
        })
        win_recycle.on('ready-to-show', () => {
            win_recycle.focus();
            win_recycle.show();
        });
    }
}

//ipc listen
ipc.on('recycle-note',function(sender,data){
    if (win_recycle!=null){
        win_recycle.webContents.send('recycle-note',data);  //pass recycled note when window is opened;
    }
});

ipc.on('reloadRecycleWindow',function(sender,data){
    if (win_recycle != null){
        win_recycle.reload();
    }
});

module.exports = RecycleWindow;