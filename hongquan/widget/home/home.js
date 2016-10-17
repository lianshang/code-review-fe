// require.loadCss({url: __uri('home.async.css')});
var $ = require('home:widget/ui/zepto/zepto.js');
var TPL = require('home:widget/home/tpls.js');
var artTpl = require('home:widget/ui/tpl/tpl.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var UIItemListView = require('home:widget/ui/ui-item-list-view/ui-item-list-view.js');
var CartMainModel = require('home:widget/cart/cart.main.model.js');
// var Loading = require('home:widget/ui/loading/loading.js');
var Alert = require('home:widget/ui/alert/alert.js');
var app = require('home:widget/ui/router/router.js');
require('home:widget/ui/slide/slide.js');
require('home:widget/ui/lazyload/lazyload.js');

// seo - 为img分配一个alt
var BANNER_TYPE = {
    1: '单品',
    2: '活动',
    3: '公告',
    4: '秒杀'
};
var filters = {
    filter_banner_alt: function (type) {
        return BANNER_TYPE[type] + '活动';
    },
    // 工具方法 - 根据jump_type转换url
    transformUrl: function (info, jump_type) {
        var url = "";
        if (jump_type == 1) {
            url = '/#category/item?sku_id=' + info;
        } else if (jump_type == 2) {
            url = '/#home/activity?activity_id=' + info;
        } else if (jump_type == 3) {
            url = info;
        } else if (jump_type == 4) {
            url = '/#seckill';
        } else {
            url = '#';
        }
        return url;
    },
    desc_filter: function (desc) {
        return ~desc.indexOf(':') ? $.trim(desc.split(':')[1]) : desc;
    },
    value_filter: function (value) {
        value = parseInt(value, 10);
        return isNaN(value) ? '' : value;
    },
    date_filter: function (seconds) {
        function pad(num, len) {
            len = Math.pow(10, len || 2);
            return num < len ? ((len + num) + '').slice(1) : num + '';
        }

        if (seconds) {
            var date = new Date(seconds * 1000);
            var day = [
                ('' + date.getFullYear()).slice(2),
                pad(date.getMonth() + 1, 2),
                pad(date.getDate(), 2)
            ];
            return day.join('.');
        } else {
            return '— —';
        }
    }
};

var DOC = $(document);

// Model
var Model = Backbone.Model.extend({
    url: '/index?format=json',
    initialize: function () {

    },
    defaults: function () {
        return {
            focus: null,
            cate: null,
            banner: null,
            item_list: null,
            coupon_list: null,
            notice: null,
            status: 1,    //跳转状态,1跳转,0不跳转
        };
    },
    /**
     * 比较原有数据信息与新请求的数据是否有变化
     * @param  {[Object/JSON]} objold [conf.index中存储的相关数据]
     * @param  {[Object/JSON]} objnew [response.content中对应的数据]
     * @return {[Bool]}        [true为有变化，false为无变化]
     */
    compareData: function (objold, objnew) {
        if (JSON.stringify(objold) != JSON.stringify(objnew)) {
            return true;
        } else {
            return false;
        }
    },
    /**
     * 通过JSON转换为字符串再转换为对象的方式来实现对象的赋值，避免出现对象的引用，相互影响
     * 对象引用在这一模块中出现了多次，需要思考如何进行优化？同时日后一定要避免对象引用问题的出现，坑很深
     * @param  {[Object]} obj [需要被克隆的对象]
     * @return {[type]}     [一个新的对象]
     */
    cloneObj: function (obj) {
        var str = JSON.stringify(obj);
        return JSON.parse(str);
    },
    /**
     * 将数据中的item_list与block_list合并为_item_list并返回，当conf.index已经存在这一属性时直接返回，避免因item_list
     * 和block_list没有更新而导致的值覆盖
     * 同时这里进行了实现方式的统一，根据判断结果都会返回相应值
     * @param {[Object]} data [conf.index或response.content数据]
     */
    setData: function (data) {
        if (data._item_list) {
            return data._item_list
        } else {
            data._item_list = data.item_list ? [{item_list: data.item_list}] : [];
            return data._item_list.concat(data.block_list);
        }
    },
    /**
     * 获取数据，第一次使用后端直接返回的内容，后续进行异步请求，页面渲染时先使用上一次最新的conf.index中数据进行渲染
     * 请求完成后将两者进行对比，有变化的部分单独进行渲染
     */
    getData: function () {
        var self = this;
        conf.index._item_list = self.setData(conf.index);//获取商品及商品分类数组
        //由于item_list后续又传入了model-cart.js存在对象引用问题，所以这里传入了一个新的对象避免修改conf.index中的值
        var data = self.cloneObj(conf.index);
        //第一次进入时直接使用后端传回来的实时值进行渲染
        //后续每次进入时都会拿上一次的数据先渲染一次，避免首页出现短暂空白的问题
        this.set({focus: data.focus_list, cate: data.cat_list, banner: data.banner_list, item_list: data._item_list});
        // v1.5.1 - 因为新增“商品价格要强制登录才能查看”这一需求，所以只能把first_time策略去掉了
        // if(conf.index.first_time == null){
        //     conf.index.first_time = false;
        // }else{
        /**
         *第二次及后续访问首页时每次都会发起请求，将返回值与conf.index中存储的值进行对比
         *依次按顺序比较轮播图focus、分类推荐cate、宣传图Banner和商品及商品分组item_list
         *当请求结果与conf.index储存的值不相符时会进行以下两个动作：
         *1.将model中的值进行更新(使用set方法，此时会触发listenTo绑定事件)，重新渲染该部分页面
         *2.将conf.index中的值进行更新，确保下次进入页面时能拿到一个相对较新的数据
         */
        self.fetch({
            dataType: "json",
            timeout: 20000,
            cache: false,
            success: function (model, response, options) {
                if (response && response.ret === 0) {
                    var data = response.content;
                    var item_list = self.setData(response.content);
                    conf.now = new Date(options.xhr.getResponseHeader("Date")).getTime();
                    if (self.compareData(conf.index.focus_list, data.focus_list)) {//比较轮播图
                        self.set('focus', data.focus_list);
                        conf.index.focus_list = data.focus_list;
                    }
                    if (self.compareData(conf.index.cat_list, data.cat_list)) {//比较分类推荐
                        conf.index.cat_list = data.cat_list;
                        self.set('cate', data.cat_list);
                    }
                    if (self.compareData(conf.index.banner_list, data.banner_list)) {//比较Banner图
                        self.set('banner', data.banner_list);
                        conf.index.banner_list = data.banner_list;
                    }
                    if (self.compareData(conf.index._item_list, item_list)) {//比较商品及商品分组
                        //由于item_list后续又传入了model-cart.js存在对象引用问题，
                        //所以这里传入了一个新的对象避免修改conf.index中的值
                        self.set('item_list', item_list);
                        conf.index._item_list = self.cloneObj(item_list);
                    }
                    //公告设置数据
                    self.set('notice', data['hot_list']);
                } else {
                    Alert.show(response.msg);
                }
            },
            error: function (model, response, options) {
                if (options.textStatus === "parsererror") {
                    Alert.show("您需要登录!", function () {
                        location.reload();
                    });
                } else if (options.textStatus === "timeout") {
                    Alert.show("网络请求超时!");
                } else {
                    Alert.show("您的网络似乎有问题, 请检查网络后重试!");
                }
            }
        });
        // }
    },
    getCouponList: function () {
        var that = this;
        var url = '/my/coupon/getUnactivatedCouponList';
        //只有第一次进入时,获取数据
        if (!conf.couponList && conf.get) {
            $.ajax({
                type: 'POST',
                url: url,
                dataType: 'json',
                timeout: 20000,
                success: function (data) {
                    if (data && data.ret === 0) {
                        conf.couponList = data.content.coupon_list;
                        that.set('coupon_list', conf.couponList);
                    } else {
                        Alert.show(response.msg);
                    }
                },
                error: function (_, errorMsg) {
                    if (errorMsg === "timeout") {
                        Alert.show("网络请求超时!");
                    } else {
                        Alert.show("您的网络似乎有问题, 请检查网络后重试!");
                    }
                }
            });
        }
    },
    /**
     * 首页未评价订单跳转
     */
    getUncommentOrder: function () {
        var self = this;
        //只有第一次进入才访问接口,从而重定向
        var url = '/shopping/comment/getUnCommentOrder';
        if (!conf.get) {
            $.ajax({
                type: 'POST',
                url: url,
                dataType: 'json',
                timeout: 20000,
                success: function (data) {
                    if (data && data.ret === 0) {
                        conf.get = true;
                        self.set({status: data.content.status});
                        if (data.content.status == 1 && data.content.order_id) {
                            self.trigger('e-location-comment', {order_id: data.content.order_id});
                        }
                    } else {
                        Alert.show(response.msg);
                    }
                },
                error: function (_, errorMsg) {
                    if (errorMsg === "timeout") {
                        Alert.show("网络请求超时!");
                    } else {
                        Alert.show("您的网络似乎有问题, 请检查网络后重试!");
                    }
                }
            });
        }
    }
});

// View
var View = Backbone.View.extend({
    className: 'mod-home header-fixed',
    model: null,
    events: {
        'click .citems-close': 'closeCouponList',
        'click .header .header-input': 'actionSearch'
    },
    initialize: function (options) {
        artTpl.helper('filter_banner_alt', filters.filter_banner_alt);
        artTpl.helper('filter_home_url', filters.transformUrl);
        artTpl.helper('desc_filter', filters.desc_filter);
        artTpl.helper('value_filter', filters.value_filter);
        artTpl.helper('date_filter', filters.date_filter);
        this.model = new Model(); // 初始化model
        this.initSkeleton(); // 先生成页面骨架
        this.listenTo(this.model, "change:item_list", this.renderItemList); // 商品及商品分组发生变化时进行渲染
        this.listenTo(this.model, "change:focus", this.renderSlide); //轮播图发生变化时进行渲染
        this.listenTo(this.model, "change:cate", this.renderHomeCate); //分类推荐发生变化时进行推荐
        this.listenTo(this.model, "change:banner", this.renderBanner); //Banner图发生变化时进行推荐
        this.listenTo(this.model, "change:coupon_list", this.renderCouponList);
        this.listenTo(this.model, "change:status", this.getCouponList);
        this.listenTo(this.model, "e-location-comment", this.getLocationComment);
        this.listenTo(this.model, "change:notice", this.renderNotice);

        DOC.trigger("e-main-nav-change", "home"); // 触发main-nav切到当前位置
        this.model.getData(); // 获取数据来触发页面重新渲染
        this.model.getCouponList();
        this.model.getUncommentOrder();
    },
    /**
     * 生成页面骨架
     */
    initSkeleton: function () {
        // this.$el.data('view-mod', 'mod-home').show();
        this.$el.html(artTpl.compile(TPL.homeViewCanvas)({logo: __uri('./img/logo.png')}));
        DOC.find('body').append(this.$el);
        this.$el.css('padding-top', 0).find('header').css('background-color', 'rgba(0,0,0,0)'); // 去掉固定时的padding效果 for 1.8.1
        this.scrollHeader();
    },


    // 调用搜索，进入搜索页面或者吊起摄像头扫描
    actionSearch: function (e) {
        e.preventDefault();
        var $target = $(e.target);
        if ($target.hasClass('i-scan')) {
            app.navigate('#home/search?frm=home&action=scan', {trigger: true, replace: true});
        } else {
            app.navigate('#home/search?frm=home', {trigger: true, replace: true});
        }
    },

    /*
     生成链商头条
     list:[
        {id: "115", board_id: "6392767194287238096", label: "test", title: "添加一个公告", status: "1", weight: "3",…},
        {id: "117", board_id: "1778266428474202845", label: "tttttttt",…}
     ],
     tag:{
         txt: "优供头条",
         color: "#00000000",
         picture:{
             id: "",
             large:'',
             medium:'',
             small:'',
             tiny:''
             }
        }
     */
    renderNotice: function () {
        var noticeObj = this.model.get('notice');
        //验证数据
        if (!noticeObj || !noticeObj.list || !noticeObj.list.length || !noticeObj.tag) {
            return;
        }

        //如果有数据 那么进行显示
        this.$('.public-notice').show();

        //变量和dom对象储藏
        var noticeList = noticeObj.list,
            noticeLogo = noticeObj.tag;

        var $notice = this.$('.public-notice'),
            $title = $notice.find('.title img'),
            $noticeList = $notice.find('.notice-list');

        //设置图标
        if (noticeLogo && noticeLogo.picture) {
            $title.attr({
                src: noticeLogo.picture[conf.imgScale],
                alt: noticeLogo.txt
            });
        }

        //设置滚动公告信息
        if (noticeList && noticeList.length) {
            $noticeList.html(
                artTpl.compile(TPL.noticeList)(
                    {
                        noticeList: noticeList
                    }));
            this.noticeScroll($noticeList);
        }
    },

    /*
     *   公告滚动
     *   传入公告ul列表
     * */
    noticeScroll: function (ele) {
        //时间3000毫秒
        var time = 3000;
        setTimeout(function () {
            //利用原生appendChild方法重构dom
            ele[0].appendChild(ele.find('li').eq(0)[0]);
            setTimeout(arguments.callee, time);
        }, time);

    },

    /*
     * 页面滚动时，header的背景色逐渐填充
     */
    scrollHeader: function () {
        var timer = null;
        var beginOpacity = 0;
        var endOpacity = 0.85;
        var $headerCover = this.$('.header-cover');
        var sliderHeight = this.$('.slide').height();
        var headerHeight = this.$('.header').height();
        var diffHeight = sliderHeight - headerHeight;
        $(window).scroll(function () {
            timer = setTimeout(function () {
                var scrollHeight = $(window).scrollTop();
                if (scrollHeight >= sliderHeight) {
                    $headerCover.css('opacity', 1);
                } else {
                    $headerCover.css('opacity', scrollHeight < headerHeight ? beginOpacity : endOpacity * ( scrollHeight - headerHeight ) / sliderHeight);
                }
            }, 80);
        })
    },
    /**
     * 生成轮播
     */
    renderSlide: function () {
        var focusList = this.model.get('focus');
        var $slide = this.$el.find(".slide");
        $slide.empty();//重新渲染时会对之前的内容先进行一次清空
        // 有数据则生成轮播，没有则隐藏
        if (focusList.length) {
            $slide.slide({
                setData: function () {
                    return $.map(focusList, function (focus, index) {
                        var url = filters.transformUrl(focus.content.info, focus.jump_type);
                        return {
                            src: focus.img_info[conf.imgScale],
                            href: url,
                            alt: BANNER_TYPE[focus.jump_type] + '活动' + (index + 1)
                        };
                    });
                }
            });
        } else {
            $slide.hide();
        }
    },
    /**
     * 渲染品类
     */
    renderHomeCate: function () {
        // 品类
        var cate = this.model.get('cate');
        this.$el.find(".cates ul").html(artTpl.compile(TPL.homeCate)({
            cat_list: cate.slice(0, Math.min(cate.length, 8)),
            imgScale: conf.imgScale
        }));
    },
    /**
     * 渲染Banner
     */
    renderBanner: function () {
        // Banner
        var banner = this.model.get('banner');
        this.$el.find(".banner-list").html(artTpl.compile(TPL.homeBanner)({
            banner_list: banner.slice(0, Math.min(banner.length, 8)),
            imgScale: conf.imgScale
        }));
        this.lazyload(); // 图片懒加载
    },
    //优惠券弹框
    $couponListDialog: null,
    //渲染优惠券
    renderCouponList: function () {
        var coupon_list = this.model.get('coupon_list');
        //解决底层滚动
        if (coupon_list.length != 0) {
            $('html,body').css({'overflow': 'hidden', 'height': '100%'});
        }
        this.$couponListDialog = $(artTpl.compile(TPL.couponList)({coupon_list: coupon_list}));
        this.$el.append(this.$couponListDialog);
    },
    //关闭优惠券
    closeCouponList: function () {
        this.$couponListDialog.hide();
        $('html,body').css({'overflow': 'auto', 'height': 'auto'});
    },
    /**
     * 渲染商品及商品分组
     */
    renderItemList: function () {
        // 商品及商品分组
        var self = this;
        var item_list = this.model.get('item_list');
        var $itemContainer = this.$el.find('.items');
        $itemContainer.empty();
        item_list.forEach(function (v, k) {
            if (v.item_list && v.item_list.length) {
                var $group = $(artTpl.compile(TPL.homeItemGroup)(v)).appendTo($itemContainer);
                //这里将每一个item_list传入了UIItemListView，后续又传入了model-cart.js，导致传入的对象
                //被不断进行修改，后续要思考一下这方面的问题
                var itemView = new UIItemListView().init({itemList: v.item_list, now: conf.now});
                itemView.appendTo($group);
            }
        });
    },
    getCouponList: function () {
        this.model.getCouponList();
    },
    //跳转至评价页
    getLocationComment: function (opts) {
        if (opts && opts.order_id) {
            var order_id = opts.order_id;
        } else {
            return;
        }
        app.navigate('#my/order/comment?order_id=' + order_id + '&redirectUrl=/#', {trigger: true, replace: true});
    },
    /**
     * 图片懒加载
     */
    lazyload: function () {
        this.$el.find(".banner-list img").lazyload();
    },
    /**
     * 模块销毁回调
     */
    close: function () {
        this.unbindEvent();
    },
    unbindEvent: function () {
    }
});

module.exports = View;
