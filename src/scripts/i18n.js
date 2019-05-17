var i18n = {};

function applyLanguage(language){
    $('[data-lang]').each(function(){
        let key = $(this).attr('data-lang');
        $(this).html(i18n[language][key]);
    });
}