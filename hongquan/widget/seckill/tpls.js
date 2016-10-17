var commonHeader = require('home:widget/ui/header/header.js');
var tpls = {
  secKillDetailCanvas: [
    commonHeader('{{activityInfo.name}}'),
    '<section class="seckills"></section>',
    '<section class="seckill-info">',
      '<div class="brief-info-wrap">',
        '<p class="name">{{activityInfo.activityTitle}}</p>',
        '<div class="brief-info">',
          '{{#activityInfo.rules}}',
        '</div>',
      '</div>',
    '</section>'
  ].join(''),

  group: [
    '{{if title}}',
    '<div class="group{{if now}} now{{else}} future{{/if}}">',
      '<div class="group-title">',
        '<i class="iconf{{if now}} i-bolt{{else}} i-clock{{/if}}"></i>',
        '{{title}}',
      '</div>',
      '<div class="items">',
        '<ul></ul>',
      '</div>',
    '</div>',
    '{{/if}}',
  ].join(''),

  empty: [
    '<div class="sec-kill-empty">暂无秒杀商品</div>'
  ].join('')
}

module.exports = tpls;
