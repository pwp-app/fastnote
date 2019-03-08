let textarea = $('#note-text');
let fs = require('fs');

var storagePath = app.getPath('userData');

//预设notesid
let notesid = 0;

//标记
let isNotesEmpty;

//获取notesid的数据
storage.get('notesid', function (error, data) {
    if (error) {
        notesid = 0;
        return;
    } else {
        //获取callback回传的json
        var notesid_json = data;
        if (typeof notesid_json.id  != 'undefined'){
            if (notesid_json.id >= 0){
                notesid = notesid_json.id;
            } else {
                notesid = 0;
            }
        } else {
            notesid = 0;
            return;
        }
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

//放入回收站
function putToRecyclebin(id, infoEnabled=true) {
    notes.every(function (note, i) {
        if (note.id == id) {
            var path;
            //暂存
            var note_temp = note;
            //检查offset
            if (note.offset > 0) {
                path = note.rawtime + '.' + note.offset + '.json';
            } else {
                path = note.rawtime + '.json';
            }
            if (fs.existsSync(storagePath + '/notes/' + path)) {
                if (fs.existsSync(storagePath + '/notes/recyclebin/')) {
                    fs.rename(storagePath + '/notes/' + path, storagePath + '/notes/recyclebin/' + path, function (err) {
                        if (err) {
                            displayInfobar('error', '放入回收站失败');
                            readNoteFiles();
                            throw (err);
                        } else {
                            //从数组里删除
                            deleteNoteFromArr(id);
                            //动画
                            $('#note_' + id).animateCss('fadeOutLeft', function () {
                                $('#note_' + id).parent().remove(); //动画结束后删除div
                                if (notes.length <= 0) {
                                    showNoteEmpty_Anim();
                                }
                            });
                            //send to main process
                            ipcRenderer.send('recycle-note', note_temp);
                            if (infoEnabled){
                                displayInfobar('success', '已放入回收站');
                            }
                        }
                    });
                } else {
                    fs.mkdirSync(storagePath + '/notes/recyclebin/');
                    fs.rename(storagePath + '/notes/' + path, storagePath + '/notes/recyclebin/' + path, function (err) {
                        if (err) {
                            if (infoEnabled){
                                displayInfobar('error', '放入回收站失败');
                            }
                            readNoteFiles();
                            throw (err);
                        } else {
                            console.log(id);
                            //从数组里删除
                            deleteNoteFromArr(id);
                            //动画
                            $('#note_' + id).animateCss('fadeOutLeft', function () {
                                $('#note_' + id).parent().remove(); //动画结束后删除div
                                if (notes.length <= 0) {
                                    showNoteEmpty_Anim();
                                }
                            });
                            //send to main process
                            ipcRenderer.send('recycle-note', note_temp);
                            if (infoEnabled){
                                displayInfobar('success', '已放入回收站');
                            }
                        }
                    });
                }
            } else {
                if (infoEnabled){
                    displayInfobar('error', '找不到文件，无法移入回收站');
                }
            }
            return false;
        } else {
            return true;
        }
    });
}

//放多个便签至回收站
function putNotesToRecyclebin(notes, callback){
    if (Object.prototype.toString.call(notes) === '[object Array]'){
        if (notes.length>0){
            try{
                notes.forEach(noteid => {
                    putToRecyclebin(noteid,false);
                });
                if (typeof callback == 'function'){
                    callback(true);
                    return;
                }
            } catch (err){
                console.error(err);
            }
        }
    }
    if (typeof callback == 'function'){
        callback(false);
    }
}

//封装在函数中
function readNoteFiles() {
    //重新读取需要清空notes Array
    clearNoteArray();
    //判断是否存在notes文件夹，不存在代表没有笔记
    if (!fs.existsSync(storagePath + '/notes/')) {
        showNoteEmpty();
        isNotesEmpty = true;
        fs.mkdirSync(storagePath + '/notes/');
    } else {
        fs.readdir(storagePath + '/notes/', function (err, fileArr) {
            if (err) {
                throw (err);
            }
            if (typeof (fileArr) == 'undefined') {
                showNoteEmpty();
                isNotesEmpty = true;
                return;
            }
            //执行初始化
            let countOffset = 0;
            fileArr.forEach(element => {
                if (!fs.statSync(storagePath + '/notes/' + element).isDirectory()) {
                    fs.readFile(storagePath + '/notes/' + element, 'utf-8', function (err, data) {
                        if (err) {
                            countOffset++;
                            console.error(err);
                        }
                        var note_json = data;
                        if (typeof (note_json) != 'undefined' && note_json != null) {
                            note_json = JSON.parse(note_json);
                            addNoteToArray(note_json.id, note_json.time, note_json.rawtime, note_json.updatetime, note_json.updaterawtime, note_json.text, note_json.offset, note_json.timezone);
                            if (notes.length + countOffset == fileArr.length) {
                                //结束文件遍历，渲染列表
                                refreshNoteList(function(){
                                    $(document).ready(function(){
                                        notes.forEach(function (note) {
                                            bindNoteFoldDBL(note.id);
                                        });
                                    });
                                });
                                //显示列表
                                showNoteList();
                            }
                        }
                    });
                } else {
                    countOffset++;
                }
            });
            if (notes.length == 0){
                showNoteEmpty();
                isNotesEmpty = true;
            }
        });
    }
}

//保存note为json
function saveNote(notetext) {
    var alltime = time.getAllTime();
    //保存路径
    var path = storagePath + '/notes/' + alltime.rawTime + '.json';
    //计算文件的offset
    var offset = 0;
    if (fs.existsSync(path)) {
        offset++;
    }
    if (offset > 0) {
        path = storagePath + '/notes/' + alltime.rawTime + '.' + offset + '.json';
        while (fs.existsSync(path)) {
            offset++;
            path = storagePath + '/notes/' + alltime.rawTime + '.' + offset + '.json';
        }
    }
    //转换回车
    notetext = notetext.replace(/(\r\n)|(\n)|(\r)/g, '<br/>');
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
            console.error(err);
        } else {
            textarea.val('');
            displayInfobar('success', '成功保存便签');
        }
    });
    notesid++;
    saveNotesId();
    try {
        //把新增的note添加到array
        addNoteObjToArray(note);
        //如果是0到1则切换到列表页
        if (notes.length == 1) {
            showNoteList();
        }
        //在顶部渲染Note
        renderNoteAtTop(note.id, note.time, note.updatetime, note.text);
        //绑定Note的点击事件
        bindNoteClickEvent();
    } catch (e) {
        //重新读取Notes
        readNoteFiles();
        //出现错误则打印错误并刷新List
        throw (e);
    }
}

//基于note obj保存便签
function saveNoteByObj(note){
    //保存路径
    var path = storagePath + '/notes/' + note.rawTime +(typeof note.offset != 'undefined'?"."+note.offset:"")+ '.json';
    //计算文件的offset
    var json = json.stringify(note);
    fs.writeFile(path, json, 'utf-8', function (err, data) {
        if (err) {
            console.error(err);
        }
    });
}

//保存ID
function saveNotesId() {
    var data = {
        id: notesid
    };
    storage.set('notesid', data);
}