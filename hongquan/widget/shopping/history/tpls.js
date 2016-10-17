var commonHeader = require('home:widget/ui/header/header.js');
module.exports = {
    content: [
        // '<div class="mod-shopping-history">',
            commonHeader('购买历史'),
            '<section class="history-cates"></section>',
            '<section class="history"></section>',
        // '</div>'
    ].join(''),
    empty: [
        '<div class="nodata">',
            '<i class="icon i-cart-empty"></i>',

            '<p class="p1">购买历史为空</p>',

            '<p class="p2">快去挑点宝贝吧</p>',
            '<a href="/" class="weui_btn weui_btn_default">去首页逛逛</a>',
        '</div>',
    ].join('')
};
