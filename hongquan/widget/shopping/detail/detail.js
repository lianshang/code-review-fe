var $ = require('home:widget/ui/zepto/zepto.js');
var TPL = require('home:widget/shopping/detail/tpls.js');
var artTpl = require('home:widget/ui/tpl/tpl.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');

var Action = function (opts) {
    this.$mod = opts.$el;
    this.init();
};

Action.prototype = {
    init: function () {
        if (conf.orderData) {
            this.$mod.html(artTpl.compile(TPL.content)({order: conf.orderData}));
        } else {
            window.location.href = '/';
        }
    }
};

var View = Backbone.View.extend({
    className: 'mod-shopping-detail',
    initialize: function () {
        $(document.body).append(this.$el);
        new Action({$el: this.$el});
    },
    close: function () {
        this.unbindEvent();
    },
    unbindEvent: function() {
    }
});

module.exports = View;
