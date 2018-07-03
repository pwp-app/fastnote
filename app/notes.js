//import electron-json-storage
const storage = require('electron-json-storage');

let textarea = $('#note-text');
let fs = require('fs');
let time = require('./tools/time.js');


//预设notesid
let notesid = 0;

//标记
let isNotesEmpty;

//获取notesid的数据
storage.get('notesid',function(error,data){
    if (error){
        notesid = 1;
        return;
    }
    //获取callback回传的json
    var notesid_json = data;
    //判断是否为空
    if (notesid_json == null || notesid_json == undefined){
        notesid = 1;
        return;
    }
    //parse Json，获取数据
    notesid_json = JSON.parse(notesid_json);
    notesid = notesid_json.id;
    console.log(notesid);
    if (notesid == null || notesid == undefined){
        notesid = 1;
    }
});

//判断是否存在notes文件夹，不存在代表没有笔记
if (!fs.existsSync('./notes/')){
    showNoteEmpty();
    isNotesEmpty = true;
    fs.mkdir('./notes/');
} else {
    fs.readdir('./notes/',function(err,fileArr){
        if (fileArr == undefined){
            showNoteEmpty();
            isNotesEmpty = true;
            return;
        }
        //目录是空的
        if (!fileArr[0]){
            showNoteEmpty();
            isNotesEmpty = true;
        } else {
            //目录不是空的，代表有笔记，执行初始化
            let countOffset = 0;
            fileArr.forEach(element => {
                fs.readFile('./notes/'+element,'utf-8',function(err,data){
                    if (err){
                        countOffset++;
                        throw(err);
                    }
                    var note_json = data;
                    if (note_json != undefined && note_json != null){
                        note_json = JSON.parse(note_json);
                        addNoteToArray(note_json.id,note_json.time,note_json.text);
                        if (notes.length == fileArr.length+countOffset){
                            //结束文件遍历，渲染列表
                            refreshNoteList();
                            //显示列表
                            showNoteList();
                        }
                    }
                });
            });
        }
    });
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