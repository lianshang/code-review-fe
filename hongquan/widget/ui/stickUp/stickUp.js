/**
 * 滚动固定
 * 现用于秒杀页面的标题滚动固定
 * 需要注意的是，这里获取的height为outheight，包括margin
 * 为了防止标题在滚动固定的时候下面的内容突然提升，需同时设置其下面元素的margin-top
 */
$.fn["stickUp"] = function ( context ) {
  if(!context) context = window;
  var $ele    = $(this);
  var posTop  = $ele.offset().top;
  var mTop    = $ele.css("margin-top");
  var mBottom = $ele.css("margin-bottom");
  var width   = $ele.width()  - parseInt( mTop, 10 ) - parseInt( mBottom, 10 );
  var height  = $ele.height() + parseInt( mTop, 10 ) + parseInt( mBottom, 10 );

  var func = debounce(function () {
    var scrollTop = $(this).scrollTop();
    scrollTop > posTop
      ? $ele.addClass("pos-fixed").css("width", width).next().css("margin-top", height + "px")
      : $ele.removeClass("pos-fixed").css("width", "auto").next().css("margin-top", "auto");
  }, 50 );
  $(context).on('scroll', func);
  return this;
}

// 函数降频
// http://www.alloyteam.com/2012/11/javascript-throttle/
var debounce = function ( fun, wait, immediate ) {
  var timer = null;
  var last = 0;
  return function () {
    var context = this, args = arguments, now  = (new Date()).getTime();
    clearTimeout(timer);
    if ( !last ) last = now;
    if ( now - last >= wait ) {
      fun.apply(context, args);
      last = now;
    } else {
      timer = setTimeout(function(){
        fun.apply(context, args);
      }, wait);
    }
    // 也可以立即执行
    if ( immediate ) fun.apply(context, args);
  }
}
