var $ = require('home:widget/ui/zepto/zepto.js');
var artTpl = require('home:widget/ui/tpl/tpl.js');
var tpls = require('home:widget/my-about/tpls.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var Log = require('home:widget/ui/log/log.js');


var Action = function() {
    this.init = function() {
        this.$mod = $('.mod-my-about');
        this.render();
        var version = this.getAppVersion();
        version && this.renderAppPart(version);

        Log.send({
            action: 'show',
            pid: '130001',
            detail: {url: location.href}
        });
    };
    this.getAppVersion = function() {
        var ua = navigator.userAgent;
        var reg = new RegExp('lianshang_[^\/]+\/(.+)$', 'g');
        var result = reg.exec(ua) || [];
        return result[1];
    };
    this.render = function() {
        this.$mod.html(artTpl.compile(tpls.content)({}));
    };
    this.renderAppPart = function(version) {
        // this.$mod.addClass('app');
        this.$mod.find('.version').html('版本V' + version);
        this.$mod.find('.header').hide();
    };
};

var App = Backbone.Router.extend({
    routes: {
        '': 'main'
    },
    main: function() {
        new Action().init();
    }
});
var app = new App();

$(window).load(function () {
    Backbone.history.start();
});

