//import electron-json-storage
const storage = require('electron-json-storage');

let textarea = $('#note-text');
let fs = require('fs');
let time = require('../app/tools/time.js');

//import storage location
const remote = require('electron').remote;
const app = remote.app;
var storagePath = app.getPath('userData');

//预设notesid
let notesid = 0;

//标记
let isNotesEmpty;

//获取notesid的数据
storage.get('notesid', function (error, data) {
    if (error) {
        notesid = 1;
        return;
    }
    //获取callback回传的json
    var notesid_json = data;
    //判断是否为空
    if (notesid_json == null || typeof(notesid_json) == undefined) {
        notesid = 1;
        return;
    }
    //parse Json，获取数据
    notesid_json = JSON.parse(notesid_json);
    notesid = notesid_json.id;
    if (notesid == null || typeof(notesid) == undefined) {
        notesid = 1;
    }
});

readNoteFiles();

//绑定textarea的事件
let isComboKeyDown = false; //防止反复触发
textarea.keydown(function (e) {
    var ctrlKey = e.ctrlKey || e.metaKey;
    if (ctrlKey && e.keyCode == 13 && !isComboKeyDown) {
        isComboKeyDown = true;
        var text = textarea.val().trim();
        if (text != null && text != "")
            saveNote(text);
    }
});
//按键弹起解除锁
textarea.keyup(function (e) {
    var ctrlKey = e.ctrlKey || e.metaKey;
    if (e.keyCode == 13 || ctrlKey) {
        isComboKeyDown = false;
    }
});

//删除按钮事件绑定
let btn_deleteNote = $('#btn-deleteNote')
btn_deleteNote.click(function (){
    deleteNote(noteid_clicked);
    //隐藏右键菜单
    $('.rightclickmenu').attr('style', 'display:none;');
})

//删除note
function deleteNote(id){
    notes.every(function (note, i) {
        if (note.id == id) {
            var path;
            //检查offset
            if (note.offset>0){
                path = storagePath+'/notes/'+note.rawtime+'.'+note.offset+'.json';
            } else {
                path = storagePath+'/notes/'+note.rawtime+'.json';
            }
            if (fs.existsSync(path)){
                //删除文件
                fs.unlink(path,function (err){
                    if (err){
                        //文件删除失败
                        displayInfobar('error','文件删除失败');
                        console.error(err);
                        readNoteFiles();
                    } else {
                        //删除成功
                        deleteNoteFromArr(id);
                        //动画
                        $('#note_'+id).animateCss('fadeOutLeft',function(){
                            $('#note_'+id).remove();    //动画结束后删除div
                            if (notes.length <= 0){
                                showNoteEmpty_Anim();
                            }                            
                        })
                        displayInfobar('success','删除成功');
                    }
                })
            } else {
                displayInfobar('error','找不到文件，无法删除');
                readNoteFiles();
            }
            return false;
        } else {
            return true;
        }
    });
}

//封装在函数中
function readNoteFiles() {
    //重新读取需要清空notes Array
    clearNoteArray();
    //判断是否存在notes文件夹，不存在代表没有笔记
    if (!fs.existsSync(storagePath+'/notes/')) {
        showNoteEmpty();
        isNotesEmpty = true;
        fs.mkdirSync(storagePath+'/notes/');
    } else {
        fs.readdir(storagePath+'/notes/', function (err, fileArr) {
            if (typeof(fileArr) == undefined) {
                showNoteEmpty();
                isNotesEmpty = true;
                return;
            }
            //目录是空的
            if (!fileArr[0]) {
                showNoteEmpty();
                isNotesEmpty = true;
            } else {
                //目录不是空的，代表有笔记，执行初始化
                let countOffset = 0;
                fileArr.forEach(element => {
                    fs.readFile(storagePath+'/notes/' + element, 'utf-8', function (err, data) {
                        if (err) {
                            countOffset++;
                            throw (err);
                        }
                        var note_json = data;
                        if (typeof(note_json) != undefined && note_json != null) {
                            note_json = JSON.parse(note_json);
                            addNoteToArray(note_json.id, note_json.time, note_json.rawtime, note_json.text, note_json.offset, note_json.timezone);
                            if (notes.length == fileArr.length + countOffset) {
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
}

//保存note为json
function saveNote(notetext) {
    var alltime = time.getAllTime();
    //保存路径
    var path = storagePath+'/notes/' + alltime.rawTime + '.json';
    //计算文件的offset
    var offset = 0;
    if (fs.existsSync(path)) {
        offset++;
    }
    if (offset > 0) {
        path = storagePath+'/notes/' + alltime.rawTime + '.' + offset + '.json';
        while (fs.existsSync(path)) {
            offset++;
            path = storagePath+'/notes/' + alltime.rawTime + '.' + offset + '.json';
        }
    }
    //转换回车
    notetext = notetext.replace(/\n/g, '<br/>');
	notetext = notetext.replace(/\r\n/g, '<br/>');
    //构造note
    var note = {
        id: notesid,
        time: alltime.currentTime,
        rawtime: alltime.rawTime,
        timezone: time.getTimeZone(),
        text: notetext,
        offset: offset
    }
    var json = JSON.stringify(note);
    fs.writeFile(path, json, 'utf-8', function (err, data) {
        if (err) {
            console.log(data);
        } else {
            textarea.val('');
            displayInfobar('success','成功保存笔记');
        }
    });
    notesid++;
    saveNotesId();
    try {
        //把新增的note添加到array
        addNoteObjToArray(note);
        //如果是0到1则切换到列表页
        if (notes.length == 1){
            showNoteList();
        }
        //在顶部渲染Note
        renderNoteAtTop(note.id, note.time, note.text);
        //绑定事件
        bindRightClickEvent();
    } catch (e) {
        //出现错误则打印错误并刷新List
        console.error(e);
        //重新读取Notes
        readNoteFiles();
    }
}

//保存ID
function saveNotesId() {
    var data = {
        id: notesid
    }
    storage.set('notesid', JSON.stringify(data));
}