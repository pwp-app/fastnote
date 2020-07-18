let widgets = [];
let widgets_noteid = [];

const {
    BrowserWindow
} = require('electron');

const electron = require('electron');
const ipc = require('electron').ipcMain;

let targetY = -1;

function createWidget(data) {
    let screenWidth = electron.screen.getPrimaryDisplay().size.width;
    if (targetY < 0){
        targetY = 18;
    }
    const conf = {
        x: screenWidth - 478,
        y: targetY,
        width: 460,
        height: 280,
        minWidth: 320,
        minHeight: 86,
        show: false,
        webPreferences: {
            nodeIntegration: true
        },
        resizable: true,
        transparent: true,
        skipTaskbar: true
    };
    if (process.platform == 'darwin')
        conf.titleBarStyle = 'hiddenInset';
    else
        conf.frame = false;

    let widget = new BrowserWindow(conf);
    widgets.push(widget);
    widgets_noteid.push(data.note.id);

    let viewpath;
    if (global.hotfix && global.hotfix.state !== 'close') {
        viewpath = global.hotfix.buildPath('desktopWidget.html');
    } else {
        viewpath = path.resolve(__dirname, '../public/desktopWidget.html');
    }
    widget.loadFile(viewpath);

    widget.on('close', ()=>{
        let widget_x = widget.getPosition()[0];
        let widget_y = widget.getPosition()[1];
        let screenWidth = electron.screen.getPrimaryDisplay().size.width;
        if (widget_x == screenWidth - 478){
            if (widget_y < targetY && widget_y >= 18){
                targetY = widget_y;
            }
        }
    });

    widget.on('closed', () => {
        let index = widgets.indexOf(widget);
        widgets.splice(index, 1);
        widgets_noteid.splice(index, 1);
        if (widgets.length < 1){
            targetY = -1;
        }
    });

    widget.on('ready-to-show', ()=>{
        ipc.once('widget-window-ready',()=>{
            widget.show();
        });
        ipc.once('widget-heightChange', (sender, height)=>{
            widget.setSize(widget.getSize()[0], height);
            targetY = targetY + height + 8;
        });
        ipc.once('widget-setMaxHeight', (sender, height)=>{
            widget.setMaximumSize(screenWidth, height);
        });
        widget.webContents.send('init', data.note);
    });

    widget.once('will-move', ()=>{
        let index = widgets.indexOf(widget);
        let widget_y = widgets[index].getPosition()[1];
        if (widget_y < targetY){
            targetY = widget_y;
        }
    });
}

ipc.on('widget-alwaysontop', (sender, data)=>{
    let index = widgets_noteid.indexOf(data);
    if (typeof widgets[index] != 'undefined' || widgets[index] != null){
        if (widgets[index].isAlwaysOnTop()){
            widgets[index].setAlwaysOnTop(false);
            widgets[index].webContents.send('setAlwaysOnTop', false);
        } else {
            widgets[index].setAlwaysOnTop(true);
            widgets[index].webContents.send('setAlwaysOnTop', true);
        }
    }
});

ipc.on('widget-lock', (sender, data)=>{
    let index = widgets_noteid.indexOf(data);
    if (typeof widgets[index] != 'undefined' || widgets[index] != null){
        if (widgets[index].isResizable()){
            widgets[index].setResizable(false);
            widgets[index].webContents.send('setLock', true);
        } else {
            widgets[index].setResizable(true);
            widgets[index].webContents.send('setLock', false);
        }
    }
});

ipc.on('reloadAllWidgets', ()=>{
    for (let i=0; i<widgets.length; i++){
        if (typeof widgets[i] != 'undefined' && widgets[i] != null) {
            widgets[i].webContents.send('readyToReload');
        }
    }
});

ipc.on('widget-reload-ready', (e, data)=>{
    e.sender.reload();
    e.sender.once('did-finish-load', () => {
        e.sender.send('init', data);
    });
});

ipc.on('closeAllWidgets', ()=>{
    for (var i = 0; i < widgets.length; i++) {
        if (typeof widgets[i] != 'undefined' && widgets[i] != null) {
            widgets[i].close();
        }
    }
    widgets = [];
    widgets_noteid = [];
});

var DesktopWidget = {
    getWindows: ()=>{
        return widgets;
    },
    getNoteIds: ()=>{
        return widgets_noteid;
    },
    create: (data)=>{
        let index = widgets_noteid.indexOf(data.note.id);
        if (index != -1){
            widgets[index].focus();
        } else {
            createWidget(data);
        }
    },
    updateEditNote: (data)=>{
        let note = data.note;
        let index = widgets_noteid.indexOf(note.id);
        if (index >= 0){
            if (typeof widgets[index] != 'undefined' && widgets[index] != null){
                widgets[index].webContents.send('update-edit-note', data.note);
            }
        }
    }
};

module.exports = DesktopWidget;