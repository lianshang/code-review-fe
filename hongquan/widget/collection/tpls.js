var commonHeader = require('home:widget/ui/header/header.js');
var tpls = {
  ui: [
    commonHeader({
      backUrl: '/#my',
      title: '我的收藏',
      extendTpl: '<i class="edit float-right">编辑</i>'
    }),
    '<section class="category"></section>',
    '<section class="nodata">',
      '<i class="icon i-cart-collection"></i>',
      '<p class="p1">暂无收藏</p>',
      '<p class="p2">快点挑点宝贝吧</p>',
      '<a href="/#" class="weui_btn weui_btn_default">去首页逛逛</a>',
    '</section>',
    '<section class="collections"></section>',
    // '<div class="item-to-end">没有更多数据了</div>',
    '<div class="sub-btn disabled">删除<span></span></div>'
  ].join(''),
  checkHtml: [
      '<div class="checkbox weui_cell_hd">',
        '<label class="weui_cell weui_check_label" for="s{{index}}">',
          '<input type="checkbox" name="checkbox1" class="weui_check" id="s{{index}}">',
          '<i class="weui_icon_checked"></i>',
        '</label',
      '</div>'
  ].join(''),
  category: [
    '<div class="trigger">',
      '<span>全部分类（{{data.count}}）</span>',
      '<i class="iconf i-triangle-b"></i>',
    '</div>',
    '<ul class="list">',
      '{{if data.cateList}}',
        '{{each data.cateList as cate}}',
          '<li data-cat-id="{{cate.catid}}" class="cur">{{cate.name}}（{{cate.num}}）</li>',
        '{{/each}}',
      '{{/if}}',
    '</ul>'
  ].join('')
};

module.exports = tpls;
