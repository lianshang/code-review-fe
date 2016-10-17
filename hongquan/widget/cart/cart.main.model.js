var Backbone = require('home:widget/ui/backbone/backbone.js');
var modelCart = require('home:widget/ui/model-cart/model-cart.js');
var Order = require('home:widget/ui/order/order.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');

var CartMainModel = Backbone.Model.extend({
    url: "/shopping/cart/calpricev2",
    // 当前的xhr对象
    xhr: null,

    empty: function () {
        modelCart.empty( {storageTypeId: this.getLocalCurrentTab()} );
    },

    defaults: {
      storageTypes: null, // 当前的商品包含多少种仓库
      currentTab: null,   // 当前选择的仓库
      tabs: null,         // 后端返回的仓库对象
      cartData: null,     // 本地存储中购物车数据
      isShowTabs: false,  // 是否显示tabs
      itemList: null,     // 当前仓库下的商品
      disabledItem: null,   //失效商品
      warnedErrorItem: null,     //失效商品+赠品库存不足异常
      hasWarned: false,  //是否已经提醒用于处理失效商品与赠品库存不足的问题
      goToError: false,  //是否直接定位异常
    },

    submit: function () {
        // 此处提交，需要把仓库信息也提交过去
        Order.create({storageTypeId: this.getLocalCurrentTab()});
    },

    update: function (opts) {
        opts = opts || {};
        opts.refresh && modelCart.updateLocalSave();
        var _data = {sku_list: []};
        var carts = modelCart.getAll();
        this.updateBuyCart();
        this.set("carts", carts);
        this.getTabs( carts );
        if ( !opts.currentTab ) this.getCurrentTab();

        this.getItemList( carts );

        this.set({
          cartData: {sku_list: this.get("itemList")},
          updatingTotal: !!opts.updatingTotal
        });
        opts.isShowTabs && this.set({isShowTabs: true});
        opts.refresh && this.trigger('e-cart-model-refresh');
    },

    // 获取某一分类下的商品数量
    getCount: function ( currentTab ) {
      if ( !currentTab ) return;
      var count = 0;
      var carts = modelCart.getAll();
      $.each(carts, function ( i, v ) {
        if ( currentTab == v.storageTypeId ) {
          count += v.count;
        }
      });
      return count;
    },

    // 获取当前的tab
    // 此种情况比较多，下面分别判断
    getCurrentTab: function () {
      var currentTab = null;
      var _currentTab = this.getLocalCurrentTab();
      var storageTypes = this.get("storageTypes");
      if ( _currentTab ) {
        currentTab = _currentTab; // 如果设置过，则取设置的值
        if ( storageTypes.length == 1 && storageTypes[0] != _currentTab ) {
          currentTab = storageTypes[0]; // 如果设置过，设置的值和仓库商品的属性值不同，则取商品的仓库属性值
        }
      } else {
        // 如果没有设置过，且存在两种仓库，取最小值
        if ( storageTypes.length >= 2 ) {
          currentTab = Math.min.apply(Math, storageTypes);
        // 如果只有一个仓库，就取该值
        } else {
          currentTab = storageTypes[0];
        }
      }
      this.setLocalCurrentTab(currentTab);
      return this;
    },

    // 暂时将currentTab保存到localstorage中
    // 因为去获取优惠券的时候也需要提交该值
    // 那是时候直接从localstorage中取
    setLocalCurrentTab: function ( tabId ) {
      Storage.setItem( "model-cart-current-tab", +tabId );
    },
    getLocalCurrentTab: function () {
      return Storage.getItem( "model-cart-current-tab" ) || null;
    },

    // 获取所有的仓库分类
    getTabs: function ( carts ) {
      var tabs = [];
      $.each( carts, function ( index, item ) {
        // 获取所有的仓库类别
        item.storageTypeId = item.storageTypeId || '1';
        if ( $.inArray( item.storageTypeId, tabs ) < 0 ) {
          tabs.push(item.storageTypeId);
        }
      });
      this.set({storageTypes: tabs});
      return this;
    },

    // 获取某一仓库下的所有商品：itemList
    // 同时记录该仓库下所有商品的数量：count
    getItemList: function ( carts ) {
      var currentTab = this.getLocalCurrentTab();
      var itemList = [];
      if ( carts || $.isArray( carts ) || carts.length ) {
        for (var i = 0, len = carts.length; i < len; i++) {
          var item = carts[i];
          if ( item.storageTypeId == currentTab ) {
            itemList.push({
              sku_id: item.skuId,
              qty: item.count,
              selected: item.selected
            });
          }
        }
      }
      this.set({itemList: itemList});
      return this;
    },

    //更新原购物车中商品信息 TODO:并未改变localStorage中的数据
    updateBuyCart: function () {
        var cart = modelCart.getAll();
        if(cart.length>0 && !cart[0].hasOwnProperty('selected')){
            $.each(cart, function(k,v) {
                v['selected'] = '1';
            });
        }
    },

    // 获取所有购买的数据
    getBuyCount: function () {
      var count = 0;
      var blocks = this.get('allItemList') || [];
      var localBlocks = modelCart.getAll();
      var skuIndexArr = this.getSkuIndexArr( localBlocks );
      $.each(blocks, function ( index1, itemList ) {
        var itemList = itemList.item_list;
        $.each(itemList, function ( index2, item ) {
          var skuIndex = skuIndexArr.indexOf( item.sku_info.sku_id );
          if ( skuIndex >= 0 && localBlocks[skuIndex].selected == 1 ) {
            count += +item.buy_info.qty;
          }
        });
      });
      return count;
    },

    // 获取本地商品的sku_id-index的对照表
    getSkuIndexArr: function ( localBlocks ) {
      return localBlocks.map(function ( item, index ) {
        return item.skuId.toString();
      });
    },

    updateTotal: function () {
        this.update({updatingTotal: true});
    },

    //获得无效商品列表(售罄下架)
    // 格式化数据(删除无效收据)
    checkDisabledItem: function (itemList) {
        var disabledItemList = {};
        var item_list = [];
        var _itemList = [];
        modelCart.emptyDisable();
        //筛选出单个block_list
        $.each(itemList, function(k, v) {
            item_list = [];
            //将有效商品与无效商品分开
            v.item_list.filter(function (value,index) {
                var sku_id = value.sku_info.sku_id;
                if(value.sale_info.inventory_num == 0 || value.sale_info.status == '3'){
                    if(!disabledItemList['item_list']){
                        disabledItemList['item_list'] = [];

                    }
                    modelCart.updateDisableCounter(sku_id, +value.buy_info.qty, value.buy_info.selected);
                    disabledItemList['item_list'].push(value);

                }else {
                    item_list.push(value);
                }
            });

            //如果有非失效商品
            if(item_list.length){
                var item = {};
                item.item_list = item_list;
                if(v.item_head) {
                    item.item_head = v.item_head;
                }
                _itemList.push(item);
            }

        });
        if (disabledItemList && disabledItemList.item_list){
            disabledItemList['disabledItem'] = true;
        }
        this.set({disabledCounter: modelCart.getDisable()});

        return { disabledItemList:disabledItemList, itemList:_itemList };
    },
    /***
     * 获取被选中异常tips
     * @param errorItem    zepto object      .error-tip异常条
     */
    getSelectedErrorTip: function (errorItem){
        var $tip = [];
        //获取勾选商品异常
        errorItem.each(function(index,value){
            //当前商品勾选状态(失效商品没有勾选状态)
            var selected = $(value).siblings('.item-check-label').find('input[name="item-selected"]').prop('checked');
            //处理失效商品tips, 强制设为true
            if(!$(value).siblings('.item-check-label').length){
                selected = true;
            }
            if(selected){
                $tip.push(value);
            }
        });
        return $tip;
    },

    /**
     * 异常条排序, 拦截异常在前,非拦截异常在后
     * @param $errorItem   zepto object   异常条
     */
    formatErrorTip: function(errorItem){
        var $errorItem = errorItem;  //所有tips
        var $otherItem = [];    //其他异常tips
        var $disableItem = [];  //失效商品异常tips
        var $giveItem = [];     //赠品异常tips
        var warnedErrorItem = [];  //失效异常+赠品库存不足
        var hasALL = false;     //失效和赠品库存是否同时存在
        //筛选
        $.each($errorItem,function(k,v){
            //筛选需要拦截的异常
            if($(v).data('errorType') == '0')
            {
                $otherItem.push(v);
                //筛选不需要拦截的赠品异常
            }else if($(v).data('errorType') == '1' && $(v).data('code') == '1021'){
                $giveItem.push(v);
            }else {
                $disableItem.push(v);
            }
        });
        $errorItem = [];
        $errorItem = $errorItem.concat($otherItem, $giveItem, $disableItem);

        //如果失效与赠品库存不足同时出现时,hasAll为true
        if( $disableItem.length && $giveItem.length ){
            hasALL = true;
        }
        //如果有拦截异常, 先定位拦截异常
        if($otherItem.length){
            $errorItem = $otherItem;
        }else{
            $errorItem =[];
            $errorItem = $errorItem.concat($giveItem, $disableItem);
        }

        warnedErrorItem = warnedErrorItem.concat($giveItem, $disableItem);
        //设置warnedErrorItem
        this.set('warnedErrorItem', warnedErrorItem);

        return { errorItem: $errorItem, otherItem: $otherItem, giveItem:$giveItem, disableItem:$disableItem, hasALL: hasALL};
    },

    //获取购物车中多个赠品不足(最多三个)
    getGiveError: function (errorItem) {
        var errorGives = [];
        var deng = '';
        $(errorItem).each(function(index,value) {
            if( $(value).data('code') == '1021' ){
                if(index <= 2){
                    errorGives.push($(value).data('errorGive'));
                    //三个以上加等
                }else if (index == 3){
                    deng = '等';
                }
            }
        });
        errorGives = errorGives.join(',') + deng;
        return errorGives;
    },

    //购物车异常提示
    /**
     *
     * @param error.errorItem       zepto object        需要定位的异常组,(分组定位异常,拦截异常为一组循环提示,不拦截异常为一组提示一次)
     * @param error.currentItem     zepto object        当前定位的异常
     * @param error.hasAll                              是否同时存在失效和赠品库存不足
     */
    getWarnedTip: function (error) {
        var that = this;
        var warnedTip = '';
        if(typeof error == 'string' ){
            warnedTip = error;
            return warnedTip;
        }else {
            var currentItem = error.currentItem; //当前错误提示
            var errorItem = error.errorItem;
            var errorType = currentItem.data('errorType') || '0';
            var errorCode = currentItem.data('code') || '';
            //失效和赠品库存不足同时存在
            if(error.hasAll == true) {
                errorGives = that.getGiveError(errorItem);
                warnedTip = '购物车存在失效商品。【赠品不足】' + errorGives + '库存不足；是否去结算?';
                //只存在赠品库存不足
            }else if ( errorCode == '1021' ) {
                errorGives = that.getGiveError(errorItem);
                warnedTip = '【赠品不足】' + errorGives + '库存不足， 是否去结算?';
            }else {
                warnedTip = '购物车存在失效商品， 是否去结算?';
            }
            return warnedTip;
        }
    },

});

module.exports = new CartMainModel();
