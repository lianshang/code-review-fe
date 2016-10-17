var $ = require('home:widget/ui/zepto/zepto.js');
var modelCart = require('home:widget/ui/model-cart/model-cart.js');
var tpls = require('home:widget/ui/ui-item-list-view/tpls.js');
var TPL = require('home:widget/ui/tpl/tpl.js');
require('home:widget/ui/lazyload/lazyload.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Confirm = require('home:widget/ui/confirm/confirm.js');
var Toast = require('home:widget/ui/toast/toast.js');
var DOC = $(document);
var Log = require('home:widget/ui/log/log.js');

/**
 * 场景:
 *   1. （首页）固定少量条目的直接渲染
 *   2. （分类页）可能需要翻页动态的渲染
 *   3. （购物车）
 *   4. （活动页）
 *   5. （搜索页）
 *   6. （购物历史页）
 *   7. （秒杀活动页）
 * @constructor
 */

var UIItemListView = function () {
    var _itemList = []; // 商品数据列表
    var _isEnd = false; // 是否到底了

    var sum = false; // 是否进行小计计算
    var validate = false; // 是否进行校验
    var that = this;
    var now = new Date().getTime();
    var _isShowSecKillBar = false;  // 是否显示秒杀商品的进度条
    var _isShowBuyBtn = true;       // 是否显示购买按钮

    var checkable = false;   //是否可以选择,是否带勾选框
    var disabledItem = false;//是否是渲染失效商品
    var groupIndex = 0;
    /**
     * 初始化数据
     * @param options
     * @params options.itemList 商品列表
     */
    this.init = function (options) {
        _itemList = options.itemList;
        _isEnd = options.isEnd;
        sum = options.sum || sum;
        validate = options.validate || validate;
        now = options.now || now;
        _isShowSecKillBar = options.isShowSecKillBar || _isShowSecKillBar;

        checkable = options.checkable || checkable;

        disabledItem = options.disabledItem || disabledItem;
        groupIndex = options.groupIndex || groupIndex;
        //初始化数据
        modelCart.init({
            itemList: _itemList
        });
        return this;
    };
    this.getTimeValid = function(now, beginAt, endAt) {
        var beginAt = parseInt(beginAt, 10) * 1000;
        var endAt = parseInt(endAt, 10) * 1000;
        var timeValid = 0;
        if (beginAt > now) { // 还没开始
            timeValid = 1;
            // setTimeout(function() {
            //     DOC.trigger('e-ui-item-list-view-reload');
            // }, now - beginAt);
        } else if (endAt <= now) { // 已经结束
            timeValid = 2;
        } else { // 进行中
            // setTimeout(function() {
            //     DOC.trigger('e-ui-item-list-view-reload');
            // }, endAt - now);
        }
        return timeValid;
    };

    /**
     * 返回秒杀活动的开始时间与结束时间
     * item 数据
     * status 返回指定状态的时间，begin或者end
     */
    this.getSecKillTime = function ( item, status ) {
      if ( item.promo_info && item.promo_info.sale && item.promo_info.sale[ status + "_at" ]) {
        return item.promo_info.sale[ status + "_at" ]
      }
      return null;
    };
    /**
     * 返回所有item的渲染HTML内容
     * @returns {string}
     */
    this.renderString = function () {
        var itemListStr = [];
        if( Log.pid ) {
            cleanLocalPage(Log.pid);
        }
        var page = Storage.getItem("log-page") || 1;
        for ( var i = 0, len = _itemList.length; i < len; i++ ) {
            var item = _itemList[i];
            var skuId = item.sku_info.sku_id;
            var itemInfo = modelCart.get(skuId);
            var price = item.currentPrice;
            // 商品小计
            // if (sum) {
            //     item["sum"] = calculateSum(price, itemInfo.buy_info.count);
            // }

            // 判断是否显示加减按钮
            var beginAt = this.getSecKillTime( item, "begin" );
            var endAt   = this.getSecKillTime( item, "end" );
            itemInfo["timeValid"] = this.getTimeValid( now, beginAt, endAt );
            //用于渲染item的数据
            var data = {
                showBar: _isShowSecKillBar, // 是否显示秒杀商品的进度信息
                showBuyBtn: _isShowBuyBtn,
                item: itemInfo,
                sum: sum,
                validate: validate,
                imgScale: conf.dpr >= 2 ? 'small': 'tiny',
                checkable: false,             //用于控制是否在此处显示总计
                disabledItem: false,
                index: i+1,                     //商品的位置, 用于上报, 从1开始
                page: page,
            };

            var $itemListStr = null;

            //需要checkbox
            if(checkable){
                // 判断赠品是否异常，可能有多个赠品的情况，这里循环判断
                var giveErr = getGiveErrContent(data.item, data.item.give_list );
                // 加入索引值用于勾选
                $.extend(data, {index: i, checkable:checkable, groupIndex:groupIndex, giveErr: giveErr.status ? giveErr.status : false });
                $itemListStr = TPL.compile(tpls.checkableItem)(data);
                $('.item .sum').remove();
            }else {
                if(disabledItem) {
                    $.extend(data, {disabledItem:disabledItem});
                    $itemListStr = TPL.compile(tpls.disableItem)(data);
                }else{
                    $itemListStr = TPL.compile(tpls.item)(data);
                }

            }
            // TPL.helper("checkItemNum", checkItemNum);
            itemListStr.push($itemListStr);

        }
        if (_isEnd) {
            itemListStr.push(tpls.end);
        }
        return itemListStr.join('');
    };
    /**
     * 渲染到指定容器
     * @param  {zepto} $container 容器
     */
    this.appendTo = function ($container) {
        //render
        if (_itemList.length > 0) {
            $container.append(this.renderString());
        } else {
            $container.append(tpls.empty);
        }
        //bindEvent
        this.bindEvent($container);
        $container.find("img").lazyload();
    };
    /**
     * 绑定事件
     * @param  {zepto} $container 容器
     */
    this.bindEvent = function ($container) {
        this.bindGlobalBuyEvent();
        // 保证同一$container事件只绑一次$container事件
        if (!$container.data('ui-item-list-view-event-bound')) {
            this.bindBuyEvent($container);
            $container.data('ui-item-list-view-event-bound', true);
        }
    };
    /**
     * 绑定全局事件
     */
    this.bindGlobalBuyEvent = function() {
        var that = this;
        DOC.off('e-model-cart-remove-item');
        DOC.off('e-model-cart-update-item');
        // 删掉单个商品
        DOC.on('e-model-cart-remove-item', function (e, data) {
            var skuId = data.skuId;
            var $item = DOC.find('.item').filter('[data-sku_id=\'' + skuId + '\']');
            // 当活动分组商品为0时，隐藏整个分组
            $item.siblings().length || $item.parents('.group').hide();
            $item.parent().remove();
        });
        // 当商品购买信息更新（主要是增减购买量、赠品、小计、校验），重新渲染商品
        DOC.on('e-model-cart-update-item', function (e, data) {
            var skuId = data.skuId;
            var itemInfo = data.itemInfo;
            var currentCount = itemInfo.buy_info.count;
            var $item = DOC.find('.item').filter('[data-sku_id=\'' + skuId + '\']');
            var $itemSelect = $item.prev().find('input[name="item-selected"]');
            //勾选状态
            if(data.selected){
                var selected = data.selected > 0;
                if($itemSelect.prop('checked') != selected){
                    $itemSelect.prop('checked', selected);
                }
            }

            // 商品个数
            var $buy = $item.find('.buy');
            var $buyCount = $buy.find('.buy-count');
            if (currentCount > 0) {
                $buy.removeClass('empty');  //移除标识
            } else {
                $buy.addClass('empty');  //增加标识
            }
            $buyCount.text(currentCount);
            // 赠品数量
            if (itemInfo.promo_info.give_list) {
                $item.find('.item-gift').html(TPL.compile(tpls.gift)({item: itemInfo}));
            }
            // 小计
            if (sum) {
                $item.siblings('.sum').find(".sum-num").text(itemInfo.buy_info.summary_text);
            }
            // 显示隐藏原价，只有在分类页才适用
            var $categoryItem = $item.parents('.mod-category');
            if($categoryItem && $categoryItem.length){
                if(currentCount == 0){
                    $item.find('.delete-price').show();
                }else{
                    $item.find('.delete-price').hide();
                }
            }
            // 校验订购数量
           validate && that.checkItemNum($item, currentCount, itemInfo);
        });
    };
    /**
     * 绑定容器事件
     * @param  {zepto} $container 容器
     */
    this.bindBuyEvent = function ($container) {
        // 点击加
        $container.on('click.cart', '.act-add', function (e) { //(controller)
            e.preventDefault();
            /////////// 以下是 act => 数据模型 => 事件通知（回调）更新的思路
            var $this = $(this);
            var $item = $this.closest('.item');
            var skuId = $item.data('sku_id');
            var moq = $item.data('moq');
            var ret = modelCart.add(skuId, moq, e); //参数e：在其他页面需要知道点击了当前的按钮
            if (ret != 0) {
                // 赠品异常，不拦截下单，使用toast提示
                var errMsg = modelCart.getMessage(ret);
                Toast({msg: errMsg, delay: 1000}).show();
                return;
            }
        // 点击减
        }).on('click.cart', '.act-subtract', function (e) {
            e.preventDefault();
            var $this = $(this);
            var $item = $this.closest('.item');
            var skuId = $item.data('sku_id');
            var moq = $item.data('moq');
            var ret = modelCart.subtract(skuId, moq, e); //(model)
            if (ret != 0) {
                Alert.show(modelCart.getMessage(ret));
            }
            // 如果该item没有error-tip，则恢复其正常的margin-top
            if ( $item.find(".error-tip").length === 0 ) $item.removeClass("fix-item-margin-top");
        // 点击删
        }).on('click.cart', '.remove-item', function (e) {//如果在购物车[sum],则允许点击售罄处理清空操作
            e.preventDefault();
            var $this = $(this);
            var $item = $this.closest('.item');
            var skuId = $item.data('sku_id');
            Confirm.show('确认要删除该商品吗?', function () {
              var ret = modelCart.remove(skuId); //(model)
              //if (ret != 0) {
              //    alert(modelCart.getMessage(ret));
              //}
            });
        // 长按商品，抛出事件，业务自己监听并定义回调
        }).on('longTap.cart', '.item', function() {
            $(document).trigger('e-item-longtap', {skuId: $(this).data('sku_id')});
        }).on('change', 'input[name="item-selected"]', function (){
            var $this = $(this);
            var $item = $this.parents('.item-check-label').next();
            var skuId = $item.data('sku_id');
            var selectedBool = $(this).prop('checked');
            var selected = selectedBool ? '1':'0';
            modelCart.select(skuId, selected);
        });
    };

    // 计算小计
    function calculateSum(price, num) {
        return price + " x " + num + " = " + (price * num).toFixed(2);
    }

    // 检测购买数量是否小于最小起订量或大于库存
    this.checkItemNum = function ($item, num, info) {
        // 为什么更新一个商品还要更新一整个列表？？
        var content = this.getErrorContent( num, info );
        var $tip = $item.siblings(".error-tip");

        if(!$tip.parent().hasClass('disable-item')){
            $tip.remove();
            if(content && content.text){
                //控制异常显示黄色背景(样式.error-item)
                $item.parent().addClass('error-item');
                $item.parent().prepend(TPL.compile(tpls.errorTip)(content))
            }else{
                $item.parent().removeClass('error-item');
            }
        }else {
            $tip.remove();
            content.text ='';
            content && content.code && $item.parent().prepend(TPL.compile(tpls.errorTip)(content));
            $item.siblings(".error-tip").empty();
        }
    },

    // 根据传入的数据，返回错误信息
    this.getErrorContent = function ( num, info ) {

      var content = {};
        //是否有赠品 inventory_num
      var hasGiveList = info.give_list && info.give_list.length != 0;
        //赠品不足需要提前判断,因它是出现的优先级较低,若存在普通异常又存在赠品库存不足,则提示普通异常
      if(hasGiveList){
          content = getGiveErrContent(info, info.give_list );
      }

        //errorType , 1为不拦截用户下单; 0为拦截用户下单
      if (info.sale_info.inventory_num == 0) {
          content.text = '售罄';
          content.code = '1002';
          content.errorType = '1';
      } else if (info.sale_info.inventory_num < num) {
          content.text = '库存不足，仅可购买'+info.sale_info.inventory_num+'件，请修改数量';
          content.code = '1022';
          content.errorType = '0';
      }else if (info.sale_info.moq > num && num != 0) {
          content.text = info.sale_info.moq + '件起订，请修改数量';
          content.code = '1001';
          content.errorType = '0';
      } else if (info.sale_info.order_limit < num && num != 0) {
          content.text = '您最多可购买' + info.sale_info.order_limit + '件，请修改数量';
          content.code = '1000';
          content.errorType = '0';
      }
        //秒杀失效
       //timeValid = 1 即将开始， 2 已经结束，0 正在疯抢
       var beginAt = this.getSecKillTime( info, "begin" );
       var endAt   = this.getSecKillTime( info, "end" );
       info["timeValid"] = this.getTimeValid( now, beginAt, endAt );
       //对于秒杀商品的处理
       if ( info.timeValid === 1 ) {
           content.text = '秒杀活动还没开始，不能购买';
           content.code = '1003';
           content.errorType = '1';
       } else if ( info.timeValid === 2 ) {
           content.text = '秒杀活动已经结束，不能购买';
           content.code = '1033';
           content.errorType = '1';
       }

      // 商品下架单独处理，如果else的话，容易受上述状态影响
      // 下架状态改成最终状态
      if (info.sale_info.status == "3" /* && num != 0 */) {
          content.text = '该商品已下架';
          content.code = '2';
          content.errorType = '1';
      }

      return content;
    }

    // 判断赠品异常
    function getGiveErrContent(itemList, giveList ) {
      var giveErr = {};
      var currentCount = itemList.buy_info.count;
      if ( giveList.length ) {
          giveErr.errorGive = '';
        $.each(giveList, function ( index, item ) {
          var giveNum = Math.floor(+currentCount / +item.promo_detail.buy_qty) * +item.promo_detail.give_qty;
          // 如果买品与赠品相同
          if ( itemList.sku_info.sku_id == item.promo_detail.give_sku_id ) {
            if ( giveNum + +itemList.buy_info.qty > item.promo_detail.give_sku_info.inventory_num ) {
              giveErr.status = true;
              giveErr.code = '1021';
              giveErr.errorType = '1';
              giveErr.errorGive =  item.promo_detail.give_sku_info.name;
              giveErr.text =  '赠品库存不足，仅剩' + ( item.promo_detail.give_sku_info.inventory_num - +itemList.buy_info.qty ) +'件';
              return giveErr;
            }
          // 买品与赠品不相同
          } else {
            if ( giveNum > item.promo_detail.give_sku_info.inventory_num ) {
              giveErr.status = true;
              giveErr.code = '1021';
              giveErr.errorType = '1';
              giveErr.errorGive =  item.promo_detail.give_sku_info.name;
              giveErr.text =  '赠品库存不足，仅剩' + item.promo_detail.give_sku_info.inventory_num +'件';
              return giveErr;
            }
          }
        })
      }
      return giveErr;
    }
    //用于清除本地log-page值
    //1. 判断是否是分类页/搜索页/收藏页/历史页 进入的详情页 或是刷新详情页
    //2. 如果不是四个页面进入的, 重置log-page
    //因这四页需要上滑加载,需要页数page
    function cleanLocalPage(pid) {
        var reg = /110016|110010|110011|110023|110020|110009/;
        //获取上一页
        var currentPid = pid;
        if( !reg.test( currentPid ) ){
            Storage.setItem("log-page", 1);
        }
    }

    //// 获取当前的销售价
    //function getCurrentPrice(item) {
    //    if (item.promo_info && item.promo_info.sale && item.promo_info.sale.promo_detail && item.promo_info.sale.promo_detail.promo_price) {
    //        return item.promo_info.sale.promo_detail.promo_price;
    //    } else {
    //        return item.sale_info.sale_price;
    //    }
    //}
    //function getDeletePrice(item) {
    //    if(item.promo_info && item.promo_info.promo_type == 1 &&
    //        item.promo_info.sale && item.promo_info.sale.promo_detail && item.promo_info.sale.promo_detail.promo_price) {
    //        return item.sale_info.sale_price;
    //    } else {
    //        return '';
    //    }
    //}
};
module.exports = UIItemListView;
