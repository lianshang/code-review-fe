/**
 * @require cart.less
 */

var $ = require('home:widget/ui/zepto/zepto.js');
var T = require('home:widget/ui/tpl/tpl.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var CartMainModel = require('home:widget/cart/cart.main.model.js');
var UIItemListView = require('home:widget/ui/ui-item-list-view/ui-item-list-view.js');
var modelCart = require('home:widget/ui/model-cart/model-cart.js');
var tpl = require('home:widget/cart/tpl.js');
var Loading = require('home:widget/ui/loading/loading.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Confirm = require('home:widget/ui/confirm/confirm.js');
var Order = require('home:widget/ui/order/order.js');
var Log = require('home:widget/ui/log/log.js');

var Win = $(window);
var Cart = Backbone.View.extend({
    model: CartMainModel,
    className: 'mod-cart header-fixed',
    id: 'cartCanvas',
    events: {
        "click .empty-cart.active": "emptyCart",
        "click .balance": "submit",
        "click .balance.error": "goToError",
        "click .categories": "switchTabs",
        "e-balance": "submit",
        'change input[name="all-selected"]': 'actionAllSelect', //全选按钮事件
        'click .empty-disabled': 'actionEmptyDisabledItem'
        //"click .item-link": "saveBackUrl" */// (此处都要用click)为了商品详情页返回按钮返回前一个页面并且刷新页面，需要将前一个的url记录下来
    },

    timer: null,
    updateTimer: null,
    _fromSubmit: false,
    _isAbort: false,  //是否abort ajax请求
    /**
     * 只有本地中没有商品存储时，才不激活清空按钮
     * @param {total} number 当前商品总数
     * @param {action} string 当前执行的动作, such as : init, add, substract, batchAdd etc.
     */
    hideEmptyBtn: function ( total, action ) {
      var carts;
      if ( total === 0 ) {
        carts = modelCart.getAll();
        if ( carts.length === 0 || action == 'switch' )
          this.$('.empty-cart').removeClass('active');
      }
    },
    //@param opts.sku_id  异常商品sku_id(确认下单页,异常商品处理返回购物车)
    initialize: function (opts) {
        var that = this;
        if(opts && opts.thisError){
           this.thisError = opts.thisError;
        }
        that.initUI();
        that.listenTo(that.model, "change:cartData", that.updateAll);
        that.listenTo(that.model, "change:tabs", that.renderTabs);
        that.listenTo(that.model, "e-cart-model-refresh", that.updateAll);
        that.listenTo(that.model, "change:warnedErrorItem", that.setHasWarned); //监听只提示一次的非拦截商品
        //that.listenTo(that.model, "change:disabledItem", that.updateUpdatingTotal);
        that.listenTo(that.model, "change:disabledCounter", that.updateUpdatingTotal);

        // 这里暂时用jquery的事件来处理
        // 将来modalChart迁移至backbone时
        // 再改回backbone的方式, 直接监听cartModel的变化
        // this.listenTo(cartModel, "change", this.updateTotal);
        $(document).on("e-model-cart-update-total.cart", function (e, t) {
            if ( t.action == 'noUpdate' ) return;
            that.eventFromTarget = t.eventFromTarget || null; // 记录从哪里触发的事件
            if (conf.currentView === "cart") {
                that.hideEmptyBtn( t.total );
                // 如果执行的是清空操作，则不重新请求数据
                if ( t && t.action && t.action === 'empty' ) {
                  that.emptyTab( t.nowTab );
                } else {
                  if ( t && t.action && t.action === 'remove' ) {
                    var countOfTab = that.model.getCount( t.nowTab );
                    if ( countOfTab === 0 ) {
                      that.emptyTab( t.nowTab );
                      return;
                    }
                  }
                  if ( t && t.action && t.action === 'emptyDisable' ){
                      that.$('.disabled-items').remove();
                  }
                  that.model.updateTotal();
                  that.setFromSubmit();

                  if(that.model.get('goToError')){
                     //防止修改数量就定位异常
                     that.model.set('goToError', false);
                  }
                }
            }
        // 长按商品删除
        }).on('e-item-longtap.cart', function(e, data) {
            if (conf.currentView === "cart") {
                Confirm.show('确认要删除该商品吗?', function () {
                    modelCart.remove(data.skuId);
                });
            }
        // 全选
        }).on('e-item-list-update-all-selected', function(e){
            that.updateAllSelect();
        });
        // 去结算前校验，通过则提交，失败则弹框告知用户
        that.$el.on('e-order-check-pass', function() {
            that.model.submit();
        }).on('e-order-check-fail', function(e, data) {
            Confirm.show(data.msg, function() {
                that.model.submit(); // 确定则提交
            }, function() {
                location.reload(); // 取消则更新购物车内容
            });
        });
    },

    close: function() {
        this.undelegateEvents();
        this.remove();
        clearTimeout(this.updateTimer);
        clearTimeout(this.timer);
        $(document).off('.cart');
    },

    // tab切换
    switchTabs: function ( e ) {
      var $cate = $(e.target);
      var active = "active";
      var currentTab = $cate.data("cate");
      var count;
      if (!$cate.hasClass( active )) {
        count = this.model.getCount(currentTab);
        this.$('.item-list').empty();
        $cate.addClass( active ).siblings().removeClass( active );
        this.model.setLocalCurrentTab(currentTab);
        this.model.update({currentTab: currentTab});
        this.hideEmptyBtn( count, "switch" );
      }
    },

    // 清空某一tab
    emptyTab: function ( tabId ) {
      if ( !tabId ) return;
      var countOfTab = this.model.getCount( tabId );
      if ( countOfTab === 0 ) {
        this.$('.nodata').show();
        this.$(".coupon-tips-container").hide();
        this.$('.common-control').hide();
        this.$('.empty-cart').removeClass('active');
        return true;
      }
      return false;
    },

    // 生成Tabs
    renderTabs: function () {
      var tabs = this.model.get("tabs") ? this.model.get("tabs").content : {};
      var storageTypes = this.model.get("storageTypes") || [];
      var currentTab   = this.model.getLocalCurrentTab();
      var $cate = this.$(".categories");
      if ( storageTypes.length >= 2 ) {
        $cate.html(T.compile(tpl.tabs)({ tabs: tabs }))
             .find('.cate[data-cate="' + currentTab + '"]')
             .addClass("active");
      } else {
        $cate.hide();
      }
    },

    updateAll: function() {
        var that = this;
        clearTimeout(that.updateTimer);
        that.updateTimer = setTimeout(function() {
            that.render();

        }, 200);
    },
    /**
     * 获取赠品数据
     * @param  {Array} blockList 购物车数据
     * @return {Array}           赠品数据
     */
    getGiveData: function(blockList) {
        var giveList = [];
        blockList.forEach(function(n, m) {
            if (n.item_list && n.item_list.length) {
                n.item_list.forEach(function(v, k) {
                    if (v.give_list && v.give_list.length) {
                        v.give_list.forEach(function(j, i) {
                            giveList.push({
                                sku_id: j.promo_detail.give_sku_id,
                                qty: j.real_give_qty,
                                f_sku_id: v.sku_info.sku_id
                            });
                        });
                    }
                });
            }
        });
        return giveList;
    },

    initUI: function () {
      var that = this;
      that.$el.html(T.compile(tpl.content)({}));
      $(document.body).append(that.$el);
    },

    render: function () {
        var that = this;
        var cartData = that.model.get("cartData");
        var currentLength = cartData.sku_list.length;

        // 如果当前的请求还没有完成，则取消当前请求
        if ( that.model.xhr && that.model.xhr.readyState !== 4 ) {
            that._isAbort = true;
            that.model.xhr.abort();

        }

        if (currentLength) {
            !that.timer && (that.timer = setTimeout(function () {
                that.timer = null;
                Loading.show("数据加载中...");
            }, 300));
            that.model.xhr = that.model.fetch({
                type: "POST",
                dataType: "json",
                timeout: 10000,
                data: cartData,
                success: function (_, response) {
                    that._isAbort = false;
                    // 保存请求成功时的本地时间，后面有时间计算，如果一个用服务器时间，一个用本地时间，会产生问题，毕竟客户机的时间不准确
                    // 所以，两个时间都取客户机上的吧
                    //_.set('lastOpreTime', +new Date());

                    if (response && response.ret === 0 && response.content && (response.content.block_list.length || response.content.item_list.length)) {
                        var content = response.content;
                        that.$(".nodata").hide();
                        var now = parseInt(response.timestamp, 10) * 1000;
                        // 整合商品数据，把普通商品列表格式化成分组列表中的最后一个元素
                        if (content.item_list.length) {
                            content.block_list.push({
                                item_list: content.item_list
                            });
                        }
                        // 保存所有的数据
                        _.set('allItemList', JSON.parse(JSON.stringify(content.block_list)));
                        //整合失效商品
                        var list = that.model.checkDisabledItem(content.block_list);

                        var disableItem = list.disabledItemList;
                        //处理 删除空itemList
                        content.block_list = list.itemList;

                        if(disableItem && disableItem.item_list){
                            content.block_list.push(disableItem);
                            that.model.set('disableItem', disableItem);

                        }

                        //更新优惠券tips
                        that.updateCouponTip( content );

                        if (that.model.get("updatingTotal")) {
                            // 更新活动标题
                            that.updateGroupTitle(content.block_list);
                        } else {
                            // 更新整个商品列表
                            that.updateList(content.block_list, now);
                            that.updateGive();
                        }
                        // 是否更新tabs
                        // 只有在切换main-nav的时候才会更新
                        if ( that.model.get("isShowTabs") ) {
                          that.model.set({tabs: {
                            content: content.tabs,
                            alwaysChange: +new Date()
                          }});
                          that.model.set("isShowTabs", false);
                        }


                        //更新商品的信息（为方便更新小计）
                        $.each(content.block_list, function(k, v) {
                            modelCart.updateItems(v.item_list);
                        });
                        // 更新总计
                        that.updateTotal(content.money_info, content.discount_tips);


                        that.model.set('giveData', that.getGiveData(content.block_list));

                        //只能在此处取完整的异常信息
                        var $errorTips = that.$el.find('.error-tip');
                        $errorTips = that.model.getSelectedErrorTip($errorTips);
                        //上报异常数据
                        if($errorTips && $errorTips.length){
                            that.logError($errorTips);
                            //从确认下单页返回定位
                            if(that.thisError){
                                that.goToThisError(that.thisError);
                                //更新数据后定位
                            }else if (that.model.get('goToError')){
                                that.goToThisError(1);
                            }
                            //如果点击结算进入的render,并且没有异常时, 执行下一步
                        }else if(that._fromSubmit){
                            that.realSubmit();
                        }

                    } else if (response && response.ret === 100021) {
                        Alert.show(response.msg, function() {
                            location.reload();
                        });
                    } else {
                        that.noResponse();
                        Alert.show(response.msg);
                    }
                    Loading.hide();
                    if (that.timer) {
                        clearTimeout(that.timer);
                        that.timer = null;
                    }
                },
                error: function (a, b, c) {
                    Loading.hide();
                    if (that.timer) {
                        clearTimeout(that.timer);
                        that.timer = null;
                    }
                    if(!that._isAbort){
                        Alert.show("网络不太好, 请刷新!");
                    }
                }
            });
        } else {
            that.$(".nodata").show();
            that.$(".coupon-tips-container").hide();
            that.$(".item-list").hide();
            that.$(".summary").hide();
            that.$(".tips").hide();
        }
    },

    updateList: function (list, now) {
        var self = this;
        var $target = self.$(".item-list");
        $target.empty();
        $.each(list, function(k, v) {
            var $group = $(T.compile(tpl.group)(v)).appendTo($target);
            var data = {itemList: v.item_list, sum: true, validate: true, now: now, checkable: true};

            //失效商品处理
            if (v.disabledItem) {
                delete data.checkable;
                $.extend(data, {disabledItem: true, groupIndex:k});
            }else{
                $.extend(data, {groupIndex:k});
            }

            if(data.itemList.length){
                var itemView = new UIItemListView().init(data);
                itemView.appendTo($group);
            }
            if (v.disabledItem) {
                $(tpl.emptyDisabled).appendTo($group);
            }

        });
        $target.show();
        self.$('.empty-cart').addClass('active');
        self.updateAllSelect();
    },

    // 自动调整列表到底部的距离
    fixMarginBottom: function () {
      var $tips = $('.coupon-tips-container');
      var $itemList = this.$('.item-list');
      var $gift = this.$('.gift');
      $itemList.css('margin-bottom', $tips.height() + 30 + 'px');
      var $div = $('<div class="test-css3"></div>').appendTo(document.body);
      if ( ( 'webkitBoxFlex' in $div[0].style ) && !( 'flex' in $div[0].style ) ) {
        $(document.documentElement).addClass('no-webkit-flex');
        $.each($gift, function ( index, gift ) {
          $(gift).parents('.item-checkbox').addClass('no-flex-item-content');
        });
      }
      $div.remove();
    },

    // 更新总计
    updateTotal: function (money, discount_tips) {
        var isAddOrder = Storage.getItem('add-order-id');
        var orderMinMoney = money.order_min_money;  // 最小起送价
        var $summary = this.$('.summary').show();
        this.currentError = 0; // 初始化错误数量为0，在gotoError方法中会使用
        var $discountTip = $summary.find(".discount-tip");

        $summary.find(".total-price").find('.actual').text("总计:￥" + money.money);
        $summary.find(".total-price").find('.save').text(money.coupon_margin_money != 0 ? "已优惠￥" + (money.coupon_margin_money) : "");
        $discountTip.html(discount_tips || '&nbsp;');
        discount_tips ? $discountTip.addClass('fix-margin') : $discountTip.removeClass('fix-margin');

        // 如果当前订单总额大于最小起送价，并且没有异常商品
        this._updateBalanceState( orderMinMoney, money.money, isAddOrder );
        this._updateGiveQty();
        // 调整列表距离底部的距离
        this.fixMarginBottom();
        $(document).trigger('e-model-cart-update-total', {action: 'noUpdate'});
    },

    // 更新结算按钮的状态
    _updateBalanceState: function ( orderMinMoney, nowBuyMoney, isAddOrder, itemList ) {
      var $balance     = this.$(".balance");
      var $errorItem   = this.model.getSelectedErrorTip( this.$(".error-tip") );
      var $formatError = this.model.formatErrorTip($errorItem);
        //拦截异常
      var $preventItem = $formatError.otherItem;
        //非拦截异常
      var $unpreventItem = $formatError.giveItem;
      $unpreventItem = $unpreventItem.concat($formatError.disableItem);

      var errorItemLen = $errorItem.length;
      var preventItemLen = $preventItem.length;
      var unpreventItemLen = $unpreventItem.length;

      var errorText    = isAddOrder ? '补单起送<br/>无限额' : orderMinMoney + "元起送"; // 异常提示
      var buyCount     = +this.model.getBuyCount();
      var successText  = "结算(" + ( buyCount > 99 ? '99+' : buyCount ) + ")"; // 获取当前购买的数量

      // 正常提交
      //if (parseFloat(orderMinMoney) <= parseFloat(nowBuyMoney) && !preventItemLen && !unpreventItemLen || isAddOrder) {
      //  $balance.removeAttr("disabled").removeClass('disable').removeClass("error").html(successText);
      //  //if ( this.isFromSubmit && !errorItemLen ) {
        //  this.isFromSubmit = false;
        //  this.model.submit();
        //}
      // 如果当前订单总额大于最小起送价，此时有异常商品，显示异常
      //} else if (parseFloat(orderMinMoney) <= parseFloat(nowBuyMoney) && preventItemLen ) {
      //  $balance.html(successText).addClass("error").removeAttr("disabled").removeClass('disable');
      //
      //    // 如果没有达到订单最小起送价
      //} else if (parseFloat(orderMinMoney) <= parseFloat(nowBuyMoney) && !preventItemLen && unpreventItemLen){
      //
      //} else {
      //  $balance.attr("disabled", "disabled").removeClass("error").html(
      //    buyCount > 0 ?
      //      '结算(' + buyCount + ')<small>' + errorText + '</small>' :
      //      '结算<small>' + errorText + '</small>'
      //  );
      //}
        //如果当前订单总额大于最小起送价
      if(parseFloat(orderMinMoney) <= parseFloat(nowBuyMoney) || isAddOrder){
          $balance.html(successText).removeAttr("disabled").removeClass('disable');
          //没有拦截异常也没有非拦截异常
          if(!preventItemLen && !unpreventItemLen){
              $balance.removeClass('error').removeClass('abnormal');

              //有拦截异常 加类 error
          }else if(preventItemLen){
              $balance.addClass('error').removeClass('abnormal');
              //无拦截异常但有非拦截异常 加类 abnormal
          }else if(!preventItemLen && unpreventItemLen){
              $balance.removeClass('error').addClass('abnormal');
          }
      }else {
          $balance.attr("disabled", "disabled").removeClass("error").html(
              buyCount > 0 ?
              '结算(' + buyCount + ')<small>' + errorText + '</small>' :
              '结算<small>' + errorText + '</small>'
          );
      }

    },

    updateGive: function () {
      // 页面初始化时，判断赠品条是否显示
      var $realGiveQty = this.$('.give-qty.real-give-qty');
      if ( !$realGiveQty.length ) return;
      var $count = +$realGiveQty.text().split('x')[1];
      var $gift  = $realGiveQty.parents('.gift');
      $realGiveQty[ $count ? 'show' : 'hide' ]();
      $gift[ $count ? 'show' : 'hide' ]();
    },

    // 动态更新赠品数量
    _updateGiveQty: function () {
      // 当点击加减按钮的时候，判断赠品条是否显示
      if ( !this.eventFromTarget ) return;
      var itemList = this.model.get('allItemList');
      var event = this.eventFromTarget;
      var $item = $(event.target).parents('.item');
      var $gift = $item.next('.item-gift').find('.gift');
      var $giveQty = $item.next('.item-gift').find('.give-qty');
      var skuId = $item.data('sku_id');
      $.each(itemList, function (index1, item_list) {
        var newItemList = item_list.item_list;
        $.each(newItemList, function ( index2, item ) {
          if ( item.sku_info.sku_id == skuId && item.give_list.length ) {
            var count = +item.give_list[0].real_give_qty;
            $gift[ count ? 'show' : 'hide' ]();
            $giveQty.text(' x' + count).show();
          }
        })
      })
    },


    /**
     * gotoError
     * 宽度定位出错商品
     * top: 出错商品距离页面顶部的高度
     * scrollTop: 滚动条高度
     * bufferHeight: 缓冲高度
     * headerHeight: header的高度
     */
    goToError: function (isSetCurrent) {
        var that = this;
        //获得被选中的异常tips
        var $errorItem = this.$(".error-tip");
        var hasAll = false;  //是否同时有赠品不足异常&失效商品异常,默认没有
        var warnedTip = '';   //提示文字
        //筛选出选中的商品异常
        $errorItem = this.model.getSelectedErrorTip( $errorItem );
        //格式化商品异常, 区分出不同商品异常(如果有拦截异常, 先定位拦截异常)
        error = this.model.formatErrorTip( $errorItem );
        $errorItem = error.errorItem;
        hasAll = error.hasALL;

        var $currentItem = $($errorItem[ this.currentError ]); //当前错误提示
        var errorType = $currentItem.data('errorType') || '0';
        var errorCode = $currentItem.data('code') || '';

        //如果从购物车返回不弹弹框, 并且为当前不是第一个异常,用于返回购物车以后的拦截
        if(this.thisError) {
            that.goTo($currentItem);
            if( errorType == '0' ) {
                if( that.currentError == ($errorItem.length - 1) ){
                    that.currentError = 0;
                }else {
                    that.currentError ++;
                }
            }
            this.thisError = false;
            return;
        }

        //拦截异常
        if( errorType == '0' ) {
            that.goTo($errorItem);
            warnedTip = that.model.getWarnedTip('结算商品可购买数量发生变化，点击查看');

            if( that.currentError == ($errorItem.length - 1) ){
                that.currentError = 0;
            }else {
                that.currentError ++;
            }

            Alert.show(warnedTip, function () {}, '确认');
        //不拦截异常
        }else if ( errorType == '1' /*&& !that.model.get('hasWarned') */) {
            that.goTo($errorItem);
            warnedTip = that.model.getWarnedTip({hasAll: hasAll, currentItem: $currentItem, errorItem: $errorItem});

            Confirm.show(warnedTip, function() {
              that.logConfirmErr( $errorItem, 1 );
              that.realSubmit();
            }, function () {
              that.logConfirmErr( $errorItem, 2 );
            }, {
              confirmText: '去结算'
            });
            //that.model.set('hasWarned', true);
           // this.$('.balance').removeClass("error");
        }


        //异常数据上报
        this.logError($errorItem);

        return false;
    },

    // 上报非拦截下单异常
    // @params {sub} number 1 确认； 2 取消
    logConfirmErr: function ( errItem, sub ) {
      if ( !$.isArray(errItem) ) return;
      var skuList = [];
      var logData = {
        pos: 'pop',
        sub: sub
      };
      var ERR_MAP = {
        '2': 3, // 下架
        '1021': 1, // 赠品库存不足
        '1002': 4,  // 售罄
        '1003': 3   //
      }
      $.each( errItem, function ( index, item ) {
        var $item = $(item);
        var skuId = $item.parent().find('.item').data('sku_id');
        skuList.push({
          sku_id: skuId,
          e_type: ERR_MAP[$item.data('code')]
        })
      });
      logData.sku_list = skuList;
      Log.send({
          action: 'click',
          pid: Log.pid,
          detail: logData
      });
    },

    //定位到第几个异常
    goToThisError: function (thisError) {
        //第几个异常
        if(thisError){
            //第一个异常,将currentError设为0
            this.currentError = thisError -1;
        }
        var isSetCurrent = true;

        //传入参数是否设置当前error,用于下次点击结算时正确定位
        this.goToError(isSetCurrent);

        //如果是点击结算后的定位异常
        if(this.model.get('goToError')){
            //重置,防止已进入购物车就定位异常
            this.model.set('goToError', false);
        }

    },

    //视觉上定位异常
    goTo: function (errorItem) {
        var $errorItem = errorItem;
        if(!$errorItem.length)
        {
            return;
        }
        var top = $errorItem[ this.currentError ].getBoundingClientRect().top,
            headerHeight = this.$("header").height(),
            scrollTop = $("body").scrollTop(),
            bufferHeight = Win.height() / 4;
        // 定位到指定位置
        Win.scrollTop( scrollTop + top - headerHeight - bufferHeight );
    },

    /**
     * 异常上报
     * @param $errorTip   zepto object   异常tip
     */
    logError: function (errorTip) {
        var errorMsg = {},
            errorMsg = errorTip.map(function(value, key){
                var sku_id = $(value).parent().data('sku_id');
                var msg = $(value).data('errorMsg');
                var ret = $(value).data('code');
                return {
                    sku_id : sku_id,
                    msg : msg,
                    ret : ret
                }
            });
        Log.send({
            action: 'click',
            pid: Log.pid,
            detail: {
                settle_ment: 0,
                msg: errorMsg,
                extend:''
            }
        });
    },

    updateGroupTitle: function(list) {
        var $titles = this.$(".item-list").find('.title');
        $.each(list, function(k, v) {
            if (v.item_head && v.item_head.text) {
                $titles.eq(k).find('span').html(v.item_head.text);
            }
        });
    },

    emptyCart: function () {
      var self = this;
      Confirm.show('确定清空当前购物车吗?', function () {
        self.model.empty();
      });
    },


    submit: function ( e ) {
        // 判断用户操作是否超时，测试超时时间为1分钟
        /*var lastOpreTime = this.model.get('lastOpreTime');
        if ( ( ( +new Date() - lastOpreTime ) / ( 1000 * 60 ) ) >= 1 ) {
            this.isFromSubmit = true;
            this.model.updateTotal();
            return;
        }*/

        // 检测是否具有异常状态，如果有，拒绝提交
        var $target = $(e.target);
        //有拦截异常
        if ( $target.hasClass( "error" ) ) {
            this.model.set('goToError', false);  //不让自动定位
            return false;

        }else {
            //有非拦截异常时
            this.updateAll();
            this.model.set('goToError', true);
            //更新页面数据
            if ( ! $target.hasClass( "abnormal" ) ){

                this._fromSubmit = true;
            }
            return false;
        }
    },
    //真正意义上的结算
    realSubmit: function () {
        // 登录状态则直接提交；未登录状态则跳转到登录页，后接能够进入订单提交页的redirectUrl
        if (conf.userData.is_login) {
            // // 如果有赠品，则先校验赠品是否失效
            // var giveData = this.model.get('giveData');
            // Order.check($.extend({give_list: giveData}, this.model.get('cartData'), {coupon: 0}), this.$el, 0);
            // 这里不进行赠品的校验，在提交订单的时候，一起校正
            this.model.submit();
        } else {
            window.location.href = '/account/user/login?redirectUrl=' + encodeURIComponent('/#shopping/cart/submit');
        }
    },

    //点击全选事件
    actionAllSelect: function (e) {
        var $target = $(e.currentTarget);
        var selectedBool = $target.prop('checked');
        var selected = selectedBool ?'1' : '0';
        var currentTab = Storage.getItem('model-cart-current-tab');
        //获得购物车中所有商品信息
        var cart = modelCart.getAll();
        cart = cart.filter(function(value){
            return value.storageTypeId == currentTab;
        });
        var unselectedItem = cart;

        //勾选全选,获取购物车中未勾选商品信息
        if(selectedBool){
            unselectedItem = cart.filter(function(value){
                return value.selected == '0';
            });
        }
        $.each(unselectedItem,function(index, value){
            modelCart.select(value.skuId, selected);
        });

        this.$el.find('input[name="item-selected"]').prop('checked',selectedBool);
    },
    //清空失效宝贝
    actionEmptyDisabledItem: function (){
        var that = this;
        var disableItem = that.model.get('disableItem').item_list;
        var _disableItem = {};

        $.each(disableItem, function(k, v){
            _disableItem[v.sku_info.sku_id] = v.sku_info.sku_id;
        });
        Confirm.show('是否清除失效商品', function () {
            modelCart.empty({sku_list: _disableItem});
            modelCart.emptyDisable();
        });
    },

    //渲染优惠券tips
    updateCouponTip: function (content) {
        var that = this;
        var couponTips = [];
        if(content.coupon_tips.length) {
            couponTips.push({
                coupon_tip: content.coupon_tips,
                coupon_title:'优惠券'
            });
        }
        if(content.cash_coupon_tips.length) {
            couponTips.push({
                coupon_tip: content.cash_coupon_tips,
                coupon_title:'现金券'
            });
        }
        that.$('.coupon-tips-container').remove();
        that.$('.summary').prepend(T.compile(tpl.couponTip)({couponTips: couponTips}));
    },


    //联动全选按钮
    updateAllSelect: function () {
        var that = this;
        var unchecked = that.$('input[name="item-selected"]').filter(function () {
            return $(this).prop('checked') == false;
        });
        unchecked.length ?
            that.$('input[name="all-selected"]').prop('checked', false) :
            that.$('input[name="all-selected"]').prop('checked', true);
    },
    //设置是否提醒. 当失效商品与买赠有变化时,才置为true
    setHasWarned: function () {
        this.model.set('hasWarned', false);
    },
    //更新UpdatingTotal
    updateUpdatingTotal: function () {
        this.model.set('updatingTotal', false);
    },
    //更新 是否从结算按钮触发
    setFromSubmit: function () {
        this._fromSubmit = false;
    },

    noResponse: function () {

    }

    // saveBackUrl: function(e) {
    //     e.preventDefault();
    //     Storage.setItem('item_redirect', encodeURIComponent(window.location.href));
    //     window.location.href = $(e.target).attr('href') || '/';
    // }
});

module.exports = Cart;
