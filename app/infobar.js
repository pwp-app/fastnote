var infobar_container = document.getElementsByClassName("container-infobar")[0];

var infobar_id = 0;

//显示Infobar
function displayInfobar(type, text, timeout = 3000) {
    var html = "";
    switch (type) {
        case 'success':
            html += '<div class="infobar infobar-success" id="infobar_' + infobar_id + '"><i class="fa fa-check"></i><span>';
            html += text;
            html += '</span></div>';
            infobar_container.innerHTML = html + infobar_container.innerHTML;
            break;
        case 'warning':
            html += '<div class="infobar infobar-warning" id="infobar_' + infobar_id + '"><i class="fa fa-warning"></i><span>';
            html += text;
            html += '</span></div>';
            infobar_container.innerHTML = html + infobar_container.innerHTML;
            break;
        case 'error':
            html += '<div class="infobar infobar-error" id="infobar_' + infobar_id + '"><i class="fa fa-warning"></i><span>';
            html += text;
            html += '</span></div>';
            infobar_container.innerHTML = html + infobar_container.innerHTML;
            break;
        case 'info':
        default:
            html += '<div class="infobar infobar-info" id="infobar_' + infobar_id + '"><i class="fa fa-info-circle"></i><span>';
            html += text;
            html += '</span></div>';
            infobar_container.innerHTML = html + infobar_container.innerHTML;
            break;
    }
    //animate
    //timeout > 0则自动关闭，否则需要用户手动关闭
    if (timeout > 0) {
        //用t中转
        var t = infobar_id;
        $('#infobar_' + t).animateCss('fadeInDown', function () {
            setTimeout(function () {
                $('#infobar_' + t).animateCss('fadeOutUp', function(){
                    $('#infobar_'+t).remove();
                });
            }, timeout);
        });
    } else {
        $('#infobar_' + infobar_id).animateCss('fadeInDown');
    }
    infobar_id++;
}

function clearInfoBarContainer() {
    infobar_container.innerHTML = '';
}