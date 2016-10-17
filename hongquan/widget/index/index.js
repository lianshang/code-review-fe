var $ = require('home:widget/ui/zepto/zepto.js');
var TPL = require('home:widget/ui/tpl/tpl.js');
var helper = require('home:widget/ui/helper/helper.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var fastclick = require('home:widget/ui/fastclick/fastclick.js');
require('home:widget/ui/lazyload/lazyload.js');
var app = require('home:widget/ui/router/router.js');
var MainTab = require('home:widget/ui/main-nav/main-nav.js');

////fastclick 避免点透的问题
fastclick(document.body);


//100021 需要登录错误

function main(options) {
    var pushState = false;
    if(options.route == 'url') {    //有些页面,是服务器重定向的,需要呼应pushState
       pushState = true;
    }
    var mainNav = new MainTab({hideMenu: true});
    app.initTab(mainNav);

    Backbone.history.start({pushState: pushState}); //目前发现iOS里边 wx.config容易出现问题,怀疑跟pushstate有关,暂时关掉..
}

module.exports = main;
