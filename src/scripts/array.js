Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};
Array.prototype.removeAt = function(index) {
    if (index > -1) {
        this.splice(index, 1);
    }
};