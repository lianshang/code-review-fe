var commonHeader = require('home:widget/ui/header/header.js');
var itemTpl = [
        '<label class="citem weui_cell weui_check_label{{if coupon.is_used == 1 || coupon.is_valid == 0 || choose && coupon.is_able_to_use !== true}} disabled{{/if}}{{if coupon.is_mutex}} conflict{{/if}}{{if (!selectId && index === 0) || coupon.coupon_id == selectId}} cur{{/if}}" for="coupon{{start + index}}" data-id="{{coupon.coupon_id}}">',
            '<div class="sep"></div>',
            '<div class="money">{{coupon.coupon_value | value_filter}}</div>',
            '<div class="info weui_cell_primary">',
                '<p>{{coupon.cond}}</p>',
                '<p>有效期：{{coupon.coupon_begin | stampFormat:"yy-MM-dd hh:mm"}} - {{coupon.coupon_end | stampFormat:"yy-MM-dd hh:mm"}}</p>',
                '<p>适用范围：{{coupon.desc | desc_filter}}</p>',
                '{{if coupon.tips}}<p class="tip">{{coupon.tips}}</p>{{/if}}',
            '</div>',
            '{{if choose && coupon.is_able_to_use === true || !choose}}',
                '<div class="weui_cell_ft">',
                    '{{if choose}}',
                        '<input type="radio" name="couponRadio" class="weui_check coupon-radio" id="coupon{{start + index}}"{{if (!selectId && index === 0) || coupon.coupon_id == selectId}} checked="checked"{{/if}}>',
                        '<span class="weui_icon_checked"></span>',
                    '{{else}}',
                        '{{if coupon.is_used == 1}}',
                            '已使用',
                        '{{else if coupon.is_valid == 0}}',
                            '已过期',
                        '{{/if}}',
                    '{{/if}}',
                '</div>',
            '{{/if}}',
        '</label>'
    ].join('');

module.exports = {
    item: itemTpl,
    sublist: [
        '{{each list as coupon index}}',
            '{{if !choose || choose && coupon.is_used == 0 && coupon.is_valid == 1}}',
                itemTpl,
            '{{/if}}',
        '{{/each}}',
    ].join(''),
    content: [
        // '<div class="mod-coupon header-fixed">',
            commonHeader({
              title: '{{type}}',
              extendTpl: '<i class="add float-right">兑换</i>'
            }),
            '{{if list && list.length}}',
                '<div class="list weui_cells{{if choose}} weui_cells_checkbox{{/if}}">',
                    '{{if choose}}',
                        '<label class="no-citem weui_cell weui_check_label{{if selectId == -1}} cur{{/if}}" data-id="-1">',
                            '<div class="weui_cell_primary">不使用{{type}}</div>',
                            '<div class="weui_cell_ft">',
                                '<input type="radio" name="couponRadio" class="weui_check coupon-radio"{{if selectId == -1}} checked="checked"{{/if}}>',
                                '<span class="weui_icon_checked"></span>',
                            '</div>',
                        '</label>',
                    '{{/if}}',
                    // subListTpl,
                '</div>',
                '<div class="loading">数据加载中...</div>',
                '<div class="end" data-end = "{{unable_total}}">{{if is_usable == 2 || choose}}没有更多数据了 {{else}}暂无更多可用券 {{if !choose && unable_total > 0 && !in_unable}} <a class="unable" href="{{unableUrl}}">查看失效券<i class="iconf i-arrow-r weui_cell_ft"></i></a>{{/if}}{{/if}}</div>',
            '{{else}}',
                '<div class="empty">您还没有{{type}}{{if !choose && unable_total > 0 && !in_unable}}<a class="unable" href="{{unableUrl}}">查看失效券<i class="iconf i-arrow-r weui_cell_ft"></i></a>{{/if}}</div>',
            '{{/if}}',
        // '</div>'
    ].join('')
};
