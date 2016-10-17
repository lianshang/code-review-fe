var $ = require('home:widget/ui/zepto/zepto.js');
var tpls = require('home:widget/activity/tpls.js');
var TPL = require('home:widget/ui/tpl/tpl.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
require('home:widget/ui/lazyload/lazyload.js');
var helper = require('home:widget/ui/helper/helper.js');
var UIItemListView = require('home:widget/ui/ui-item-list-view/ui-item-list-view.js');
// var modelCart = require('home:widget/ui/model-cart/model-cart.js');
// var actionBuyItem = require('home:widget/ui/action-buy-item/action-buy-item.js');
var CartMainModel = require('home:widget/cart/cart.main.model.js');
var Alert = require('home:widget/ui/alert/alert.js');

var modName = 'mod-activity-detail header-fixed';

//处理活动类名
TPL.helper('filter_activity_className', function (info) {

});

function activityAction(opts) {
    var $viewCanvas = opts.$el;
    var _itemListView = new UIItemListView();


    //render view canvas
    function renderViewFrame() {
        $viewCanvas.data('view-mod', modName);
        //$viewCanvas.html(TPL.compile(tpls.itemViewCanvas)({
        //    item: conf.itemInfo
        //}));
    }

    //update

    renderViewFrame();

    function init() {
        if(!opts.activity_id) {
            Alert.show('params error!');
            return;
        }
        //异步获取活动的数据
        $.ajax({
            type: 'GET',
            url: '/promotion/activity/getinfo',
            data: {activity_id: opts.activity_id, rn: 99, pn: 0},   //把所有的都取回来吧..TODO: 活动先实现按99个来,后面策略定了再优化
            dataType: 'json',
            timeout: 10000,
            cache: false,
            success: function(data, textStatus, jqXHR){
                if (data && data.ret == 0) {
                    var now = parseInt(data.timestamp, 10) * 1000 || new Date().getTime();
                    _itemListView.init({
                        itemList: data.content.item_list,
                        now: now
                    });
                    //活动信息
                    //过滤自己活动
                    var activityList = [];
                    for(var i=0; i < opts.activityList.length; i++) {
                        var a = opts.activityList[i];
                        if(a.id != opts.activity_id) {
                            activityList.push(a);
                        }
                    }
                    $viewCanvas.html(TPL.compile(tpls.activityDetailCanvas)({
                        activityInfo: data.content,
                        activityList: activityList,
                        imgScale: conf.dpr >= 2 ? 'medium' : 'small'
                    }));

                    // 商品
                    _itemListView.appendTo($viewCanvas.find('.items ul'));

                    // 检查活动是否进行中
                    checkValid(data, now);

                } else if (data && data.ret == 100021) {
                    Alert.show(data.msg, function() {
                        location.reload();
                    });
                } else if (data && data.ret == -10120) {
                    location.replace('/static/home/special/error/index.html');
                }else {
                    console.warn('data load fail');
                }
                console.log(data);
            },
            error: function(xhr, type){
                //Alert.show('Ajax error!')
            }
        });
    }

    function checkValid(data, curTime) {
        setTimeout(function() {
            // var curTime = Date.parse(jqXHR.getResponseHeader("Date") || new Date);
            var beginTime = +data.content.begin_at * 1000;
            var endTime = +data.content.end_at * 1000;
            var msg = null;
            if (curTime < beginTime) msg = '活动还没开始';
            else if (curTime > endTime)  msg = '活动已经结束';
            if (msg) {
                Alert.show(msg, function() {
                    goBack();
                });
            }
        }, 500);
    }

    function goBack() {
        var backUrl = helper.queryString('back');
        if (backUrl == 'cart') {
            location.href = '/#shopping/cart';
        } else {
            history.go(-1);
        }
    }

    function bindEvent() {
        $viewCanvas.on(conf.evClick, '.i-back', function() {
            goBack();
        });
    }

    init();
    bindEvent();
}

var Model = Backbone.Model.extend({
  url: '/home/activity',
  defaults: {data: null},
  initialize: function(options) {
    var self = this;
    self.fetch({
      data: {activity_id: options.activity_id, format: 'json'},
      dataType: 'json',
      success: function (model, response, options) {
        if (response && response.ret === 0) {
          self.set({data: response.content.activity_list});
        } else if (response && response.ret == 100021) {
            Alert.show(response.msg, function() {
                location.reload();
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
  }
});

var View = Backbone.View.extend({
    model: null,
    className: modName,
    initialize: function (options) {
        $(document.body).append(this.$el);
        this.model = new Model(options);
        this.listenTo(this.model, 'change:data', function() {
          activityAction($.extend({
            $el: this.$el,
            activityList: this.model.get('data')
          }, options));
        });
    },
    close: function () {
        this.unbindEvent();
    },
    unbindEvent: function() {
        $(window).off('.history');
    }
});

module.exports = View;
