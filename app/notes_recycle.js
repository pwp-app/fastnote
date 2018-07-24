//import

const storage = require('electron-json-storage');

let textarea = $('#note-text');
let fs = require('fs');
let time = require('../app/tools/time.js');

//import storage location
const remote = require('electron').remote;
const app = remote.app;
var storagePath = app.getPath('userData');

//execute
readNoteFiles();

//删除note
function deleteNote(id) {
    notes.every(function (note, i) {
        if (note.id == id) {
            var path;
            //检查offset
            if (note.offset > 0) {
                path = storagePath + '/notes/recyclebin/' + note.rawtime + '.' + note.offset + '.json';
            } else {
                path = storagePath + '/notes/recyclebin/' + note.rawtime + '.json';
            }
            if (fs.existsSync(path)) {
                //删除文件
                fs.unlink(path, function (err) {
                    if (err) {
                        //文件删除失败
                        displayInfobar('error', '文件删除失败');
                        readNoteFiles();
                        throw(err);                        
                    } else {
                        //删除成功
                        deleteNoteFromArr(id);
                        //动画
                        $('#note_' + id).animateCss('fadeOutLeft', function () {
                            $('#note_' + id).remove(); //动画结束后删除div
                            if (notes.length <= 0) {
                                showNoteEmpty_Anim();
                            }
                        });
                        displayInfobar('success', '删除成功');
                    }
                })
            } else {
                displayInfobar('error', '找不到文件，无法删除');
                readNoteFiles();
            }
            return false;
        } else {
            return true;
        }
    });
}

function restoreNote(id){
    notes.every(function (note, i) {
        if (note.id == id) {
            var path;
            //检查offset
            if (note.offset > 0) {
                path = storagePath + '/notes/recyclebin/' + note.rawtime + '.' + note.offset + '.json';
            } else {
                path = storagePath + '/notes/recyclebin/' + note.rawtime + '.json';
            }
            if (fs.existsSync(path)) {
                var newpath = path.replace('recyclebin/','');
                console.log(newpath);
                fs.rename(path,newpath, function (err) {
                    if (err) {
                        displayInfobar('error', '笔记还原失败');
                        readNoteFiles();
                        throw(err);                        
                    } else {
                        deleteNoteFromArr(id);
                        //动画
                        $('#note_' + id).animateCss('fadeOutLeft', function () {
                            $('#note_' + id).remove(); //动画结束后删除div
                            if (notes.length <= 0) {
                                showNoteEmpty_Anim();
                            }
                        });
                        displayInfobar('success', '还原成功');
                        ipcRenderer.send('restore-note', note);
                    }
                })
            } else {
                displayInfobar('error', '找不到文件，无法还原');
                readNoteFiles();
            }
            return false;
        } else {
            return true;
        }
    });
}

//bind delete event
$("#btn-deleteNote").click(function(){
    deleteNote(noteid_clicked);
    //隐藏右键菜单
    $('.rightclickmenu').attr('style', 'display:none;');
});

//bind restore event
$("#btn-restoreNote").click(function(){
    restoreNote(noteid_clicked);
    //隐藏右键菜单
    $('.rightclickmenu').attr('style', 'display:none;');
});

//封装在函数中
function readNoteFiles() {
    //重新读取需要清空notes Array
    clearNoteArray();
    //判断是否存在notes文件夹，不存在代表没有笔记
    if (!fs.existsSync(storagePath + '/notes/recyclebin/')) {
        showNoteEmpty();
        isNotesEmpty = true;
        fs.mkdirSync(storagePath + '/notes/recyclebin/');
    } else {
        fs.readdir(storagePath + '/notes/recyclebin/', function (err, fileArr) {
            if (err) {
                throw (err);
            }
            if (typeof (fileArr) == 'undefined') {
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
                    if (!fs.statSync(storagePath + '/notes/recyclebin/' + element).isDirectory()) {
                        fs.readFile(storagePath + '/notes/recyclebin/' + element, 'utf-8', function (err, data) {
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
                                    refreshNoteList();
                                    //显示列表
                                    showNoteList();
                                }
                            }
                        });
                    } else {
                        countOffset++;
                    }
                });
            }
        });
    }
}