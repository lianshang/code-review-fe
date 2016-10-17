/**
 * @require "home:widget/ui/header/header.less"
 */
var $ = require('home:widget/ui/zepto/zepto.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var Loading = require('home:widget/ui/loading/loading.js');
var CartMainModel = require('home:widget/cart/cart.main.model.js');
var CartMainView = require('home:widget/cart/cart.main.view.js');


var View = Backbone.View.extend({
    initialize: function (options) {

        conf.currentView = 'cart';
        if( options && options.thisError ) {
            this.cartView = new CartMainView({thisError : options.thisError });
        }else {
            this.cartView = new CartMainView();
        }

        this.setElement(this.cartView.el);
        // 如果URL中有submit，则直接进订单提交页；没有则进购物车页
        if (options && options.submit) {
            this.$el.trigger("e-balance");
        } else {
            // $('.mod-main-nav').show();
            $(document).trigger("e-main-nav-change", "cart");
            CartMainModel.update({refresh: true, isShowTabs: true});
        }
    },
    close: function() {
        // Loading.destroy();
        this.cartView.close();
    }
});

module.exports = View;
