var tpls = {
    nav: [
        // '<footer class="mod-main-nav clearfix">',
            '<a href="/#" class="main-nav nav-home" data-nav="home"><i class="icon i-nav-home"></i>首页</a>',
            '<a href="/#category" class="main-nav nav-category" data-nav="category"><i class="icon i-nav-category"></i>分类</a>',
            '<a href="/#shopping/cart" class="main-nav nav-cart" data-nav="cart"><i class="icon i-nav-cart"></i><span class="buyTotalPrice">购物车</span><span class="total">{{if buyTotal > 0}}<em class="num">{{if buyTotal > 99}}99+{{else}}{{buyTotal}}{{/if}}</em>{{/if}}</span></a>',
            '<a href="/#my" class="main-nav nav-my" data-nav="my"><i class="icon i-nav-my"></i>我的</a>',
        // '</footer>'
    ].join('')
};

module.exports = tpls;
