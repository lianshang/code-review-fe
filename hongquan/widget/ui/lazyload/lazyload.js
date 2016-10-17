/************
 * 图片延迟加载处理
 * （原始代码来自网上。。。）
 * **/

var Zepto = require("home:widget/ui/zepto/zepto.js");

(function ($, win) {
    var _options = {
        container: win,
        event: 'scroll resize load',
        attr: 'data-src',
        delay: 100
    };
    var _imgList = [];

    $.fn.lazyload = function (opt) {
        //首先获得页面中所有需要处理的图片列表
        //绑定srcoll 事件（可以有交互上面的延迟）
        //判断是否在可视区（+预判），然后执行加载（可以考虑控制总数）

        opt = $.extend({}, _options, opt);

        //为了简化运算，一次判断中，只用一次计算
        // TODO: 考虑缓存各个ITEM-element 的offset()
        var currentTopLine = 0; //用来一次判断中的图片容器的：上边缘
        var currentBottomLine = 0; //用来判断图片容器的：下边缘
        function updateWinInfo() {
            currentTopLine = $(opt.container).scrollTop();
            currentBottomLine = $(opt.container).height() + currentTopLine;
        }

        /*
         *判断元素是否出现在viewport中
         */
        function isInView(element) {
            var curTop = $(element).offset().top;
            return ((curTop >= currentTopLine) && (curTop <= currentBottomLine));
        }

        function getInViewportList() {
            //console.log('getInViewportList')
            updateWinInfo();
            //var imgList = $(domQuery);
            //console.log(_imgList);
            var isLeft = false;
            $(_imgList).each(function (i, img) {
                //console.log(img);
                //var img = _imgList.eq(i);
                if (isInView(img)) {
                    // TODO
                    loadImg(img);
                    //console.log(img);
                } else {
                    isLeft = true;
                    //console.log(img);
                }
            });
            if(!isLeft) {
                //console.info('isLeft == false');
                $(opt.container).off(_options.event, checkImageLazyLoad);   //取消事件绑定
            }
        }

        function loadImg(img) {
            var $img = $(img);
            var src = $img.attr(opt.attr);
            if (!src) {
                return;
            }
            $img.attr('src', src).one('load', function () {
                $img.removeClass('lazy-load-img');
                $img.removeAttr(opt.attr);
                $img.removeAttr('data-lazyload-add');
            });
        }

        var refreshTimer = null;
        //var domQuery = 'img';
        function checkImageLazyLoad() {
            if (refreshTimer) {
                clearTimeout(refreshTimer);
            }
            // 延迟响应
            refreshTimer = setTimeout(getInViewportList, opt.delay);
            //console.log(refreshTimer);
        }

        this.each(function (i, img) {
            var src = img.getAttribute(opt.attr);
            if (!src || img.getAttribute('data-lazyload-add')) {
                return;
            }
            img.setAttribute('data-lazyload-add', '1'); //记录,避免重复添加
            _imgList.push(img);
        });
        //_imgList.concat(this.slice());

        /*
         *滚动结束 屏幕静止一秒后检测哪些图片出现在viewport中
         *和PC端不同 由于无线速度限制 和手机运算能力的差异 1秒钟的延迟对手机端的用户来说可以忍受
         */
        $(opt.container).on(_options.event, checkImageLazyLoad);
        checkImageLazyLoad();
        return this;
    };
})(Zepto, window);
