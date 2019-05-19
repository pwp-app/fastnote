var i18n = {};
var current_i18n;
var i18n_loaded = [];

function applyLanguage(language, callback){
    if (i18n_loaded.indexOf(language) != -1){
        processLanguage(language);
        if (typeof callback == "function"){
            callback();
        }
    } else {
        $.getScript('static/i18n/'+language+'.js',function(){
            i18n_loaded.push(language);
            processLanguage(language);
            if (typeof callback == "function"){
                callback();
            }
        });
    }
}

function processLanguage(language){
    current_i18n = language;
    $('[data-lang]').each(function(){
        let key = $(this).attr('data-lang');
        $(this).html(i18n[language][key]);
    });
    //post process
    if (typeof postprocess_i18n != "undefined"){
        for(var i=0;i<postprocess_i18n.length;i++){
            $(postprocess_i18n[i].selector).attr(postprocess_i18n[i].attr, i18n[language][postprocess_i18n[i].key]);
        }
    }
}