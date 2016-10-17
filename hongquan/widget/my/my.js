var $ = require('home:widget/ui/zepto/zepto.js');
var artTpl = require('home:widget/ui/tpl/tpl.js');
var tpls = require('home:widget/my/tpls.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var API_LOGOUT = '/account/user/ajaxlogout';
var MSG_CONFIRM = '确认退出登录？';
var URL_LOGIN = '/account/user/login';
var Confirm = require('home:widget/ui/confirm/confirm.js');
var Alert = require('home:widget/ui/alert/alert.js');
var app = require('home:widget/ui/router/router.js');

var navData = [
    [
        { 'name': '全部订单', 'icon': 'order', 'url': '/#my/order', tips: '', class: 'order-all' },
        { 'name': '数据加载中...', class: 'orders-num' },  // 生成订单状态容器
        { 'name': '地址管理', 'icon': 'address', 'url': '/#my/address' },
        { 'name': '优惠券', 'icon': 'coupon', 'url': '/#my/coupon?type=1&is_usable=1' },
        { 'name': '现金券', 'icon': 'cash-coupon', 'url': '/#my/coupon?type=2&is_usable=1' },
        { 'name': '收藏', 'icon': 'collect', 'url': '/#my/collection' }
    ],
    [
        { 'name': '关于链商', 'icon': 'about', 'url': '/my/company/about' }
    ]
];
var Model = Backbone.Model.extend({
    url: '/my?format=json',
    defaults: function () {
        return {
            account: '',
            nav: null,
            status: null,
            errMsg: null
        };
    },
    ERROR_CODE: {
      0: '返回数据格式错误',
      1: '数据返回异常',
      2: '数据请求失败'
    },
    initialize: function() {
        var self = this;
        self.fetch({
            dataType: 'json',
            timeout: 20000,
            cache: false,
            success: function (_, response) {
                if (response && response.ret === 0) {
                    //补充“优惠信息”
                    navData[0][0].tips = response.content.pay_tips;    //支付的tips
                    self.set({
                      'account': response.user_data.name,
                      nav: navData,
                    });
                }
            },
            error: function (model, response, options) {
                if (options.textStatus === "parsererror") {
                    Alert.show("您需要登录!", function() {
                        location.reload();
                    });
                }
            }
        });
    },

    // 获取订单状态的信息
    getOrdersCount: function () {
      this.fetch({
        url: '/shopping/order/getlistcount',
        dataType: 'json',
        success: function ( _, res ) {
          if ( res && res.ret === 0 ) {
            _.set('status', _.formatData( res.content ));
          } else {
            _.set('errMsg', _.ERROR_CODE[1] );
          }
        },
        error: function ( _, err ) {
          _.set('errMsg', _.ERROR_CODE[2] );
        }
      });
    },

    /**
     * 格式化数据，后端返回的订单信息是两个字段，合并到一个
     */
    formatData: function ( data ) {
      if ( !data || !data.config || !data.order_counts ) return;
      var newData = [];
      var tags = data.config.tag;
      var count = data.order_counts;
      for (var i in tags) {
        if (tags.hasOwnProperty(i)) {
          newData.push({status_name:tags[i], count: count[i], status: i});
        }
      }
      return newData;
    }
});
var View = Backbone.View.extend({
    className: 'mod-my',
    events: {
      'click .order-status span': 'enterOriderList',
      'click .logout': 'logout'
    },
    initialize: function() {
        this.renderUI();
        this.model = new Model();
        this.listenTo(this.model, 'change:account', this.renderMain);
        this.listenTo(this.model, 'change:status', this.renderStatus);
        this.listenTo(this.model, 'change:errMsg', this.showErr);
    },

    // 生成列表
    renderMain: function () {
      var that = this;
      var opts = {
        $el: that.$el,
        account: that.model.get('account'),
        nav: that.model.get('nav'),
        redirectUrl: encodeURIComponent('/#my')
      };
      this.$('.main').html(artTpl.compile(tpls.main)(opts));
      this.model.getOrdersCount();
    },

    // 先生成界面
    renderUI: function () {
      this.$el.html(artTpl.compile(tpls.skeleton)({}));
      $(document.body).append(this.$el);
      $(document).trigger("e-main-nav-change", "my");
    },

    /**
     * 生成订单数量部分
     */
    renderStatus: function () {
      var status = this.model.get("status") || [];
      var $order = this.$(".orders-num");
      if ( status.length > 0 ) {
        $order.html(artTpl.compile(tpls.orderStatus)({status: status}));
      }
    },

    /**
     * 进入订单列表
     */
    enterOriderList: function ( e ) {
      var $target = $(e.target);
      if ( $target[0].nodeName.toLowerCase() === 'span' ) {
        var status = $target.data('status');
        $target.addClass("active").siblings().removeClass('active');
        app.navigate("#my/order?status=" + status, {trigger: true, replace: true});
      }
    },

    // 退出
    logout: function () {
      var that = this;
      Confirm.show(MSG_CONFIRM, function () {
        that._logout();
      });
    },

    _logout: function () {
      $.ajax({
        url: API_LOGOUT,
        dataType: 'json',
        success: function (data) {
            if (data && data.ret === 0) {
                window.location.href = URL_LOGIN;
            } else {

            }
        }
      });
    },

    /**
     * 展示错误信息
     */
    showErr: function () {
      var errMsg = this.model.get('errMsg');
      Alert.show( errMsg );
    }
});

module.exports = View;
