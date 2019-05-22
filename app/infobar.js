var infobar_container;

$(document).ready(function(){
    infobar_container = $(".container-infobar");
});

var infobar_id = 0;

//显示Infobar
function displayInfobar(type, text, timeout = 3000) {
    var html = "";
    switch (type) {
        case 'success':
            html += '<div class="infobar infobar-success" id="infobar_' + infobar_id + '"><i class="fa fa-check"></i><span>';
            html += text;
            html += '</span></div>';
            break;
        case 'warning':
            html += '<div class="infobar infobar-warning" id="infobar_' + infobar_id + '"><i class="fa fa-warning"></i><span>';
            html += text;
            html += '</span></div>';
            break;
        case 'error':
            html += '<div class="infobar infobar-error" id="infobar_' + infobar_id + '"><i class="fa fa-warning"></i><span>';
            html += text;
            html += '</span></div>';
            break;
        case 'update':
            timeout = 0; //禁用自动关闭
            html += '<div class="infobar infobar-info" id="infobar_update"><i class="fa fa-spinner icon-spin"></i><span id="infobar-update-text">' + text + '</span><progress class="update-progress" id="update-progress" value="0" max="100"></progress>';
            html += '</div>';
            break;
        case 'info':
        default:
            html += '<div class="infobar infobar-info" id="infobar_' + infobar_id + '"><i class="fa fa-info-circle"></i><span>';
            html += text;
            html += '</span></div>';
            break;
    }
    infobar_container.append($(html));
    //animate
    //timeout > 0则自动关闭，否则需要用户手动关闭
    if (timeout > 0) {
        //用t中转
        var t = infobar_id;
        $('#infobar_' + t).animateCss('fadeInDown', function () {
            setTimeout(function () {
                $('#infobar_' + t).animateCss('fadeOutUp', function () {
                    $('#infobar_' + t).remove();
                });
            }, timeout);
        });
    } else {
        $('#infobar_' + infobar_id).animateCss('fadeInDown');
    }
    //更新infobar
    if (type=="update"){
        $('#infobar_update').animateCss('fadeInDown');
    }
    infobar_id++;
}

function clearInfoBarContainer() {
    infobar_container.innerHTML = '';
}