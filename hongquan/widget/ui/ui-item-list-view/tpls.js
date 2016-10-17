var giftTpl = [
        '{{each item.promo_info.give_list as give index}}',
            '<a class="gift" href="/#category/item?sku_id={{give.promo_detail.give_sku_id}}">',
                '<i class="tag tag-{{give.promo_type}}"></i>',
                '<div class="row-wrap"><span class="name">',
                    '<span class="rule">买{{give.promo_detail.buy_qty}}即赠</span>',
                    '{{give.promo_detail.give_sku_info.name}} ',
                    '{{if give.promo_detail.give_qty > 1 || give.real_give_qty != null}}',
                        '{{if give.real_give_qty != null}}',
                            '<span class="give-qty real-give-qty">{{if give.real_give_qty > 0}} x{{give.real_give_qty}}{{/if}}</span>',
                        '{{else}}',
                            '<span class="give-qty"> x{{give.promo_detail.give_qty}}</span>',
                        '{{/if}}',
                    '{{/if}}',
                '</span></div>',
                '<del class="actual-price">￥{{give.promo_detail.give_sku_info.price}}</del>',
                '<span class="give-price">￥0.00</span>',
            '</a>',
        '{{/each}}'
        ].join('');
var secKillTpl = [
    '<div class="process">',
      '<div class="progress-time">{{if item.timeValid === 0}}{{item.promo_info.sale.end_at | stampFormat_tomorrow_fixed:"hh:mm" }}结束{{else if item.timeValid === 1}}{{item.promo_info.sale.begin_at | stampFormat_tomorrow_fixed:"hh:mm" }}开始{{/if}}</div>',
      '<div class="progress-bar">',
        '已售{{item.promo_info.sale.kill_process}}%',
        '<span class="progress-bg">',
          '<span style="width:{{item.promo_info.sale.kill_process}}%"></span>',
        '</span>',
      '</div>',
    '</div>'
].join('');
var sum = [
    '{{if sum}}',
    '<div class="sum">',
        '<span>小计</span>',
        '<span class="sum-num">{{item.buy_info.summary_text}}</span>',
    '</div>',
    '{{/if}}',
].join('');
var tpls = {
    item: [
        '<div class="item" data-sku_id="{{item.sku_info.sku_id}}" data-cprice="{{item.currentPrice}}" data-moq="{{item.sale_info.moq}}">',
            '{{if item.sale_info && item.sale_info.bomb_tags && item.sale_info.bomb_tags[0] && item.sale_info.bomb_tags[0].name}}',
                '<i class="flag iconf i-item-tag">',
                  '<span class="flag-title" style="background:{{item.sale_info.bomb_tags[0].bgcolor | formatColor}}">',
                    '{{item.sale_info.bomb_tags[0].name}}',
                  '</span><span class="flag-triangle" style="border-left-color:{{item.sale_info.bomb_tags[0].bgcolor | formatColor}}"></span>',
                '</i>',
            '{{/if}}',
            '<div class="item-content">',
                '<a class="item-link" href="/#category/item?sku_id={{item.sku_info.sku_id}}&index={{index}}&page={{page}}">',
                    '<img alt="{{item.sku_info.name}}" class="lazy-load-img" src="'+__uri('/static/img/holder.png')+'" {{if item.sku_info.img_list[0]}} data-src="{{item.sku_info.img_list[0][imgScale]}}"{{/if}}/>',
                '</a>',
                '<div class="info">',
                    '<p class="name">',
                        '<a class="item-link link-href" href="/#category/item?sku_id={{item.sku_info.sku_id}}&index={{index}}&page={{page}}">',
                            '{{item.sku_info.name}}',
                        '</a>',
                    '</p>',
                    '{{if item.history_info && item.history_info.buy_count}}',
                        '<span class="buy-times">买过{{item.history_info.buy_count}}次</span>',
                    '{{/if}}',
                    // 商品标签
                    '<div class="tags">',
                      '{{if item.sale_info && item.sale_info.item_tags}}',
                        '{{each item.sale_info.item_tags as tags}}',
                          '<i class="tag iconf i-item-tag" style="background:{{tags.bgcolor | formatColor}}">',
                            '{{tags.name}}',
                          '</i>',
                        '{{/each}}',
                      '{{/if}}',
                      // 黑名单商品
                      '{{if item.sale_info && item.sale_info.black_tags && item.sale_info.black_tags[0] && item.sale_info.black_tags[0].name}}',
                        '{{each item.sale_info.black_tags as black_tag}}',
                          '<i class="tag iconf i-item-tag" style="border:{{black_tag.bgcolor | formatColor}} 1px solid; color: {{black_tag.bgcolor | formatColor}}">',
                            '{{black_tag.name}}',
                          '</i>',
                        '{{/each}}',
                      '{{/if}}',
                    '</div>',

                    '<div class="operation">',
                        '<span class="current-price">',
                            '{{item.currentPrice | formatPrice}}',
                        '</span>',
                        '{{if item.deletePrice}}',
                            '<del>{{item.deletePrice | formatPrice}}</del>',
                        '{{/if}}',
                        '{{if item.history_info && item.history_info.coupon_money && item.history_info.coupon_money > 0}}',
                            '<span class="price-lower"><i class="iconf i-direc-down"></i>降价{{item.history_info.coupon_money}}</span>',
                        '{{/if}}',
                        //下架\售罄处理

                        '{{if item.sale_info.status == 3 || item.timeValid == 2}}',
                                '{{if !disabledItem}}',
                                '<span class="sellout">下架</span>',
                                '{{else}}',
                                '<span class="buy">',
                                    '<span class="buy-count" data-count="{{item.buy_info.count || 0}}">{{item.buy_info.count || 0}}</span>',
                                '</span>',
                                '{{/if}}',
                        '{{else if item.sale_info.inventory_num == 0 && item.timeValid != 1}}',
                                '{{if !disabledItem}}',
                                    '<span class="sellout">售罄</span>',
                                '{{else}}',
                                    '<span class="buy">',
                                        '<span class="buy-count" data-count="{{item.buy_info.count || 0}}">{{item.buy_info.count || 0}}</span>',
                                    '</span>',
                                '{{/if}}',
                        '{{else}}',
                            '{{if !item.timeValid}}',
                                '<span class="buy{{if !item.buy_info.count}} empty{{/if}}">',
                                    '<i class="act-subtract iconf i-item-subtract" data-index="{{index}}" data-page="{{page}}"></i>',
                                    '<span class="buy-count" data-count="{{item.buy_info.count || 0}}" >{{item.buy_info.count || 0}}</span>',
                                    '{{if item.sale_info.moq > 1}}<span class="moq">{{item.sale_info.moq}}{{item.sale_info.sale_unit_name || "件"}}起订</span>{{/if}}',
                                    '<i class="act-add iconf i-item-add" data-index="{{index}}" data-page="{{page}}"></i>',
                                '</span>',
                            //未到开抢时间
                            '{{else}}',
                                '{{if !disabledItem}}',
                                '<span class="kill-at-once">即将开抢</span>',
                                '{{else}}',
                                '<span class="buy">',
                                '<span class="buy-count" data-count="{{item.buy_info.count || 0}}">{{item.buy_info.count || 0}}</span>',
                                '</span>',
                                '{{/if}}',
                            '{{/if}}',
                        '{{/if}}',
                    '</div>',

                '</div>',
                '{{if showBar}}',
                  '<div class="item-seckill">',
                    secKillTpl,
                  '</div>',
                '{{/if}}',
            '</div>',
            '{{if !checkable && !disabledItem}}',
            '<div class="item-gift">',
                giftTpl,
            '</div>',
            sum,
            '{{/if}}',

        '</div>'
    ].join(''),
    gift: giftTpl,
    secKill: secKillTpl,
    empty: ['<div class="item-empty">暂无数据</div>'].join(''),
    end: ['<div class="item-to-end">没有更多数据了</div>'].join(''),
    errorTip: [
        '<div class="error-tip" data-code = "{{code}}" data-error-type = "{{errorType}}" data-error-give = "{{errorGive}}" data-error-msg = "{{text}}">',
            '<i class="iconf i-warn"></i>',
            '{{text}}',
        '</div>'
    ].join(""),
};

var checkableTpls = [
    '<div class="weui_cells weui_cells_checkbox item-checkbox ',
      // 增加error-item标志
      '{{if ',
        'validate && ',
        '(item.buy_info.count > 0) && ',
        '( item.sale_info.inventory_num == 0 || ',  // 库存不足
          'item.sale_info.moq > item.buy_info.count || ', // 不足最少起定量
          'item.sale_info.order_limit < item.buy_info.count || ', // 超出限购量
          'item.sale_info.inventory_num < item.buy_info.count || ', // 库存不足
          'item.sale_info.status == "3" || ', // 下架
          'giveErr',  // 赠品异常状态
        ')',
      '}}',
        'error-item',
      '{{/if}}">',
        '{{if validate && (item.buy_info.count > 0) && (item.sale_info.inventory_num == 0 || item.sale_info.moq > item.buy_info.count || item.sale_info.order_limit < item.buy_info.count || item.sale_info.inventory_num < item.buy_info.count || item.sale_info.status == "3" || giveErr )}}',
        '<div class="error-tip">',
        '<i class="iconf i-warn"></i>',
        // '{{if item.exp_info && item.exp_info.tips && item.exp_info.tips.length}}',
        //     '{{item.exp_info.tips}}',
        //'{{if item.sale_info.inventory_num == 0}}',
        //'售罄',
        '{{if item.sale_info.moq > item.buy_info.count}}',
        '该商品最少{{item.sale_info.moq}}件起订',
        '{{else if item.sale_info.order_limit < item.buy_info.count}}',
        '该商品最多限购{{item.sale_info.order_limit}}件',
        '{{else if item.sale_info.inventory_num < item.buy_info.count}}',
        '库存不足，仅可购买{{item.sale_info.inventory_num}}件，请修改数量',
        '{{else if (giveErr && giveErr.text)}}',
        '{{giveErr.text}}',
        //'{{else if item.sale_info.status == "3"}}',
        //'该商品已下架',
        '{{/if}}',
        '</div>',
        '{{/if}}',
        '<label class="weui_cell weui_check_label item-check-label" for="group-{{groupIndex}}-item-{{index}}">',
            '<div class="weui_cell_hd">',
            '<input type="checkbox" class="weui_check" name="item-selected" id="group-{{groupIndex}}-item-{{index}}" {{if item.buy_info.selected > 0}}checked{{/if}}>',
            '<i class="weui_icon_checked"></i>',
            '</div>',
            '<div class="weui_cell_bd weui_cell_primary">',

            '</div>',
        '</label>',
        tpls.item,
        '<div class="item-gift">',
        giftTpl,
        '</div>',
        //sum,

    '</div>'
].join('');

var disableItemTpl = [
    '<div class="weui_cells disable-item {{if validate && (item.buy_info.count > 0) && (item.sale_info.inventory_num == 0 || item.sale_info.moq > item.buy_info.count || item.sale_info.order_limit < item.buy_info.count || item.sale_info.inventory_num < item.buy_info.count || item.sale_info.status == "3")}}error-item{{/if}}">',
        '<div class="label-container">',
            '{{if item.sale_info.status == 3 || item.timeValid == 2 }}',
            '<label>下架</label>',
            '{{else if item.sale_info.inventory_num == 0 && item.timeValid != 1}}',
            '<label>售罄</label>',
            '{{else if item.timeValid == 1}}',
            '<label>失效</label>',
            '{{/if}}',
        '</div>',
        tpls.item,
        '<div class="item-gift">',
        giftTpl,
        '</div>',
        //'<div class="sum"><span class="price">{{item.currentPrice | formatPrice}}</span><span class="count">{{item.buy_info.count}}</span></div>',
        //'{{if validate && (item.buy_info.count > 0) && (item.sale_info.inventory_num == 0 || item.sale_info.moq > item.buy_info.count || item.sale_info.order_limit < item.buy_info.count || item.sale_info.inventory_num < item.buy_info.count || item.sale_info.status == "3")}}',
        '<div class="error-tip">',

        '</div>',
        //'{{/if}}',
    '</div>',
].join('');

tpls['checkableItem'] = checkableTpls;
tpls['disableItem'] = disableItemTpl;

module.exports = tpls;
