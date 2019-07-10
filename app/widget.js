let widgets = [];
let widgets_noteid = [];
let widget = null;

const {
    BrowserWindow
} = require('electron');

const electron = require('electron');
const ipc = require('electron').ipcMain;
const app = require('electron').app;
const path = require('path');

var targetY = -1;
function createWidget(data) {
    let _widget = null;
    var screenWidth = electron.screen.getPrimaryDisplay().size.width;

    if (targetY < 0){
        targetY = 18;
    }
    var conf = {
        x: screenWidth-478,
        y: targetY,
        width: 460,
        height: 280,
        minWidth: 320,
        minHeight: 108,
        show: false,
        webPreferences: {
            nodeIntegration: true
        },
        transparent: true,
        skipTaskbar: true
    };
    if (process.platform == 'darwin')
        conf.titleBarStyle = 'hiddenInset';
    else
        conf.frame = false;

    _widget = new BrowserWindow(conf);
    widget = _widget;
    widgets.push(_widget);
    widgets_noteid.push(data.note.id);

    _widget.loadFile(path.resolve(__dirname, '../public/desktopWidget.html'));

    if (indebug)
    _widget.webContents.openDevTools();

    _widget.on('close', ()=>{
        let widget_x = _widget.getPosition()[0];
        let widget_y = _widget.getPosition()[1];
        let screenWidth = electron.screen.getPrimaryDisplay().size.width;
        if (widget_x == screenWidth-478){
            if (widget_y < targetY && widget_y>=18){
                targetY = widget_y;
            }
        }
    });

    _widget.on('closed', () => {
        let index = widgets.indexOf(_widget);
        widgets.splice(index, 1);
        widgets_noteid.splice(index, 1);
    });

    _widget.on('ready-to-show', ()=>{
        ipc.once('widget-window-ready',()=>{
            widget.show();
        });
        ipc.once('widget-heightChange', (sender, height)=>{
            widget.setSize(widget.getSize()[0], height);
            targetY = targetY + height + 8;
            //锁定最大高度
            if (height<400){
                widget.setMaximumSize(electron.screen.getPrimaryDisplay().size.width, height);
            }
        });
        ipc.once('widget-setMaxHeight', (sender, height)=>{
            widget.setMaximumSize(electron.screen.getPrimaryDisplay().size.width, height);
        });
        _widget.webContents.send('init', data.note);
    });

    _widget.once('will-move', ()=>{
        let index = widgets.indexOf(_widget);
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

ipc.on('closeAllWidgets', ()=>{
    for (var i = 0; i < widgets.length; i++) {
        if (widgets[i] != null) {
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