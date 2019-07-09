let widgets = [];
let widgets_noteid = [];

const {
    BrowserWindow
} = require('electron');

const electron = require('electron');
const ipc = require('electron').ipcMain;
const app = require('electron').app;
const path = require('path');

var targetY = -1;
function createWidget(data) {

    var widget = null;
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

    widget = new BrowserWindow(conf);
    widgets.push(widget);
    widgets_noteid.push(data.note.id);

    widget.loadFile(path.resolve(__dirname, '../public/desktopWidget.html'));

    if (indebug)
        widget.webContents.openDevTools();

    widget.on('close', ()=>{
        let widget_x = widget.getPosition()[0];
        let widget_y = widget.getPosition()[1];
        let screenWidth = electron.screen.getPrimaryDisplay().size.width;
        if (widget_x == screenWidth-478){
            if (widget_y < targetY && widget_y>=18){
                targetY = widget_y;
            }
        }
    });

    widget.on('closed', () => {
        let index = widgets.indexOf(widget);
        widgets.splice(index, 1);
        widgets_noteid.splice(index, 1);
    });

    widget.on('ready-to-show', ()=>{
        ipc.once('widget-window-ready',()=>{
            widget.show();
        });
        ipc.once('widget-heightChange', (sender, height)=>{
            widget.setSize(widget.getSize()[0], height);
            targetY = targetY + height + 8;
            if (height<800){
                widget.setMaximumSize(999999, height);
            }
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

ipc.on('closeAllWidgets', function () {
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
    }
};

module.exports = DesktopWidget;