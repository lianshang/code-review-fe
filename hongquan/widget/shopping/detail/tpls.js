var commonHeader = require('home:widget/ui/header/header.js');
module.exports = {
    content: [
        '<div class="mod-shopping-detail">',
            commonHeader({
              title: '交易详情',
              backUrl: '/#'
            }),
            '<section class="top">',
                    '<h2>下单成功</h2>',
                    '<div class="em">应付金额：￥{{order.money}}</div>',
                    '<div class="normal pay">{{order.pay_method.title}}：{{order.pay_method.value}}</div>',
                    '<div class="normal">订单总计：￥{{order.activity_money}}</div>',
                    '{{if order.discount_coupon_money != 0}}<div class="normal">订单折扣{{if order.discount_coupon_money != 0}}（{{order.discount_ratio}}折）{{/if}}：-￥{{order.discount_coupon_money}}</div>{{/if}}',
                    '{{if order.ticket_coupon_money != 0}}<div class="normal">优惠券：-￥{{order.ticket_coupon_money}}</div>{{/if}}',
                    '{{if order.cash_coupon_money != 0}}<div class="normal">现金券：-￥{{order.cash_coupon_money}}</div>{{/if}}',
                    // '<div class="normal">微信在线支付立减：¥-5.00</div>',
            '</section>',
            '<section class="bottom">',
                '<div class="tip">提示：<br/><br/>司机送货后请您当面确认货品无质量问题，并按实际到货数量为准结清货款。</div>',
                '<a class="btn weui_btn weui_btn_primary" href="/#">继续下单</a>',
                '<a class="btn weui_btn weui_btn_default" href="/my/order/view?order_id={{order.order_id}}">查看订单</a>',
            '</section>',
        '</div>'
    ].join('')
};
