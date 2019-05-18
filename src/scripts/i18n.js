var i18n = {};
var current_i18n;
var i18n_loaded = [];

function applyLanguage(language){
    if (i18n_loaded.indexOf(language) != -1){
        $('[data-lang]').each(function(){
            let key = $(this).attr('data-lang');
            $(this).html(i18n[language][key]);
        });
        current_i18n = language;
    } else {
        $.getScript('static/i18n/'+language+'.js',function(){
            i18n_loaded.push(language);
            $('[data-lang]').each(function(){
                let key = $(this).attr('data-lang');
                $(this).html(i18n[language][key]);
            });
            current_i18n = language;
        });
    }
}