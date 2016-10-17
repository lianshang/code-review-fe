var $              = require('home:widget/ui/zepto/zepto.js');
var tpls           = require('home:widget/seckill/tpls.js');
var TPL            = require('home:widget/ui/tpl/tpl.js');
var Backbone       = require('home:widget/ui/backbone/backbone.js');
var Loading        = require('home:widget/ui/loading/loading.js');
var stickUp        = require('home:widget/ui/stickUp/stickUp.js');
var UIItemListView = require('home:widget/ui/ui-item-list-view/ui-item-list-view.js');
var Alert          = require('home:widget/ui/alert/alert.js');

// Model
var Model = Backbone.Model.extend({
  url: 'promotion/activity/getkillitemlist',
  defaults: {
    blockList: null,
    requestTime: null,
    tips: null
  },
  initialize: function () {

  },

  getData: function () {
    var that = this;
    that.fetch({
      dataType: "json",
      timeout: '20000',
      cache: false,
      success: function ( _, res, options ) {
        if ( res && res.ret === 0 ) {
          conf.now = res.timestamp; // 重置conf.now，否则在页面切换时，该时间容易丢失 fixbug 1466
          _.set( {
            "blockList": {
              now_item_list: res.content.now_item_list || [],
              future_item_list: res.content.future_item_list || []
            },
            "tips": res.content.tips,
            "requestTime": parseInt(res.timestamp, 10) * 1000 // new Date( options.xhr.getResponseHeader("Date") ).getTime()
          });
          // console.log(new Date( options.xhr.getResponseHeader("Date") ).getTime());
          // console.log(res.timestamp * 1000);
        } else if (res && res.ret === 100021) {
          Alert.show(res.msg, function() {
              location.reload();
          });
        }
      },
      error: function ( _, error ) {
        console.error(error.responseText);
      }
    });
  }
});

// View
var View = Backbone.View.extend({
  className: "mod-seckill-detail",
  model: null,
  events: {
    "click .i-back": "back"
  },

  initialize: function ( options ) {
    Loading.show('数据加载中...');
    this.model = new Model();
    this.initSkeleton();       // 生成页面骨架
    this.listenTo( this.model, "change:blockList", this.render );
    this.listenTo( this.model, "change:requestTime", this.renderTimer );
    this.listenTo( this.model, "change:tips", this.renderTips );
    this.model.getData();      // 异步操作
  },

  // 初始化页面骨架
  initSkeleton: function () {
    var tpl = tpls.secKillDetailCanvas;
    var data = {
      activityInfo: {
        name: "秒杀",
        activityTitle: "秒杀规则："
      }
    };
    $(document.body).append( this.$el.html( TPL.compile( tpl )( data ) ) );
  },

  /**
   * 页面渲染
   */
  render: function () {
    var that = this;
    var $seckills  = this.$(".seckills");
    var uiItemList = new UIItemListView();
    var requestTime = this.model.get("requestTime");

    // 加载tpl 辅助方法
    // 用于时间格式化
    this.addStampFormat();

    // 获取数据并进行格式化
    var data = this.model.get('blockList');
    var newData = this.formatData( data );

    // 如果数据为空，则显示“暂无秒杀商品”
    if ( newData.future_item_list &&
         newData.future_item_list.itemList &&
         newData.future_item_list.itemList.length === 0 &&
         newData.now_item_list &&
         newData.now_item_list.itemList &&
         newData.now_item_list.itemList.length === 0 ) {
          $seckills.append( TPL.compile( tpls.empty )() );
    }

    // showSecKillBar 是否显示进度条
    // isSecKillingItem 该商品是否在疯抢中
    var i = 0;
    $.each( newData, function ( k, v ) {
      if (v.itemList.length) {
        var $items;
        $seckills.append( TPL.compile( tpls.group )( v.status ) );
        $items = $( that.$(".items ul")[i++] );
        uiItemList.init( { itemList: v.itemList, now: requestTime, isShowSecKillBar: true } ).appendTo( $items );
      }
    });
    // 分组固定
    this.groupTitleFixed();
    // 取消loading
    Loading.hide();
  },

  /**
   * 数据格式化
   */
  formatData: function ( data ) {
    var that = this;
    var _newData  = {};
    $.each( data, function ( k, v ) {
      _newData[k] = {};
      _newData[k].itemList = v;
      _newData[k].status = {
        title: k.indexOf("now") >= 0 ? "疯抢中" : "即将开抢",
        now: k.indexOf("now") >= 0 ? true : false
      }
    });
    return _newData;
  },

  // 启动倒计时
  // 倒计时结束的时候，重新刷新页面
  renderTimer: function () {
    var blockList = this.model.get('blockList') || null;
    var firstItemBeginAt = firstItemEndAt = null;
    var timeOut = null;
    if ( blockList ) {
      var futureItem = blockList.future_item_list;
      var nowItem = blockList.now_item_list;
      if ( futureItem && futureItem[0] && futureItem[0].promo_info && futureItem[0].promo_info.sale && futureItem[0].promo_info.sale.begin_at ) {
        firstItemBeginAt = parseInt( futureItem[0].promo_info.sale.begin_at * 1000, 10 );
      }
      if ( nowItem && nowItem[0] && nowItem[0].promo_info && nowItem[0].promo_info.sale && nowItem[0].promo_info.sale.end_at ) {
        firstItemEndAt = parseInt( nowItem[0].promo_info.sale.end_at * 1000, 10 );
      }
    }
    if ( firstItemBeginAt || firstItemEndAt ) {
      this._setTimeOut( firstItemBeginAt );
      this._setTimeOut( firstItemEndAt );
    }
  },

  // 倒计时
  // itemTime是倒计时时间
  _setTimeOut: function ( itemTime, title ) {
    var timer = null;
    var requestTime = this.model.get('requestTime') || 0;
    if ( itemTime ) {
      timeOut = parseInt( ( itemTime - requestTime ), 10 );
      if ( timeOut > 0 /* && ( timeOut / 60000 ) < 30 */ ) {  // 这里不进行时间限制
        clearTimeout( timer );
        timer = setTimeout(function () {
          location.reload();  // 指定秒杀活动开始时，刷新页面
        }, timeOut);
      }
    }
  },

  renderTips: function () {
    var tips = this.model.get('tips') || "";
    var $tipCon = this.$(".brief-info");
    var $infoCon = this.$(".seckill-info");
    // 如果没有数据，则不显示活动规则
    var data = this.model.get('blockList');
    if ( !data.future_item_list.length && !data.now_item_list.length ) {
      $infoCon.empty();
    } else {
      $tipCon.html( tips );
    }
  },

  // 循环遍历元素，绑定事件滚动
  groupTitleFixed: function () {
    var $ele = this.$(".group-title");
    $.each( $ele, function ( k, v ) {
      $(v).stickUp();
    })
  },

  // 回退
  back: function ( e ) {
    history.go(-1);
  },

  // 页面清空时，清掉该值，防止影响首页效果。因为首页也用到了该变量
  // 最好去除confi的使用
  close: function () {
    conf.now = null;
  },

  addStampFormat: function () {
    /**
     * 仿上述方法
     * 用户秒杀页面，显示“明日”的效果
     * By Gavin
     * 2016-5-5
     */
    TPL.helper('stampFormat_tomorrow_fixed', function (unixTimeStamp, format, emptyString) {
      var requestTime = new Date( conf.now * 1000 );
      var	stampTime   = new Date( unixTimeStamp * 1000 );
      var requestDay  = requestTime.getDate();
      var stampDay    = stampTime.getDate();
      if(!/^\d{2,}$/.test(unixTimeStamp)){
        return emptyString || '--';
      } else {
        var date = new Date(unixTimeStamp * 1000);
        var o = {
          "M+": date.getMonth() + 1, //月份
          "d+": date.getDate(), //日
          "h+": date.getHours(), //小时
          "m+": date.getMinutes(), //分
          "s+": date.getSeconds(), //秒
          "q+": Math.floor((date.getMonth() + 3) / 3), //季度
          "S": date.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
          if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));

        var dayValid = stampDay - requestDay;
        if ( dayValid === 1 /* 正常日期 */ || dayValid < 0 /* 跨月的情况 */) {
          format = "明日 " + format;
        }
        return format;
      }
    });
  }
})

module.exports = View;
