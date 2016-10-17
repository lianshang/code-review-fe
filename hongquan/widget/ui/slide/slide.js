var $ = require('home:widget/ui/zepto/zepto.js');
require('home:widget/ui/zepto/zepto-animate.js');
var Swipe = require('home:widget/ui/slide/swiper.js');
var T = require('home:widget/ui/tpl/tpl.js');

$.fn.slide = function (options) {
    var $this = $(this);
    var tpl = [
        '<div>',
        '{{if href}}',
        '<a href="{{href}}">',
        '{{/if}}',
        '<img src="{{src}}" alt="{{alt}}"/>',
        '{{if href}}',
        '</a>',
        '{{/if}}',
        '</div>'
    ].join("");
    var navDot = "<span class='dot {{cur}}'></span>";

    var defaulConfig = {
        speed: 2000
    };
    var config = $.extend(defaulConfig, options);

    var data = config.setData() || [];
    var l = data.length;
    var els = "";
    var dots = "";

    for ( var i = 0, length = l; i < length; i++ ) {
        var img = data[i].src;
        var href = data[i].href;
        var alt = data[i].alt;

        els += T.compile(tpl)({src: img, href: href, alt: alt});
        dots += T.compile(navDot)({cur: i === 0 ? "cur" : ""});
    }

    $this.addClass("ui-slide").append("<div class='swipe-wrap'>" + els + "</div>").append("<span class='dots'>" + dots + "</span>");

    if (l < 2) {
        $this.find(".dots").hide();
    }

    new Swipe($this[0], {
        startSlide: 0,
        speed: 400,
        auto: 3000,
        continuous: true,
        disableScroll: false,
        stopPropagation: false,
        callback: function (index, elem) {
            // 只有两个的时候, swiper会在左右各复制一个, 但没有对index做处理, 所以这里的index要特殊处理一下
            if (l === 2 && index >= l) {
                index = index - 2;
            }
            setDot(index);
        }
    });

    var $dots = $this.find(".dot");

    function setDot(cur) {
        $dots.removeClass("cur").eq(cur).addClass("cur");
    }
};
