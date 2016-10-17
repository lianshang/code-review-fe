var $ = require('home:widget/ui/zepto/zepto.js');
var modelCart = require('home:widget/ui/model-cart/model-cart.js');
var tpls = require('home:widget/ui/main-nav/tpls.js');
var TPL = require('home:widget/ui/tpl/tpl.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var app = require('home:widget/ui/router/router.js');
var Model = require('home:widget/ui/main-nav/main-nav.model.js');

var View = Backbone.View.extend({
    model: null,
    tagName: 'footer',
    className: 'mod-main-nav clearfix',
    events: {
        'click .main-nav': 'nav'
    },
    initialize: function (options) {
        this.model = new Model();
        this.render(options);
        this.bindEvent();
        this.listenTo(this.model, 'change:money', this.updateTotalMoney);
        this.updateTotalMoney( true );
    },
    render: function (options) {
        var total = modelCart.getTotal();
        this.$el.html(TPL.compile(tpls.nav)({buyTotal: total}));
        if(options.hideMenu) {
            this.$el.hide();
        } else {
            this.$el.show();
        }
        $(document.body).append(this.$el);
        return this;
    },
    show: function (nav) {
      this.$el.show()
          .find('.main-nav').removeClass('active').filter('.nav-'+nav).addClass('active');
    },
    hide: function () {
        this.$el.hide();
    },
    nav: function (e) {
        var nav = $(e.currentTarget).data('nav');
        this.$el.find('.main-nav').removeClass('active').filter('.nav-'+nav).addClass('active');
        // app.navigate(nav, {trigger: true, replace: true}); // 该方式会导致页面二次刷新 BY: Gavin
    },

    // 更新总价
    updateTotalMoney: function ( forceUpdate ) {
      var money = null;
      if ( forceUpdate ) {
        money = this.model.getMoneyLocal();
      } else {
        money = this.model.get('money');
      }
      this.$('.buyTotalPrice').text( money ? '￥' + money : '购物车' );
      $(document).trigger('e-model-cart-update-total-price', {money: money});
    },

    // 请求接口获取最新总价
    bindEvent: function() {
        var that = this;
        var $el  = this.$el;
        $(document).on('e-model-cart-update-total', function (e, data) {
            var skuInfo = that.model.getSkuInfo();
            if (skuInfo.count == 0) {
                $el.find(".total").empty();
                that.model.setMoneyLocal( '' );
                that.model.set('money', '');
            } else {
                that.model.getTotalPrice( skuInfo.skuList );
                var strNum = skuInfo.count;
                if (strNum > 99) {
                    strNum = '99+';
                }
                $el.find(".total").html('<em class="num">' + strNum + '</em>');
            }
        });
    }
});

module.exports = View;
