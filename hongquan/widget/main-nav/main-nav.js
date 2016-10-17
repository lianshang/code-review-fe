var $ = require('home:widget/ui/zepto/zepto.js');
var modelCart = require('home:widget/ui/model-cart/model-cart.js');
var tpls = require('home:widget/main-nav/tpls.js');
var TPL = require('home:widget/ui/tpl/tpl.js');

var $mod = $('.mod-main-nav');
var ACTIVE = "active";

var $home = $("#viewCanvas");
//var $cart = $("#cartCanvas");

conf.currentView = "";

var mainNav = {
    init: function () {
        var total = modelCart.getTotal();

        $mod.html(TPL.compile(tpls.nav)({buyTotal: total}));
        bindEvent();

        return this;
    },

    nav: function (targetNav) {
        $mod.find('.main-nav').removeClass(ACTIVE);
        $mod.find('.nav-' + targetNav).addClass(ACTIVE);

        conf.currentView = targetNav;

        if (targetNav === "cart") {
            $home.hide();
            //$cart.show(); //在购物车里处理-change by NE 2015.12.27
        } else {
            $home.show();
            //$cart.hide();
        }
    }
};

function bindEvent() {
    //TODO: 现在逻辑是,点击a链接,对于hash的,则触发Backbone的路由逻辑（针对HASH的情况）;对于url,则直接前往对应的页面
    //                  但是,对于路由应用了pushState的情况,目前对于购物车,是不能由HASH触发的.所以,这里增加一个全局的事件,对于链接点击,也触发一个全局的点击事件,方便category这种页面处理?...优化待定
    $mod.on(conf.evClick, 'a', function (e) {
        var targetNav = $(this).data('nav');
        $(document).trigger('e-main-nav-click', targetNav);
    });

    // 导航切换
    $(document).on("e-main-nav-change", function (e, targetNav) {
        mainNav.nav(targetNav);
    });

    // 购物车
    $(document).on('e-model-cart-update-total', function (e, data) {
        if (data.total == 0) {
            $mod.find(".total").empty();
        } else {
            var strNum = data.total;
            if (strNum > 99) {
                strNum = '99+';
            }
            $mod.find(".total").html('<em class="num">' + strNum + '</em>');
        }
    });
}


module.exports = mainNav.init;
