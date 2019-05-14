let wins_decryption = [];
let decryption_noteid = [];

const {
    BrowserWindow
} = require('electron');

//ipc主进程
const ipc = require('electron').ipcMain;

const app = require('electron').app;
const path = require('path');

function createDecryptionWindow(data){
    let win_decryption = null;
    var conf = {
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    }
    if (process.platform == 'darwin')
        conf.titleBarStyle = 'hiddenInset';
    else
        conf.frame = false;

    win_decryption = new BrowserWindow(conf);
    wins_decryption.push(win_decryption);

    decryption_noteid.push(data.id);

    win_decryption.loadFile(path.resolve(__dirname, '../public/edit.html'));

    if (indebug)
        win_decryption.webContents.openDevTools();

    win_decryption.on('closed', ()=>{
        let index = wins_decryption.index(win_decryption);
        win_decryption[index] = null;
        decryption_noteid[index] = null;
    });

    win_decryption.on('ready-to-show', ()=>{
        ipc.once('decryption-window-ready',()=>{
            win_decryption.show();
        });
        win_decryption.webContents.send('init', data);
    });
}

var decryptionWindow = {
    getWins: function(){
        return wins_decryption;
    },
    show: function(data){
        let index = decryption_noteid.indexOf(data.id);
        if (index != -1){
            if (typeof wins_decryption[index] == "undefined" || wins_decryption[index] == null){
                decryption_noteid[index] = null;
                createDecryptionWindow(data);
            } else {
                wins_decryption[index].focus();
            }
        } else {
            createDecryptionWindow(data);
        }
    }
}

ipc.on('reloadAllEditWindow', function(){
    for (let i=0;i<wins_decryption;i++){
        
    }
});

module.exports = decryptionWindow;