$('.container-lockscreen').mousedown(function (e){
    $('#input-lockscreen').focus();
    return false;
});
$('#input-lockscreen').keypress(function (e){
    if (e.which === 13){
        var t = $('#input-lockscreen').val().trim();
        if (t.length > 0){
            var p = sha256(t, 'fastnote');
            if (p == settings.lockpassword){
                //解锁
                disableLockScreen();
                ipcRenderer.send('disable-lockscreen');
            } else {
                if (!$('#input-lockscreen').hasClass('invalid')){
                    $('#input-lockscreen').addClass('invalid');
                }
            }
        } else {
            $('#input-lockscreen').addClass('invalid');
        }
    }
});
ipcRenderer.on('enable-lockscreen-minimize',function(){
    if (!settings){
        return;
    }
    if (typeof settings.lockpassword !== 'undefined' && settings.locktype === 'minimize' && $('.container-lockscreen').css('display') == 'none'){
        enableLockScreen();
    }
});
ipcRenderer.on('enable-lockscreen-blur', function(){
    if (!settings){
        return;
    }
    if (typeof settings.lockpassword !== 'undefined' && settings.locktype === 'blur' && $('.container-lockscreen').css('display') == 'none'){
        enableLockScreen();
    }
});
ipcRenderer.on('disable-lockscreen', function(){
    disableLockScreen();
});

function enableLockScreen(){
    if (!settings || !settings.lockpassword || !settings.locktype) {
        return;
    }
    if (typeof isMainMenuOpen !== "undefined" && isMainMenuOpen){
        closeMainMenu();
    }
    $('#input-lockscreen').val('');
    $('#input-lockscreen').removeClass('invalid');
    $('.container-lockscreen').css('display', 'block');
    $('.container-lockscreen').animateCss('fadeIn faster');
    $('#input-lockscreen').focus();
}

function disableLockScreen(){
    if ($('.container-lockscreen').css('display') != 'none'){
        $('.container-lockscreen').animateCss('fadeOut faster',function(){
            $('.container-lockscreen').css('display', 'none');
        });
        $('#input-lockscreen').removeClass('invalid');
    }
}