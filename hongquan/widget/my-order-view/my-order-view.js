var $ = require('home:widget/ui/zepto/zepto.js');
var TPL = require('home:widget/my-order-view/tpls.js');
var artTpl = require('home:widget/ui/tpl/tpl.js');
var Order = require('home:widget/ui/order/order.js');
require('home:widget/ui/lazyload/lazyload.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');
// 引入星星评价组件
var Evaluate = require('home:widget/ui/evaluate/evaluate.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
// var app = require('home:widget/ui/router/router.js');
var Log = require('home:widget/ui/log/log.js');

var URL_ORDER_VIEW = '/my/order/view';
var URL_ORDER_COMMENT = '/#my/order/comment';
var INVOICE_CONF = {
  type: {
    1: '纸质发票'
  },
  title: {
    1: '个人',
    2: '公司'
  },
  content: {
    1: '食品',
    2: '日用品'
  }
};
var SCORE_MAP = {
  '商品质量': 'score_quality',
  '送货速度': 'score_speed',
  '配送服务': 'score_service'
};
var filters = {
  date: function (seconds) {
      function pad(num, len) {
          len = Math.pow(10, len || 2);
          return num < len ? ((len + num) + "").slice(1) : num + "";
      }
      if (seconds) {
          var date = new Date(seconds * 1000);
          var day = [
              date.getFullYear(),
              pad(date.getMonth() + 1, 2),
              pad(date.getDate(), 2)
          ];
          var time = [
              pad(date.getHours(), 2),
              pad(date.getMinutes(), 2)
          ];
          return day.join('-') + '&nbsp;&nbsp;' + time.join(':');
      } else {
          return '— —';
      }
  },
  invoice_type: function(key) {
    return INVOICE_CONF.type[key] || '';
  },
  title_type: function(key, company) {
    return key == '1' ? INVOICE_CONF.title[key] || '' : company;
  },
  content_type: function(key) {
    return INVOICE_CONF.content[key] || '';
  }/*,
  getPayWay: function() {
    return navigator.userAgent.toLowerCase().match(/MicroMessenger/i) == "micromessenger" ? "微信在线支付" : "支付宝在线支付";
  }*/
};


var formater = {
    //将有效条目进行计数,方便显隐
    counter: function (data) {
        //一个是detail,另一个是赠品/套餐
        for(var i = 0, length = data.order_list.length; i < length; i++) {
            var orders = data.order_list[i];
            var counter = 0;
            for(var n = 0, len=orders.detail_list.length; n < len; n++) {
                var detail = orders.detail_list[n];
                counter++;
                detail.counter = counter;   //列表
                if(detail.give_list) {
                    for(var g = 0, l1 = detail.give_list.length; g < l1; g++) {
                        var give = detail.give_list[g];
                        counter++;
                        give.counter = counter; //赠品
                        if(g == 0) {
                            detail.give_list.counter = counter;  //第一个的counter
                        }
                    }
                }
                if(detail.package_info) {
                    for(var p= 0, l2=detail.package_info.item_list.length; p < l2; p++) {
                        var packageItem = detail.package_info.item_list[p];
                        counter++;
                        packageItem.counter = counter;  //套餐
                        if(p == 0) {
                            detail.package_info.counter = counter;  //第一个的counter
                        }
                    }
                }
            }
            orders.detail_list.counter = counter;  //total
        }

    }
};

var Action = function (opts) {
    this.$mod = $('.mod-my-order-view');
    this.opts = opts;
    this.star;
    this.returnValue = {
      star: {},     // 评分内容
      _tags: [],
      tags: "",
      content: ""      // 输入的内容
    };  // 评价模块，需要返回的评价内容
    this.init();
};

Action.prototype = {
    init: function () {
        this.render();
        this.bindEvent();
        //TODO 这个是同步输出的页面,这里打log
        Log.send({
            action: 'show',
            pid: '110017',
            detail: {
                order_id: this.opts.data.order_info.order_id
            }
        });
    },
    render: function () {
        var self = this;
        $.each(filters, function(k, v) {
          artTpl.helper(k + '_filter', v);
        });
        // artTpl.helper('date_filter', filters.date);
        // artTpl.helper('invoice_type_filter', filters.invoice_type);
        // artTpl.helper('title_type_filter', filters.title_type);
        // artTpl.helper('content_type_filter', filters.content_type);
        // artTpl.helper("getPayWay", filters.getPayWay);
        $.extend(this.opts.data, {
            type: 'view',
            imgScale: conf.dpr >= 2 ? 'small' : 'tiny'
        });
        this.opts.data.type = 'view';

        formater.counter(this.opts.data);

        $.extend(this.opts.data, {
            pay_tips: this.opts.data.pay_tips,  //增加优惠策略
            itemList: artTpl.compile(TPL.itemList)(this.opts.data),
            backUrl: '/#my/order',
            title: '订单详情'
        });
        this.$mod.append(artTpl.compile(TPL.content)(this.opts.data));
        this.$mod.find('img').lazyload();
    },
    bindEvent: function () {
        var self = this;
        self.$mod
        // .on('tap', '.action', function () {
        //     var $this = $(this);
        //     var $shipOrder = $this.parents('.item-list');
        //     if ($this.hasClass('view-all')) {
        //         $shipOrder.find('.item-info.hide').removeClass('hide');
        //     } else {
        //         $shipOrder.find('.item-info-more').addClass('hide');
        //     }
        //     $shipOrder.find('.view-all, .view-minor').toggleClass('hide');
        // })
        .on('click', '.confirm-pay', function () {
            Order.pay($(this).data('order-id'), self.opts.openId, function () {
                Alert.show("支付成功!");
                setTimeout(function() {
                    //alert(URL_ORDER_COMMENT + '?order_id=' + self.opts.orderId);
                    //window.location.reload();
                    window.location.href = location.origin + URL_ORDER_COMMENT + '?order_id=' + self.opts.orderId;
                }, 500);
            });
        }).on(conf.evClick, '.cancel', function () {
            Order.cancel(self.opts.orderId);
        }).on(conf.evTouchEnd, '.reorder', function (e) {
            Order.reorder(self.opts.orderId);
            e.preventDefault();
        }).on(conf.evClick, '.add', function () {
            Storage.setItem('add-order-id', self.opts.orderId);
            window.location.href = '/#category';
        });

        $(window).on('e-order-cancel-success.myorderview', function () {
            //app.navigate(URL_ORDER_COMMENT + '?order_id=' + self.opts.orderId, {trigger: true, replace: false});
            window.location.reload();
        });
    }
};

// var Model = Backbone.Model.extend({
//   url: '/my/order/view',
//   defaults: {data: null},
//   initialize: function(options) {
//     var self = this;
//     self.fetch({
//       data: {format: 'json', order_id: options.id},
//       dataType: 'json',
//       success: function(_, data) {
//         if (data && data.ret === 0) {
//           self.set({data: data.content});
//         }
//       }
//     });
//   }
// });

// var View = Backbone.View.extend({
//     model: null,
//     className: 'mod-my-order-view',
//     id: 'myOrderViewCanvas',
//     initialize: function (options) {
//         this.model = new Model(options);
//         this.listenTo(this.model, 'change:data', function() {
//           new Action({
//             $el: this.$el,
//             data: this.model.get('data')
//           });
//         });
//         $(document.body).append(this.$el);
//     },
//     close: function () {
//         this.unbindEvent();
//     },
//     unbindEvent: function() {
//         $(window).off('.myorderview');
//     }
// });

module.exports = Action;
