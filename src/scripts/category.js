var fs = require('fs');
var remote = require('electron').remote;
var app = remote.app;
var storagePath = app.getPath('userData');

var categories = [];
var notalloc_count = 0;

global.indebug = remote.getGlobal('indebug');

readCategoriesFile();

//读取
function readCategoriesFile(){
    if(fs.existsSync(storagePath + (global.indebug?'/devTemp':'')+ '/storage/categories.json')){
        fs.readFile(storagePath + (global.indebug?'/devTemp':'')+ '/storage/categories.json', 'utf-8', function(err, data){
            if (err){
                console.error(err);
                return;
            }
            categories = JSON.parse(data);
            renderCategoryList();
        });
    }

}

function Category(name, count){
    var category = {};
    category.name = name;
    category.count = count;
    return category;
}

//放置新的Category到数组
function putCategoryToArr(name, count=0){
    categories.push(Category(name, count));
}

function existCategory(name){
    for (var i=0;i<categories.length;i++){
        if (categories[i].name == name){
            return true;
        }
    }
    return false;
}

function removeCategoryFromArr(name){
    for (var i=0;i<categories.length;i++){
        if (categories.name == name){
            categories.splice(i,1);
        }
    }
}

async function saveCategories(){
    if(!fs.existsSync(storagePath + (global.indebug?'/devTemp':'')+ '/storage/')){
        fs.mkdirSync(storagePath +(global.indebug?'/devTemp':'') + '/storage/');
    }
    var json = JSON.stringify(categories);
    fs.writeFile(storagePath +(global.indebug?'/devTemp':'') + '/storage/categories.json', json, 'utf-8', function (err, data) {
        if (err) {
            console.error(err);
        }
    });
}

function renderCategoryToList(name, count, animate=false){
    var html = '<li><div id="category-custom-'+name+'"><div class="category-item-name"><span>'+name+'</span></div><div class="category-item-count"><span>'+count+'</span></div></div></li>';
    $('.category-menu-custom').append(html);
    if (animate){
        $('#category-custom-'+name).animateCss('fadeIn morefaster');
    }
}

async function renderCategoryList(){
    $('.category-menu-custom').html('');    //先清空
    for (var i=0;i<categories.length;i++){
        renderCategoryToList(categories[i].name, categories[i].count);
    }
}

async function addCategoryCount(name){
    for (var i=0;i<categories.length;i++){
        if (categories[i].name == name){
            categories[i].count = categories[i].count + 1;
            $('#category-custom-'+categories[i].name+' .category-item-count span').html(categories[i].count);   //渲染到UI上
            return;
        }
    }
}

async function renderSystemCategoryCount(){
    $('#category-count-all').html(notes.length);
    $('#category-count-notalloc').html(notalloc_count);
}

async function renderCustomCategoryCount(){
    
}