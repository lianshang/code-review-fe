var tpls = {
    categoryViewCanvas: [
        '<header class="header">',
            '<span class="page-title">分类</span>',
            '<a class="header-input">',
              '<span class="iconf i-search"></span>',
              '<span class="header-text">请输入您要搜索的商品</span>',
              '<span class="iconf i-scan"></span>',
            '</a>',
        '</header>',

        '<section class="cates">',
            '<ul class="clearfix"></ul>',
        '</section>',

        '<section class="items">',
            //'<h2 class="active-cate"></h2>',
            '<div class="brand-mask"></div>',
            '<div class="brandes"></div>',
            '<div class="item-list">',
                '<ul class="clearfix"></ul>',
                '<div class="loading">数据加载中...</div>',
            '</div>',
        '</section>'
    ].join(''),
    categoryItem: [
        '{{each list as lv1 index1}}',
            '{{if lv1.list}}',
                '<li class="cate-lv1{{if active[0] == index1}} active{{if active[1]==null || active[1] === 0}} active-first-sub{{/if}}{{/if}}" data-cat_id="{{lv1.cat_id}}">',
                    '<span>{{lv1.cat_name}}</span>',
                '</li>',
                '<ul class="cates-lv2">',
                    // '<li class="cate-lv2 all{{if active[0] == index1 && active[1] == undefined}} active{{/if}}" data-cat_id="{{lv1.cat_id}}"><span>全部</span></li>',
                    '{{each lv1.list as lv2 index2}}',
                        '<li class="cate-lv2{{if active[0] == index1 && active[1] == index2}} active{{/if}}" data-cat_id="{{lv2.cat_id}}"><span>{{lv2.cat_name}}</span></li>',
                    '{{/each}}',
                '</ul>',
            '{{/if}}',
        '{{/each}}',
    ].join(''),
    categoryTips: [
        '<a class="tips" href="{{url}}">',
            '<span class="tips-l">{{txt}}</span>',
            '<span class="tips-r">点击查看<i class="iconf i-arrow-r"></i></span>',
        '</a>',
    ].join(''),
    brandBtn: [
      '<div class="iconf brand-btn i-arrow-b">全部品牌</div>',
      '<div class="brand-list">',
        '<span data-value="" class="brand {{if !current }} current {{/if}}">全部品牌</span>',
        '{{each brandes as brand index}}',
          '<span data-value="{{brand.brand}}" class="brand {{if current == index + 1 }} current {{/if}}">{{brand.brand}}</span>',
        '{{/each}}',
      '</div>'
    ].join('')
};

module.exports = tpls;
