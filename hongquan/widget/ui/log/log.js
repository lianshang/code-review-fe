var $ = require('home:widget/ui/zepto/zepto.js');
require('home:widget/ui/zepto/zepto.cookie.js');
require('home:widget/ui/wexin-sdk/wexin-sdk.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');

var timer = null;
var Log = {
    url: '/home/statistics/appreport',

    wxConfig: null, // 微信配置信息

    networkType: '',  // 网络类型

    headers: {
        HTTP_PLATFORM: conf.page.platform,
        HTTP_DEVICE_ID: $.fn.cookie('sid'),
        HTTP_UID: conf.userData.uid,
        HTTP_TOKEN: $.fn.cookie('token'),
        HTTP_VERSION: ''
    },

    //获取微信接口配置信息
    getWXConfig: function () {
      var that = this;
      $.ajax({
          url: '/common/weixin/getjsconfig',
          data: { url: window.location.href.split('#')[0] },
          dataType: 'json',
          success: function(data) {
              if (data && data.ret === 0) {
                  that.wxConfig = data.content;
              }  else if (data && data.ret == 100021) {
                  Alert.show(data.msg, function() {
                      location.reload();
                  });
              }
          }
      });
    },

    // 获取微信的网络类型
    getWXNetType: function () {
      var res =  window.navigator.userAgent.toLowerCase().match(/nettype\/(\w+?)\s/);
      if ( res && res.length >= 1 ) return res[1].toLowerCase();
      return '';
    },

    // 获取硬件信息
    getDeviceType: function () {
      // 获取安卓设置手机型号
      var deviceType = '';
      var UA = window.navigator.userAgent.toLowerCase();
      var regRes = /;\s(?:.*);\s(.*?)\sbuild/.exec(UA); // 匹配安卓机型
      if ( regRes && regRes.length >= 1 ) deviceType = regRes[1];
      if ( !deviceType ) { // 如果安卓手机型号为空，判断是否为苹果手机型号
        regRes = /mozilla\/.*?\s\((\w+?);/.exec(UA); // 苹果手机型号匹配设备类型与版本
        if ( regRes && regRes.length >= 1 ) deviceType = regRes[1];
      }
      return deviceType;
    },

    // 获取网络连接类型
    getNetworkType: function () {
      var that = this;
      var networkType = '';
      wx.config($.extend({
        debug: false,
        jsApiList: ['getNetworkType']
      }, that.wxConfig));
      wx.ready(function () {
        wx.getNetworkType({
          success: function ( res ) {
            that.networkType = res.networkType.toLowerCase();
          },
          fail: function ( err ) {
            console.log(res);
          }
        });
      });
    },

    // 对比两种方式获取的网络类型，然后输出
    diffNetWork: function () {
      var _netType = this.getWXNetType();
      if ( !this.networkType ) return _netType;
      if ( this.networkType == _netType ) return _netType;
      if ( this.networkType != _netType ) return this.networkType;
      return '';
    },
    getRefer: function () {
        var currentPid =  Storage.getItem('currentPid') || '';
        Storage.setItem('prevPid', currentPid);
        var prevPid =  Storage.getItem('prevPid') || '';
        return prevPid;
    },
    setRefer: function () {
        var prevPid = this.getRefer();
        var pid = Log.pid;
        Storage.setItem('currentPid', pid);
        return prevPid;
    },

    /**
     * 发送行为参数到日志服务
     * @param params
     * @param params.action 行为类型
     * @param params.pid 页面id（数字形式,数据组分配）
     * @param params.detail 额外的数据JSON对象
     */
    send: function (params) {
        var that = this;
        that.headers.HTTP_DEVICE_NAME = this.getDeviceType(); // 添加设备信息
        that.headers.HTTP_NETWORK_TYPE = this.diffNetWork();  // 添加网络信息
        var prevPid = that.setRefer();
        params.ref ? $.extend(params.ref,{pid:prevPid}) : $.extend(params,{ref:{pid:prevPid}});

        $.ajax({
            type: 'POST',
            url: that.url,
            headers: that.headers,
            data: params,
            dataType: 'json',
            timeout: 30000,
            success: function(data) {
                console.info('Log.send() success pid=' + params.pid);
            },
            error: function(xhr, type) {
                console.warn('Log Ajax error!');
            }
        });
    },
    /**
     * 上滑加载列表上报
     * @param page  第几页
     */
    scrollSend: function ( page ){
        var detail = {
            page: page,
            extend:''
        };
        this.send({
            action: "show",
            pid: Log.pid,
            detail: detail
        });
    },
    // 获取当前购物车的商品
    getSkuList: function () {
      var skuList = Storage.getItem("model-cart-buy-counter") || [];
      if (!skuList.length) return "";
      var _skuList = [];
      for (var i = 0, len = skuList.length; i < len; i++) {
        var item = skuList[i];
        _skuList.push({
          skuId: item.skuId,
          qty: item.count
        });
      }
      return JSON.stringify(_skuList);
    }
};

// 启动获取微信浏览器的配置信息
// 每20秒更新一下异步获取的网络类型
Log.getWXConfig();
clearInterval(timer);
timer = setInterval(function () {
  Log.getNetworkType();
}, 20000);

module.exports = Log;
