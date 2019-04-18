var fs = require('fs');
var remote = require('electron').remote;
var app = remote.app;
var storagePath = app.getPath('userData');

var categories = [];
var current_category;

var notalloc_count = 0;

global.indebug = remote.getGlobal('indebug');

readCategoriesFile();
readCurrentCategory();

//读取
function readCurrentCategory(){
    if(fs.existsSync(storagePath + (global.indebug?'/devTemp':'')+ '/storage/current_category.json')){
        fs.readFile(storagePath + (global.indebug?'/devTemp':'')+ '/storage/current_category.json', 'utf-8', function(err, data){
            if (err){
                console.error(err);
                return;
            }
            current_category = JSON.parse(data).category;
        });
    } else {
        current_category = "all";
    }
    $(document).ready(function(){
        renderCurrentCategory();
    });
}

function readCategoriesFile(){
    if(fs.existsSync(storagePath + (global.indebug?'/devTemp':'')+ '/storage/categories.json')){
        fs.readFile(storagePath + (global.indebug?'/devTemp':'')+ '/storage/categories.json', 'utf-8', function(err, data){
            if (err){
                console.error(err);
                return;
            }
            categories = JSON.parse(data);
            $(document).ready(function(){
                renderCategoryList();
                renderCategorySelect();
                renderSystemCategoryCount();
                renderCustomCategoryCount();
            });
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
    var html = '<li data-name="'+name+'"><div id="category-custom-'+name+'"><div class="category-item-name"><span>'+name+'</span></div><div class="category-item-count"><span>'+count+'</span></div><div class="category-item-delbtn"><i class="fa fa-minus-circle" aria-hidden="true"></i></div></div></li>';
    $('.category-menu-custom').append(html);
    if (animate){
        $('#category-custom-'+name).animateCss('fadeIn morefaster');
    }
}

function renderCategoryToSelect(name){
    var html = '<option value="'+name+'">'+name+'</option>';
    $('#select-note-category').append(html);
}

async function renderCategoryList(){
    $('.category-menu-custom').html('');    //先清空
    for (var i=0;i<categories.length;i++){
        renderCategoryToList(categories[i].name, categories[i].count);
    }
}

async function renderCategorySelect(){
    $('#select-note-category').html('<option value="notalloc">未分类</option>');
    for (var i=0;i<categories.length;i++){
        renderCategoryToSelect(categories[i].name);
    }
}

async function renderCurrentCategory(){
    switch(current_category){
        default:
        $('#category-custom-'+current_category).addClass('category-selected');
        break;
        case 'all':case 'notalloc':
        $('#category-system-'+current_category).addClass('category-selected');
        break;
    }
}

async function addCategoryCount(name, render=false, save=false){
    if (typeof name == 'undefined'){
        notalloc_count++;
        renderSystemCategoryCount();
        return;
    }
    for (var i=0;i<categories.length;i++){
        if (categories[i].name == name){
            categories[i].count = categories[i].count + 1;
            if (render){
                $('#category-custom-'+categories[i].name+' .category-item-count span').html(categories[i].count);   //渲染到UI上
                renderSystemCategoryCount();
            }
            if (save){
                saveCategories();
            }
            return;
        }
    }
}

async function minorCategoryCount(name, render=false, save=false){
    if (typeof name == 'undefined'){
        notalloc_count--;
        renderSystemCategoryCount();
        return;
    }
    for (var i=0;i<categories.length;i++){
        if (categories[i].name == name){
            categories[i].count = categories[i].count - 1;
            if (render){
                $('#category-custom-'+categories[i].name+' .category-item-count span').html(categories[i].count);   //渲染到UI上
                renderSystemCategoryCount();
            }
            if (save){
                saveCategories();
            }
            return;
        }
    }
}

async function renderSystemCategoryCount(){
    $('#category-count-all').html(notes.length);
    $('#category-count-notalloc').html(notalloc_count);
}

async function renderCustomCategoryCount(){
    for (var i=0;i<categories.length;i++){
        $('#category-custom-'+categories[i].name+' .category-item-count span').html(categories[i].count);
    }
}