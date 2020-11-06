var storage = require(pathPrefix + 'electron-json-storage');
var reg = require('./static/notes.render.reg');

// prototype
String.prototype.startWith = function(compareStr){
    return this.indexOf(compareStr) == 0;
};

// *** 变量 ***

// 保存所有的notes
var notes = [];

var selectModeEnabled = false;
// 存放长按的setTimeout
var noteLongClickTimeout;

var notes_selected = [];
var notes_selected_withencrypted = [];

var sort_mode = null;

// lazyload

var lazyloadObserver = null;

// *** jQuery缓存 ***

var noteList = {};
var filterX;

$(function() {
    noteList.normal = $('#note-list-normal');
    noteList.forceTop = $('#note-list-forceTop');
    filterX = $('#filter-x');
});

// *** 即时执行 ***

// 初始化排序模式
storage.get('sortMode' + (inRecyclebin ? '_recyclebin' : ''), function (err, data) {
    if (err) {
        console.error(err);
        sort_mode = 'id'; //设置为默认值
        return;
    }
    sort_mode = data.mode;
});

// 绑定外链
$(document).on('click', '.note a', function (e) {
    ipcRenderer.send('openExternalURL', $(this).attr('href'));
    e.preventDefault();
});

// 绑定时间点击事件

$(document).on('click', '.note-updatetime', function(e) {
    let id = $(e.currentTarget).parent().parent().parent().attr('data-id');
    $(`#note_${id} .note-header .note-updatetime`).css('display', 'none');
    $(`#note_${id} .note-header .note-createtime`).css('display', 'initial');
});

$(document).on('click', '.note-createtime', function(e) {
    let id = $(e.currentTarget).parent().parent().parent().attr('data-id');
    $(`#note_${id} .note-header .note-updatetime`).css('display', 'initial');
    $(`#note_${id} .note-header .note-createtime`).css('display', 'none');
});

// *** 定义 ***

//显示没有笔记的界面
function showNoteEmpty() {
    $('#note-empty').css('display', 'flex');
    $('.note-list').css('display', 'none');
}

function showNoteEmpty_Anim() {
    $('#note-empty').css('display', 'flex');
    $('#note-empty').animateCss('fadeIn faster');
    $('.note-list').css('display', 'none');
}
//显示有笔记的界面
function showNoteList() {
    $('#note-empty').css('display', 'none');
    $('.note-list').css('display', 'block');
}
//清空列表内的笔记DOM
function clearNoteList() {
    var note_list_forceTop = document.getElementById('note-list-forceTop');
    var note_list_normal = document.getElementById('note-list-normal');
    if (typeof note_list_forceTop != 'undefined' && note_list_forceTop != null) { //if用来兼容recyclebin
        note_list_forceTop.innerHTML = "";
    }
    note_list_normal.innerHTML = "";
    selectModeEnabled = false; //刷新页面/列表时重置多选开关
}

// 初始化渲染（渲染整个列表）
function initialRender() {
    sortNotes(sort_mode); // 排序
    let html = [];
    let html_forceTop = [];
    // 渲染
    for (let i = 0; i < notes.length; i++) {
        let rendered = renderNote(notes[i], immediate=false);
        if (rendered.forceTop) {
            html_forceTop.push(rendered.html);
        } else {
            html.push(rendered.html);
        }
    }
    // DOM操作
    noteList.forceTop.append(html_forceTop.join(''));
    noteList.normal.append(html.join(''));
    // 绑定Note的点击事件
    bindNoteClickEvent();
    // 绑定双击事件
    for (let i = 0;i < notes.length; i++) {
        bindNoteFoldDBL(notes[i].id);
    }
    if (!inRecyclebin) { //回收站内不进行分类渲染
        renderNotesOfCategory(current_category);
    }
    // 图片lazyload
    lazyloadObserver = window.lozad('.lozad');
    lazyloadObserver.observe();
}

// 渲染一条笔记
function renderNote(note, immediate = true, isPrepend = false, animate = false) {
    let { id, rawtime, updaterawtime, title, category, password, text, forceTop, markdown } = note;
    if (!settings.language){
        current_i18n = 'zh-cn';
    } else {
        current_i18n = settings.language;
    }
    let html = `<div class="note-wrapper"><div class="note${forceTop ? " note-forceTop" : ""}" id="note_${id}"
         data-id="${id}" data-category="${category ? category : 'notalloc'}"
         data-markdown="${markdown ? markdown : false}"><div class="note-header">
         <span class="note-no">#${id}</span>`;
    // 渲染note-title
    let titletext = "";
    if (title) {
        if (title.length > 50) {
            titletext = '<titlep1>' + insert_spacing(title.substring(0, 16), 0.12) + '</titlep1><titlesusp1>...</titlesusp1><titlep2>' + insert_spacing(title.substring(18, 32), 0.12) + '</titlep2><titlesusp2>...</titlesusp2><titlep3>' + insert_spacing(title.substring(32, 50), 0.12) + '</titlep3><titlesusp3>...</titlesusp3><titlep4>' + insert_spacing(title.substring(50), 0.12) + '</titlep4>';
        } else if (title.length > 32) {
            titletext = '<titlep1>' + insert_spacing(title.substring(0, 16), 0.12) + '</titlep1><titlesusp1>...</titlesusp1><titlep2>' + insert_spacing(title.substring(18, 32), 0.12) + '<titlesusp2>...</titlesusp2><titlep3>' + insert_spacing(title.substring(32), 0.12) + '</titlep3>';
        } else if (title.length > 16) {
            titletext = '<titlep1>' + insert_spacing(title.substring(0, 16), 0.12) + '</titlep1><titlesusp1>...</titlesusp1><titlep2>' + insert_spacing(title.substring(18), 0.12) + '</titlep2>';
        } else {
            titletext = insert_spacing(title, 0.12);
        }
    }
    html += '<span class="note-title">' + titletext + '</span>';
    if (typeof forceTop !== 'undefined' && forceTop !== null) {
        if (forceTop) {
            html += '<i class="fa fa-caret-up note-forceTop-icon" aria-hidden="true"></i>';
        }
    }
    // 选择性显示时间
    let m_time = moment(rawtime, 'YYYYMMDDHHmmss');
    if (updaterawtime) {
        var m_updatetime = moment(updaterawtime, 'YYYYMMDDHHmmss');
        html += '<time><p class="note-time note-updatetime"><span class="note-updatetime-label">'+i18n.render[current_i18n].updatetime+'</span>' + m_updatetime.format('[<timeyear>]YYYY['+i18n.render[current_i18n].year+'</timeyear><timemonth>]MM['+i18n.render[current_i18n].month+'</timemonth><timeday>]DD['+i18n.render[current_i18n].day+'</timeday><timeclock>&nbsp;]HH:mm:ss[</timeclock>]') + '</p>' +
            '<p class="note-time note-createtime" style="display: none;"><span class="note-createtime-label">'+i18n.render[current_i18n].createtime+'</span>' + m_time.format('[<timeyear>]YYYY['+i18n.render[current_i18n].year+'</timeyear><timemonth>]MM['+i18n.render[current_i18n].month+'</timemonth><timeday>]DD['+i18n.render[current_i18n].day+'</timeday><timeclock>&nbsp;]HH:mm:ss[</timeclock>]') + '</p></time>';
    } else {
        html += '<time><p class="note-time">' + m_time.format('[<timeyear>]YYYY['+i18n.render[current_i18n].year+'</timeyear><timemonth>]MM['+i18n.render[current_i18n].month+'</timemonth><timeday>]DD['+i18n.render[current_i18n].day+'</timeday><timeclock>&nbsp;]HH:mm:ss[</timeclock>]') + '</p></time>';
    }
    if (!password) {
        html += '</div><div class="note-content"><div class="note-text">';
        // process html tag
        if (markdown){
            text = getMarkdownText(text);
        } else {
            html += '<p>';
            text = filterX.text(text).html().replace(/ /g, '&nbsp;');
            text = text.replace(/\n/gi,'<br>');
        }
        text = insert_spacing(text, 0.15);
        // 自动识别网页
        if (!markdown){
            html += text.replace(reg.url, function (result) {
                return '<a href="' + result + '">' + result + '</a>';
            });
        } else {
            html += text + '</p>';
        }
        html += '</div></div></div></div>';
    } else {
        // 再锁定按钮
        html += `<i class="fa fa-lock note-password-relock" aria-hidden="true" onclick="relockNote(${id})"></i>`;
        // 密码框
        html += `</div><div class="note-content"><div class="note-password" data-password="${password}" data-encrypted="${text}">`;
        if (!inRecyclebin) {
            html += '<span>'+i18n.render[current_i18n].password+'</span><input type="password" class="form-control" id="note_password_' + id + '" onkeydown="checkNotePassword(event, ' + id + ');">';
        } else {
            html += '<p>['+i18n.render[current_i18n].encrypted_info+']</p>';
        }
        html += '</div></div></div></div>';
    }

    // 不即时渲染，返回html
    if (!immediate) {
        return {
            forceTop: forceTop ? true : false,
            html: html
        };
    }

    // 即时渲染
    if (forceTop) {
        if (isPrepend) {
            noteList.forceTop.prepend($(html));
        } else {
            noteList.forceTop.append($(html));
        }
    } else {
        if (isPrepend) {
            noteList.normal.prepend($(html));
        } else {
            noteList.normal.append($(html));
        }
    }

    // animate
    if (animate) {
        $('#note_' + id).animateCss('fadeInLeft faster');
    }

    setTimeout(function(){
        // 防止读取不了便签内容的高度
        bindNoteFoldDBL(id);
    },0);
}

// 在顶部渲染Note
function renderNoteAtTop(note) {
    renderNote(note, immediate = true, isPrepend = true, animate = true);
}

function rerenderEditedNote(data, rawtext) {
    // 分类
    if (current_category != 'all') {
        // 便签编辑后已经不属于当前分类，从画面中移出并隐藏
        if (data.category != current_category) {
            $('#note_' + data.id).parent().animateCss('fadeOutLeft faster', function () {
                $('#note_' + data.id).parent().hide();
                // 当前分类是否为空
                if (getCountOfCategory(current_category) < 1) {
                    $('#note-empty-category').show();
                    $('#note-empty-category').animateCss('fadeIn');
                }
            });
            // 此处不return，后续更新仍然要处理，只是便签不显示
        } else {
            // 便签可能是从其他类别改到当前类别的
            if ($('#note_' + data.id).parent().css('display') == 'none') {
                $('#note_' + data.id).parent().show();
                $('#note_' + data.id).parent().animateCss('fadeInLeft faster');
                // 有便签新加入必定不为空
                $('#note-empty-category').hide();
            }
        }
    }

    // 处理markdown
    if (data.markdown){
        $('#note_'+data.id).attr('data-markdown', data.markdown);
    } else {
        $('#note_'+data.id).attr('data-markdown', 'false');
    }

    //处理密码的更改
    if (data.password) {
        resetEditedNoteText(data, rawtext);
        // 便签设置了密码，判断便签之前是否有密码
        if ($('#note_'+data.id+' .note-content .note-password').length > 0){
            // 便签已经有密码
            $('#note_'+data.id+' .note-content .note-password').attr('data-password',data.password);
            $('#note_'+data.id+' .note-content .note-password').attr('data-encrypted',data.text);
        } else {
            // 便签之前没有设置过密码
            $('#note_'+data.id+' .note-content').prepend('<div class="note-password" data-password="' + data.password + '" data-encrypted="' + data.text + '" style="display: none;"><span>'+i18n.render[current_i18n].password+'</span><input type="password" class="form-control" id="note_password_' + data.id + '" onkeydown="checkNotePassword(event, ' + data.id + ');"></div>');
            $('#note_'+data.id+' .note-header').append('<i class="fa fa-lock note-password-relock" aria-hidden="true" onclick="relockNote(' + data.id + ')" style="display: inline-block !important;"></i>');
            $('#note_'+data.id+' .note-header .note-password-relock').animateCss('fadeIn morefaster');
        }
    } else {
        //没有设置密码
        resetEditedNoteText(data, data.text);
    }

    //reset content of updatetime
    let m_updatetime = moment(data.updaterawtime, 'YYYYMMDDHHmmss');
    let m_time = moment(data.rawtime, 'YYYYMMDDHHmmss');
    let timeContent = '<p class="note-time note-updatetime"><span class="note-updatetime-label">'+i18n.render[current_i18n].updatetime+'</span>' + m_updatetime.format('[<timeyear>]YYYY['+i18n.render[current_i18n].year+'</timeyear><timemonth>]MM['+i18n.render[current_i18n].month+'</timemonth><timeday>]DD['+i18n.render[current_i18n].day+'</timeday><timeclock>&nbsp;]HH:mm:ss[</timeclock>]') + '</p>' +
        '<p class="note-time note-createtime" style="display: none;"><span class="note-createtime-label">'+i18n.render[current_i18n].updatetime+'</span>' + m_time.format('[<timeyear>]YYYY['+i18n.render[current_i18n].year+'</timeyear><timemonth>]MM['+i18n.render[current_i18n].month+'</timemonth><timeday>]DD['+i18n.render[current_i18n].day+'</timeday><timeclock>&nbsp;]HH:mm:ss[</timeclock>]') + '</p>';
    $('#note_' + data.id + ' .note-header time').html(timeContent);

    //处理标题
    if (data.title) {
        let titletext = "";
        if (data.title.length > 50) {
            titletext = '<titlep1>' + insert_spacing(data.title.substring(0, 16), 0.12) +
                '</titlep1><titlesusp1>...</titlesusp1><titlep2>' + insert_spacing(data.title.substring(
                    18, 32), 0.12) + '</titlep2><titlesusp2>...</titlesusp2><titlep3>' + insert_spacing(
                    data.title.substring(32, 50), 0.12) +
                '</titlep3><titlesusp3>...</titlesusp3><titlep4>' + insert_spacing(data.title.substring(
                    50), 0.12) + '</titlep4>';
        } else if (data.title.length > 32) {
            titletext = '<titlep1>' + insert_spacing(data.title.substring(0, 16), 0.12) +
                '</titlep1><titlesusp1>...</titlesusp1><titlep2>' + insert_spacing(data.title.substring(
                    18, 32), 0.12) + '<titlesusp2>...</titlesusp2><titlep3>' + insert_spacing(data.title
                    .substring(32), 0.12) + '</titlep3>';
        } else if (data.title.length > 16) {
            titletext = '<titlep1>' + insert_spacing(data.title.substring(0, 16), 0.12) +
                '</titlep1><titlesusp1>...</titlesusp1><titlep2>' + insert_spacing(data.title.substring(
                    18), 0.12) + '</titlep2>';
        } else {
            titletext = insert_spacing(data.title, 0.12);
        }
        $('#note_' + data.id + ' .note-header .note-title').html(titletext);
    }

    //获取便签编辑后的内容高度
    let edited_content_height = $('#note_'+data.id+' .note-content .note-text').height();
    if (edited_content_height <= 250){  //与.note-content高度相等
        //编辑后的内容不超高
        $('#note_'+data.id + ' .note-content').removeClass('note-overheight');
        $('#note_'+data.id + ' .note-content').removeAttr('style');
        $('#note_'+data.id).removeAttr('data-expanded');
        //取消dblclick
        $('#note_'+data.id + ' .note-content').off('dblclick');
    } else {
        //编辑后的内容超高
        //判断原先内容是否超高
        let expanded = $('#note_'+data.id).attr('data-expanded');
        if (typeof expanded != "undefined"){
            //原先内容超高
            if (expanded == "true"){  //原先内容超高、已展开
                $('#note_'+data.id + ' .note-content').height();
            }
            //超高未展开 -> do nothing
        } else {
            //没有expanded属性有两种可能 第一是便签本身不超高 第二是超高未展开
            if (!$('#note_'+data.id+' .note-content').hasClass('note-overheight')){
                //不存在note-overheight属性是不超高，重新绑定dblclick
                bindNoteFoldDBL(data.id);
            }
        }
    }

    //处理分类
    let category_name = $('#note_' + data.id).attr('data-category');
    //如果分类未改变，到这个地方也会有-1+1的过程，如果-1之后为0再检查分类是否为empty，则会显示category-empty，故执行完-1+1后再检查
    minorCategoryCount(category_name, false, true, true);
    addCategoryCount(data.category, true, true);
    checkCategoryEmpty();
    $('#note_' + data.id).attr('data-category', data.category);
}

function resetEditedNoteText(data, t) {
    let text;
    if (data.markdown){
        text = getMarkdownText(t);
    } else {
        text = filterX.text(t).html().replace(/ /g, '&nbsp;');
        text = text.replace(/\n/gi,'<br>');
    }
    text = insert_spacing(text, 0.15);
    let html = '';
    if (!data.markdown){
        text = text.replace(reg.url, function (result) {
            return '<a href="' + result + '">' + result + '</a>';
        });
    }
    html += '<p>' + text + '</p>';
    //reset note content on page
    $("#note_" + data.id + " .note-content .note-text").html(html);
}

//绑定note的双击折叠
function bindNoteFoldDBL(id) {
    if ($('#note_' + id + ' .note-content').height() > 250) {
        $('#note_' + id + ' .note-content').addClass("note-overheight"); //process css
        $('#note_' + id + ' .note-content').off('dblclick').on('dblclick',function (e) {
            //process double click
            if ($('#note_' + id + ' .note-content').height() > 250) {
                $('#note_' + id + ' .note-content').animate({
                    height: "250px"
                });
                $('#note_' + id + ' .note-content').addClass("note-overheight");
                //标识便签是否展开
                $('#note_' + id).attr('data-expanded','false');
            } else {
                $('#note_' + id + ' .note-content').css('height', 'auto');
                var animate_height = $('#note_' + id + ' .note-content').height();
                $('#note_' + id + ' .note-content').css('height', '250px');
                $('#note_' + id + ' .note-content').animate({
                    height: animate_height
                });
                $('#note_' + id + ' .note-content').removeClass("note-overheight");
                //标识便签是否展开
                $('#note_' + id).attr('data-expanded','true');
            }
        });
        //在双击折叠/展开时不选中文本
        $('#note_' + id + ' .note-content .note-text').mousedown(function (e) {
            if (e.detail > 0) {
                e.preventDefault();
            }
        });
    } else {
        $('#note_' + id + ' .note-content').removeClass("note-overheight");
    }
}

//添加笔记至Array
function addNoteObjToArray(note, isRecycle = false) {
    notes.push(note);
    // 分类计数
    const { category } = note;
    if (!category && !isRecycle) {
        notalloc_count++;
    }
}

//刷新note-list
function refreshNoteList(callback) {
    clearNoteList(); //先清空
    if (typeof sort_mode !== 'string') {
        storage.get('sortMode' + (inRecyclebin ? '_recyclebin' : ''), function (err, data) {
            if (err) {
                console.error(err);
                return;
            }
            sort_mode = data.mode;
            if (typeof sort_mode !== 'string') {
                sort_mode = 'id';
            }
            // 渲染列表
            initialRender(notes);
            // callback
            if (typeof callback === 'function') {
                callback();
            }
        });
    } else {
        // 渲染列表
        initialRender(notes);
        // callback
        if (typeof callback === 'function') {
            callback();
        }
    }
}

//清空notes数组
function clearNoteArray() {
    notes = [];
}

//排序笔记
function sortNotes(mode) {
    switch (mode) {
        default:
        case 'id':
            notes.sort(sortNotesById);
            break;
        case 'updateDate':
            notes.sort(sortNotesByUpdateDate);
            break;
    }
}

function sortNotesById(a, b) {
    if (a.id > b.id) {
        return -1;
    } else if (a.id < b.id) {
        return 1;
    } else {
        return 0;
    }
}

function sortNotesByUpdateDate(a, b) {
    var temp_a = typeof a.updaterawtime != 'undefined' ? a.updaterawtime : a.rawtime;
    var temp_b = typeof b.updaterawtime != 'undefined' ? b.updaterawtime : b.rawtime;
    if (temp_a > temp_b) {
        return -1;
    } else if (temp_a < temp_b) {
        return 1;
    } else {
        return 0;
    }
}

//从数组中删除一项
function deleteNoteFromArr(id) {
    notes.every(function (note, i) {
        if (note.id == id) {
            notes.splice(i, 1);
            minorCategoryCount(note.category, false, true, true);
            return false;
        } else {
            return true;
        }
    });
}

function deleteNoteFromArr_recycle(id) {
    notes.every(function (note, i) {
        if (note.id == id) {
            notes.splice(i, 1);
            return false;
        } else {
            return true;
        }
    });
}

function operateForceTopNote(noteid, status) {
    for (var i = 0; i < notes.length; i++) {
        if (notes[i].id == noteid) {
            //处理note文件
            notes[i].forceTop = status;
            saveNoteByObj(notes[i]);
            break;
        }
    }
    let note_style = $('#note_'+noteid+' .note-content').attr('style');
    let overheight = $('#note_'+noteid+' .note-content').hasClass('note-overheight');
    refreshNoteList(function(){
        if (overheight){
            setTimeout(()=>{
                $('#note_'+noteid+' .note-content').addClass('note-overheight');
                $('#note_'+noteid+' .note-content').removeAttr('style');
            }, 0);
        } else {
            setTimeout(()=>{
                $('#note_'+noteid+' .note-content').removeClass('note-overheight');
                $('#note_'+noteid+' .note-content').attr('style', note_style);
            }, 0);
        }
    });
    renderNotesOfCategory(current_category);
}

function operateForceTopNotes(notes_selected, status){
    let notes_status = [];
    for (let i=0;i<notes_selected.length;i++){
        for (let j = 0; j < notes.length; j++) {
            if (notes[j].id == notes_selected[i]) {
                //处理note文件
                notes[j].forceTop = status;
                saveNoteByObj(notes[j]);
                let note_style = $('#note_'+notes[j].id+' .note-content').attr('style');
                notes_status.push({
                    id: notes[j].id,
                    style: note_style
                });
                break;
            }
        }
    }
    refreshNoteList(function(){
        for (let i=0;i<notes_status.length;i++){
            $('#note_'+notes_status[i].id+' .note-content').attr('style', notes_status[i].style);
        }
    });
}

function renderNotesOfCategory(name) {
    //判断是否为空
    if (getCountOfCategory(name) < 1) {
        $('#note-empty-category').show();
    } else {
        $('#note-empty-category').hide();
    }
    //渲染便签
    if (name == 'all') {
        $('.note').parent().show();
    } else if (name == 'notalloc') {
        for (let i = 0; i < notes.length; i++) {
            if (notes[i].category) {
                $('#note_' + notes[i].id).parent().hide();
            } else {
                $('#note_' + notes[i].id).parent().show();
            }
        }
    } else {
        for (let i = 0; i < notes.length; i++) {
            if (!notes[i].category || notes[i].category !== name) {
                $('#note_' + notes[i].id).parent().hide();
            } else {
                $('#note_' + notes[i].id).parent().show();
            }
        }
    }
}

// noteid: string
function checkNotePassword(e, noteid) {
    if (e.keyCode == 13) {
        let input_pwd = $('#note_password_' + noteid).val().toString();
        if (sha256(input_pwd, 'fastnote') === $('#note_password_' + noteid).parent().attr('data-password')) {
            //密码正确
            //生成解密文本
            let text = $('#note_password_' + noteid).parent().attr('data-encrypted');
            let decrypted_text = aes_decrypt(text, input_pwd);
            let markdown = $('#note_'+noteid).attr('data-markdown');
            //生成html
            var html = '<div class="note-text" style="display:none;">';
            let temp;
            if (markdown === 'true'){
                temp = getMarkdownText(decrypted_text);
            } else {
                temp = '<p>' + filterX.text(decrypted_text).html().replace(/ /g, '&nbsp;');
                temp = temp.replace(/\n/gi,'<br>');
            }
            temp = insert_spacing(temp, 0.15);
            //自动识别网页
            if (markdown === 'false'){
                html += temp.replace(reg.url, function (result) {
                    return '<a href="' + result + '">' + result + '</a>';
                });
            } else {
                html += temp + '</p>';
            }
            html += '</div>';

            //渲染
            $('#note_' + noteid + ' .note-content').append(html);

            //暂存解密后的内容
            $('#note_' + noteid).attr('data-decrypted', decrypted_text);

            $('#note_password_' + noteid).parent().animateCss('fadeOut morefaster', function () {
                $('#note_password_' + noteid).parent().hide();
                $('#note_password_' + noteid).removeClass('br-invalid');
                $('#note_' + noteid + ' .note-content .note-text').show();
                $('#note_' + noteid + ' .note-content .note-text').animateCss('fadeIn morefaster');

                //显示relock按钮
                $('#note_' + noteid + ' .note-header .note-password-relock').attr('style', 'display: inline-block !important;');
                $('#note_' + noteid + ' .note-header .note-password-relock').animateCss('fadeIn morefaster');

                setTimeout(function(){//auto fold
                    bindNoteFoldDBL(noteid);
                },0);
            });
        } else {
            //密码不对
            $('#note_password_' + noteid).addClass('br-invalid');
        }
    }
}

function relockNote(noteid) {
    $('#note_' + noteid).removeAttr('data-decrypted');
    $('#note_' + noteid + ' .note-content .note-text').animateCss('fadeOut morefaster', function () {
        $('#note_password_' + noteid).val('');
        $('#note_password_' + noteid).parent().show();
        $('#note_password_' + noteid).parent().animateCss('fadeIn morefaster');
        $('#note_' + noteid + ' .note-content .note-text').remove();
        $('#note_' + noteid + ' .note-content').removeAttr('style');
        $('#note_' + noteid + ' .note-content').removeClass('note-overheight');
        //隐藏relock按钮
        $('#note_' + noteid + ' .note-header .note-password-relock').animateCss('fadeOut morefaster', function () {
            $('#note_' + noteid + ' .note-header .note-password-relock').removeAttr('style');
        });
    });
}

//对便签文本进行再渲染
function rerenderTextOfNote(noteid, text, animate=false){
    $('#note_'+noteid+' .note-content').html('');   //先清空note-content的内容
    //获取markdown设置
    let markdown = $('#note_'+noteid).attr('data-markdown');

    let html = '<div class="note-text">';
    let temp;
    if (markdown === 'true'){
        temp = getMarkdownText(text);
    } else {
        temp = '<p>' + filterX.text(text).html().replace(/ /g, '&nbsp;');
    }
    temp = temp.replace(/\n/gi,'<br>');
    temp = insert_spacing(temp, 0.15);
    //自动识别网页
    if (markdown == 'false'){
        html += temp.replace(reg.url, function (result) {
            return '<a href="' + result + '">' + result + '</a>';
        });
    } else {
        html += temp + '</p>';
    }
    html += '</div>';

    //渲染
    $('#note_' + noteid + ' .note-content').append(html);

    if (animate){
        $('#note_' + noteid + ' .note-content').animateCss('fadeIn morefaster');
    }

    setTimeout(function(){//auto fold
        bindNoteFoldDBL(noteid);
    },0);
}

// 解析并渲染markdown
marked.setOptions({
    renderer: new marked.Renderer(),
    headerIds: false,
    pedantic: false,
    tables: false,
    gfm: true,
    breaks: true,
    sanitize: true,
    smartLists: true,
    smartypants: false,
    xhtml: false,
    silent: true,
});

function getMarkdownText(text) {
    return marked(text);
}