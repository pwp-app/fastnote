var searchOpened = false;

var searchTextChangeCount = 0;

//绑定触发快捷键
/*Mousetrap.bind('ctrl+f', function () {
    if (!searchOpened){
        searchOpened = true;
        popupSearchToast();
    }
});*/

//绑定input
$('#input-search').change(function(){
    searchTextChangeCount++;
    searchNotes(searchTextChangeCount, $('#input-search').val().trim());
});

function popupSearchToast(){
    $('.toast-search').show();
    $('#input-search').val(''); //清空
    $('.toast-search').animateCss('fadeInRight faster', function(){
        //focus the input
        $('#input-search').focus();
    });
}

function closeSearchToast(){
    $('.toast-search').animateCss('fadeOutRight faster', function(){
        //focus the input
        $('.toast-search').hide();
        searchOpened = false;
    });
    //解除隐藏
    $('.search-hidden').removeClass('search-hidden');
}

async function searchNotes(count, pattern){
    var t = count;
    if (pattern.length<1){
        return;
    }
    //解除隐藏
    $('.search-hidden').removeClass('search-hidden');
    //检查是否为特殊搜索
    if (pattern.indexOf('id:') == 0){

    } else {
        for (var i=0;i<notes.length;i++){
            if (count != searchTextChangeCount){
                //搜索的pattern已经改变，无需再进行当前的搜索
                return;
            }
            if (notes[i].text.indexOf(pattern) == -1){
                //隐藏掉不包含pattern的便签
                $('#note_'+notes[i].id).parent().addClass('search-hidden');
            }
        }
    }
}
