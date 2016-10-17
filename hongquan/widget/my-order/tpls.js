var commonHeader = require('home:widget/ui/header/header.js');
var tpls = {
    content: [
        // '<div class="mod-my-order">',
            commonHeader({
              title: '我的订单',
              backUrl: '/#my'
            }),
            '<div class="fixed"><div class="status"></div></div>',
            '<div class="list"></div>',
            '<div class="loading hide">数据加载中...</div>',
        // '</div>'
    ].join(''),
    empty: [
        '<i class="icon i-orders"></i>',
        '<p>订单为空</p>'
    ].join(''),
    status: [
      '{{each status as status}}',
        '<span data-status="{{status.status}}">{{status.status_name}}</span>',
      '{{/each}}'
    ].join(''),
    /* 商品信息 */
    order: [
        '{{each order_list as item i}}',
            '<div class="weui_cells order-info" data-order-id="{{item.order_id}}" data-openid="{{item.openid}}">',
                // 金额、时间
                '<div class="weui_cell">',
                    '<div class="weui_cell_primary pay-total">{{if status == ""}}<span class="order-status">{{item.status_name}}</span>{{/if}}￥{{item.money}}{{if item.type == "2"}}<span class="type">补单</span>{{/if}}</div>',
                    '<div class="weui_cell_ft">{{item.ordered_at | date_filter}}</div>',
                '</div>',
                // 订单详情
                '<a href="/my/order/view?order_id={{item.order_id}}">',
                    '<div class="order-detail weui_cell">',
                        '<div class="weui_cell_primary">',
                            '{{each item.img_list as img i}}',
                                '{{if i < 3}}',
                                    '<div class="item-img"><img class="lazy-load-img" src="'+__uri('/static/img/holder.png')+'"{{if img[imgScale]}} data-src="{{img[imgScale]}}{{/if}}"/></div>',
                                '{{/if}}',
                            '{{/each}}',
                        '</div>',
                        '<div class="weui_cell_ft">',
                            '<span class="vm">共{{item.sku_count}}件, {{item.sub_order_count}}次配送</span>',
                            '<i class="right iconf i-arrow-r"></i>',
                        '</div>',
                    '</div>',
                '</a>',
                // 配送单状态及收起展开按钮
                /*
                 未编辑，可提交DC——待发货
                 已提交DC，已发货——待收货
                 用户取消，客服取消——已取消
                 已完成——已完成
                */
                '{{if item.status != "99"}}',
                '<div class="weui_cell">',
                    '<div class="weui_cell_primary pay-status">货到付款</div>',
                    '<div class="weui_cell_ft">',
                        '{{if item.extend_status.cancel}}',
                            '<button class="operation cancel">取消订单</button>',
                        '{{else}}',
                            '{{item.status_name}}',
                        '{{/if}}',
                    '</div>',
                '</div>',
                '{{/if}}',
            '</div>',
        '{{/each}}',
    ].join(''),
    end: [
        '<p class="end">没有数据了</p>'
    ].join('')
};

module.exports = tpls;
