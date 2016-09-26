var $ = require('home:widget/ui/zepto/zepto.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var artTpl = require('home:widget/ui/tpl/tpl.js');
var TPL = require('home:widget/coupon/tpls.js');
var Order = require('home:widget/ui/order/order.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Confirm = require('home:widget/ui/confirm/confirm.js');
var Log = require('home:widget/ui/log/log.js');

//过滤器,用于在tpl.js中处理数据
var filters = {
    //适用范围处理
    desc_filter: function(desc) {
        return ~desc.indexOf(':') ? $.trim(desc.split(':')[1]) : desc;
    },
    //金额处理
    value_filter: function(value) {
        value = parseInt(value, 10);
        return isNaN(value) ? '' : value;
    },
    //时间处理
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

//现金券/优惠券对应的name,用于区分显示
var TYPE_MAP = {
    '1':['优惠券','couponId'],
    '2':['现金券','cashCouponId']
};
var URL = '/my/coupon/getlist';

var Model = Backbone.Model.extend({
    defaults: function () {
        return {
            couponList: null,      //优惠券/现金券列表
            total: 0,           //优惠券/现金券数量
            currentCoupon: null,   //添加优惠券/现金券时, 当前现金券/优惠券信息
            selectFlag: false,      //优惠券/现金券是否可选
            selectId: null,        //选择的优惠券/现金券ID
            index: 0,              //一次加载优惠券/现金券的起始值
        };
    },
    /**
     * 初始化函数,new Model时会自动执行
     * @param option  object
     * @param option.type  number  类型(优惠券 or 现金券)
     * @param option.is_usable  number  是否可用标识, 1代表可用,2代表失效
     */
    initialize: function (option) {
        var opts = this.formatData(option);
        //用于控制 现金券 or 优惠券
        this.type = opts.type;
        //用于控制 可用券 or 失效券
        this.is_usable = opts.is_usable;
        // 请求 优惠券/现金券列表的接口
        this.url = URL + '?type=' + this.type + '&is_usable=' + this.is_usable;
    },

    /**
     * 处理option数据
     * @param option  object  (必须)需要格式化的数据
     * @returns {{type: number, is_usable: number}}
     */
    formatData: function (option) {
        var type = option && option.type ? option.type : 1;
        var is_usable = option && option.is_usable ? option.is_usable : 1;
        return {
            type: type,
            is_usable: is_usable
        };
    },

    url: this.url,
    /**
     * 获取现金券/优惠券列表
     * @param selectFlag  boolean  (可选)优惠券/现金券是否可选   适用场景: 结算页选择现金券/优惠券
     * @param couponId    string   (可选)当前选中优惠券的Id      适用场景: 结算页选择现金券/优惠券
     *
     */
    getList: function ( selectFlag, couponId ) {
        var that = this;
        var chooseData = {};          //选择优惠券时需要的参数,params.choose boolean 是否可选; params.selectId string 选中的券的id
        var couponData = that.get('couponList') || [];                //获取当前券的列表
        var couponDataLen = couponData.length;                        //获取当前券的列表长度
        //如果当前为结算页的选择优惠券/现金券页面
        if ( selectFlag ) {
            chooseData.selectFlag = selectFlag;
        }
        //如果有选中券
        if ( couponId ){
            chooseData.selectId = couponId;
        }
        //请求参数(分页请求)
        var params = formatPostParam();

        that.fetch({
            type: 'POST',
            data: params,
            dataType: 'json',
            timeout: 20000,
            success: function (_, response) {
                if (response && response.ret === 0) {
                    var content = response.content;
                    that.set( $.extend( chooseData, {
                        couponList: couponData.concat( content.coupon_list ),
                        total: content.total,
                        index: couponDataLen - 1,
                        unable_total: content.unable_total
                    }));
                } else {
                    that.set( $.extend( chooseData, { couponList: [] }) );
                    if (response && response.ret === 100021) {
                        Alert.show(response.msg, function() {
                            location.reload();
                        });
                    }
                }
            },
            error: function () {
                that.set( $.extend( chooseData, { couponList: [] }));
                Alert.show("网络不太好");
            }
        });
        //格式化 请求参数
        function formatPostParam() {
            var data = {};
            var pn = couponDataLen ? couponDataLen : 0;
            var rn = 12;
            data = {
                pn: pn,
                rn: rn
            };
            //如果当前为结算页的选择优惠券/现金券页
            if ( selectFlag ) {
                that.formatSelectedData( data );
            }
            return data;
        }
    },

    /**
     * 获取当前购物车分类下的购物车中商品信息 { 商品的sku_id, 商品的数量qty }列表
     * 用于结算选择优惠券时传给后端获得可用优惠券
     * @param opts.currentTab  number  (必须)购物车分类(常温/冻品)
     * @returns {Array}
     */
    getSkuList: function(opts) {
        //购物车中的所有商品的信息列表
        var cartSkuList = Storage.getItem('model-cart-buy-counter');
        // 筛选出当前购物车分类(常温or冻品)下的商品信息列表
        var skuList = $.map( cartSkuList, function( value ) {
            if ( value.storageTypeId == opts.currentTab && value.selected == '1') {
                return {
                    sku_id: value.skuId,
                    qty: value.count
                };
            }
        });
        return skuList;
    },
    /**
     * 格式化 数据 添加tab 和sku_list属性
     * @param data
     */
    formatSelectedData: function ( data ) {
        var currentTab = Storage.getItem("model-cart-current-tab"); //取出当前购物车的tab值(即,是常温or冻品)
        var skuList = this.getSkuList( {currentTab: currentTab} );
        data.tab = currentTab;
        data.sku_list = JSON.stringify( skuList );
    },
    /**
     * 添加优惠券/现金券( 兑换现金券/优惠券 )
     * @param code  string  兑换码
     */
    add: function ( code ) {
        var that = this;
        //请求参数
        var params = {
            coupon_code: code,
            type: that.type
        };
        //当前购物车类型tab
        if ( that.get('selectFlag') ) {
            that.formatSelectedData( params );
        }
        $.ajax({
            url: '/my/coupon/validate',
            type: 'POST',
            dataType: 'json',
            data: params,
            success: function( response ) {
                if ( response && response.ret === 0 ) {
                    Alert.show('优惠券添加成功！');
                    var list = that.get('couponList');
                    var currentCoupon = response.content.coupon_info;
                    list.unshift( currentCoupon );
                    that.set({
                        list: list,
                        currentCoupon: currentCoupon,
                        index: that.get('index') + 1
                    });
                } else if ( response && response.ret === 100021 ) {
                    Alert.show( response.msg, function() {
                        location.reload();
                    });
                } else {
                    Alert.show( response.msg );
                }
            }
        });
    },
    /**
     * 获得渲染页面需要的数据
     * @returns {{start: number, list: *, choose: *, selectId: *, type: *, unableUrl: string, unable_total: *}}
     */
    getRenderData: function ( initFlag ) {
        var start =  initFlag ? 0 : this.get('index') + 1; //开始位置
        var list = this.get('couponList').slice( start ); //需要渲染的优惠券列表
        var type = this.type ? TYPE_MAP[this.type][0] : TYPE_MAP['1'][0]; //显示"优惠券"or"现金券"
        var data = {
            start: start,
            list: list,
            choose: this.get('selectFlag'),
            selectId: this.get('selectId'),
            type: type,
            unable_total: this.get('unable_total')    //失效券的数量
        }
        return data;
    },
    /**
     * 上报数据
     */
    logSend: function () {
        var that = this;
        var data = that.getRenderData();
        if ( that.get('selectFlag') ) {
            //获取当前优惠券
            var couponIds = $.map( data.list, function( value ){
                return {
                    coupon_id: value.coupon_id
                };
            });
            Log.send({
                action: 'show',
                pid: Log.pid,
                detail: {
                    coupon_list:couponIds,
                    extend:''
                },
                ref: {
                    param: 'type=' + that.type
                }
            });
        }
    },
});

var View = Backbone.View.extend({
    model: null,
    $mod: null,
    className: 'mod-coupon header-fixed',
    events: {
        'click .add': 'actExchangeCoupon',                           //兑换现金券/优惠券
        'change input[ name = "couponRadio" ]': 'actConfirmSelect',  //选中现金券/优惠券
        'click .unable': 'actShowUnableCoupon',                      //显示失效券
        'click .i-back': 'actBack'                                   //返回
    },

    initialize: function ( options ) {
        artTpl.helper('desc_filter', filters.desc_filter);
        artTpl.helper('value_filter', filters.value_filter);
        artTpl.helper('date_filter', filters.date_filter);

        if( options ){
            this.model = new Model(options);
        }else {
            this.model = new Model();
        }
        //渲染容器
        $(document.body).append( this.$el );

        this.listenTo( this.model, 'sync', this.render );
        this.listenTo( this.model, 'change:currentCoupon', this.appendItem );

        if ( options && options.id ) {
            this.model.getList( true, options.id );
        } else {
            this.model.getList();
        }
        this.bindEvents();
    },
    /**
     * 初始化页面骨架, 并获得常用dom对象
     * @param data  jquery   渲染页面数据
     */
    initSkeleton: function ( data ) {
        this.$el.html( artTpl.compile( TPL.content )( data ) );
        this.$mod = this.$el.find('.list');
        this.$loading = this.$el.find('.loading');
        this.$end = this.$el.find('.end');
        this.showNextPage(true);
    },
    /**
     * 渲染页面
     */
    render: function () {
        var that = this;
        //是否初始化页面(当有$mod时,页面不为初始化页面);
        var initFlag = !( that.$mod && that.$mod.length );
        var data = that.model.getRenderData( initFlag );
        if ( initFlag ) {
            that.initSkeleton( data );
        }
        this.$mod.append( artTpl.compile( TPL.sublist )( data ) );

        that.setOldChoice();
        //数据上报
        this.model.logSend();
    },
    /**
     * 兑换优惠券/现金券
     */
    actExchangeCoupon: function() {
        var that = this;
        Alert.prompt('请输入优惠码', function ( code ) {
          if (code && $.trim( code ).length) {
              that.model.add(code);
          }
        });
    },
    /**
     *追加优惠券/现金券列表
     */
    appendItem: function() {
        var choose = this.model.get('selectFlag');
        var total = this.$mod.find('.citem').length;
        var html = artTpl.compile( TPL.item )({
            coupon: this.model.get('couponList')[0],
            choose: choose,
            start:  total || 0,
            index: 0,
            selectId: this.model.get('selectId')
        });
        //特殊处理, 当当前没有优惠券/现金券,兑换优惠券/现金券,刷新页面
        //主要原因是没有优惠券/现金券时,兑换优惠券/现金券没有.list对象,无法插入
        if( this.$mod.length == 0 ){
            location.reload();
        }
        if ( choose ) {
            this.$mod.find('.no-citem').after(html);
        } else {
            this.$mod.prepend(html);
        }
    },
    /**
     * 保存上一次选择的对象
     */
    setOldChoice: function() {
        //上一次选择的对象
        this.$oldChoice = this.$mod.find('input[name= "couponRadio"][checked = "checked"]');
    },
    /**
     * 勾选优惠券/现金券
     * @param e
     */
    actConfirmSelect: function( e ) {
        var that = this;
        var $target = $(e.target);
        if ( $target.hasClass('conflict') ) {
            Confirm.show('当前优惠券与订单折扣不能同时使用，确认使用优惠券？', function() {
                that.selectCoupon( $target );
            }, function() {
                that.$mod.find('input[ name= "couponRadio" ]').prop('checked', false);
                $oldChoice.prop('checked', true);
            });
        } else {
            that.selectCoupon( $target );
        }
    },
    /**
     * 选择现金券/优惠券
     * @param target  zepto object  当前选择的元素
     */
    selectCoupon: function( target ) {
        target.prop('checked', true);
        var dataId = target.parents('.citem').data('id');
        this.model.set('selectId', dataId);
        this.createOrder(dataId);
    },

    /**
     * 兼容处理现金券\优惠券,用于创建对应id(couponId\cashCouponId)
     * @param couponId   现金券id/优惠券id
     */
    createOrder: function( couponId ) {
        var couponType = TYPE_MAP[this.model.type][1];  //couponId or cashCouponId
        var opts = {};
        opts[couponType] = couponId;
        Order.create(opts);
    },
    /**
     * 显示下一页 (优惠券列表为分页显示)
     * @param initFlag   boolean  是否是初始化页面
     */
    showNextPage: function( initFlag ) {
        if ( this.model.get('couponList').length < this.model.get('total') ) {
            this.$loading.show();
            //如果是初始化页面, 阻止再次请求,只显示一页;反之,再次请求
            if( !initFlag ){
                this.model.getList( this.model.get('selectFlag'), this.model.get('selectId') );
            }
        } else {
            this.$loading.hide();
            this.$end.show();
        }
    },

    //显示失效券
    actShowUnableCoupon: function(e) {
        e.preventDefault();
        var that = this;
        that.model.set('couponList', null);
        that.model.url = URL + '?type=' + that.model.type + '&is_usable=2';
        that.model.getList();
        that.$el.find('.unable').remove();
    },
    /**
     *返回
     */
    actBack: function() {
        if ( this.model.get('selectFlag') ) {
            window.location.href = '/#shopping/order';
        } else {
            history.go(-1);
        }
    },

    bindEvents: function() {
        var self = this;
        var timer = null;
        $(window).on('scroll.coupon', function() {
            var $this = $(this);
            clearTimeout(timer);
            timer = setTimeout(function() {
                var scrollTop = $this.scrollTop();
                var height = $this.height();
                var scrollHeight = document.body.scrollHeight;
                if (scrollTop + height + 10 > scrollHeight) {
                    self.showNextPage();
                }
            }, 100);
        });
    },

    close: function() {
        this.unbindEvent();
    },

    unbindEvent: function() {
        $(window).off('.coupon');
    }
});

module.exports = View;
