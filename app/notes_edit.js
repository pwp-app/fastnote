let fs = require('fs');
let time = require('../app/tools/time.js');

//import storage location
const remote = require('electron').remote;
const app = remote.app;

var storagePath = app.getPath('userData');

var notesEdit = {
    //保存编辑的Note
    saveEditNote:function (note,callback){
        var alltime = time.getAllTime();
        //保存路径
        var path;
        //检查offset
        if (note.offset>0){
            path = storagePath+'/notes/'+note.rawtime+'.'+note.offset+'.json';
        } else {
            path = storagePath+'/notes/'+note.rawtime+'.json';
        }
        //replace char
        note.text = note.text.replace(/\n/g, '<br/>');
        note.text = note.text.replace(/\r\n/g, '<br/>');
        //set time
        note.updatetime = alltime.currentTime;
        note.updaterawtime = alltime.rawTime;
        //get json
        var json = JSON.stringify(note);
        fs.writeFile(path, json, 'utf-8', function (err, data) {
            if (err) {
                console.log(data);
                displayInfobar('error','保存编辑内容时发生错误。');
                return;
            }
        });
        //callback
        if (typeof(callback)!='undefined'){
            callback(note);
        }
    }
}

module.exports = notesEdit;