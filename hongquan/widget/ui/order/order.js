var $ = require('home:widget/ui/zepto/zepto.js');
var Pay = require('home:widget/ui/pay/pay.js');
var modelCart = require('home:widget/ui/model-cart/model-cart.js');
var Loading = require('home:widget/ui/loading/loading.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Confirm = require('home:widget/ui/confirm/confirm.js');

var $window = $(window);
var Order = {
    check: function(data, eventCenter) {
        $.ajax({
            url: '/shopping/order/check',
            type: 'POST',
            dateType: "json",
            timeout: 20000,
            data: data,
            success: function(response) {
                if (response && response.ret === 0) {
                    eventCenter.trigger('e-order-check-pass');
                } else {
                    if (response && response.ret === 100021) {
                        Alert.show(response.msg, function() {
                            location.reload();
                        });
                    // 赠品异常提示
                    } else if ( response && response.ret === -10000 ) {
                      Confirm.show(response.msg, function() {
                        eventCenter.trigger('e-order-check-pass');
                      }, function () {
                        eventCenter.trigger('e-order-check-fail-gotoCart', response);
                      },{
                        confirmText: "确认"
                      });
                    // 现金券提示
                    } else if ( response && response.ret === -10001 ) {
                      Confirm.show(response.msg, function () {
                        eventCenter.trigger('e-order-check-pass');
                      }, function () {
                        eventCenter.trigger('e-order-check-fail-cash');
                      }, {
                        confirmText: "确认"
                      })
                    } else if ( response && response.ret === -10027 ){
                        Alert.show(response.msg, function() {
                            eventCenter.trigger('e-order-check-fail-gotoCart', response);
                        });
                    } else{
                        eventCenter.trigger('e-order-check-fail', response);
                    }
                }
            },
            error: function() {
                // 如果接口失败，不应该阻碍用户下单
                eventCenter.trigger('e-order-check-pass');
            }
        });
    },
    create: function(opts) {
        Loading.hide();
        if (!navigator.onLine) {
            Alert.show("您的网络似乎没有连接, 请检查网络后刷新页面重试!");
        } else {
            Loading.show("正在生成订单...");
            if (opts) {
                var store = Storage.getItem('shopOrderOpt') || {};
                opts = $.extend(store, opts);
                Storage.setItem('shopOrderOpt', opts);
            }
            Loading.hide();
            window.location.href = '/#shopping/order';
        }
    },
    get: function(order_id) {
        $.ajax({
            url: '/shopping/order/get',
            // type: 'POST',
            data: { order_id: order_id },
            dataType: 'json',
            success: function(data) {
                if (data && data.ret === 0) {
                    // Alert.show('订单查询成功');
                    $window.trigger('e-order-get-success', [data.content]);
                } else {
                    if (data && data.ret === 100021) {
                        Alert.show(data.msg || '订单查询失败', function() {
                            location.reload();
                        });
                    } else {
                       $window.trigger('e-order-get-fail');
                    }
                }
            }
        });
    },
    reorder: function(order_id) {
        this.get(order_id);
        $window.on('e-order-get-success', function(e, data) {
            var newData = [];
            data.order_list.forEach(function (v, k) {
                newData = newData.concat(v.detail_list);
            });
            modelCart.batchAdd(newData);
            window.location.href = '/#shopping/cart';
        });
    },
    cancel: function (order_id) {
        $.ajax({
            url: '/shopping/order/cancel',
            type: 'POST',
            data: {order_id: order_id},
            dataType: 'json',
            success: function (data) {
                if (data && data.ret === 0) {
                    Alert.show('订单取消成功', function () {
                      $window.trigger('e-order-cancel-success');
                    });
                } else {
                    Alert.show(data.msg || '订单取消失败', function () {
                        if (data && data.ret === 100021) {
                            location.reload();
                        } else {
                            $window.trigger('e-order-cancel-fail');
                        }
                    });
                }
            }
        });
    },
    pay: function (order_id, openid, callback) {
        Pay.pay(order_id, openid, callback);
    }
};

module.exports = Order;
