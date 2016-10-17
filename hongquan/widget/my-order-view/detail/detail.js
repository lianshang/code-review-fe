/**
 * @require ../my-order-view.less
 * @type {[type]}
 */
var $ = require('home:widget/ui/zepto/zepto.js');
var TPL = require('home:widget/my-order-view/tpls.js');
var artTpl = require('home:widget/ui/tpl/tpl.js');
require('home:widget/ui/lazyload/lazyload.js');
// 引入星星评价组件
var Evaluate = require('home:widget/ui/evaluate/evaluate.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');

var URL_ORDER_VIEW = '/my/order/view';
var MAP = {
    '总计': 'discounted_money',
    '满减': 'coupon_money',
    '优惠券': 'ticket_coupon_money',
    '应付': 'money',
    '折扣优惠': 'discount_coupon_money'
};

var SCORE_MAP = {
  'score_quality': '商品质量',
  'score_speed': '送货速度',
  'score_service': '配送服务'
};

var Action = function (opts) {
    this.$mod = opts.$el;
    this.opts = opts.content;
    this.extend = opts.content.extend_status;
    this.init();
};

Action.prototype = {
    init: function () {
        this.opts.data = this.formatData();
        this.render();
        // this.bindEvent();
    },
    formatData: function() {
        var newData = [];

        console.log( this.opts );
        $.each(this.opts.detail_list, function(k, v) {
            var tmp = {};
            //$.each(v.footer, function(i, j) {
            //    if (~j.key.indexOf('(')) {
            //        tmp['discount_ratio'] = j.key;
            //    }
            //    tmp[MAP[j.key.replace(/\(.*\)/, '')]] = j.value;
            //});
            newData.push({
                head_info: {
                    sku_count: v.title.value,
                    order_name: v.title.key
                    //, discounted_money: tmp.discounted_money,
                    //ticket_coupon_money: tmp.ticket_coupon_money,
                    //coupon_money: tmp.coupon_money,
                    //money: tmp.money,
                    //discount_coupon_money: tmp.discount_coupon_money,
                    //discount_ratio: tmp.discount_ratio
                },
                footer: v.footer,
                detail_list: v.body
            });
        });
        return {
            //backUrl: URL_ORDER_VIEW + '?order_id=' + this.opts.order_id,
            backUrl: 'javascipt:;',
            title: '配送详情',
            order_list: newData
        };
    },
    render: function () {
        var self = this;
        artTpl.helper('date_filter', function (seconds) {
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

        this.opts.data.imgScale = conf.dpr >= 2 ? 'small' : 'tiny';
        this.$mod.append(artTpl.compile(TPL.content)($.extend({
            itemList: artTpl.compile(TPL.itemList)(this.opts.data)
        }, this.opts.data)));
        this.$mod.find('img').lazyload();

        // 渲染小星星评价
        this._getComment();
    },

    // 获取评价信息
    _getComment: function () {
      var self = this;
      if ( parseInt(self.opts.order_id) ) {
        // 获取评价信息
        $.ajax({
          url: '/shopping/comment/getinfo',
          data: 'order_id=' + self.opts.order_id,
          dateType: 'json',
          success: function(data) {
            if (data && data.ret === 0) {
              var tags = data.content.comment_info;
              if (tags.score_quality && tags.score_speed && tags.score_service) {
                self._renderComment( tags );
                self.$mod.find("#myEvaluate").show();
              } else {
                self._renderNoComment();
              }
            } else {
              Alert.show(data.msg, function() {
                if (data && data.ret === 100021) {
                  location.reload();
                }
              });
            }
          }
        });
      } else {
        self._renderNoComment();
      }
    },
    // 渲染评论内容，实例化星星组件
    _renderComment: function ( tags ) {
      var self = this;
      new Evaluate({
        el: ".evaluate-star",
        data: self._formatData( tags )
      });
    },
    // 格式化评论数据
    _formatData: function ( tags ) {
      var _tags = {};
      for (var tag in tags) {
        if (tags.hasOwnProperty(tag)) {
          var _tag = SCORE_MAP[tag];
          _tags[_tag] = tags[tag];
        }
      }
      return _tags;
    },
    // 没有评论内容时
    _renderNoComment: function () {
      var tpl = '<div class="weui_cell">暂无评价</div>';
      this.$mod.find(".evaluate-star").html(tpl);
    }

};

var Model = Backbone.Model.extend({
  url: '/my/order/detail',
  defaults: {data: null},
  initialize: function(options) {
    var self = this;
    self.fetch({
      data: {format: 'json', order_id: options.id},
      dataType: 'json',
      success: function(_, data) {
        if (data && data.ret === 0) {
          self.set({content: data.content});
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
  }
});

var View = Backbone.View.extend({
    model: null,
    className: 'mod-my-order-view mod-my-order-detail',
    id: 'myOrderDetailCanvas',
    events: {
        'click .i-back': 'goBack',
    },
    initialize: function (options) {
        this.model = new Model(options);
        this.listenTo(this.model, 'change:content', function() {
          new Action({
            $el: this.$el,
            content: this.model.get('content')
          });
        });
        $(document.body).append(this.$el);
    },
    goBack: function () {
        history.go(-1);
        console.log('dd');
    },
    close: function () {
        this.unbindEvent();
    },
    unbindEvent: function() {
        // $(window).off('.myorder');
    }
});

module.exports = View;
