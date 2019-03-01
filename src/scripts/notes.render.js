//保存所有的notes
var notes = new Array();

let selectModeEnabled = false;
var noteLongClickTimeout;

var notes_selected = new Array();

//显示没有笔记的界面
function showNoteEmpty() {
    var node_empty = document.getElementsByClassName('note-empty')[0];
    var node_list = document.getElementsByClassName('note-list')[0];
    node_empty.setAttribute("style", "display:flex;");
    node_list.setAttribute("style", "display:none;");
}

function showNoteEmpty_Anim() {
    $('.note-empty').css('display', 'flex');
    $('.note-empty').animateCss('fadeIn');
    var node_list = document.getElementsByClassName('note-list')[0];
    node_list.setAttribute("style", "display:none;");
}
//显示有笔记的界面
function showNoteList() {
    var node_empty = document.getElementsByClassName('note-empty')[0];
    var node_list = document.getElementsByClassName('note-list')[0];
    node_empty.setAttribute("style", "display:none;");
    node_list.setAttribute("style", "display:block;");
}
//清空列表内的笔记DOM
function clearNoteList() {
    var node_list = document.getElementsByClassName('note-list')[0];
    node_list.innerHTML = "";
}

//定义url过滤正则
let reg_url =
    /(http|ftp|https|mailto):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/gi;

//渲染一条笔记
function renderNote(id, time, updatetime, text) {
    var html = '<div class="note-wrapper"><div class="note" id="note_' + id +
        '" data-id="'+ id +'"><div class="note-header"><p class="note-no">';
    html += '#' + id + '</p>';
    //选择性显示时间
    if (typeof (updatetime) != 'undefined') {
        html += '<time><p class="note-time note-updatetime han-element">更新：' + updatetime,
            +'</p>';
        html += '<p class="note-time han-element">创建：' + time + '</p></time>';
    } else {
        html += '<time><p class="note-time han-element">' + time + '</p></time>';
    }
    html += '</div><div class="note-content"><p class="note-text">';
    //process html tag
    temp = text.split('<br/>');
    final_text = "";
    for (var i = 0; i < temp.length; i++) {
        s = $("#filter-x").text(temp[i]).html().replace(' ', '&nbsp;');
        final_text += s;
        final_text += "<br/>";
    }
    text = final_text;
    text = insert_spacing(text, 0.15);
    //自动识别网页
    html += text.replace(reg_url, function (result) {
        return '<a href="' + result + '">' + result + '</a>';
    });
    html += '</p></div></div></div>';
    $('.note-list').append($(html));
    //open external on os default webbrowser
    $('#note_' + id + ' a').click(function (e) {
        ipcRenderer.send('openExternalURL', $(this).attr('href'));
        e.preventDefault();
    });
}
//在顶部渲染Note
function renderNoteAtTop(id, time, updatetime, text) {
    //构造html
    var html = '<div class="note-wrapper"><div class="note" id="note_' + id +
        '" data-id="'+ id +'"><div class="note-header"><p class="note-no">';
    html += '#' + id + '</p>';
    //选择性显示时间
    if (typeof (updatetime) != 'undefined') {
        html += '<time><p class="note-time note-updatetime han-element">更新：' + updatetime + '</p>';
        html += '<p class="note-time han-element">创建：' + time + '</p></time>';
    } else {
        html += '<time><p class="note-time han-element">' + time + '</p></time>';
    }
    html += '</div><div class="note-content"><p class="note-text">';

    temp = text.split('<br/>');
    final_text = "";
    for (var i = 0; i < temp.length; i++) {
        s = $("#filter-x").text(temp[i]).html().replace(' ', '&nbsp;');
        console.log(s);
        final_text += s;
        final_text += "<br/>";
    }
    text = final_text;

    text = insert_spacing(text, 0.15);
    //自动识别网页
    html += text.replace(reg_url, function (result) {
        return '<a href="' + result + '">' + result + '</a>';
    });
    html += '</p></div></div></div>';
    $('.note-list').prepend($(html));
    //auto fold
    bindNoteFoldDBL(id);
    //animate
    $('#note_' + id).animateCss('fadeInLeft');
    //open external on os default webbrowser
    $('#note_' + id + ' a').click(function (e) {
        ipcRenderer.send('openExternalURL', $(this).attr('href'));
        e.preventDefault();
    });
}

//绑定note的双击折叠
function bindNoteFoldDBL(id) {
    if ($('#note_' + id + ' .note-content').height() > 250) {
        $('#note_' + id + ' .note-content').addClass("note-overheight"); //process css
        $('#note_' + id + ' .note-content').dblclick(function () {
            //process double click
            if ($('#note_' + id + ' .note-content').height() > 250) {
                $('#note_' + id + ' .note-content').animate({
                    height: "250px"
                });
                $('#note_' + id + ' .note-content').addClass("note-overheight");
            } else {
                $('#note_' + id + ' .note-content').css('height', 'auto');
                var animate_height = $('#note_' + id + ' .note-content').height();
                $('#note_' + id + ' .note-content').css('height', '250px');
                $('#note_' + id + ' .note-content').animate({
                    height: animate_height
                });
                $('#note_' + id + ' .note-content').removeClass("note-overheight");
            }
        });
    } else {
        $('#note_' + id + ' .note-content').removeClass("note-overheight");
    }
}

//添加笔记至Array
function addNoteToArray(id, time, rawtime, updatetime, updaterawtime, text, offset, timezone) {
    var note = {
        id: id,
        time: time,
        rawtime: rawtime,
        updatetime: updatetime,
        updaterawtime: updaterawtime,
        text: text,
        offset: offset,
        timezone: timezone
    }
    notes.push(note);
}
//添加Note Obj至Array
function addNoteObjToArray(note) {
    notes.push(note);
}
//刷新note-list
function refreshNoteList(callback) {
    clearNoteList(); //先清空
    notes.sort(sortNotes); //排序
    notes.forEach(function (note) {
        renderNote(note.id, note.time, note.updatetime, note.text);
    });
    //绑定Note的点击事件
    bindNoteClickEvent();
    //callback
    if (typeof (callback) === 'function') {
        callback();
    }
}
//清空notes数组
function clearNoteArray() {
    notes = new Array();
}
//排序笔记
function sortNotes(a, b) {
    if (a.id > b.id) {
        return -1;
    } else if (a.id < b.id) {
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
            return false;
        }
        return true; //every是true继续循环 false跳出
    });
}