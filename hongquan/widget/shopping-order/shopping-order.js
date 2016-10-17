var $ = require('home:widget/ui/zepto/zepto.js');
var tpls = require('home:widget/shopping-order/tpls.js');
var T = require('home:widget/ui/tpl/tpl.js');
var modelCart = require('home:widget/ui/model-cart/model-cart.js');
var Loading = require('home:widget/ui/loading/loading.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');
require('home:widget/ui/lazyload/lazyload.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var ShoppingOrderDetail = require('home:widget/shopping/detail/detail.js');
var Invoice = require('home:widget/invoice/invoice.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Confirm = require('home:widget/ui/confirm/confirm.js');
var Order = require('home:widget/ui/order/order.js');
conf.orderData = null; // 下单成功数据
var app = require('home:widget/ui/router/router.js');
var Log = require('home:widget/ui/log/log.js');


var formater = {
    //将有效条目进行计数,方便显隐
    counter: function (data) {
        //一个是detail,另一个是赠品/套餐
        for(var i = 0, length = data.order_list.length; i < length; i++) {
            var orders = data.order_list[i];
            var counter = 0;
            for(var n = 0, len=orders.detail_list.length; n < len; n++) {
                var detail = orders.detail_list[n];
                counter++;
                detail.counter = counter;   //列表
                if(detail.give_list) {
                    for(var g = 0, l1 = detail.give_list.length; g < l1; g++) {
                        var give = detail.give_list[g];
                        counter++;
                        give.counter = counter; //赠品
                    }
                }
                if(detail.package_info) {
                    for(var p= 0, l2=detail.package_info.item_list.length; p < l2; p++) {
                        var packageItem = detail.package_info.item_list[p];
                        counter++;
                        packageItem.counter = counter;  //套餐
                        if(p == 0) {
                            detail.package_info.counter = counter;  //整体的counter
                        }
                    }
                }
            }
            orders.detail_list.counter = counter;  //total
        }

    }
};

var Action = function (opts) {
    var $viewCanvas = opts.$el;
    var _conf = null;
    var noClear = false;
    T.helper("getPayWay", function() {
        return navigator.userAgent.toLowerCase().match(/MicroMessenger/i) == "micromessenger" ? "微信在线支付" : "支付宝在线支付";
    });
    var getSkuList = function() {
        var tmp = [];
        var opts = Storage.getItem('shopOrderOpt');
        var carts = modelCart.getAll();
        for ( var i = 0, len = carts.length; i < len; i++ ) {
            var item = carts[i];
            // 增加仓库判断
            if (item.count != 0 && item.storageTypeId == opts.storageTypeId && item.selected == '1') {
                tmp.push({
                    sku_id: item.skuId,
                    qty: item.count,
                });
            }
        }
        return tmp;
    };
    var getOrderData = function() {
        if (_data && _data.length) {
            var params = {
                sku_list: _data
            };
            var opts = Storage.getItem('shopOrderOpt');
            opts && opts.addressId && (params.address_id = opts.addressId);
            if (opts && opts.couponId) {
                if (opts.couponId == -1) {
                    params.use_coupon = 0;
                } else {
                    params.use_coupon = 1;
                    params.coupon_ids = [opts.couponId];
                }
            }
            if (opts && opts.cashCouponId) {
                if (opts.cashCouponId == -1) {
                    params.use_cash_coupon = 0;
                } else {
                    params.use_cash_coupon = 1;
                    params.cash_coupon_ids = [opts.cashCouponId];
                }
            }
            // 设置仓库选项
            opts && opts.storageTypeId && (params.tab = opts.storageTypeId);
            // 被补单id
            var addOrderId = Storage.getItem('add-order-id');
            addOrderId && (params['add_order_id'] = addOrderId);

            $.ajax({
                url: '/shopping/order/prepare',
                type: 'POST',
                data: params,
                dateType: 'json',
                success: function(data) {
                    if (data && data.ret === 0) {
                        _conf = data.content;
                        _conf.imgScale = conf.dpr >= 2 ? 'small' : 'tiny';
                        _conf.coupon_list.length || (_conf.no_usable = true);
                        _conf.cash_coupon_list.length || (_conf.no_cash_usable = true);
                        if (opts && opts.couponId == -1) {
                            _conf.no_coupon = true;
                        }
                        if (opts && opts.cashCouponId == -1) {
                            _conf.no_cash_coupon = true;
                        }
                        _conf.add_order_id = !!Storage.getItem('add-order-id');
                        _conf.invoice = Storage.getItem('invoice') || {};

                        formater.counter(_conf);

                        $viewCanvas.append(T.compile(tpls.content)(_conf)).find("img").lazyload();
                        var orderInfo = _conf.order_info;
                        var coupon_list = _conf.coupon_list;
                        if (!Storage.getItem('shopOrderOpt')) {
                            var params = {};
                            orderInfo.address_info && (params.addressId = orderInfo.address_info.address_id);
                            if (opts && opts.couponId != -1) {
                                coupon_list && coupon_list[0] && (params.couponId = coupon_list[0].coupon_id);
                            }
                            Storage.setItem('shopOrderOpt', params);
                        }
                        _conf.give_data = getGiveData(_conf.order_list[0].detail_list);
                        // Storage.setItem('couponIds', _conf.coupon_ids);
                    } else if (data && data.ret == 100021) {
                        Alert.show(data.msg, function() {
                            location.reload();
                        });
                    } else if (data && data.ret == -10022) {
                        Alert.show(data.msg, function() {
                            app.navigate("#shopping/cart", {trigger: true, replace: true});
                        });
                    } else {
                        Alert.show(data.msg);
                    }
                }
            });
        } else {
            window.location.href = '/';
        }
    };
    this.close = function() {
        if (!noClear) {
            Storage.removeItem('shopOrderOpt');
            Storage.removeItem('invoice');
        }
    };

    //获取下单的商品skuId列表
    var getEmptySkuId = function () {
        var cart = modelCart.getAll();
        var sku_list = {};
        $.each(cart, function(k, v){
            if(v.selected == '1'){
                sku_list[v.skuId] = v.skuId;
            }
        })
        return sku_list;
    };
    /**
     * 获取赠品数据
     * @param  {Array} data 购物车数据
     * @return {Array}           赠品数据
     */
    var getGiveData = function(data) {
        var giveList = [];
        data.forEach(function(v, k) {
            if (v.give_list && v.give_list.length) {
                v.give_list.forEach(function(j, i) {
                   giveList.push({
                        sku_id: j.promo_detail.give_sku_id,
                        qty: j.real_give_qty,
                        f_sku_id: v.sku_id
                    });
                });
            }
        });
        return giveList;
    };

    // 获取优惠券ID
    var getCouponId = function () {
      var $curCoupon = $viewCanvas.find(".coupon a");
      var couponId = $curCoupon.data("id");
      return couponId ? couponId : null;
    };

    // 获取现金券ID
    var getCashCouponId = function () {
      var $curCashCoupon = $viewCanvas.find(".cash-coupon a");
      var cashCouponId = $curCashCoupon.data("id");
      return cashCouponId ? cashCouponId : null;
    };

    /**
     * 确认下单操作
     */
    var orderAction = function() {
        var data = {};
        // 商品列表
        var storageTypeId = Storage.getItem('shopOrderOpt').storageTypeId || 1;
        data["tab"] = storageTypeId;
        data["sku_list"] = _data;
        // 收货地址
        data["address_id"] = $viewCanvas.find(".address-info").data("id");
        // 优惠券
        var $curCoupon = $viewCanvas.find(".coupon a");
        var couponId = $curCoupon.data("id");
        couponId && couponId != -1 && (data["coupon_ids"] = [couponId]);
        //现金券
        var $curCashCoupon = $viewCanvas.find(".cash-coupon a");
        var cashCouponId = $curCashCoupon.data("id");
        cashCouponId && cashCouponId != -1 && (data["cash_coupon_ids"] = [cashCouponId]);
        // 发票
        var invoice = Storage.getItem('invoice');
        invoice && (data['invoice'] = invoice);
        // 付款类f型
        data["pay_type"] = 1;
        // 钱
        data["money"] = $viewCanvas.find(".total-price").data("price");
        // token
        data["_csrf"] = conf.page && conf.page._csrf;
        // cartkey
        //data["cart_key"] = modelCart.getCartKey();
        data["cart_key"] = _cartKey;
        // 被补单id
        var addOrderId = Storage.getItem('add-order-id');
        addOrderId && (data['add_order_id'] = addOrderId);
        $.ajax({
            url: "/shopping/order/init",
            type: "POST",
            dateType: "json",
            timeout: 20000,
            data: data,
            success: function (response) {
                Loading.hide();
                if (response.ret != 0 && response.ret != -10002) {
                    Log.send({
                        action: 'click',
                        pid: Log.pid,
                        detail: {
                            confirm_order:0,
                            msg:{
                                ret: response.ret,
                                msg: response.msg
                            },
                            extend:''
                        }
                    });
                }
                if (response.ret === 0 || response.ret === -10002) {
                    //获取商品id失败


                    // 清空购物车
                    modelCart.empty({storageTypeId: storageTypeId, sku_list: getEmptySkuId()});

                    Storage.removeItem('add-order-id');
                    conf.orderData = response.content;
                    // Alert.show(response.msg || "下单成功!", function() {
                    app.navigate("#shopping/result", {trigger: true, replace: true});
                    // });
                    // Loading.show("跳转中...");
                    // window.location.replace("/my/order/view?order_id=" + response.content.order_id);
                } else if (response.ret === -1100012) {
                    //下单重复
                    modelCart.empty({storageTypeId: storageTypeId, sku_list: getEmptySkuId()});
                    Alert.show(response.msg);
                    Loading.show("跳转中...");
                    window.location.replace("/my/order/view?order_id=" + response.content.order_id);
                } else if (response.ret === -10017) {
                    //优惠券无效
                    Alert.show(response.msg);
                    var tmp = Storage.getItem('shopOrderOpt');
                    delete tmp['couponId'];
                    Storage.setItem('shopOrderOpt', tmp);
                    $curCoupon.attr('href', '/#my/coupon/select');
                    // window.location.reload();
                } else if (response.ret == 10021) {
                    //地址出错
                    Alert.show(response.msg, function() {
                        location.reload();
                    });
                } else {
                    Alert.show(response.msg, function () {
                        app.navigate("#shopping/cart?thisError=1", {trigger: true, replace: true});
                    });
                }
            },
            error: function (_, errorMsg) {
                Loading.hide();
                if (errorMsg === "timeout") {
                    Alert.show("网络请求超时!");
                } else {
                    Alert.show("您的网络似乎有问题, 请检查网络后重试!");
                }
            }
        });
    };
    var bindEvent = function() {
        // $(window).on('unload.shoppingOrder', function(e) {
        //     if (!noClear) {
        //         Storage.removeItem('shopOrderOpt');
        //         Storage.removeItem('invoice');
        //     }
        // });

        $viewCanvas.on(conf.evClick, ".operation", function () {
            Loading.show("数据加载中...");
            var data = {};
            var coupon_ids = getCouponId();
            var cash_coupon_ids = getCashCouponId();
            data.tab = Storage.getItem('shopOrderOpt').storageTypeId || 1;
            if ( coupon_ids && coupon_ids != -1  ) data.coupon_ids = [coupon_ids];
            if ( cash_coupon_ids && cash_coupon_ids != -1 ) data.cash_coupon_ids = [cash_coupon_ids];
            if (!navigator.onLine) {
                Loading.hide();
                Alert.show("您的网络似乎没有连接, 请检查网络后刷新页面重试!");
                return;
            }
            Order.check($.extend({
              sku_list: _data,
              give_list: _conf.give_data || {},
              coupon: 1
            }, data), $viewCanvas, 1);
        }).on(conf.evClick, '.action', function () {
            var $this = $(this);
            var $shipOrder = $this.parents('.item-list');
            if ($this.hasClass('view-all')) {
                //点击查看全部埋点
                Log.send({
                    action: 'show',
                    pid: Log.pid,
                    detail: {
                        goods_view:0,
                    }
                });
                $shipOrder.find('.item-info.hide').removeClass('hide');
            } else {
                $shipOrder.find('.item-info-more').addClass('hide');
            }
            $shipOrder.find('.view-all, .view-minor').toggleClass('hide');
        }).on('click', '.address a, .coupon a, .cash-coupon a, .invoice a', function() {
            noClear = true;
        })
        // 去结算前校验，通过则提交，失败则弹框告知用户
        .on('e-order-check-fail-gotoCart', function () {
            Loading.hide();
            app.navigate('#shopping/cart?thisError=1', {trigger: true, replace: true});
        // 现金券返回
        }).on('e-order-check-fail-cash', function () {
            Loading.hide();
            location.reload();
        }).on('e-order-check-pass', function() {
            orderAction();
        }).on('e-order-check-fail', function(e, data) {
            Log.send({
                action: 'click',
                pid: Log.pid,
                detail: {
                    confirm_order:0,
                    msg:{
                        ret: data.ret,
                        msg: data.msg
                    },
                    extend:''
                }
            });
            Confirm.show(data.msg, function() {
                orderAction();
            }, function() {
                location.reload();
            });
        });

    };
    var _data = getSkuList();
    var _cartKey = modelCart.getCartKey();  //要跟skuList在一起,避免时间差（edit by NE: 2016.7.23晚; 因特殊重复下单case）
    getOrderData();
    bindEvent();
};

var View = Backbone.View.extend({
    className: 'mod-shopping-order header-fixed',
    initialize: function (options) {
        $(document.body).append(this.$el);
        this.action = new Action($.extend({$el: this.$el}, options));
    },
    close: function () {
        this.action.close();
        this.unbindEvent();
    },
    unbindEvent: function() {
        $(window).off('.shoppingOrder');
    }
});

module.exports = View;
