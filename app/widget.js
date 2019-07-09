let widgets = [];
let widgets_noteid = [];
let widget = null;

const {
    BrowserWindow
} = require('electron');

const ipc = require('electron').ipcMain;
const app = require('electron').app;
const path = require('path');

function createWidget(data) {
    var conf = {
        width: 460,
        height: 280,
        minWidth: 320,
        minHeight: 108,
        show: false,
        webPreferences: {
            nodeIntegration: true
        },
        transparent: true
    };
    if (process.platform == 'darwin')
        conf.titleBarStyle = 'hiddenInset';
    else
        conf.frame = false;

    widget = new BrowserWindow(conf);
    widgets.push(widget);
    widgets_noteid.push(data.id);

    widget.loadFile(path.resolve(__dirname, '../public/desktopWidget.html'));

    if (indebug)
        widget.webContents.openDevTools();

    widget.on('closed', () => {
        let index = widgets.indexOf(widget);
        widgets[index] = null;
        widgets_noteid[index] = null;
    });

    widget.on('ready-to-show', ()=>{
        ipc.once('widget-window-ready',()=>{
            widget.show();
        });
        ipc.on('widget-heightChange', function(sender, height){
            widget.setSize(widget.getSize()[0], height);
            if (height<800){
                widget.setMaximumSize(999999, height);
            }
        });
        widget.webContents.send('init', data.note);
    });
}

ipc.on('closeAllWidgets', function () {
    for (var i = 0; i < widgets.length; i++) {
        if (widgets[i] != null) {
            widgets[i].close();
            widgets[i] = null;
            widgets_noteid[i] = null;
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
        let index = widgets_noteid.indexOf(data.id);
        if (index != -1){
            if (typeof widgets[index] == "undefined" || widgets[index] == null){
                widgets_noteid[index] = null;
                createWidget(data);
            } else {
                widgets[index].focus();
            }
        } else {
            createWidget(data);
        }
    }
};

module.exports = DesktopWidget;