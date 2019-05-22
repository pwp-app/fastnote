let fs = require('fs');
let time = require('../app/tools/time.js');

//import storage location
const remote = require('electron').remote;
const app = remote.app;

var storagePath = app.getPath('userData');

var notesEdit = {
    //保存编辑的Note
    saveEditNote:function (data,callback){
        var note = data.note;
        var alltime = time.getAllTime();
        //保存路径
        var path;
        //检查offset
        if (note.offset>0){
            path = storagePath + (global.indebug?'/devTemp':'')+'/notes/'+note.rawtime+'.'+note.offset+'.json';
        } else {
            path = storagePath + (global.indebug?'/devTemp':'')+'/notes/'+note.rawtime+'.json';
        }
        //replace char
        //set time
        note.updatetime = alltime.currentTime;
        note.updaterawtime = alltime.rawTime;
        if (note.category == 'notalloc'){
            note.category = undefined;
        }
        //get json
        var json = JSON.stringify(note);
        fs.writeFile(path, json, 'utf-8', function (err, data) {
            if (err) {
                displayInfobar('error', i18n[current_i18n]['edit_error']);
                return;
            }
        });
        //callback
        if (typeof(callback)!='undefined'){
            callback(data);
        }
    }
}

module.exports = notesEdit;