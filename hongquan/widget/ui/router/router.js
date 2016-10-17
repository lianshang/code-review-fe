var Backbone = require('home:widget/ui/backbone/backbone.js');
var helper   = require('home:widget/ui/helper/helper.js');
var $ = require('home:widget/ui/zepto/zepto.js');
var Log = require('home:widget/ui/log/log.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');

var App = Backbone.Router.extend({
    routes: {
        '': 'pageHome',
        'category(?cat_id=:id&brand=:brand)': 'pageCategory',
        'category/item(?sku_id=:id&index=:index&page=:page)': 'pageItem',
        'shopping/cart(/:query)': 'pageCart',
        'shopping/order': 'pageShoppingOrder',
        'shopping/result': 'pageShoppingResult',
        'shopping/invoice': 'pageInvoice',
        'shopping/history': 'pageShoppingHistory',
        'my': 'pageMy',
        'my/coupon(/*path)(?type=:type&is_usable=:is_usable)': 'pageCoupon',
        'my/address(/*path)': 'pageAddress',
        'my/order(?status=:id)': 'pageMyOrder',
        // 'my/order/view(?order_id=:id)': 'pageMyOrderView',
        'my/order/detail(?order_id=:id)': 'pageMyOrderDetail',
        'home/activity(?*path)': 'pageActivity',
        'home/search(?*path)': 'pageSearch',
        'my/order/comment(?order_id=:id&redirectUrl=:url)': 'pageOrderComment',
        'seckill': 'pageSecKill',
        'my/collection': 'pageCollection'
        // '*action': 'pageHome'
    },
    currentView: null,
    hideMenu: true,
    mainNav: null,
    initialize: function() {
        /* 注: 这里务必不要循环引用app,否则拿到的app是不完整的 */
    },
    initTab: function(tab) {
        this.mainNav = tab;
    },
    clean: function(options) {
        if (this.currentView) {
            if (this.currentView.close) {
                this.currentView.close();
            }
            this.currentView.undelegateEvents(); //解除现有事件 events
            this.currentView.remove(); //移除View的DOM容器
            this.currentView = null;
        }
        var defaultOptions = {
            hideMenu: false,
            nav: 'home'
        };
        options = $.extend(defaultOptions, options);
        this.hideMenu = options.hideMenu;
        if (this.mainNav) {
            if (options.hideMenu) {
                this.mainNav.hide();
            } else {
                this.mainNav.show(options.nav);
            }
        }
    },

    splitQuery: function(path) {
        path = path.slice(path.indexOf('?')+1);
        path = path.split('&');
        var options = {};
        for(var i=0,len=path.length;i<len;i++) {
            var tmp = path[i].split('=');
            options[tmp[0]] = tmp[1];
        }
        return options;
    },
    checkLogin: function(options) {
        //TODO 如何更好的跳转到登录路由,这个需要设计一下. 后续要研究一下后端的路由配置和应用方式（如express）,方便适应不同场景
        if (!conf.userData.is_login) {
            // app.navigate("account/user/login?redirectUrl=" + encodeURIComponent(location.href), {
            //     trigger: true,
            //     replace: false
            // });
            // return false;
            location.href = "/account/user/login?redirectUrl=" + encodeURIComponent(location.href);
        } else {
            return true;
        }
    },
    pageHome: function() {
        var that = this;
        require.async('home:widget/home/home.js', function(View) {
            that.clean({
                hideMenu: false,
                nav: 'home'
            });
            Log.pid = '110001';
            that.currentView = new View();
            Log.send({
                action: 'show',
                pid: Log.pid,
                detail: {}
            });
        });
        console.log('pageHome');
    },
    pageCategory: function( id, brand ) {
        var that = this;
        var id = brand = '';
        if ( !brand ) {
          id = helper._queryString("cat_id") || '';
          brand = helper._queryString("brand") || '';
        }
        require.async('home:widget/category/category.js', function(View) {
            that.clean({
                hideMenu: false,
                nav: 'category'
            });
            Log.pid = '110002';
            that.currentView = new View({ id: id, brand: brand ? brand : '' });
            Log.send({
                action: 'show',
                pid: Log.pid,
                detail: {},
                ref:{
                    param: 'cat_id=' + id
                }
            });
            // 为了进入分类页后点击加减按钮的数据上报
            Log.pid = '110016';
        });
        console.log('pageCategory');
    },
    pageItem: function(id, index, page) {
        var that = this;
        var id = index = '';
        var page = '';
        if( !index ){
            id = helper._queryString("sku_id") || '';
            index = helper._queryString("index") || '';
            page = helper._queryString("page") || 1;
        }
        require.async('home:widget/category/item/item.js', function(View) {
            that.clean({
                hideMenu: true,
            });
            Log.pid = '110009';
            that.currentView = new View({ id: id});
            Log.send({
                action: 'show',
                pid: Log.pid,
                detail: {sku_id: id, index: index ? index : '', page: page},
                ref:{
                    param:'sku_id=' + id
                }
            });
        });
        console.log('pageItem');
    },
    pageCart: function(submit) {
        var that = this;
        //确认下单页异常处理 返回购物车 异常商品的sku_id
        var thisError = helper._queryString('thisError');
        var opts = { submit: submit };
        if( thisError ) {
            $.extend(opts, {thisError: thisError});
        }
        require.async('home:widget/shopping/cart/cart.js', function(View) {
            that.clean({
                hideMenu: false,
                nav: 'cart'
            });
            Log.pid = '110003';
            that.currentView = new View( opts );
            Log.send({
                action: 'show',
                pid: Log.pid,
                detail: {
                  sku_list: function () {
                    return Log.getSkuList();
                  }
                }
            });
        });
        console.log('pageCart');
    },
    pageShoppingOrder: function() {
        var that = this;
        require.async('home:widget/shopping-order/shopping-order.js', function(View) {
            that.clean({
                hideMenu: true
            });
            Log.pid = '110012';
            that.currentView = new View();
            Log.send({
                action: 'show',
                pid: Log.pid,
                detail: {}
            });
        });
        console.log('pageShoppingOrder');
    },
    pageShoppingResult: function() {
        var that = this;
        if (!that.checkLogin()) {
            return;
        }
        require.async('home:widget/shopping/detail/detail.js', function(View) {
            that.clean({
                hideMenu: true
            });
            Log.pid = '110015';
            that.currentView = new View();
            Log.send({
                action: 'show',
                pid: Log.pid,
                detail: {
                    order_id: conf.orderData.order_id   //页面给的(因为是POST跳转)?
                }
            });
        });
        console.log('pageShoppingResult');
    },
    pageShoppingHistory: function() {
        var that = this;
        if (!that.checkLogin()) {
            return;
        }
        require.async('home:widget/shopping/history/history.js', function(View) {
            that.clean({
                hideMenu: true
            });
            Log.pid = '110020';
            that.currentView = new View();
            Log.send({
                action: 'show',
                pid: Log.pid,
                detail: {}
            });
        });
        console.log('pageShoppingHistory');
    },
    pageInvoice: function() {
        var that = this;
        if (!that.checkLogin()) {
            return;
        }
        require.async('home:widget/invoice/invoice.js', function(View) {
            that.clean({
                hideMenu: true
            });
            Log.pid = '110013';
            that.currentView = new View();
            Log.send({
                action: 'show',
                pid: Log.pid,
                detail: {}
            });
        });
        console.log('pageInvoice');
    },
    pageMy: function() {
        var that = this;
        require.async('home:widget/my/my.js', function(View) {
            that.clean({
                hideMenu: false,
                nav: 'my'
            });
            Log.pid = '110004';
            that.currentView = new View();
            Log.send({
                action: 'show',
                pid: Log.pid,
                detail: {}
            });
        });
        console.log('pageMy');
    },
    pageCoupon: function(path,type,is_usable) {
        var that = this;
        if (!that.checkLogin()) {
            return;
        }
        var type = is_usable = '';
        if ( !is_usable) {
            type = helper._queryString("type") || '';
            is_usable = helper._queryString("is_usable") || '';
        }

        path = path ? path.split('/') : [];
        require.async('home:widget/coupon/coupon.js', function(View) {
            that.clean({
                hideMenu: true
            });
            var opts = path.length === 2 ? { action: path[0], id: path[1]} : (path.length === 1 ? { action: path[0]} : []);

            if(type){
                opts['type'] = type;
                // type = 1 优惠券
                // type = 2 现金券
                if ( type == 1) {
                  Log.pid = '110006';
                  if ( opts.action == 'select' ) {
                    Log.pid = '110014'
                  }
                } else {
                  Log.pid = '110022';
                  if ( opts.action == 'select' ) {
                    Log.pid = '110024'
                  }
                }
                //选择优惠券/现金券 不在此上报
                if(!path.length){
                    Log.send({
                        action: 'show',
                        pid: Log.pid,
                        detail: {},
                        ref: {
                            param: 'type=' + type
                        }
                    });
                }
            }
            if(is_usable) {
                opts['is_usable'] = is_usable;
            }
            console.log( type );
            //TODO: 上面opts的策略是啥?
            // if(opts == null) {  //我的优惠券
            //     Log.send({
            //         action: 'show',
            //         pid: Log.pid,
            //         detail: {}
            //     });
            // } else {    //选择优惠券
            //     Log.pid = '110014';
            //     Log.send({
            //         action: 'show',
            //         pid: Log.pid,
            //         detail: {}
            //     });
            // }
            that.currentView = new View(opts);
        });

        console.log('pageCoupon');
    },
    pageAddress: function(path) {
        var that = this;
        if (!that.checkLogin()) {
            return;
        }
        require.async('home:widget/address/address.view.js', function(View) {
            that.clean({
                hideMenu: true
            });
            that.currentView = new View(path || '');
        });
        console.log('pageAddress');
    },
    pageMyOrder: function( id ) {
        var that = this;
        if (!that.checkLogin()) {
            return;
        }
        require.async('home:widget/my-order/my-order.js', function(View) {
            that.clean({
                hideMenu: true
            });
            Log.pid = '110005';
            that.currentView = new View({status: id});
            Log.send({
                action: 'show',
                pid: Log.pid,
                detail: {}
            });
        });
        console.log('pageMyOrder');
    },
    // 微信支付必须用单独页面
    // pageMyOrderView: function(id) {
    //     var that = this;
    //     if (!that.checkLogin()) {
    //         return;
    //     }
    //     require.async('home:widget/my-order-view/my-order-view.js', function(View) {
    //         that.clean({
    //             hideMenu: true,
    //         });
    //         that.currentView = new View({ id: id });
    //     });
    //     console.log('pageMyOrderView');
    // },
    pageMyOrderDetail: function(id) {
        var that = this;
        if (!that.checkLogin()) {
            return;
        }
        require.async('home:widget/my-order-view/detail/detail.js', function(View) {
            that.clean({
                hideMenu: true,
            });
            Log.pid = '110018';
            that.currentView = new View({ id: id });
            Log.send({
                action: 'show',
                pid: Log.pid,
                detail: {
                    order_id: id
                }
            });
        });
        console.log('pageMyOrderDetail');
    },
    pageActivity: function(path) {
        var that = this;
        require.async('home:widget/activity/activity.js', function(View) {
            that.clean({
                hideMenu: true,
            });
            var params = that.splitQuery(path);
            Log.pid = '120001';
            that.currentView = new View(params);
            Log.send({
                action: 'show',
                pid: Log.pid,
                detail: {
                    event_id: params.activity_id
                },
                ref: {
                    param: 'activity_id=' + params.activity_id
                }
            });
        });
        console.log('pageActivity');
    },
    pageSearch: function(path) {
        var that = this;
        require.async('home:widget/search/search.js', function(View) {
            var queries = that.splitQuery(path);
            // 如果有查询文字，则进入的是查询结果页面
            if ( queries && queries.q && queries.q.length > 0 ) {
              Log.pid = '110011';
            } else {
              Log.pid = '110010';
            }
            if (that.currentView && that.currentView.id === 'searchCanvas') {
                if (queries.q) {
                    that.currentView.action.search(queries.q);
                } else {
                    that.currentView.action.clearSearch();
                }
            } else {
                that.clean({
                    hideMenu: true,
                });
                that.currentView = new View(queries);
                Log.send({
                    action: 'show',
                    pid: Log.pid,
                    detail: {}
                });
            }
        });
        console.log('pageSearch');
    },
    pageOrderComment: function ( id,url ) {
      var that = this;
      if (!that.checkLogin()) {
          return;
      }
      var id = url = '';
      if ( !url) {
          id = helper._queryString("order_id") || '';
          url = helper._queryString("redirectUrl") || '';
      }
      require.async('home:widget/comment/comment.js', function ( View ) {
        that.clean({
          hideMenu: true,
        });
        that.currentView = new View({ id: id ,url: url});
      });
      console.log("pageOrderComment");
    },
    pageSecKill: function ( path ) {
      var that = this;
      require.async('home:widget/seckill/seckill.js', function ( View ) {
        that.clean({
          hideMenu: true
        });
          Log.pid = '110019';
        that.currentView = new View( path );

          Log.send({
              action: 'show',
              pid: Log.pid,
              detail: {}
          });
      });
      console.log("pageSecKill");
    },
    pageCollection: function () {
      var that = this;
      require.async('home:widget/collection/collection.view.js', function ( View ) {
        that.clean({
          hideMenu: true
        });
        Log.pid = '110023';
        that.currentView = new View();
        Log.send({
            action: 'show',
            pid: Log.pid,
            detail: {}
        });
      });
    }
});

var app = new App();

module.exports = app;
