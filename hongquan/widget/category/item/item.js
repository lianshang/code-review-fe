var $ = require('home:widget/ui/zepto/zepto.js');
var tpls = require('home:widget/category/item/tpls.js');
var TPL = require('home:widget/ui/tpl/tpl.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
require('home:widget/ui/lazyload/lazyload.js');
var modelCart = require('home:widget/ui/model-cart/model-cart.js');
var actionBuyItem = require('home:widget/ui/action-buy-item/action-buy-item.js');
var CartMainModel = require('home:widget/cart/cart.main.model.js');
require('home:widget/ui/slide/slide.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Toast = require('home:widget/ui/toast/toast.js');
var MainNav = require('home:widget/ui/main-nav/main-nav.model.js');

var modName = 'mod-category-item header-fixed';
function pad (num, len) {
    len = Math.pow(10, len || 2);
    return num < len ? ((len + num) + "").slice(1) : num + "";
}
function dateParser(seconds) {
    var date = new Date(seconds * 1000);
    return {
        year: date.getFullYear(),
        month: pad(date.getMonth() + 1, 2),
        day: pad(date.getDate(), 2),
        hour: pad(date.getHours(), 2),
        minute: pad(date.getMinutes(), 2),
        second: pad(date.getSeconds(), 2),
    };
}
var filters = {
    datetime_filter: function (seconds) {
        if (seconds) {
            var res = dateParser(seconds);
            return [res.year, res.month, res.day].join('-') + '&nbsp;&nbsp;' + [res.hour, res.minute].join(':');
        } else {
            return '— —';
        }
    }
};

function itemAction(opts) {
    var $viewCanvas = opts.$el;
    var model = opts.model;
    //render view canvas
    function renderViewFrame() {
        $viewCanvas.data('view-mod', modName);
    }

    //update
    renderViewFrame();
    function init() {
        modelCart.init({
           itemList:  [opts.itemInfo]
        });
        TPL.helper('datetime_filter', filters.datetime_filter);
    }

    function render() {
        //详情
        var itemInfo = modelCart.get(opts.itemInfo['sku_info']['sku_id']);
        $viewCanvas.html(TPL.compile(tpls.itemViewCanvas)({
            item: itemInfo,
            imgScale: conf.dpr >= 2 ? 'small': 'tiny'
        }));
        $(document.body).append($viewCanvas);
        $viewCanvas.find("img").lazyload();

        //大图轮播
        var $slide = $viewCanvas.find(".slide");
        var imgScale = 'medium';

        // 轮播
        $slide.slide({
            setData: function () {
                return $.map(opts.itemInfo['sku_info']['img_list'], function (img) {
                    return {src: img[imgScale]};
                });
            }
        });

        // 如果是秒杀商品，则不显示收藏按钮
        // sale_type == 2 表示秒杀商品
        if ( itemInfo && itemInfo.sale_info && itemInfo.sale_info.sale_type == 2 ) {
          $viewCanvas.find(".collect").remove();
        }

        // 这里触发更新购物车的操作
        var money = Storage.getItem('main-nav-total-money');
        if ( money ) {
          $viewCanvas.find('.cart-price').text( money ? '￥' + money : '购物车' );
        }
        $(document).trigger('e-model-cart-update-total', {total: modelCart.getTotal()});
    }

    function bindEvent() {
        actionBuyItem.bindBuyEvent($viewCanvas);
        // 点击返回按钮返回前一个页面并且刷新页面
        $viewCanvas.one('click', '.i-back', function() {
            // var backUrl = Storage.getItem('item_redirect');
            // if (backUrl) {
            //     Storage.removeItem('item_redirect');
            //     window.location.replace(decodeURIComponent(backUrl || '/'));
            // } else {
                history.go(-1);
            // }
        });
    }

    init();
    render();
    bindEvent();
}
var Model = Backbone.Model.extend({
    url: '/category/item?format=json',
    defaults: {
      sku_collect_status: null
    },
    initialize: function(options) {
        var self = this;

        self.fetch({
            data: {sku_id: options.id},
            dataType: 'json',
            success: function(_, data, resp) {
                if (data && data.ret === 0) {
                    if (data.content.promo_info.sale && data.content.sale_info.sale_type == 2 && data.content.sale_info.status != 3) {
                        data.content.timeValid = self._getTimeValid(data.content.promo_info.sale, new Date(resp.xhr.getResponseHeader("Date")).getTime());
                    }
                    self.set('itemInfo', data.content);
                    // 保存商品的收藏状态
                    if ( data.content && data.content.sku_collect_status ) {
                      self.set('sku_collect_status', data.content.sku_collect_status);
                    }
                } else if(data && data.ret == -10120){
                    location.replace('/static/home/special/error/index.html');
                }
            },
            error: function (model, response, options) {
                if (options.textStatus === "parsererror") {
                    Alert.show("您需要登录!", function() {
                        location.reload();
                    });
                }
            }
        });
    },
    _getTimeValid: function(promoData, now) {
        var beginAt = parseInt(promoData.begin_at, 10) * 1000;
        var endAt = parseInt(promoData.end_at, 10) * 1000;
        var timeValid = 0;
        if (!isNaN(beginAt) && !isNaN(beginAt) && !isNaN(now)) {
            var startGap = beginAt - now;
            var endGap = endAt - now;
            if (startGap > 0) { // 还没开始
                timeValid = 1;
                setTimeout(function() {
                    location.reload();
                }, startGap);
            } else if (endGap <= 0) { // 已经结束
                timeValid = 2;
            } else { // 进行中
                setTimeout(function() {
                    location.reload();
                }, endGap);
            }
        }
        return timeValid;
    },
    collect: function () {
      var that = this;
      var skuId = that._getSkuId();
      var URL = '/collect/sku/add';
      $.ajax({
        url: URL,
        data: {sku_id: skuId},
        method: 'GET',
        dataType: 'json',
        success: function ( res ) {
          if ( res && res.ret === 0) {
            that.set('sku_collect_status', res.content.sku_collect_status);
          } else {
            Alert.show('数据出错');
          }
        },
        error: function ( err ) {
          Alert.show('请求失败');
        }
      });
    },
    // 数据过滤，获取当前商品的sku_id
    _getSkuId: function () {
      var itemInfo = this.get('itemInfo');
      if ( itemInfo && itemInfo.sku_info && itemInfo.sku_info.sku_id ) {
        return itemInfo.sku_info.sku_id;
      } else {
        console.log( "sku_id不存在" );
        return null;
      }
    }
});
var View = Backbone.View.extend({
    model: null,
    className: modName,
    events: {
      'click .collect': 'changeCollectStatus'
    },
    initialize: function (options) {
        var self = this;
        self.model = new Model(options);
        self.MainNav = new MainNav();
        self.listenTo(self.model, 'change:sku_collect_status', self.renderCollect);
        self.listenTo(self.model, 'change:itemInfo', function() {
            itemAction({
                $el: this.$el,
                itemInfo: self.model.get('itemInfo'),
                model: this.model
            });
        });
        this.bindBuyEvent();
    },
    // 购物车事件
    bindBuyEvent: function () {
      var that = this;
      var $el = this.$el;
      $(document).on('e-model-cart-update-total-price.item', function ( e, data ) {
        $el.find('.cart-price').text( data.money ? '￥' + data.money : '购物车' );
      }).on('e-model-cart-update-total.item', function (e, data) {
        var skuInfo = that.MainNav.getSkuInfo();
        if (skuInfo.count == 0) {
            $el.find(".cart-count").empty();
        } else {
            that.MainNav.getTotalPrice( skuInfo.skuList );
            var strNum = skuInfo.count;
            if (strNum > 99) {
                strNum = '99+';
            }
            $el.find(".cart-count").html('<em class="num">' + strNum + '</em>');
        }
      });
    },
    /**
     * 渲染收藏按钮
     * 根据数据库返回来的状态二次确认收藏效果
     * 只是进行状态确认，如果状态设置正确，不进行任何操作
     */
    renderCollect: function () {
      var status = this.model.get('sku_collect_status');  /// 当前商品的收藏状态
      var $collect = this.$('.collect');
      if ( status == 1 ) $collect.addClass( this.FULL_CLASS ).removeClass( this.EMPTY_CLASS );
      if ( status == 2 ) $collect.removeClass( this.FULL_CLASS ).addClass( this.EMPTY_CLASS );
    },

    // 收藏按钮的class值
    FULL_CLASS: 'i-collect-star-full',
    EMPTY_CLASS: 'i-collect-star-empty',

    /*
     * 修改收藏按钮事件，并进行弹窗信息提示
     * 用户点击后，立马显示交互效果，然后在进行数据存储
     */
    changeCollectStatus: function ( e ) {
      var $this = $(e.target);
      var msg = this._changeStar( $this );
      // $this.removeClass("animation-target");
      // $this[0].offsetWidth = $this[0].offsetWidth;  // 为了重新激活动画，在这里手动进行一次DOM树重绘（reflow）
      // $this.addClass("animation-target");
      Toast({msg: msg}).show(); // toast提示，交互友好并且可以防止连续点击
      this.model.collect();
    },

    // 更改收藏按钮的状态
    _changeStar: function ( ele, status ) {
      var msg = '';
      if ( ele.hasClass( this.FULL_CLASS ) || status ) {
        ele.removeClass( this.FULL_CLASS ).addClass( this.EMPTY_CLASS );
        msg = '已经取消收藏~';
      } else {
        ele.addClass( this.FULL_CLASS ).removeClass( this.EMPTY_CLASS );
        msg = '收藏成功';
      }
      return msg;
    },

    close: function () {
      $(document).off('.item');
    }
});

module.exports = View;
