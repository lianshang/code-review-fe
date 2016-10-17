var tpls = {
    content: [
        //'<div id="cartCanvas" class="mod-cart" style="display: none;">',
            '<header class="header">',
                '<h1>购物车</h1>',
                '<span class="empty-cart">',
                    '清空',
                '</span>',
                '<span class="history">',
                    '<a href="/#shopping/history">购买历史</a>',
                '</span>',
            '</header>',
            '<div class="categories"></div>',
            '<div class="nodata">',
                '<i class="icon i-cart-empty"></i>',

                '<p class="p1">您的购物车还是空的</p>',

                '<p class="p2">快去挑点商品吧</p>',
                '<a href="/#" class="weui_btn weui_btn_default">去首页逛逛</a>',
            '</div>',
            '<div class="item-list common-control"></div>',
            //'<p class="tips hide common-control"></p>',
            '<div class="summary common-control">',
                '<div class="weui_cells weui_cells_checkbox">',
                    '<label class="weui_cell weui_check_label" for="all-selected">',
                        '<div class="weui_cell_hd">',
                            '<input type="checkbox" class="weui_check" name="all-selected" id="all-selected">',
                            '<i class="weui_icon_checked"></i>',
                        '</div>',
                        '<div class="weui_cell_bd weui_cell_primary">全选',
                        '</div>',
                    '</label>',
                    '<span class="f-right">',
                    '<span class="price">',
                    '<span class="discount-tip"></span>',
                    '<span class="total-price">',
                    '<span class="save"></span>',
                    '<span class="actual"></span>',
                    '</span>',
                    '</span>',
                    '<button class="balance disable" disabled>',
                        '<span class="balance-txt">结算</span>',
                        '<span class="lowest-price"></span>',
                    '</button>',
                    '</span>',
                '</div>',
            '</div>'
        //'</div>'
    ].join(""),
    group: [
        '<div{{if item_head}} class="group"{{/if}} {{if disabledItem}} class="disabled-items"{{/if}}>',
            '{{if item_head}}<a class="title" href="/#home/activity?activity_id={{item_head.id}}&back=cart"><i class="tag tag-{{item_head.type}}" style="background:{{item_head.bgcolor | formatColor}}">{{item_head.tag}}</i><span>{{item_head.text}}</span><i class="iconf i-arrow-r"></i></a>{{/if}}',
        '</div>'
    ].join(""),
    emptyDisabled: [
        //'{{if disabledItem}}',
        '<div class="disable-item btn-container">',
        '<button class="weui_btn weui_btn_plain_primary empty-disabled">',
        '清空失效商品',
        '</button>',
        '</div>',
        //'{{/if}}',
    ].join(""),
    tabs: [
      '{{each tabs as tab}}',
        '<div class="cate" data-cate="{{tab.id}}">{{tab.name}}</div>',
      '{{/each}}'
    ].join(''),
    couponTip: [
        '<div class="coupon-tips-container">',
        '{{each couponTips as couponTip index}}',
        '<div class="coupon-tip">',
            '<label>{{couponTip.coupon_title}}</label>',
            '<div class="coupon-text">',
            '{{each couponTip.coupon_tip as coupon tip_inex}}',
              '<span style="color: {{coupon.color | formatColor}}">{{coupon.txt}}</span>',
            '{{/each}}',
            '</div>',
        '</div>',
        '{{/each}}',
        '</div>'
    ].join('')
};

module.exports = tpls;
