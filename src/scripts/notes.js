var textarea = $('#note-text');
var fs = require('fs');

var storagePath = app.getPath('userData');

// 保存所有的notes
var notes = [];
var noteMap = {};

// 预设notesid
var notesid = 0;

// 标记
var isNotesEmpty;

// 回收栈
var recycledNotes = [];

// 从主线程获取global
global.indebug = remote.getGlobal('indebug');

if (global.indebug) {
    if (!fs.existsSync(storagePath + '/devTemp/')) {
        fs.mkdirSync(storagePath + '/devTemp/');
    }
}

// 获取notesid的数据
storage.get('notesid' + (global.indebug ? '_dev' : ''), function (error, data) {
    if (error) {
        notesid = 0;
        return;
    } else {
        // 获取callback回传的json
        let notesid_json = data;
        if (typeof notesid_json.id !== 'undefined' && notesid_json.id !== null) {
            if (notesid_json.id >= 0) {
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

// execute
if (!settings){
    storage.get('settings' + (global.indebug ? '_dev' : ''), function (err, data) {
        if (err) {
          // 获取callback回传的json
          console.error(err);
        }
        settings = data;
        readNoteFiles();
    });
} else {
    readNoteFiles();
}

// tip是否显示的flag
var note_submit_tip_show = true;
textarea.on('input propertychange',function(e){
    if (e.target.scrollHeight > $(e.target).height()+16){
        if (note_submit_tip_show){
            note_submit_tip_show = false;
            $('.note-text-submittip').animateCss('fadeOut morefaster',function(){
                $('.note-text-submittip').attr('style','display: none !important');
            });
        }
    } else {
        if (!note_submit_tip_show){
            note_submit_tip_show = true;
            $('.note-text-submittip').removeAttr('style');
            $('.note-text-submittip').animateCss('fadeIn morefaster');
        }
    }
});

let isComboKeyDown = false; // 防止反复触发
textarea.on('keydown', function (e) {
    let ctrlKey = e.ctrlKey || e.metaKey;
    if (ctrlKey && e.key === 'd') {
        showDevConsole();
        return;
    }
    if (ctrlKey && e.key === 'Enter' && !isComboKeyDown) {
        isComboKeyDown = true;
        let text = textarea.val().trim();
        let title = $('#input-note-title').val().trim();
        let category = $('#select-note-category').val().trim();
        let password = $('#input-note-password').val().trim();
        if (category === 'notalloc'){
            category = null;
        }
        if (text) {
            saveNote(text, title, category, password, markdown_enabled);
            // 清空浮层的内容
            $('#input-note-category').val('');
            $('#input-note-password').val('');
        }
    }
});

// 按键弹起解除锁
textarea.on('keyup', function (e) {
    const ctrlKey = e.ctrlKey || e.metaKey;
    if (e.key === 'Enter' || ctrlKey) {
        isComboKeyDown = false;
    }
});

// 放入回收站
function putToRecyclebin(id, infoEnabled = true) {
    notes.every(function (note, i) {
        if (note.id === id) {
            let path;
            // 暂存
            let note_temp = note;
            // 检查offset
            if (note.offset > 0) {
                path = note.rawtime + '.' + note.offset + '.json';
            } else {
                path = note.rawtime + '.json';
            }
            if (fs.existsSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + path)) {
                if (!fs.existsSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/recyclebin/')) {
                    let res_mkdir = fs.mkdirSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/recyclebin/');
                    if (!res_mkdir){
                        displayInfobar('error', i18n[current_i18n].recycle_foldercreate_error);
                        return;
                    }
                }
                fs.rename(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + path, storagePath + (global.indebug ? '/devTemp' : '') + '/notes/recyclebin/' + path, function (err) {
                    if (err) {
                        displayInfobar('error', i18n[current_i18n].note_recycle_error);
                        readNoteFiles();
                        throw (err);
                    } else {
                        // 成功回收，推入栈
                        recycledNotes.push(note_temp);
                        // 从数组里删除
                        deleteNoteFromArr(id);
                        // 记录回收内容
                        recordRecycleBehaviour(note_temp);
                        // 动画
                        $('#note_' + id).animateCss('fadeOutLeft faster', function () {
                            $('#note_' + id).parent().remove(); // 动画结束后删除div
                            checkCategoryEmpty();
                            if (notes.length <= 0) {
                                showNoteEmpty_Anim();
                            }
                        });
                        // send to main process
                        ipcRenderer.send('recycle-note', note_temp);
                        if (infoEnabled) {
                            displayInfobar('success', i18n[current_i18n].note_recycle_success);
                        }
                    }
                });
            } else {
                if (infoEnabled) {
                    displayInfobar('error', i18n[current_i18n].recycle_cantfindfile);
                }
            }
            return false;
        } else {
            return true;
        }
    });
}

function moveFileToRecycled(note) {
    let path;
    if (note.offset > 0) {
        path = note.rawtime + '.' + note.offset + '.json';
    } else {
        path = note.rawtime + '.json';
    }
    if (fs.existsSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + path)) {
        if (!fs.existsSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/recyclebin/')) {
            let res_mkdir = fs.mkdirSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/recyclebin/');
            if (!res_mkdir){
                return;
            }
        }
        fs.rename(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + path, storagePath + (global.indebug ? '/devTemp' : '') + '/notes/recyclebin/' + path, function (err) {
            if (err) {
                throw (err);
            }
        });
    }
}

function deleteNoteFile(note, inRecycle = false) {
    if (!note) {
        return;
    }
    // 构建路径
    let path;
    const after = inRecycle ? '/recyclebin' : '';
    if (note.offset > 0) {
        path = storagePath + (global.indebug ? '/devTemp' : '') + `/notes${after}` + note.rawtime + '.' + note.offset + '.json';
    } else {
        path = storagePath + (global.indebug ? '/devTemp' : '') + `/notes${after}` + note.rawtime + '.json';
    }
    if (!fs.existsSync(path)) {
        return;
    }
    // 删除文件
    fs.unlink(path, function (err) {
        if (err) {
            throw (err);
        }
    });
}

// 放多个便签至回收站
function putNotesToRecyclebin(notes, callback) {
    if (Object.prototype.toString.call(notes) === '[object Array]') {
        if (notes.length > 0) {
            try {
                notes.forEach(noteid => {
                    putToRecyclebin(noteid, false);
                });
                if (typeof callback == 'function') {
                    callback(true);
                    return;
                }
            } catch (err) {
                console.error(err);
            }
        }
    }
    if (typeof callback === 'function') {
        callback(false);
    }
}

// 快速还原一个便签
function quickRestoreNote(note) {
    return new Promise((resolve) => {
        let path;
        if (note.offset > 0) {
            path = storagePath + (global.indebug ? '/devTemp' : '') + '/notes/recyclebin/' + note.rawtime + '.' + note.offset + '.json';
        } else {
            path = storagePath + (global.indebug ? '/devTemp' : '') + '/notes/recyclebin/' + note.rawtime + '.json';
        }
        if (!fs.existsSync(path)) {
            displayInfobar('error', i18n[current_i18n].restore_cantfindfile);
            resolve(false);
            return;
        }
        let newpath = path.replace('recyclebin/', '');
        // 检查是否存在ID冲突
        if (noteMap[note.id]) {
            // 存在冲突
            const ret = dialog.showMessageBoxSync({
                title: '便签ID冲突',
                type: 'warning',
                message: '正在恢复的便签和已有便签的ID存在冲突',
                defaultId: 1,
                cancelId: 1,
                buttons: ['覆盖', '恢复为新便签'],
            });
            if (ret === 0) {
                // 先删除原有的
                deleteNoteFile(noteMap[note.id]);
            } else if (ret === 1) {
                note.id = notesid;
                notesid += 1;
                saveNotesId();
            }
            note.needSync = true;
        }
        fs.rename(path, newpath, err => {
            if (err) {
                if (infoEnabled) {
                    displayInfobar('error', i18n[current_i18n].restore_error);
                }
                console.log(err);
                resolve(false);
                return;
            }
            addNoteObjToArray(note);
            recordRestoreBehaviour(note);
            refreshNoteList(() => {
                displayInfobar('success', i18n[current_i18n].restore_success);
                // animate
                $(`#note_${note.id}`).animateCss('fadeInRight faster');
                bindNoteFoldDBL(note.id);
            });
            resolve(true);
        });
    });
}

// 封装在函数中
function readNoteFiles(success_callback) {
    // 重新读取需要清空notes Array
    clearNoteArray();
    // 判断是否存在notes文件夹，不存在代表没有笔记
    if (!fs.existsSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/')) {
        showNoteEmpty();
        isNotesEmpty = true;
        fs.mkdirSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/');
    } else {
        fs.readdir(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/', function (err, fileArr) {
            if (err) {
                throw (err);
            }
            if (typeof fileArr == 'undefined' || fileArr.length < 1) {
                showNoteEmpty();
                isNotesEmpty = true;
                return;
            }
            // 执行初始化
            let countOffset = 0;
            // 读取前检查notalloc的数值，存在则重置
            if (notalloc_count) {
                notalloc_count = 0;
            }
            // 读取文件
            for (let i = 0; i < fileArr.length; i++) {
                if (fs.statSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + fileArr[i]).isDirectory()) {
                    // 是文件夹
                    countOffset++;
                    continue;
                }
                fs.readFile(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + fileArr[i], 'utf-8', function (err, data) {
                    if (err) {
                        countOffset++;
                        console.error(err);
                    }
                    const note_json = data;
                    if (note_json) {
                        const note = JSON.parse(note_json);
                        addNoteObjToArray(note);
                        if (notes.length + countOffset === fileArr.length) {
                            // 等待页面DOM初始化
                            $(function() {
                                // 结束文件遍历，渲染列表
                                refreshNoteList();
                                // 显示列表
                                showNoteList();
                                // 渲染便签分类数量
                                renderSystemCategoryCount();
                                renderCustomCategoryCount();
                                // 检查便签分类数量的正确性
                                checkCategoryCount();
                                if (notes.length === 0) {
                                    showNoteEmpty();
                                    isNotesEmpty = true;
                                }
                                // 回调
                                if (typeof success_callback === 'function') {
                                    success_callback();
                                }
                            });
                        }
                    }
                });
            }
        });
    }
}

// 保存note为json
function saveNote(notetext, notetitle, notecategory, notepassword, markdown) {
    const alltime = time.getAllTime();
    // 保存路径
    let path = storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + alltime.rawTime + '.json';
    // 计算文件的offset
    let offset = 0;
    if (fs.existsSync(path)) {
        offset += 1;
    }
    if (offset > 0) {
        path = storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + alltime.rawTime + '.' + offset + '.json';
        while (fs.existsSync(path)) {
            offset++;
            path = storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + alltime.rawTime + '.' + offset + '.json';
        }
    }
    // 转换回车
    if (notepassword){
        // 密码不为空，对便签加密
        notetext = aes_encrypt(notetext, notepassword);
        // 保存密码的哈希值
        notepassword = sha256(notepassword, 'fastnote');
    } else {
        notepassword = null;
    }
    // 构造note
    const note = {
        id: notesid,
        time: alltime.currentTime,
        rawtime: alltime.rawTime,
        timezone: time.getTimeZone(),
        text: notetext,
        title: (notetitle ? notetitle : null),
        category: (notecategory ? notecategory : null),
        password: notepassword,
        offset: offset,
        forceTop: false,
        markdown: markdown,
    };
    const json = JSON.stringify(note);
    fs.writeFile(path, json, 'utf-8', function (err, data) {
        if (err) {
            console.error(err);
            displayInfobar('error', i18n[current_i18n].save_error);
            return;
        } else {
            textarea.val('');
            displayInfobar('success', i18n[current_i18n].save_success);
        }
    });
    notesid++;
    saveNotesId();
    // 把新增的note添加到array
    addNoteObjToArray(note);
    // 如果是0到1则切换到列表页
    if (notes.length >= 1) {
        showNoteList();
    }
    // 分类的empty隐藏
    $('#note-empty-category').hide();
    // 在顶部渲染Note
    renderNoteAtTop(note);
    // 绑定Note的点击事件
    bindNoteClickEvent();
}

// 基于note obj保存便签
function saveNoteByObj(note) {
    console.log(note);
    // 保存路径
    const path = storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + note.rawtime + (typeof note.offset !== 'undefined' ? note.offset > 0 ? "." + note.offset : "" : "") + '.json';
    // 计算文件的offset
    const json = JSON.stringify(note);
    fs.writeFile(path, json, 'utf-8', function (err, data) {
        if (err) {
            console.error(err);
        }
    });
}

// 基于obj删除note
function deleteNoteByObj(note) {
    const notePath = storagePath + (global.indebug ? '/devTemp' : '') + "/notes/" + note.rawtime + (typeof note.offset !== 'undefined' ? note.offset > 0 ? "." + note.offset : "" : "") + ".json";
    if (fs.existsSync(notePath)) {
        fs.unlink(notePath, function (err) {
            if (err) {
                console.error(err);
            }
        });
    }
}

// 保存ID
function saveNotesId() {
    var data = {
        id: notesid
    };
    storage.set('notesid' + (global.indebug ? '_dev' : ''), data);
}

