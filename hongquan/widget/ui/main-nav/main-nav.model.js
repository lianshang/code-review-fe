var Backbone = require('home:widget/ui/backbone/backbone.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');
var Big = require('home:widget/ui/big/big.js'); // 精确的小数计算插件
var Toast = require('home:widget/ui/toast/toast.js');

var Model = Backbone.Model.extend({
  initialize: function () {},

  defaults: {
    money: null
  },

  KEY_MONEY: 'main-nav-total-money',

  url: '/shopping/cart/agg',

  // 当前的xhr对象
  xhr: null,

  getTotalPrice: function ( data ) {
    // 如果离线，则进行本地计算
    if ( !navigator.onLine ) {
      this.calAtLocal( data );
      return;
    }
    // 如果当前的请求还没有完成，则取消当前请求
    if ( this.xhr && this.xhr.readyState !== 4 ) {
      this.xhr.abort();
    }
    // 正常请求接口计算
    var skuList = this.getSkuInfo().skuList;
    if ( skuList && skuList.length ) {
      this.xhr = this.fetch({
        dataType: 'json',
        type: 'GET',
        data: {
          sku_list: skuList
        },
        success: function ( model, res ) {
          if ( res && res.ret === 0 ) {
            var money = res.content.money;
            model.setMoneyLocal( money );
            model.set( 'money', money );
          } else if ( res.msg ) {
            Toast({msg: res.msg, delay: 1000}).show();
          } else {
            model.calAtLocal( data );
          }
        },
        error: function ( model, err ) {
          model.calAtLocal( data );
        }
      })
    }
  },

  // 在本地计算总价
  calAtLocal: function ( data ) {
    var action = data.action;
    var nowTotalPrice;
    var currentPrice = +data.currentPrice || 0;
    var totalPrice = +(Storage.getItem( this.KEY_MONEY ) || '');
    if ( currentPrice ) {
      if ( action == 'add' ) {
        nowTotalPrice = String((Big( totalPrice )).plus( currentPrice ));
      }
      if ( action == 'subtract' || action == 'remove' ) {
        nowTotalPrice = String((Big( totalPrice )).minus( currentPrice ));
      }
      this.setMoneyLocal( nowTotalPrice );
      this.set( 'money', nowTotalPrice );
    }
  },

  // 更新本地存储的总价
  setMoneyLocal: function ( money ) {
    Storage.setItem( this.KEY_MONEY, money );
  },

  // 获取
  getMoneyLocal: function ( money ) {
    return Storage.getItem( this.KEY_MONEY ) || 0;
  },

  // 获取当前购物车所有商品信息
  getSkuInfo: function () {
    var _skuList = [];
    var _count = _disCount = 0;
    var skuList = Storage.getItem('model-cart-buy-counter') || [];
    var disableSkuList = Storage.getItem('model-cart-disable-counter') || [];
    if ( skuList && skuList.length ) {
      skuList.forEach(function ( sku, index ) {
        _skuList.push({
          sku_id: sku.skuId,
          qty: sku.count
        });
        _count += +sku.count;
      })
      disableSkuList.forEach(function ( sku, index) {
        _disCount += +sku.count;
      })
    }
    return {
      skuList: _skuList,
      count: _count - _disCount
    };
  }
});

module.exports = Model;
