var $ = require('home:widget/ui/zepto/zepto.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var artTpl = require('home:widget/ui/tpl/tpl.js');
var TPL = require('home:widget/coupon/tpls.js');
var Order = require('home:widget/ui/order/order.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Confirm = require('home:widget/ui/confirm/confirm.js');
var Log = require('home:widget/ui/log/log.js');

var filters = {
    desc_filter: function(desc) {
        return ~desc.indexOf(':') ? $.trim(desc.split(':')[1]) : desc;
    },
    value_filter: function(value) {
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

var TYPE_MAP = {
    '1':['优惠券','couponId'],
    '2':['现金券','cashCouponId']
};

var Model = Backbone.Model.extend({
    defaults: function () {
        return {
            list: null,
            total: null,
            current: null,
            selectFlag: null,
            selectId: null,
            index: 0,
            in_unable: false,   //是否在失效券内
        };
    },
    initialize: function (option) {
        var type = option && option.type ? option.type : 1;
        var is_usable = option && option.is_usable ? option.is_usable : 1;
        this.url = '/my/coupon/getlist?type=' + type + '&is_usable=' + is_usable;
        //用于控制现金券 or 优惠券
        this.type = type;
        //用于控制可用券 or 失效券
        this.is_usable = is_usable;
    },
    url: this.url,
    getSkuList: function(opts) {
        var sku_list = [];
        $.each(Storage.getItem('model-cart-buy-counter'), function(k, v) {
            if ( opts && opts.currentTab && v.storageTypeId == opts.currentTab && v.selected == '1') {
              sku_list.push({
                  sku_id: v.skuId,
                  qty: v.count
              });
            }
        });
        return sku_list;
    },
    getList: function (selectFlag, couponId) {
        var self = this;
        var params = {};
        var currentTab = Storage.getItem("model-cart-current-tab");

        var couponData = self.get('list') || [];
        if (selectFlag)
            params.choose = selectFlag;
            this.set('selectFlag', selectFlag);
        if (couponId)
            params.selectId = couponId;
            this.set('selectId', couponId);
        var _data = {
            pn: couponData.length ? couponData.length : 0,
            rn: 12,
        };
        if (selectFlag) {
            _data.tab = currentTab;
            _data.sku_list = JSON.stringify(self.getSkuList( {currentTab: currentTab} ));
            // _data.coupon_ids = JSON.stringify(Storage.getItem('couponIds'));
            //Storage.removeItem('couponIds');
        }
        //  else {
        //     _data = {};
        // }
        self.fetch({
            type: 'POST',
            data: _data,
            dataType: 'json',
            timeout: 20000,
            success: function (_, response) {
                if (response && response.ret === 0) {
                    self.set($.extend(params, {
                        list: couponData.concat(response.content.coupon_list),
                        total: response.content.total,
                        index: couponData.length - 1,
                        unable_total: response.content.unable_total
                    }));
                } else {
                    self.set($.extend(params, {list: []}));
                    if (response && response.ret === 100021) {
                        Alert.show(response.msg, function() {
                            location.reload();
                        });
                    }
                }
                // Loading.hide();
            },
            error: function () {
                // Loading.hide();
                self.set($.extend(params, {list: []}));
            }
        });
    },
    add: function (code) {
        var self = this;
        var type = this.type?this.type:'';
        var params = {coupon_code: code,type: type};
        var currentTab = Storage.getItem("model-cart-current-tab");
        if (self.get('choose')) {
            params['sku_list'] = JSON.stringify(self.getSkuList( {currentTab: currentTab} ));
            params['tab'] = currentTab;
        }
        $.ajax({
            url: '/my/coupon/validate',
            type: 'POST',
            dataType: 'json',
            data: params,
            success: function(data) {
                if (data && data.ret === 0) {
                    Alert.show('优惠券添加成功！');
                    var list = self.get('list');
                    var current = data.content.coupon_info;
                    current.id = current.id + self.get('index');
                    list.unshift(current);
                    self.set({list: list, current: current, index: self.get('index') + 1});
                } else if (data && data.ret === 100021) {
                    Alert.show(data.msg, function() {
                        location.reload();
                    });
                } else {
                    Alert.show(data.msg);
                }
            }
        });
    }
});

var View = Backbone.View.extend({
    model: null,

    $mod: null,

    className: 'mod-coupon header-fixed',

    events: {
        'click .add': 'add',
        'click .i-back': 'back',
        'click .citem': 'preSelect',
        'click .coupon-radio': 'confirmSelect',
        'click .unable': 'showUnableCoupon',
    },

    initialize: function (options) {
        artTpl.helper('desc_filter', filters.desc_filter);
        artTpl.helper('value_filter', filters.value_filter);
        artTpl.helper('date_filter', filters.date_filter);
        if(options){
            this.model = new Model(options);
        }else {
            this.model = new Model();
        }
        $(document.body).append(this.$el);
        this.listenTo(this.model, 'sync', this.render);
        this.listenTo(this.model, 'change:current', this.appendItem);
        if (options&&options.id) {
            this.model.getList(true, options.id);
        } else {
            this.model.getList();
        }
        this.bindEvents();
    },

    render: function () {
        // Loading.hide();
        var that = this;
        var initFlag = this.$mod && this.$mod.length;
        var data = {
            start: initFlag ? this.model.get('index') + 1 : 0,
            list: this.model.get('list').slice(initFlag ? this.model.get('index') + 1 : 0),
            choose: this.model.get('choose'),
            selectId: this.model.get('selectId'),
            type: this.model.type ? TYPE_MAP[this.model.type][0] : TYPE_MAP['1'][0],
            is_usable: this.model.is_usable,
            unableUrl: '/#my/coupon/getlist?type=' + this.model.type + '&is_usable=2',
            unable_total: this.model.get('unable_total'),
            in_unable: this.model.get('in_unable')
        };

        if (!initFlag) {
            this.$el.html(artTpl.compile(TPL.content)(data));
            this.$mod = this.$el.find('.list');
            this.$loading = this.$el.find('.loading');
            this.$end = this.$el.find('.end');
            this.actionAfterLoad();
        }

        this.$mod.append(artTpl.compile(TPL.sublist)(data));

        var couponIds = $.map(data.list,function(value){
           return {coupon_id: value.coupon_id}
        });

        if (this.model.get('choose')) {
            Log.send({
                action: 'show',
                pid: Log.pid,
                detail: {
                    coupon_list:couponIds,
                    extend:''
                },
                ref: {
                    param: 'type=' + that.model.type
                }
            });
        }
    },

    add: function() {
        var self = this;
        Alert.prompt('请输入优惠码', function ( code ) {
          if (code && $.trim(code).length) {
              self.model.add(code);
          }
        });
        // var code = prompt('请输入优惠码');
        // if (code && $.trim(code).length) {
        //     this.model.add(code);
        // }
    },

    appendItem: function() {
        var choose = this.model.get('choose');
        var total = this.$mod.find('.citem').length;
        var html = artTpl.compile(TPL.item)({
            coupon: this.model.get('list')[0],
            choose: choose,
            start:  total || 0,
            index: 0,
            selectId: this.model.get('selectId')
        });
        if(this.$mod.length==0){
            location.reload();
        }
        if (choose) {
            this.$mod.find('.no-citem').after(html);
        } else {
            this.$mod.prepend(html);
        }
    },

    preSelect: function() {
        this.$oldChoice = this.$mod.find('.cur');
    },

    confirmSelect: function(e) {
        var self = this;
        var $target = $(e.target).parents('.weui_check_label');

        if ($target.hasClass('conflict')) {
            Confirm.show('当前优惠券与订单折扣不能同时使用，确认使用优惠券？', function() {
                self.changeSelect($target);
            }, function() {
                self.$mod.find('.weui_check_label').removeClass('cur').prop('checked', false);
                self.$oldChoice.addClass('cur').find('.coupon-radio').prop('checked', true);
            });
        } else {
            self.changeSelect($target);
        }
    },


    /**
     * 兼容处理现金券\优惠券,用于创建对应id(couponId\cashCouponId)
     * @param couponId   现金券id/优惠券id
     */
    createOrder: function(couponId) {
        var couponType = TYPE_MAP[this.model.type][1];  //couponId or cashCouponId
        var opts = {};
        opts[couponType] = couponId;
        Order.create(opts);
    },

    changeSelect: function($target) {
        this.$mod.find('.weui_check_label').removeClass('cur');
        $target.addClass('cur');
        var dataId = $target.data('id');
        this.model.set('selectId', dataId);
        this.createOrder(dataId);
    },

    back: function() {
        if (this.model.get('choose')) {
            //this.createOrder(this.model.get('selectId'));
            window.location.href = '/#shopping/order';
        } else {
            //window.location.href = '/#my';
            history.go(-1);
        }

    },

    actionAfterLoad: function() {
        if (this.model.get('list').length < this.model.get('total')) {
            this.$loading.show();
            this.model.getList(this.model.get('selectFlag'), this.model.get('selectId'));
        } else {
            this.$loading.hide();
            this.$end.show();
        }
    },
    //显示失效券
    showUnableCoupon: function(e) {
        e.preventDefault();
        var that = this;
        that.model.set('list', null);
        that.model.url = '/my/coupon/getlist?type=' + that.model.type + '&is_usable=2';
        that.model.set('in_unable', true);
        that.model.getList();
        that.$el.find('.unable').remove();
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
                    self.actionAfterLoad();
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
