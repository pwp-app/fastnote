//import electron-json-storage
const storage = require('electron-json-storage');

let textarea = $('#note-text');
let fs = require('fs');
let time = require('./tools/time.js');


//预设notesid
let notesid = 0;

//获取notesid的数据
storage.get('notesid',function(error,data){
    if (error){
        notesid = 1;
        return;
    }
    var notesid_json = data;
    if (notesid_json == null || notesid_json == undefined){
        notesid = 1;
        return;
    }
    notesid_json = JSON.parse(notesid_json);
    notesid = notesid_json.id;
    console.log(notesid);
    if (notesid == null || notesid == undefined){
        notesid = 1;
    }
});

if (!fs.existsSync('./notes/')){
    fs.mkdir('./notes/');
}

//绑定textarea的事件
textarea.keyup(function (e) {
    var ctrlKey = e.ctrlKey || e.metaKey;
    if (ctrlKey && e.keyCode == 13) {
        var text = textarea.val();
        if (text.trim() != null && text.trim()!="")
            saveNote(text.trim());
    }
});

//保存note为json
function saveNote(notetext) {
    var note = {
        id: notesid,
        time: time.getCurrentTime(),
        rawtime:time.getRawCurrentTime(),
        timezone: time.getTimeZone(),
        text: notetext
    }
    var json = JSON.stringify(note);
    fs.writeFile('./notes/' + time.getRawCurrentTime() + '.json', json, 'utf-8', function (err, data) {
        if (err) {
            console.log(data);
        } else {
            textarea.val('');
        }
    });
    notesid++;
    saveNotesId();
}

//保存ID
function saveNotesId(){
    var data = {
        id:notesid
    }
    storage.set('notesid',JSON.stringify(data));
}