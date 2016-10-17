var commonHeader = require('home:widget/ui/header/header.js');
var info = [
  '<div class="info">',
    '<div class="pay">',
      '<p class="title">{{item.flag}}</p>',
      '<p class="money">{{item.money}}</p>',
    '</div>',
    '<div class="weui_cells order-info">',
      // 订单详情
      '<a href="/#my/order/detail?order_id={{order_id}}">',
        '<div class="order-detail weui_cell">',
          '<div class="weui_cell_primary">',
          '{{each item.img_list as img i}}',
            '{{if i < 3}}',
              '<div class="item-img"><img class="lazy-load-img" src="'+__uri('/static/img/holder.png')+'"{{if img[imgScale]}} data-src="{{img[imgScale]}}{{/if}}"/></div>',
            '{{/if}}',
          '{{/each}}',
          '</div>',
          '<div class="weui_cell_ft">',
            '<span class="vm">共{{item.item_count}}件</span>',
            '<i class="right iconf i-arrow-r"></i>',
          '</div>',

        '</div>',
      '</a>',
      '<div class="weui_cell trans-info">',
        '<div class="weui_cell_primary">',
          '<span>{{item.name}}</span>',
        '</div>',
        '<div class="weui_cell_ft">',
          '<p class="car-number">{{item.car_number}}</p>',
          '<p>送达时间:&nbsp&nbsp{{item.time | date_filter}}</p>',
        '</div>',
      '</div>',
    '</div>',
  '</div>',
].join('');

var tpls = {
  info: info,
  tagList: [
    '{{ if tag_list.length !== 0 }}',
    '<div class="weui_cell el-taglist">',
      '{{each tag_list as tag}}',
        '<a class="el-btn {{if tag.selected}}selected{{/if}}" href="" data-id="{{tag.tag_id}}">{{tag.tag_name}}</a>',
      '{{/each}}',
    '</div>',
    '{{/if}}',
  ].join(""),
  content: [
    commonHeader({
      backUrl: '{{backUrl}}',
      title: '{{title}}'
    }),
    '<div class="weui_cells evaluate-pop">',
      '<div class="evaluate-title">服务评价</div>',
      '<div class="evaluate-star"></div>',
      '<div class="evaluate-text">',
        '<div class="el-tags">',
          '<div class="weui_cell title">说点什么</div>',
        '</div>',
        '<div class="weui_cells el-move-margin">',
          '<div class="el-textarea">',
            '<div class="weui_cell_bd weui_cell_primary">',
              '<textarea class="weui_textarea" placeholder="（请至少输入10个字）您可以从商品质量、配送、服务态度等方面来发表评价。" rows="3"></textarea>',
            '</div>',
          '</div>',
        '</div>',
      '</div>',
      '<div class="summary goto-eveluate">',
        '<button class="sub-evaluate" disabled="true">提交评价</button>',
      '</div>',
    '</div>'
  ].join("")
}


module.exports = tpls;
