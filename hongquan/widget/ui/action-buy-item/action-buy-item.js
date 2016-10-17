var $ = require('home:widget/ui/zepto/zepto.js');
var modelCart = require('home:widget/ui/model-cart/model-cart.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Toast = require('home:widget/ui/toast/toast.js');


//
//function ActBubble() {
//    var _bubbleTimer = null;
//    function _hideBubble() {
//        $('.ui-item-action-bubble').hide();
//        _bubbleTimer = null;
//    }
//
//    this.actSubtractBubble = function (num, pos) {
//        var left = pos.left;
//        var top = pos.top;
//        var $bubble = $('.ui-item-action-bubble');
//        var bubbleHtml = [
//            '<div class="ui-item-action-bubble ui-item-subtract-action-bubble">',
//            '<span class="num">',
//            num,
//            '</span>',
//            '</div>'
//        ];
//        if ($bubble.length == 0) {
//            $(document.body).append(bubbleHtml.join(''));
//            $bubble = $('.ui-item-action-bubble');
//        }
//        $bubble
//            .show()
//            .removeClass('ui-item-add-action-bubble')
//            .addClass('ui-item-subtract-action-bubble')
//            .css({left: left, top: top})
//            .find('.num').text(num);
//        if (_bubbleTimer) {
//            clearTimeout(_bubbleTimer);
//        }
//        _bubbleTimer = setTimeout(_hideBubble, 1000);
//    };
//    this.actAddBubble = function (num, pos) {
//        var left = pos.left;
//        var top = pos.top;
//        var $bubble = $('.ui-item-action-bubble');
//        var bubbleHtml = [
//            '<div class="ui-item-action-bubble ui-item-add-action-bubble">',
//            '<span class="num">',
//            num,
//            '</span>',
//            '</div>'
//        ];
//        if ($bubble.length == 0) {
//            $(document.body).append(bubbleHtml.join(''));
//            $bubble = $('.ui-item-action-bubble');
//        }
//        $bubble
//            .show()
//            .removeClass('ui-item-subtract-action-bubble')
//            .addClass('ui-item-add-action-bubble')
//            .css({left: left, top: top})
//            .find('.num').text(num);
//
//        if (_bubbleTimer) {
//            clearTimeout(_bubbleTimer);
//        }
//        _bubbleTimer = setTimeout(_hideBubble, 1000);
//    }
//}
//
//var actBubble = new ActBubble();

var actionBuyItem = {
    bindBuyEvent: function ($container) {
        //事件兼容  tap.cart-->click
        $container.on(conf.evClick, '.act-add', function (e) { //(controller)
            e.preventDefault();
            /////////// 以下是 act => 数据模型 => 事件通知（回调）更新的思路
            var $this = $(this);
            var $item = $this.closest('[data-sku_id]');
            var skuId = $item.data('sku_id');
            var moq = $item.data('moq');
            var ret = modelCart.add(skuId, moq); //(model)
            if (ret == 0) {
                var itemInfo = modelCart.get(skuId);
                var currentCount = itemInfo.buy_info.count;

                //(view)更新整个块
                //var itemStr = TPL.compile(tpls.indexItem)({item: data});
                //$item.replaceWith(itemStr);

                //局部更新（用DOM操作）
                var $buy = $this.closest('.buy');
                var $buyCount = $buy.find('.buy-count');
                if (currentCount > 0) {
                    $buy.removeClass('empty');  //移除标识
                }
                $buyCount.text(currentCount);

                //var offset = $this.offset();
                //var currentTopLine = $(window).scrollTop();
                //var currentLeftLine = $(window).scrollLeft();
                //actBubble.actAddBubble(currentCount, {
                //    left: offset.left - currentLeftLine,
                //    top: offset.top - currentTopLine
                //});
            } else {
                Toast({msg: modelCart.getMessage(ret), delay: 1000}).show();
            }
        }).on(conf.evClick, '.act-subtract', function (e) {
            e.preventDefault();

            var $this = $(this);
            var $item = $this.closest('[data-sku_id]');
            var skuId = $item.data('sku_id');
            var moq = $item.data('moq');
            var ret = modelCart.subtract(skuId, moq); //(model)
            if (ret == 0) {
                var itemInfo = modelCart.get(skuId);
                var currentCount = itemInfo.buy_info.count;

                //局部更新（用DOM操作）
                var $buy = $this.closest('.buy');
                var $buyCount = $buy.find('.buy-count');
                if (currentCount <= 0) {
                    $buy.addClass('empty');  //增加标识
                }
                $buyCount.text(currentCount);

                //var offset = $this.offset();
                //var currentTopLine = $(window).scrollTop();
                //var currentLeftLine = $(window).scrollLeft();
                //
                //actBubble.actSubtractBubble(currentCount, {
                //    left: offset.left - currentLeftLine,
                //    top: offset.top - currentTopLine
                //});
                ////(view)更新整个块
                //var itemStr = TPL.compile(tpls.indexItem)({item: data});
                //$item.replaceWith(itemStr);


            } else {
                Alert.show(modelCart.getMessage(ret));
            }
        });
    }
};

module.exports = actionBuyItem;
