var searchOpened = false;

var searchTextChangeCount = 0;
var searchTimeout;

//绑定触发快捷键
Mousetrap.bind('ctrl+f', function () {
    if (!searchOpened) {
        searchOpened = true;
        popupSearchToast();
    }
});

//绑定input
$('#input-search').bind('input propertychange', function () {
    searchTextChangeCount++;
    if (typeof searchTimeout != "undefined") {
        clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(searchNotes(searchTextChangeCount, $('#input-search').val().trim()), 100);
});

function popupSearchToast() {
    $('.toast-search').addClass('toast-active');
    $('#input-search').val(''); //清空
    $('.toast-search').animateCss('fadeInRight faster', function () {
        //focus the input
        $('#input-search').focus();
    });
}

function closeSearchToast() {
    $('.toast-search').animateCss('fadeOutRight faster', function () {
        //focus the input
        $('.toast-search').removeClass('toast-active');
        searchOpened = false;
    });
    //解除隐藏
    $('.search-hidden').removeClass('search-hidden');
    //隐藏找不到相关便签的div
    $('#note-empty-search').hide();
}

function searchNotes(count, pattern) {
    var t = count;
    $('.search-hidden').removeClass('search-hidden');
    $('#note-empty-search').hide();
    if (pattern.length < 1) {
        return;
    }
    //检查是否为特殊搜索
    let f_noresult = true;
    if (pattern.indexOf('#id:') == 0) {
        //把前缀处理掉
        let p = pattern.replace('#id:', '').trim();
        //特定搜索的便签数量较少，为了提升效率，给所有的便签都加上search-hidden
        $('.note').parent().addClass('search-hidden');
        var ids = p.split(','); //没有分隔符，ids.length = 1
        for (let i = 0; i < ids.length; i++) {
            //判断是否为区间
            if (ids[i].indexOf('-') != -1) {
                let limit = ids[i].split('-').map(Number);
                for (let j = limit[0]; j <= limit[1]; j++) {
                    if ($('#note_' + j).length > 0) {
                        //note存在
                        f_noresult = false;
                        $('#note_' + j).parent().removeClass('search-hidden');
                    }
                }
            } else {
                if (ids[i] != null && ids[i].trim().length > 0) {
                    //判断id是否为有效的， 再判断note是否存在
                    if ($('#note_' + ids[i]).length > 0) {
                        //note存在
                        f_noresult = false;
                        $('#note_' + ids[i]).parent().removeClass('search-hidden');
                    }
                }
            }
        }
    } else {
        for (var i = 0; i < notes.length; i++) {
            if (t != searchTextChangeCount) {
                //搜索的pattern已经改变，无需再进行当前的搜索
                return;
            }
            var reg = eval("/" + pattern + "/i");
            if (reg.test(notes[i].text)) {
                f_noresult = false;
            } else {
                //隐藏掉不包含pattern的便签
                $('#note_' + notes[i].id).parent().addClass('search-hidden');
            }
        }
    }
    if (f_noresult) {
        $('#note-empty-search').show();
    }
}