require('home:widget/ui/wexin-sdk/wexin-sdk.js');
// var helper = require('home:widget/ui/helper/helper.js');
var Loading = require('home:widget/ui/loading/loading.js');
var Alert = require('home:widget/ui/alert/alert.js');

var UA = navigator.userAgent.toLowerCase();
var URL_ORDER_COMMENT = '/#my/order/comment';
var Pay = {
    way: {
        alipay: 1, // 支付宝支付
        wx: 2 // 微信支付
    },
    pay: function (orderId, openId, success) {
        // 订单号需要转成字符串, 防止整数类型溢出
        orderId = orderId + "";

        // 支付跳转
        getPayWay() === this.way.alipay ? aliPay(orderId) : wxPay(orderId, openId, success);
    }
};

/**
 * userAgent检测
 * 微信支付的SDK只能在微信客户端内调起
 * 支付宝支付只能在浏览器或支付宝客户端内调起
 * 不像APP可以任意调用, 在HTML5端这两者是无法共存的, 所以这里需要根据userAgent进行区分
 * */
function getPayWay() {
    return UA.match(/MicroMessenger/i) == "micromessenger" ? Pay.way.wx : Pay.way.alipay;
}

function aliPay(orderId) {
    Loading.show("连接中，请稍候...");
    $.ajax({
        url: "/shopping/order/pay",
        type: "POST",
        dataType: "json",
        timeout: 20000,
        data: $.param({order_id: orderId, pay_way: 1, return_url: location.origin + URL_ORDER_COMMENT + '?order_id='+orderId}),
        success: function (response) {
            if (response && response.ret === 0) {
                Loading.hide();
                window.location.href = response.content.result;
            } else {
                if (response && response.ret === 100021) {
                    Alert.show(response.msg, function() {
                        location.reload();
                    });
                } else {
                    fail();
                }
            }
        },
        error: fail
    });
}

// !function listenAliPayStatus() {
//     $(window).on('load', function() {
//         if (!!(helper.queryString('aaa'))) {
//             paySync();
//         }
//     });
// }();

function wxPay(orderId, openId, callback) {
    Loading.show("连接中，请稍候...");
    $.ajax({
        url: "/shopping/order/pay",
        type: "POST",
        dataType: "json",
        timeout: 20000,
        data: {order_id: orderId, pay_way: 2, openid: openId},
        success: function (response) {
            if (response && response.ret === 0) {
                Loading.hide();
                WeixinJSBridge.invoke(
                    'getBrandWCPayRequest', response.content.result,
                    function (res) {
                        // 成功的回调
                        if (res.err_msg == "get_brand_wcpay_request:ok") {
                            paySync(orderId,callback);
                            // callback && typeof callback === "function" && callback();
                        }
                    }
                );
            } else {
                if (response && response.ret === 100021) {
                    Alert.show(response.msg, function() {
                        location.reload();
                    });
                } else {
                    fail();
                }
            }
        },
        error: fail
    });
}

function fail() {
    Loading.hide();
    Alert.show("支付失败, 请检查您的网络!");
}

/**
 * 第三方支付返回成功后触发后端同步支付状态，暂时不处理此接口返回的结果
 * 目前：微信在接口成功回调中直接调用；支付宝支付完成切回/order/view时调用
 * @param  {string} orderId 订单编号
 */
function paySync(orderId, callback) {
    $.ajax({
        url: '/shopping/order/paysucc',
        dataType: 'json',
        data: {order_id: orderId},
        success: function(data) {
            callback && typeof callback === "function" && callback();
        }
    });
}

module.exports = Pay;
