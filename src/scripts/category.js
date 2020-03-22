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
function readCurrentCategory() {
    if (fs.existsSync(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/current_category.json')) {
        fs.readFile(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/current_category.json', 'utf-8', function(err, data) {
            if (err) {
                console.error(err);
                return;
            }
            current_category = JSON.parse(data).category;
            $(document).ready(function() {
                //渲染一次current_category
                renderCurrentCategory();
                if (current_category != 'notalloc' && current_category != 'all') {
                    $('#select-note-category').val(current_category);
                }
            });
        });
    } else {
        current_category = "all";
        $(document).ready(function() {
            //渲染一次current_category
            renderCurrentCategory();
        });
    }
}

function saveCurrentCategory() {
    var data = {
        category: current_category
    };
    fs.writeFile(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/current_category.json', JSON.stringify(data), 'utf-8', function(err) {
        if (err) {
            console.error(err);
        }
    });
}

function readCategoriesFile() {
    if (fs.existsSync(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/categories.json')) {
        fs.readFile(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/categories.json', 'utf-8', function(err, data) {
            if (err) {
                console.error(err);
                return;
            }
            categories = JSON.parse(data);
            $(document).ready(function() {
                renderCategoryList();
                renderCategorySelect();
                renderSystemCategoryCount();
                renderCustomCategoryCount();
            });
        });
    }
}

function checkCategoryCount() {
    let custom_total = 0;
    for (var i = 0; i < categories.length; i++) {
        custom_total += categories[i].count;
    }
    if (notalloc_count + custom_total != notes.length) {
        recountNotes();
    } else {
        console.log('Category count check passed.');
    }
}

//重新计算note的数量
function recountNotes() {
    let count_obj = {};
    //清点notes
    for (let i = 0; i < notes.length; i++) {
        if (typeof notes[i].category != 'undefined') {
            if (notes[i].category != 'notalloc') {
                if (typeof count_obj[notes[i].category] == 'undefined') {
                    count_obj[notes[i].category] = {};
                    count_obj[notes[i].category].count = 1;
                } else {
                    count_obj[notes[i].category].count++;
                }
            }
        }
    }
    //覆盖categories的设置
    for (let i = 0; i < categories.length; i++) {
        if (typeof count_obj[categories[i].name] != 'undefined') {
            categories[i].count = count_obj[categories[i].name].count;
        }
    }
    //重新校验正确性
    let custom_total = 0;
    for (let i = 0; i < categories.length; i++) {
        custom_total += categories[i].count;
    }
    console.log('Category verify total after fix: ' + (notalloc_count + custom_total));
    if (notalloc_count + custom_total == notes.length) {
        console.log('Category count is reset to correct values.');
        saveCategories();
        renderSystemCategoryCount();
        renderCustomCategoryCount();
    } else {
        console.error('Category count error, cannot auto fix.');
    }
}

function Category(name, count) {
    var category = {};
    category.name = name;
    category.count = count;
    return category;
}

//放置新的Category到数组
function putCategoryToArr(name, count = 0) {
    categories.push(Category(name, count));
}

function existCategory(name) {
    for (var i = 0; i < categories.length; i++) {
        if (categories[i].name == name) {
            return true;
        }
    }
    return false;
}

function indexOfCategory(name) {
    for (var i = 0; i < categories.length; i++) {
        if (categories[i].name == name) {
            return i;
        }
    }
    return false;
}

function getCountOfCategory(name) {
    if (name == 'notalloc') {
        return notalloc_count;
    } else if (name == 'all') {
        return notes.length;
    } else {
        for (var i = 0; i < categories.length; i++) {
            if (categories[i].name == name) {
                return categories[i].count;
            }
        }
        return false;
    }
}

function removeCategoryFromArr(name) {
    for (var i = 0; i < categories.length; i++) {
        if (categories[i].name == name) {
            categories.splice(i, 1);
        }
    }
}

function setNotesCategory(name, category) {
    var index;
    if (typeof category != "undefined") {
        index = indexOfCategory(name);
    }
    for (var i = 0; i < notes.length; i++) {
        if (notes[i].category == name) {
            notes[i].category = category;
            saveNoteByObj(notes[i]);
            if (typeof category == "undefined") {
                notalloc_count++;
            } else {
                if (index) {
                    categories[index].count++;
                }
            }
        }
    }
    //保存分类
    saveCategories();
    //重新渲染计数
    renderSystemCategoryCount();
    renderCustomCategoryCount();
}

function saveCategories() {
    if (!fs.existsSync(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/')) {
        fs.mkdirSync(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/');
    }
    var json = JSON.stringify(categories);
    fs.writeFile(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/categories.json', json, 'utf-8', function(err, data) {
        if (err) {
            console.error(err);
        }
    });
}

function renderCategoryToList(index, name, count, animate = false) {
    var html = '<li data-name="' + name + '" draggable="true"><div id="category-custom-' + name + '"><div class="category-item-name"><span>' + name + '</span><input class="category-edit-input" type="text" value="' + name + '" data-index="' + index + '"></div><div class="category-item-count"><span>' + count + '</span></div><div class="category-item-delbtn"><i class="fa fa-minus-circle" aria-hidden="true"></i></div></div></li>';
    $('.category-menu-custom').append(html);
    //如果是编辑模式下添加的，样式和编辑模式统一
    if (categoryEditMode) {
        $('#category-custom-' + name + ' .category-item-count').hide();
        $('#category-custom-' + name + ' .category-item-delbtn').show();
        $('#category-custom-' + name).parent().css('-webkit-user-drag', 'auto');
        $('#category-custom-' + name).parent().css('-webkit-user-select', 'auto');
    }
    if (animate) {
        $('#category-custom-' + name).animateCss('fadeIn morefaster');
    }
}

function renderCategoryToSelect(name) {
    var html = '<option value="' + name + '">' + name + '</option>';
    $('#select-note-category').append(html);
}

function renderCategoryList() {
    $('.category-menu-custom').html(''); //先清空
    for (var i = 0; i < categories.length; i++) {
        renderCategoryToList(i, categories[i].name, categories[i].count);
    }
}

function renderCategorySelect() {
    $('#select-note-category').html('<option value="notalloc" data-lang="notalloc">未分类</option>');
    for (var i = 0; i < categories.length; i++) {
        renderCategoryToSelect(categories[i].name);
    }
}

function renderCurrentCategory() {
    switch (current_category) {
        case 'all':
            $('#category-system-' + current_category).addClass('category-selected');
            $('.bottombar-category-name').html('');
            $('#newnote-info-item-category').show(); //当前分类为所有便签时创建便签的分类可选
            break;
        case 'notalloc':
            $('#category-system-' + current_category).addClass('category-selected');
            $('.bottombar-category-name').html('未分类');
            $('#newnote-info-item-category').hide();
            break;
        default:
            $('#category-custom-' + current_category).addClass('category-selected');
            $('.bottombar-category-name').html(current_category);
            $('#newnote-info-item-category').hide(); //当前分类为其他分类时创建便签的分类不可选
            break;
    }
}

function addCategoryCount(name, render = false, save = false) {
    if (typeof name == 'undefined' || name == 'notalloc') {
        notalloc_count++;
        renderSystemCategoryCount();
        return;
    }
    for (var i = 0; i < categories.length; i++) {
        if (categories[i].name == name) {
            categories[i].count = categories[i].count + 1;
            if (render) {
                $('#category-custom-' + categories[i].name + ' .category-item-count span').html(categories[i].count); //渲染到UI上
                renderSystemCategoryCount();
            }
            if (save) {
                saveCategories();
            }
            return;
        }
    }
}

function minorCategoryCount(name, checkEmpty = true, render = false, save = false) {
    if (typeof name == 'undefined' || name == 'notalloc') {
        notalloc_count--;
        renderSystemCategoryCount();
        if (checkEmpty) {
            if (current_category == 'notalloc') {
                checkCategoryEmpty();
            }
        }
        return;
    }
    for (var i = 0; i < categories.length; i++) {
        if (categories[i].name == name) {
            categories[i].count = categories[i].count - 1;
            if (render) {
                $('#category-custom-' + categories[i].name + ' .category-item-count span').html(categories[i].count); //渲染到UI上
                renderSystemCategoryCount();
            }
            if (checkEmpty) {
                checkCategoryEmpty();
            }
            if (save) {
                saveCategories();
            }
            return;
        }
    }
}

function checkCategoryEmpty() {
    if (current_category == 'all' || notes.length < 1) {
        return;
    }
    if (getCountOfCategory(current_category) < 1) {
        if ($('#note-empty-category').css('display') == 'none') {
            $('#note-empty-category').show();
            $('#note-empty-category').animateCss('fadeIn faster');
        }
    }
}

function renderSystemCategoryCount() {
    $('#category-count-all').html(notes.length);
    $('#category-count-notalloc').html(notalloc_count);
}

function renderCustomCategoryCount() {
    for (var i = 0; i < categories.length; i++) {
        $('#category-custom-' + categories[i].name + ' .category-item-count span').html(categories[i].count);
    }
}