var $ = require('home:widget/ui/zepto/zepto.js');

/*
 * Toast
 * Usage : Toast( opts ).show();
 * opts: {} Object
 * By Gavin 2016.3.15
 */

var Toast =  function ( opts ){
  var tpl = [
    '<div class="lsh-toast" style="display: none;">',
      '<div class="weui_mask_transparent"></div>',
      '<div class="weui_toast_self"></div>',
    '</div>'
  ].join(''),

  // 默认数据
  defaults =  {
    msg     :   "",             // 默认消息值
    delay   :   500,            // 显示多长时间后消失
    func    :   null,           // toast消失后的回调
    show    :   false           // 如果为ture，则会一直显示，除非调用hide()方法
  },

  // 合并参数
  opts = $.extend( {}, defaults, opts),

  // 渲染
  render = function () {
    $(document.body).append( tpl );
  };

  // 判断是否有lsh-toast类，如果有的话，就不创建了
  $(".lsh-toast").length === 0 && render();

  // 缓存起来
  var $toast = $(".lsh-toast");

  return {
    // 显示方法
    show: function () {
      var self = this, timer = null;
      // 显示toast
      $toast.show();
      // 设置具体内容
      $toast.find(".weui_toast_self").html( opts.msg );
      clearTimeout( timer );
      if ( typeof opts.delay === 'number' && !opts.show ) {
        timer = setTimeout( function () {
          $toast.hide();
          $.isFunction( opts.func ) && opts.func();
        }, opts.delay );
      }
      return this;
    },

    // 隐藏方法
    hide: function () {
      $toast.hide();
      return this;
    },

    // 移除
    remove: function () {
      $toast.remove();
    }
  };
};

module.exports = Toast;
