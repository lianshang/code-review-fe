var tpls = {
    ///#home/search?frm=home
    homeViewCanvas: [
        '<header class="header">',
            '<div class="header-cover"></div>',
            '<a class="header-input">',
              '<span class="iconf i-search"></span>',
              '<span class="header-text">请输入您要搜索的商品</span>',
              '<span class="iconf i-scan"></span>',
            '</a>',
        '</header>',

        '<section class="slide">',
        '</section>',

        '<section class="cates">',
            '<ul class="clearfix"></ul>',
        '</section>',

        // 公告
        '<section class="public-notice">',
          '<span class="title"><img src="" alt=""></span>',
          '<ul class="notice-list"></ul>',
        '</section>',

        '<section class="banner-list">',
        '</section>',

        '<section class="items">',
        '</section>'
    ].join(''),
    noticeList: [
      '{{each noticeList as notice}}',
        '<li><span class="tag" style="background-color:{{notice.label_color | formatColor}};">{{notice.label}}</span>',
        '<a href="{{notice.url}}" style="color: {{notice.title_color | formatColor}};">{{notice.title}}</a></li>',
      '{{/each}}'
    ].join(''),
    homeCate:[
        '{{each cat_list as cate}}',
            '<li>',
                '<a class="cate" href="/#category?cat_id={{cate.cat_id}}">',
                    '<img src="{{cate.img_info[imgScale]}}" alt="{{cate.cat_name}}"/>',
                    '<div class="cate-text">{{cate.cat_name}}</div>',
                '</a>',
            '</li>',
        '{{/each}}'
    ].join(""),
    homeBanner:[
        '{{each banner_list as banner}}',
            '<a class="banner-item" href="{{banner.content.info | filter_home_url:banner.jump_type}}">',
                '<img src="'+__uri('/static/img/holder.png')+'" data-src="{{banner.img_info[imgScale]}}" alt="{{banner.jump_type | filter_banner_alt}}"/>',
            '</a>',
        '{{/each}}'
    ].join(""),
    homeItemGroup: [
        '<div{{if item_head}} class="group"{{/if}}>',
            '{{if item_head}}',
                '<a class="title" href="/#category?cat_id={{item_head.id}}">',
                    '<div class="title-primary">{{item_head.text}}</div><div class="iconf i-arrow-r">更多 </div></a>',
                '</a>',
            '{{/if}}',
        '</div>'
    ].join(""),
    couponList: [
        '{{if coupon_list.length!=0}}',
        '<div class="coupon-item weui_cells">',
            '<div class="weui_mask"></div>',
            '<div class="citems-container">',
                '<div class="citems-close"><i class="icon i-coupon-close"></i></div>',
                '<div class="citems-bg">',
                '<div class="citems-tips"><p>请到[我的]页面查看</p></div>',
                '<div class="citems">',
                    '{{each coupon_list as coupon}}',
                    '<div class="citem weui_cell">',
                        '<div class="money">{{coupon.coupon_value | value_filter}}</div>',
                        '<div class="info">',
                            '<p>{{coupon.cond}}</p>',
                            '<p>有效期：{{coupon.coupon_begin | date_filter}} - {{coupon.coupon_end | date_filter}}</p>',
                            '<p>适用范围：{{coupon.desc | desc_filter}}</p>',
                            '{{if coupon.tips}}<p class="tip">{{coupon.tips}}</p>{{/if}}',
                        '</div>',
                    '</div>',
                    '{{/each}}',
                '</div>',
                '</div>',
            '</div>',
        '</div>',
        '{{/if}}'
    ].join('')
};

module.exports = tpls;
