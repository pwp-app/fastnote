var categories = [];

//放置新的Category到数组
function putNewCategory(name){
    categories[name] = Category(name, 0);
}

function Category(name, count){
    this.name = name;
    this.count = count;
    return this;
}

