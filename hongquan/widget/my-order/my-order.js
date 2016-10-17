var $ = require('home:widget/ui/zepto/zepto.js');
var TPL = require('home:widget/my-order/tpls.js');
var artTpl = require('home:widget/ui/tpl/tpl.js');
var Order = require('home:widget/ui/order/order.js');
require('home:widget/ui/lazyload/lazyload.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Loading = require('home:widget/ui/loading/loading.js');
var app = require('home:widget/ui/router/router.js');

var API_LIST = '/shopping/order/getlist';
var pn = 0;
var rn = 12;
var maxPn = null;
var isEnd = false;

var Action = function(opts) {
    this.$mod = opts.$el;
    this.model = opts.model;
    // this.opts = opts;
    this.init();
};

Action.prototype = {
    init: function() {
        pn = 0;
        maxPn = null;
        isEnd = false;
        this.renderSkeleton();
        this.model.saveStatus();
        isEnd || this.getOrderList();
        this.bindEvent();
    },

    /**
     * 请求订单列表
     * @param {opts} 请求参数 目前只有在切换tag的时候用到了
     * @param {opts.pn}
     */
    getOrderList: function( opts ) {
        var self = this;
        $.ajax({
            url: API_LIST,
            data: {
                status: self.model.get('currentStatus'),
                pn: opts ? opts.pn : pn,
                rn: rn
            },
            dataType: 'json',
            timeout: 20000,
            success: function(data) {
                Loading.hide();
                if (data && data.ret === 0) {
                    maxPn || (maxPn = data.content.total);
                    pn += rn;
                    if (pn >= maxPn) {
                        isEnd = true;
                        self.$loading.addClass('hide');
                    }
                    self.renderList(data.content);
                } else if (data && data.ret === 100021) {
                    Alert.show(data.msg, function() {
                        location.reload();
                    });
                } else {
                    self.renderNoResult();
                }
            },
            error: function() {
                Loading.hide();
                self.renderNoResult();
            }
        });
    },
    pad: function(num, len) {
        len = Math.pow(10, len || 2);
        return num < len ? ((len + num) + "").slice(1) : num + "";
    },
    renderSkeleton: function() {
        var self = this;
        artTpl.helper('date_filter', function(seconds) {
            if (seconds) {
                var date = new Date(seconds * 1000);
                var day = [
                    date.getFullYear(),
                    self.pad(date.getMonth() + 1, 2),
                    self.pad(date.getDate(), 2)
                ];
                var time = [
                    self.pad(date.getHours(), 2),
                    self.pad(date.getMinutes(), 2)
                ];
                return day.join('-') + '&nbsp;&nbsp;' + time.join(':');
            } else {
                return '— —';
            }
        });
        this.$mod.append(artTpl.compile(TPL.content)({}));
        this.$list = this.$mod.find('.list');
        this.$loading = this.$mod.find('.loading');
    },
    renderList: function(data) {
        data.status = this.model.get('currentStatus'); // 数据扩充，补充上当前tab信息
        data.imgScale = conf.dpr >= 2 ? 'small' : 'tiny';
        this.$list.append(artTpl.compile(TPL.order)(data));
        this.$list.find('img').lazyload();
        if (isEnd) {
            this.$list.append(artTpl.compile(TPL.end)({}));
        } else {
            this.$loading.removeClass('hide');
        }
        Loading.hide();
    },
    renderNoResult: function() {
        this.$list.addClass('nodata').append(artTpl.compile(TPL.empty)({}));
    },
    bindEvent: function() {
        var self = this;
        var timer = null;
        self.$mod.on(conf.evClick, '.action', function() {
            var $this = $(this);
            var $shipOrder = $this.parents('.order-info');
            if ($this.hasClass('view-all')) {
                $shipOrder.find('.order-detail.hide').removeClass('hide');
            } else {
                $shipOrder.find('.order-detail-more').addClass('hide');
            }
            $shipOrder.find('.view-all, .view-minor').toggleClass('hide');
        }).on(conf.evClick, '.confirm-pay', function() {
            var $order = $(this).parents('.order-info');
            Order.pay($order.data('order-id'), $order.data('openid'));
        }).on(conf.evClick, '.cancel', function() {
            var $order = $(this).parents('.order-info');
            Order.cancel($order.data('order-id'));
        }).on(conf.evClick, '.reorder', function() {
            var $order = $(this).parents('.order-info');
            Order.reorder($order.data('order-id'));
        });
        $(window).on('scroll.myorder', function() {
            var $this = $(this);
            clearTimeout(timer);
            timer = setTimeout(function() {
                var scrollTop = $this.scrollTop();
                var height = $this.height();
                var scrollHeight = document.body.scrollHeight;

                if (scrollTop + height + 10 > scrollHeight) {
                    isEnd || self.getOrderList();
                }
            }, 100);

        });
        $(window).on('e-order-cancel-success.myorder', function() {
            window.location.reload();
        });
    }
};

var Model = Backbone.Model.extend({
  defaults: {
    status: null,       // 所有的tags
    currentStatus: null // 当前的tag
  },
  initialize: function ( options ) {
    this.currentStatus = ( options && options.status ) ? options.status : 0;
    this.statusArr = [
      { status: '',         status_name: "全部" },
      { status: 'send',     status_name: "待发货" },
      { status: 'receipt',  status_name: "待收货" },
      { status: 'comment',  status_name: "待评价" },
      { status: 'complete', status_name: "已完成" }
    ];
  },
  saveStatus: function () {
    this.set('status', this.statusArr);
  }
});

var View = Backbone.View.extend({
    className: 'mod-my-order header-fixed',
    id: 'myOrderCanvas',
    events: {
      "click .status span": "switchStatus"
    },

    initialize: function (options) {
        $(document.body).append(this.$el);
        Loading.show('数据加载中...');
        this.model = new Model( options );
        this.model.set('currentStatus', options.status || '');
        this.listenTo( this.model, "change:status", this.renderStatus );
        this.action = new Action($.extend({$el: this.$el, model: this.model}, options));
    },

    /**
     * 生成tags标签列表
     */
    renderStatus: function () {
      var status = this.model.get("status");
      var currentStatus = this.model.get('currentStatus');
      var $status = this.$(".status");
      $status.html(artTpl.compile(TPL.status)({status: status}));
      $status.find('[data-status="' + currentStatus + '"]').addClass("active");
    },

    /**
     * 切换tags，并请求数据
     */
    switchStatus: function ( e ) {
      e.preventDefault();
      var $target = $(e.target);
      var status = $target.data('status');
      $target.addClass("active").siblings().removeClass("active");
      this.model.set('currentStatus', status);
      this.$('.list').empty();
      app.navigate("#my/order?status=" + status, {trigger: false, replace: true});
      Loading.show('数据加载中...');
      this.action.getOrderList({pn: 0});
    },

    close: function () {
        Loading.hide();
        this.unbindEvent();
    },
    unbindEvent: function() {
        $(window).off('.myorder');
    }
});

module.exports = View;
