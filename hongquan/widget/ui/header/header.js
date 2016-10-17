/*
 * 公共的header
 * 为了更方便的管理header，这里把header抽出来，支持一些简单的配置
 * 传入一个值，则表示创建的header只有一个title与返回按钮
 * 如果传入多值，使用对象的形式
 */

function renderHeader( options ) {
  //  标题     返回URL    拓展的模板   自定义返回模板
  var title = backUrl = extendTpl = customBackTpl = backClass = '';
  //   标题局长          隐藏返回按钮
  var titleCenter = hideBackIcon = false;

  // 如果直接传入字符串，则设置标题
  if ( typeof options === 'string' ) {
    title = options;
  } else if ( typeof options === 'object' ) {
    title = options.title;
    backClass = options.backClass || '';
    backUrl = options.backUrl || '';
    extendTpl = options.extendTpl || '';
    customBackTpl = options.customBackTpl || '';
    titleCenter = options.titleCenter || false;
    hideBackIcon = options.hideBackIcon || false;
  }

  // 如果标题居中，则给返回按钮增加一个类名，实现绝对定位
  if ( titleCenter ) backClass = backClass + ' pos-absolute';

  // 配置返回标签
  var getBackTpl = function () {
    if ( customBackTpl ) return customBackTpl;
    if ( hideBackIcon ) return '';  // 隐藏返回按钮
    return backUrl ?
      '<a href="' + backUrl + '" class="iconf i-arrow-l i-back ' + backClass + '"></a>' :
      '<i class="iconf i-arrow-l i-back ' + backClass + '"></i>';
  };

  // 返回标题
  var getTitle = function () {
    var className = titleCenter ? 'noindent' : 'title';
    return '<h1 class="' + className + '">' + title + '</h1>';
  };

  var headerTpl =
    '<header class="header">' +
      getBackTpl() +
      getTitle() +
      extendTpl +
    '</header>';
  return headerTpl;
}

module.exports = renderHeader;
