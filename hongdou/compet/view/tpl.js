var tpls = {
    TOPTPL:[
        '<span class="approve-count">审核轮数：{{matchCount || "- -"}} 轮</span>',
        '<h2 class="title">{{competName}}商品</h2>'
    ].join(''),
    ITEMSTPL: [
        '{{each matchList as item}}',
            '<div class="item-info col-4" data-com="{{item.com_id}}" data-item="{{item.com_key}}">',
                '{{if item.img_url}}<img class="img" src="{{item.img_url}}" /><i class="iconfont {{if item.is_select}}icon-gouxuan{{/if}}"></i>{{else}}<div class="img no-img" src="" >暂无图片</div><i class="iconfont"></i>{{/if}}',
                '<div class="field-group">',
                    '<span class="field-label">{{competName}}商品名称：</span>',
                    '<div>{{item.pname || "- -"}}</div>',
                '</div>',
                '<div class="field-group">',
                    '<span class="field-label">{{competName}}商品规格：</span>',
                    '<div>{{item.spec || "- -"}}</div>',
                '</div>',
                '<div class="field-group">',
                    '<span class="field-label">{{competName}}商品售价：</span>',
                    '<div>{{item.order_price || "- -"}}</div>',
                '</div>',
                '<div class="field-group">',
                    '<label class="field-label">{{competName}}商品EA数量：</label>',
                    '<input class="field-control {{if !(item.is_select && taskType==2)}}hide{{/if}} ea-num" pattern="^(([1-9]\\d*|0)(\\.\\d+)?)?$" invalid="请填写有效数字" type="text" value="{{item.ea_num}}" />',
                    '<div class="field-msg"></div>',
                    '<div class="ea-view {{if item.is_select && taskType==2}}hide{{/if}}">{{item.ea_num || "- -"}}</div>',
                '</div>',
            '</div>',
        '{{/each}}'
    ].join(''),
    MAINITEMTPL:[
        '<h2 class="main-title">{{competName}}商品</h2>',
        '<div class="main-item-info" data-map="{{item.map_id}}" data-com="{{item.com_id}}" data-item="{{item.key}}">',
            '{{if item.img_url}}<img src="{{item.img_url}}" />{{else}}<div class="no-img" src="" >暂无图片</div>{{/if}}',
                '<div class="field-group">',
                    '<span class="field-label">{{competName}}商品名称：</span>',
                    '<div>{{item.pname || "- -"}}</div>',
                '</div>',
                '<div class="field-group">',
                    '<span class="field-label">{{competName}}商品规格：</span>',
                    '<div>{{item.spec || "- -"}}</div>',
                '</div>',
                '<div class="field-group">',
                    '<span class="field-label">{{competName}}商品售价：</span>',
                    '<div>{{item.order_price || "- -"}}</div>',
                '</div>',
                '<div class="field-group">',
                    '<label class="field-label">{{competName}}商品EA数量：</label>',
                    '{{if taskType==1}}',
                        '<input class="field-control ea-view"  autofocus="autofocus"  required pattern="^(([1-9]\\d*|0)(\\.\\d+)?)?$" invalid="请填写有效数字"  value="{{item.ea_num}}" type="text" /><div class="field-msg"></div>',
                    '{{else}}',
                        '<div class="ea-view">{{item.ea_num || "- -"}}</div>',
                    '{{/if}}',
                '</div>',
        '</div>'
    ].join('')
};

module.exports = tpls;