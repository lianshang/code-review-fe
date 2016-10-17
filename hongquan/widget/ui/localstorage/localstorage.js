module.exports = {
    canUse: function() {
        return typeof window.localStorage != 'undefined';
    },
    setItem: function(key, value) {
        this.canUse() && localStorage.setItem(key, JSON.stringify(value));
    },
    getItem: function(key) {
        if (this.canUse())
          // 增加对undefined数据的处理，因为如果值为undefined的话，该代码会直接报错，导致程序不能正确执行
          // By Gavin 2016-8-1
          return localStorage.getItem(key) == 'undefined' ? null : JSON.parse(localStorage.getItem(key));
    },
    removeItem: function(key) {
        this.canUse() && localStorage.removeItem(key);
    },
};
