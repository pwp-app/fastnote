var storage = require('electron-json-storage');

//保存所有的notes
var notes = [];

var selectModeEnabled = false;
//存放长按的setTimeout
var noteLongClickTimeout;

var notes_selected = [];
var notes_selected_withencrypted = [];

var sort_mode = null;

//markdown parser
var mk_strong = /(\*\*)(.*)(\*\*)/gi;
var mk_em = /(\*)(.*)(\*)/gi;
var mk_link = /(\[)(.*)(\])(\()(.*)(\))/gi;
var mk_hr = /(\\n\s*(-\s*){3,}\s*\\n)|(\\n\s*(\*\s*){3,}\s*\\n)|(\\n\s*(_\s*){3,}\s*\\n)/gi;


//初始化排序模式
storage.get('sortMode' + (typeof inRecyclebin != 'undefined' && inRecyclebin ? '_recyclebin' : ''), function (err, data) {
    if (err) {
        console.log(err);
        sort_mode = 'id'; //设置为默认值
        return;
    }
    sort_mode = data.mode;
});
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

//定义url过滤正则
var reg_url = /(http|ftp|https|mailto):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/gi;

//渲染一条笔记
function renderNote(id, rawtime, updaterawtime, title, category, password, text, forceTop) {
    if (typeof settings.language == 'undefined'){
        current_i18n = 'zh-cn';
    } else {
        current_i18n = settings.language;
    }
    var html = '<div class="note-wrapper"><div class="note' + (typeof forceTop != 'undefined' ? forceTop ? " note-forceTop" : "" : "") + '" id="note_' + id +
        '" data-id="' + id + '" data-category="' + (typeof category != 'undefined' ? category : 'notalloc') + '"><div class="note-header"><span class="note-no">';
    html += '#' + id + '</span>';
    //渲染note-title
    var titletext = "";
    if (typeof title != 'undefined') {
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
    if (typeof forceTop != 'undefined' && typeof inRecyclebin == 'undefined') {
        if (forceTop) {
            html += '<i class="fa fa-caret-up note-forceTop-icon" aria-hidden="true"></i>';
        }
    }
    //选择性显示时间
    var m_time = moment(rawtime, 'YYYYMMDDHHmmss');
    if (typeof (updaterawtime) != 'undefined') {
        var m_updatetime = moment(updaterawtime, 'YYYYMMDDHHmmss');
        html += '<time><p class="note-time note-updatetime"><span class="note-updatetime-label">'+i18n['render'][current_i18n]['updatetime']+'</span>' + m_updatetime.format('[<timeyear>]YYYY['+i18n['render'][current_i18n]['year']+'</timeyear><timemonth>]MM['+i18n['render'][current_i18n]['month']+'</timemonth><timeday>]DD['+i18n['render'][current_i18n]['day']+'</timeday><timeclock>&nbsp;]HH:mm:ss[</timeclock>]') + '</p>' +
            '<p class="note-time note-createtime" style="display: none;"><span class="note-createtime-label">'+i18n['render'][current_i18n]['createtime']+'</span>' + m_time.format('[<timeyear>]YYYY['+i18n['render'][current_i18n]['year']+'</timeyear><timemonth>]MM['+i18n['render'][current_i18n]['month']+'</timemonth><timeday>]DD['+i18n['render'][current_i18n]['day']+'</timeday><timeclock>&nbsp;]HH:mm:ss[</timeclock>]') + '</p></time>';
    } else {
        html += '<time><p class="note-time">' + m_time.format('[<timeyear>]YYYY['+i18n['render'][current_i18n]['year']+'</timeyear><timemonth>]MM['+i18n['render'][current_i18n]['month']+'</timemonth><timeday>]DD['+i18n['render'][current_i18n]['day']+'</timeday><timeclock>&nbsp;]HH:mm:ss[</timeclock>]') + '</p></time>';
    }
    if (typeof password == 'undefined') {
        html += '</div><div class="note-content"><p class="note-text">';
        //process html tag
        temp = text.split('\n');
        let final_text = "";
        for (var i = 0; i < temp.length; i++) {
            s = $("#filter-x").text(temp[i]).html().replace(' ', '&nbsp;');
            final_text += s;
            final_text += "<br>";
        }
        text = final_text;
        text = insert_spacing(text, 0.15);
        //自动识别网页
        html += text.replace(reg_url, function (result) {
            return '<a href="' + result + '">' + result + '</a>';
        });
        html += '</p></div></div></div>';
    } else {
        //再锁定按钮
        html += '<i class="fa fa-lock note-password-relock" aria-hidden="true" onclick="relockNote(' + id + ')"></i>';
        //密码框
        html += '</div><div class="note-content"><div class="note-password" data-password="' + password + '" data-encrypted="' + text + '">';
        if (typeof inRecyclebin == 'undefined') {
            html += '<span>'+i18n['render'][current_i18n]['password']+'</span><input type="password" class="form-control" id="note_password_' + id + '" onkeydown="checkNotePassword(event, ' + id + ');">';
        } else {
            html += '<p>['+i18n['render'][current_i18n]['encrypted_info']+']</p>';
        }
        html += '</div></div></div></div>';
    }

    if (typeof forceTop != 'undefined' && typeof inRecyclebin == 'undefined') {
        if (forceTop) {
            $('.note-list-forceTop').append($(html));
        } else {
            $('.note-list-normal').append($(html));
        }
    } else {
        $('.note-list-normal').append($(html));
    }

    //open external on os default webbrowser
    $('#note_' + id + ' a').click(function (e) {
        ipcRenderer.send('openExternalURL', $(this).attr('href'));
        e.preventDefault();
    });

    setTimeout(function(){
        //防止读取不了便签内容的高度
        bindNoteFoldDBL(id);
        bindNoteTimeClick(id);
    },0);
}
//在顶部渲染Note
function renderNoteAtTop(id, rawtime, updaterawtime, title, category, password, text, forceTop) {
    //构造html
    var html = '<div class="note-wrapper"><div class="note' + (typeof forceTop != 'undefined' ? forceTop ? " note-forceTop" : "" : "") + '" id="note_' + id +
        '" data-id="' + id + '" data-category="' + (typeof category != 'undefined' ? category : 'notalloc') + '"><div class="note-header"><span class="note-no">';
    html += '#' + id + '</span>';
    //渲染note-title
    var titletext = "";
    if (typeof title != 'undefined') {
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
    //置顶标志
    if (typeof forceTop != 'undefined' && typeof inRecyclebin == 'undefined') {
        if (forceTop) {
            html += '<i class="fa fa-caret-up note-forceTop-icon" aria-hidden="true"></i>';
        }
    }
    //选择性显示时间
    var m_time = moment(rawtime, 'YYYYMMDDHHmmss');
    if (typeof (updaterawtime) != 'undefined') {
        var m_updatetime = moment(updaterawtime, 'YYYYMMDDHHmmss');
        html += '<time><p class="note-time note-updatetime"><span class="note-updatetime-label">'+i18n['render'][current_i18n]['updatetime']+'</span>' + m_updatetime.format('[<timeyear>]YYYY['+i18n['render'][current_i18n]['year']+'</timeyear><timemonth>]MM['+i18n['render'][current_i18n]['month']+'</timemonth><timeday>]DD['+i18n['render'][current_i18n]['day']+'</timeday><timeclock>&nbsp;]HH:mm:ss[</timeclock>]') + '</p>' +
            '<p class="note-time note-createtime" style="display: none;"><span class="note-createtime-label">'+i18n['render'][current_i18n]['createtime']+'</span>' + m_time.format('[<timeyear>]YYYY['+i18n['render'][current_i18n]['year']+'</timeyear><timemonth>]MM['+i18n['render'][current_i18n]['month']+'</timemonth><timeday>]DD['+i18n['render'][current_i18n]['day']+'</timeday><timeclock>&nbsp;]HH:mm:ss[</timeclock>]') + '</p></time>';
    } else {
        html += '<time><p class="note-time">' + m_time.format('[<timeyear>]YYYY['+i18n['render'][current_i18n]['year']+'</timeyear><timemonth>]MM['+i18n['render'][current_i18n]['month']+'</timemonth><timeday>]DD['+i18n['render'][current_i18n]['day']+'</timeday><timeclock>&nbsp;]HH:mm:ss[</timeclock>]') + '</p></time>';
    }
    if (typeof password == 'undefined') {
        html += '</div><div class="note-content"><p class="note-text">';
        temp = text.split('\n');
        let final_text = "";
        for (var i = 0; i < temp.length; i++) {
            s = $("#filter-x").text(temp[i]).html().replace(' ', '&nbsp;');
            final_text += s;
            final_text += "<br>";
        }
        text = final_text;

        text = insert_spacing(text, 0.15);
        //自动识别网页
        html += text.replace(reg_url, function (result) {
            return '<a href="' + result + '">' + result + '</a>';
        });
        html += '</p></div></div></div>';
    } else {
        //再锁定按钮
        html += '<i class="fa fa-lock note-password-relock" aria-hidden="true" onclick="relockNote(' + id + ')"></i>';
        //密码框
        html += '</div><div class="note-content"><div class="note-password" data-password="' + password + '" data-encrypted="' + text + '">';
        if (typeof inRecyclebin == 'undefined') {
            html += '<span>'+i18n['render'][current_i18n]['password']+'</span><input type="password" class="form-control" id="note_password_' + id + '" onkeydown="checkNotePassword(event, ' + id + ');">';
        } else {
            html += '<p>['+i18n['render'][current_i18n]['encrypted_info']+']</p>';
        }
        html += '</div></div></div></div>';
    }
    //置顶
    if (typeof forceTop != 'undefined' && typeof inRecyclebin == 'undefined') {
        if (forceTop) {
            $('.note-list-forceTop').prepend($(html));
        } else {
            $('.note-list-normal').prepend($(html));
        }
    } else {
        $('.note-list-normal').prepend($(html));
    }

    //animate
    $('#note_' + id).animateCss('fadeInLeft faster');
    //open external on os default webbrowser
    $('#note_' + id + ' a').click(function (e) {
        ipcRenderer.send('openExternalURL', $(this).attr('href'));
        e.preventDefault();
    });

    setTimeout(function(){
        bindNoteFoldDBL(id);
        bindNoteTimeClick(id);
    },0);
}

async function rerenderEditedNote(data, rawtext) {
    //分类
    if (current_category != 'all') {
        //便签编辑后已经不属于当前分类，从画面中移出并隐藏
        if (data.category != current_category) {
            $('#note_' + data.id).parent().animateCss('fadeOutLeft faster', function () {
                $('#note_' + data.id).hide();
                //当前分类是否为空
                if (getCountOfCategory(current_category) < 1) {
                    $('#note-empty-category').show();
                    $('#note-empty-category').animateCss('fadeIn');
                }
            });
            //此处不return，后续更新仍然要处理，只是便签不显示
        } else {
            //便签可能是从其他类别改到当前类别的
            if ($('#note_' + data.id).parent().css('display') == 'none') {
                $('#note_' + data.id).parent().show();
                $('#note_' + data.id).parent().animateCss('fadeInLeft faster');
                //有便签新加入必定不为空
                $('#note-empty-category').hide();
            }
        }
    }

    if (typeof data.password != "undefined") {
        resetEditedNoteText(data, rawtext);
        //便签设置了密码，判断便签之前是否有密码
        if ($('#note_'+data.id+' .note-content .note-password').length>0){
            $('#note_'+data.id+' .note-content .note-password').attr('data-password',data.password);
            $('#note_'+data.id+' .note-content .note-password').attr('data-encrypted',data.text);
        } else {
            //便签之前没有设置过密码
            $('#note_'+data.id+' .note-content').prepend('<div class="note-password" data-password="' + data.password + '" data-encrypted="' + data.text + '" style="display: none;"><span>'+i18n['render'][current_i18n]['password']+'</span><input type="password" class="form-control" id="note_password_' + data.id + '" onkeydown="checkNotePassword(event, ' + data.id + ');"></div>');
            $('#note_'+data.id+' .note-header').append('<i class="fa fa-lock note-password-relock" aria-hidden="true" onclick="relockNote(' + data.id + ')" style="display: inline-block !important;"></i>');
            $('#note_'+data.id+' .note-header .note-password-relock').animateCss('fadeIn morefaster');
        }
    } else {
        //没有设置密码
        resetEditedNoteText(data, data.text);
    }

    //移除overheight标签获取便签编辑后的内容实际高度
    let flag_overheight;
    if ($('#note_' + data.id + ' .note-content').hasClass('note-overheight')) {
        flag_overheight = true;
        $('#note_' + data.id + ' .note-content').removeClass('note-overheight');
        $('#note_' + data.id + ' .note-content').removeAttr('style');
    }
    var after_height = $('#note_' + data.id + ' .note-content').height();
    //还原被移除的overheight标签
    if (flag_overheight) {
        $('#note_' + data.id + ' .note-content').addClass('note-overheight');
    }
    //reset content of updatetime
    var timeContent = '<p class="note-time note-updatetime han-element">' + i18n['render'][current_i18n]['updatetime']
        data.updatetime + '</p>' + '<p class="note-time han-element">'+ i18n['render'][current_i18n]['createtime'] + data.time + '</p>';
    let m_updatetime = moment(data.updaterawtime, 'YYYYMMDDHHmmss');
    let m_time = moment(data.rawtime, 'YYYYMMDDHHmmss');
    var timeContent = '<p class="note-time note-updatetime"><span class="note-updatetime-label">'+i18n['render'][current_i18n]['updatetime']+'</span>' + m_updatetime.format('[<timeyear>]YYYY['+i18n['render'][current_i18n]['year']+'</timeyear><timemonth>]MM['+i18n['render'][current_i18n]['month']+'</timemonth><timeday>]DD['+i18n['render'][current_i18n]['day']+'</timeday><timeclock>&nbsp;]HH:mm:ss[</timeclock>]') + '</p>' +
        '<p class="note-time note-createtime" style="display: none;"><span class="note-createtime-label">'+i18n['render'][current_i18n]['updatetime']+'</span>' + m_time.format('[<timeyear>]YYYY['+i18n['render'][current_i18n]['year']+'</timeyear><timemonth>]MM['+i18n['render'][current_i18n]['month']+'</timemonth><timeday>]DD['+i18n['render'][current_i18n]['day']+'</timeday><timeclock>&nbsp;]HH:mm:ss[</timeclock>]') + '</p>';
    $('#note_' + data.id + ' .note-header time').html(timeContent);
    //open external event rebind
    $('#note_' + data.id + ' a').click(function (e) {
        ipcRenderer.send('openExternalURL', $(this).attr('href'));
        e.preventDefault();
    });
    //timeevent rebind
    bindNoteTimeClick(data.id);
    //处理标题
    if (typeof data.title != 'undefined') {
        var titletext = "";
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
    var origin_height = $('#note_' + data.id + ' .note-content').height(); //get origin height
    var tag_class = $('#note_' + data.id + ' .note-content').attr('class');
    //fix note status
    if (after_height > 250) {
        if (origin_height <= 250) {
            if (!$('#note_' + data.id + ' .note-content').hasClass('note-overheight')) {
                bindNoteFoldDBL(data.id);
                $('#note_' + data.id + ' .note-content').css('height', origin_height);
                $('#note_' + data.id + ' .note-content').animate({
                    height: "250px"
                });
            }
        } else {
            //already expanded
            $('#note_' + data.id + ' .note-content').css('height', origin_height);
            $('#note_' + data.id + ' .note-content').animate({
                height: after_height
            });
        }
    } else {
        $('#note_' + data.id + ' .note-content').css('height', origin_height);
        $('#note_' + data.id + ' .note-content').animate({
            height: after_height
        });
        $('#note_' + data.id + ' .note-content').dblclick = function () {}; //unbind event
        $('#note_' + data.id + ' .note-content').unbind('dblclick');
    }
    //处理分类
    var category_name = $('#note_' + data.id).attr('data-category');
    minorCategoryCount(category_name, true, true);
    addCategoryCount(data.category, true, true);
    $('#note_' + data.id).attr('data-category', data.category);
}

function resetEditedNoteText(data, t) {
    temp = t.split('\n');
    text = "";
    for (var i = 0; i < temp.length; i++) {
        s = $("#filter-x").text(temp[i]).html().replace(' ', '&nbsp;');
        text += s;
        text += "<br>";
    }
    let final_text = insert_spacing(text, 0.12);
    var html = final_text.replace(reg_url, function (result) {
        return '<a href="' + result + '">' + result + '</a>';
    });
    //reset note content on page
    $("#note_" + data.id + " .note-content p").html(html);
}

function bindNoteTimeClick(id) {
    $('#note_' + id + ' .note-updatetime').off('click').on('click', function () {
        $('#note_' + id + ' .note-header .note-updatetime').css('display', 'none');
        $('#note_' + id + ' .note-header .note-createtime').css('display', 'initial');
    });
    $('#note_' + id + ' .note-createtime').off('click').on('click', function () {
        $('#note_' + id + ' .note-header .note-updatetime').css('display', 'initial');
        $('#note_' + id + ' .note-header .note-createtime').css('display', 'none');
    });
}

//绑定note的双击折叠
function bindNoteFoldDBL(id) {
    if ($('#note_' + id + ' .note-content').height() > 250) {
        $('#note_' + id + ' .note-content').addClass("note-overheight"); //process css
        $('#note_' + id + ' .note-content').dblclick(function (e) {
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
        //在双击折叠/展开时不选中文本
        $('#note_' + id + ' .note-content p').mousedown(function (e) {
            if (e.detail > 1) {
                e.preventDefault();
            }
        });
    } else {
        $('#note_' + id + ' .note-content').removeClass("note-overheight");
    }
}

//添加笔记至Array
function addNoteToArray(id, time, rawtime, updatetime, updaterawtime, title, category, password, text, offset, timezone, forceTop, markdown) {
    var note = {
        id: id,
        time: time,
        rawtime: rawtime,
        updatetime: updatetime,
        updaterawtime: updaterawtime,
        title: title,
        category: category,
        password: password,
        text: text,
        offset: offset,
        timezone: timezone,
        forceTop: forceTop,
        markdown: markdown
    };
    notes.push(note);
    //分类计数
    if (typeof category == 'undefined') {
        notalloc_count++;
    }
}

function addNoteToArray_recycle(id, time, rawtime, updatetime, updaterawtime, title, category, password, text, offset, timezone, forceTop) {
    var note = {
        id: id,
        time: time,
        rawtime: rawtime,
        updatetime: updatetime,
        updaterawtime: updaterawtime,
        title: title,
        category: category,
        text: text,
        password: password,
        offset: offset,
        timezone: timezone,
        forceTop: forceTop
    };
    notes.push(note);
}

//添加Note Obj至Array
function addNoteObjToArray(note) {
    notes.push(note);
    //计数器增加
    if (typeof inRecyclebin == "undefined"){
        addCategoryCount(note.category, true, true);
    }
}

//刷新note-list
function refreshNoteList(callback) {
    clearNoteList(); //先清空
    if (typeof sort_mode != 'string') {
        storage.get('sortMode' + (typeof inRecyclebin != 'undefined' && inRecyclebin ? '_recyclebin' : ''), function (err, data) {
            if (err) {
                console.error(err);
                return;
            }
            sort_mode = data.mode;
            if (typeof sort_mode != 'string') {
                sort_mode = 'id';
            }
            sortNotes(sort_mode); //排序
            for (var i = 0; i < notes.length; i++) {
                renderNote(notes[i].id, notes[i].rawtime, notes[i].updaterawtime, notes[i].title, notes[i].category, notes[i].password, notes[i].text, notes[i].forceTop);
            }
            //绑定Note的点击事件
            bindNoteClickEvent();
            if (typeof inRecyclebin == 'undefined') { //回收站内不进行分类渲染
                renderNotesOfCategory(current_category);
            }
            //callback
            if (typeof (callback) === 'function') {
                callback();
            }
        });
    } else {
        sortNotes(sort_mode); //排序
        for (var i = 0; i < notes.length; i++) {
            renderNote(notes[i].id, notes[i].rawtime, notes[i].updaterawtime, notes[i].title, notes[i].category, notes[i].password, notes[i].text, notes[i].forceTop);
        }
        //绑定Note的点击事件
        bindNoteClickEvent();
        if (typeof inRecyclebin == 'undefined') { //回收站内不进行分类渲染
            renderNotesOfCategory(current_category);
        }
        //callback
        if (typeof (callback) === 'function') {
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
            minorCategoryCount(note.category, true, true);
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

async function operateForceTopNote(noteid, status) {
    for (var i = 0; i < notes.length; i++) {
        if (notes[i].id == noteid) {
            //处理note文件
            notes[i].forceTop = status;
            saveNoteByObj(notes[i]);
            break;
        }
    }
    var note_style = $('#note_'+noteid+' .note-content').attr('style');
    refreshNoteList(function(){
        $('#note_'+noteid+' .note-content').attr('style', note_style);
    });
    renderNotesOfCategory(current_category);
}

async function operateForceTopNotes(notes_selected, status){
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

async function renderNotesOfCategory(name) {
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
        for (var i = 0; i < notes.length; i++) {
            if (typeof notes[i].category != 'undefined') {
                $('#note_' + notes[i].id).parent().hide();
            } else {
                $('#note_' + notes[i].id).parent().show();
            }
        }
    } else {
        for (var i = 0; i < notes.length; i++) {
            if (typeof notes[i].category == 'undefined' || notes[i].category != name) {
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
        var input_pwd = $('#note_password_' + noteid).val();
        if (sha256(input_pwd, 'fastnote') == $('#note_password_' + noteid).parent().attr('data-password')) {
            //密码正确
            //生成解密文本
            var text = $('#note_password_' + noteid).parent().attr('data-encrypted');
            var decrypted_text = aes_decrypt(text, input_pwd);

            //生成html
            var html = '<p class="note-text" style="display:none;">';
            temp = decrypted_text.split('\n');
            let final_text = "";
            for (var i = 0; i < temp.length; i++) {
                s = $("#filter-x").text(temp[i]).html().replace(' ', '&nbsp;');
                final_text += s;
                final_text += "<br>";
            }
            final_text = insert_spacing(final_text, 0.15);
            //自动识别网页
            html += final_text.replace(reg_url, function (result) {
                return '<a href="' + result + '">' + result + '</a>';
            });
            html += '</p>';

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

                //animate
                //open external on os default webbrowser
                $('#note_' + noteid + ' a').click(function (e) {
                    ipcRenderer.send('openExternalURL', $(this).attr('href'));
                    e.preventDefault();
                });

                setTimeout(function(){//auto fold
                    bindNoteFoldDBL(noteid);
                    //绑定时间
                    bindNoteTimeClick(noteid);
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
        //隐藏relock按钮
        $('#note_' + noteid + ' .note-header .note-password-relock').animateCss('fadeOut morefaster', function () {
            $('#note_' + noteid + ' .note-header .note-password-relock').removeAttr('style');
        });
    });
}

//对便签文本进行再渲染
async function rerenderTextOfNote(noteid, text, animate=false){
    $('#note_'+noteid+' .note-content').html('');   //先清空note-content的内容
    let html = '<p class="note-text">';
    temp = text.split('\n');
    let final_text = "";
    for (var i = 0; i < temp.length; i++) {
        s = $("#filter-x").text(temp[i]).html().replace(' ', '&nbsp;');
        final_text += s;
        final_text += "<br>";
    }
    final_text = insert_spacing(final_text, 0.15);
    //自动识别网页
    html += final_text.replace(reg_url, function (result) {
        return '<a href="' + result + '">' + result + '</a>';
    });
    html += '</p>';

    //渲染
    $('#note_' + noteid + ' .note-content').append(html);

    if (animate){
        $('#note_' + noteid + ' .note-content').animateCss('fadeIn morefaster');
    }

    //open external on os default webbrowser
    $('#note_' + noteid + ' a').click(function (e) {
        ipcRenderer.send('openExternalURL', $(this).attr('href'));
        e.preventDefault();
    });

    setTimeout(function(){//auto fold
        bindNoteFoldDBL(noteid);
        //绑定时间
        bindNoteTimeClick(noteid);
    },0);
}