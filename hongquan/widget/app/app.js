var $ = require('home:widget/ui/zepto/zepto.js');
var $mod = $('.mod-app');
var $browser = $('.browser');
var ua = navigator.userAgent.toLowerCase();
//var $download = $('.download');
var action = function () {
	$mod.on('click', '.download', function () {
		if (ua.match(/MicroMessenger/i) == "micromessenger") {
		    //在微信中打开
		    $browser.show();
		}
	});
}
module.exports = action;