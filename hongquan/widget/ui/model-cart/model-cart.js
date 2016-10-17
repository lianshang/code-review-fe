var $ = require('home:widget/ui/zepto/zepto.js');
var helper = require('home:widget/ui/helper/helper.js');
var Log = require('home:widget/ui/log/log.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');

/**
 * 【单例?】购物车数据处理模型,处理包括:购物车元数据刷新/响应购物操作,反馈购物限制,持久化购买操作等策略
 * NOTICE: 模型通过事件方式,向外通知自身状态变更（ 暂定通过 $(document).trigger ）
 */
var ModelCart = function () {
    var NAME = "model-cart-buy-counter";
    var DISABLE = "model-cart-disable-counter";
    var KEY = "model-cart-key";
    var KEY_ZONE_ID = 'model-cart-zone-id';

    var inited = false; // 标识是否初始化过

    // var _lastUserUpdateAt = 0;  //标识用户上次操作的时间
    //var _lastLocalSaveAt = 0;   //标识上次持久化执行时间

    ////记录用户购买了哪些商品
    //var _buyCounter = {
    //    //sku_id: count
    //};

    //记录了用户购买了哪些商品（有序的）每次有商品入帐时,将新增的商品放到第一位
    var _arrBuyCounter = [
        //{skuId: 'xx', count: '11', selected:'0'},...
    ];
    //记录了购物车中失效商品的数量
    var _arrDisableCounter = [
        //{skuId: 'xx', count: '11', selected:'0'},...
    ];

    //记录总购物数
    var _buyTotal = 0;
    //记录当前zone_id
    var _zoneId = '';   //未知

    //外部数据,商品的详细属性清单,包括限购等标识
    var _itemInfo = {
        //{}
    };

    //错误类型
    var ERR_CODE = {
        'success': 0,
        'max_limit': '1000',
        'moq': '1001',
        'promo_order_limit': '1011',
        'promo_inventory_limit': '1012',
        'order_limit': '1021',
        'inventory_num': '1022',
        'not_exist': 2,
        'unknown': -1,
        'give_limit': '1023'
    };
    var ERR_MSG = {
        '0': '操作成功',
        '1000': '超出最大限购量了',
        '1001': '不足最大起订量',
        '1011': '超出促销最大限购量了',
        '1012': '超出促销最大限购量了',
        '1021': '超出最大限购量了',
        '1022': '库存不足',
        '2': '不存在或已经下架的商品',
        '-1': '未知错误',
        '1023': '赠品不足'
    };
    /**
     * 初始化模型,目前最重要的是初始化商品数据
     * @param options
     */
    this.init = function (options) {
        if (inited) {
            _updateItems(options.itemList);
            return;
        }
        //初始化商品数据
        inited = true;
        _updateItems(options.itemList);   //更新商品items\
        $(document).trigger('e-model-cart-update-total', {total: _buyTotal, action: 'init'}); //first update
    };

    /**
     * 更新商品items情况（需要触发单个的更新事件）未更新count
     * @param itemList
     */
    this.updateItems = function (itemList) {
        if (itemList && itemList.length > 0) {
            for ( var i = 0; i < itemList.length; i++ ) {
                var itemInfo = itemList[i];
                var skuId = itemInfo.sku_info.sku_id;
                _formatItem(itemInfo);  //将数据初处理一下
                _itemInfo[skuId] = itemInfo;
                //触发更新事件
                itemInfo = this.get(skuId); //规整化
                var count = itemInfo.buy_info.count;
                //更新selected属性
                var selected = itemInfo.buy_info.selected;

                //更新列表清单并触发e-model-cart-update-item
                _updateBuyCounter(skuId, count, selected);
                //$(document).trigger('e-model-cart-update-item', {skuId: skuId, itemInfo: itemInfo, count: count, selected: selected});
            }
        }

    };
    /**
     * 将数据初处理一下
     * @param  {Array} itemList 商品列表
     */
    function _updateItems(itemList) {
        if (itemList && itemList.length > 0) {
            for ( var i = 0; i < itemList.length; i++ ) {
                var itemInfo = itemList[i];
                _formatItem(itemInfo);  // 增加价格数据
                _itemInfo[itemInfo.sku_info.sku_id] = itemInfo; // 收集到_itemInfo变量中

            }
        }
    }
    /**
     * 增加价格数据
     * @param  {Object} item 单个商品数据
     */
    function _formatItem(item) {
        // 商品当前的售价
        // 计算比较复杂, 单独提取出去进行计算
        item["currentPrice"] = _getCurrentPrice(item);
        item["deletePrice"] = _getDeletePrice(item);
    }
    /**
     * 获取当前的销售价
     * @param  {Object} item 单个商品数据
     */
    function _getCurrentPrice(item) {
        if (item.promo_info && item.promo_info.sale && item.promo_info.sale.promo_detail && item.promo_info.sale.promo_detail.promo_price) {
            return item.promo_info.sale.promo_detail.promo_price;
        } else {
            return item.sale_info.sale_price;
        }
    }
    /**
     * 获取原价
     * @param  {Object} item 单个商品数据
     */
    function _getDeletePrice(item) {
        //item.sale_info.sale_type 1普通 2秒杀 3套餐
        //item.promo_info.sale.promo_type 活动类型
        if (item.promo_info && item.promo_info.sale &&
            (item.sale_info.sale_type == 3 || item.promo_info.sale.promo_type == 1 || item.promo_info.sale.promo_type == 5)
            && item.promo_info.sale.promo_detail
            && item.promo_info.sale.promo_detail.promo_price) {
            return item.sale_info.sale_price;
        } else {
            return '';
        }
    }

    /**
     * 过滤掉相同仓库的商品，用于“再次购买”场景
     * By Gavin 2016-7-16
     */
    /*function _fileterByTabId( tabId ) {
        //保留旧数据
      var _newArrBuyCounter = _arrBuyCounter;
        debugger;
      $.each(_arrBuyCounter, function ( i, v ) {
        if ( v.storageTypeId != tabId ) {
          _newArrBuyCounter.push(v);
        }
      });
      return _newArrBuyCounter;
    }*/

    /**
     * 批量增加一批商品【购物车的“再次购买逻辑”,需要清空旧的数据,1.8.1改为保留旧数据】
     * @param {Array} skuList
     */
    this.batchAdd = function (skuList) {
        //var self = this;
        //// 获取当前购物车中的商品
        //_buyCounter = self.getAll();

        // 先过滤掉购物车相同仓库的商品
        var tabId = skuList && skuList[0] && skuList[0].storage_type_id;

        // 新增加的商品总数
        var newSkuCount = 0;
        // 遍历新商品列表，得到商品id和数量,重置商品数量 【商品有可能是sku分成两个表示（特价类型）了,要考虑类加的情况】
        skuList.forEach(function (v, k) {
            var currentCount = parseInt(v.qty, 10) || 0;
            var skuId = v.sku_id;
            var buyInfo = _getBuyInfo(skuId);
            if (buyInfo) {
                buyInfo.count += currentCount;
            } else {
                _arrBuyCounter.push({
                    skuId: skuId,
                    count: currentCount,
                    selected: '1',
                    storageTypeId: tabId
                });
            }
            newSkuCount += currentCount;
        });
        _localSave(); // 保存到本地存储
        // _lastUserUpdateAt = new Date();
        _updateTotalBy(newSkuCount, {tabId: tabId, action: "batchAdd"}); // 更新总计值
        _setCartKey();
    };

    /**
     * 根据商品id获取购物车中该商品的购买信息
     * @param  {String} skuId 商品id
     * @return {object}       购物车中该商品的购买信息
     */
    function _getBuyInfo(skuId) {
        for ( var i = 0, len = _arrBuyCounter.length; i < len; i++ ) {
            var _buyItem = _arrBuyCounter[i];
            if (_buyItem.skuId == skuId) {
                return _buyItem;
            }
        }
        return false;
    }

    /**
     * 根据Id获取购物车该失效商品的购买信息
     * @param skuId
     * @returns {*}
     * @private
     */
    function _getDisableInfo(skuId){
        for ( var i = 0, len = _arrDisableCounter.length; i < len; i++ ) {
            var _buyItem = _arrDisableCounter[i];
            if (_buyItem.skuId == skuId) {
                return _buyItem;
            }
        }
        return false;
    }
    /**
     * 根据商品id获取购物车中该商品的的购买量
     * @param skuId
     * @returns 购买量
     * @private
     */
    function _getBuyCounter(skuId) {
        var _buyItem = _getBuyInfo(skuId);
        if (_buyItem) {
            return _buyItem.count;
        } else {
            return 0;
        }
    }

    /**
     * 获取 某个商品信息
     * @param skuId
     * @param key             count/selected      获取某个值的key 如count,selected
     * @param defaultValue                        当没有此商品时,默认返回值
     * @returns
     * @private
     */
    function _getBuyValue(skuId, key, defaultValue) {
        var _buyItem = _getBuyInfo(skuId);
        if (_buyItem) {
            return _buyItem[key];
        } else {
            return defaultValue;
        }
    }



    // 数据上报
    // action 1：减少操作，0：增加操作，2：删除，3：清空
    // opts.tabId 只有在清空的时候才用到
    // opts.index 只有在加车减车的时候用到 index, tabId
    function _sendLog ( skuId, action, opts) {
      var detail = {
        cartype: action,
        sku_id: skuId,
        sku_list: function () {
          return Log.getSkuList();
        },
        extend: ""
      };
      // 适配清空，如果清空操作，提交仓库类型，不提交tabId
      if ( opts.tabId ) detail.storage_id = opts.tabId;
      if ( opts.index ) detail.index = opts.index;
      if ( opts.page ) detail.page = opts.page;
      if ( !skuId ) delete detail.sku_id;
      Log.send({
        action: "click",
        pid: Log.pid,
        detail: detail
      });
    }

    /**
     * 增加一个商品
     * @param skuId  商品id
     * @param moq   商品最小起订量
     * @return {ERR_CODE}
     */
    this.add = function (skuId, moq, eventFromTarget) {
        var ret = _checkCanAdd(skuId);
        var canAdd = false;
        //商品的位置,用于上报
        var index = eventFromTarget ? $(eventFromTarget.target).data('index') : 1;
        var page = eventFromTarget ? $(eventFromTarget.target).data('page') : 1;

        if ( ret == ERR_CODE.success || ret == ERR_CODE.give_limit ) canAdd = true;
        if (canAdd) {
            var currentCount = _getBuyCounter(skuId);
            var step = currentCount === 0 ? moq : 1;
            currentCount += step;
            _updateBuyCounter(skuId, currentCount, '1');
            _updateTotalBy(step, {skuId: skuId, action: "add", eventFromTarget: eventFromTarget});
            _sendLog(skuId, 0, {index: index, page:page}); // 数据上报
            return ret;
        } else {
            return ret;
        }
    };

    /**
     * 减少一个商品
     * @param skuId
     * @param moq   商品最小起订量
     * @return {ERR_CODE}
     */
    this.subtract = function (skuId, moq, eventFromTarget) {
        var currentCount = _getBuyCounter(skuId);
        //商品的位置,用于上报
        var index = eventFromTarget ? $(eventFromTarget.target).data('index') : 1;
        var page = eventFromTarget ? $(eventFromTarget.target).data('page') : 1;
        if (currentCount == 0) {
            _updateBuyCounter(skuId, currentCount, '0');
        } else {
            var step = currentCount === moq ? moq : 1;
            currentCount -= step;
            //商品减为零,取消勾选
            if(currentCount == 0)
            {
                _updateBuyCounter(skuId, currentCount, '0');
            } else{
                _updateBuyCounter(skuId, currentCount, '1');
            }
            _updateTotalBy(-step, {skuId: skuId, action: "subtract", eventFromTarget: eventFromTarget});
        }
        _sendLog(skuId, 1, {index: index, page:page}); // 数据上报
        return ERR_CODE.success;
    };

    /**
     * 移除一个商品（清0）
     */
    this.remove = function (skuId) {
        var currentCount = _getBuyCounter(skuId);
        _updateBuyCounter(skuId, 0, true);
        _updateTotalBy(-currentCount, {action: "remove"});

        $(document).trigger('e-model-cart-remove-item', {skuId: skuId});
        _sendLog(skuId, 2); // 数据上报
        return ERR_CODE.success;
    };


    /**
     * 勾选或取消勾选
     */
    this.select = function (skuId, selected, noUpdate) {
        var currentCount = _getBuyCounter(skuId);
        //var selected = _getBuyValue(skuId, 'selected', true);

        _updateBuyCounter(skuId, currentCount, selected);

        // 勾选 or 取消勾选 更新数量
        if(!noUpdate) {
            selected == '1' ?
                // 总的数量和选中不选中无关，这里传diff = 1或者-1
                _updateTotalBy(0, {action: "selected"}) :
                _updateTotalBy(0, {action: "cancelSelected"});
        }
        //_sendLog(skuId, 2); // 数据上报
        return ERR_CODE.success;
    };

    /**
     * 返回错误码对应的信息
     * @param code
     */
    this.getMessage = function (code) {
        return ERR_MSG[code] || '';
    };

    /**
     * 获取当前购物总量
     */
    this.getTotal = function () {
        return _buyTotal;
    };

    /**
     * 返回商品信息,包括购买情况
     * @param skuId
     * @returns {{}|boolean}
     */
    this.get = function (skuId) {
        var itemInfo = _itemInfo[skuId];
        if (itemInfo) {
            itemInfo['buy_info'] = itemInfo['buy_info'] || {};
            itemInfo['buy_info']['count'] = _getBuyCounter(skuId);  //mix count
            //itemInfo['buy_info']['selected'] = _getBuyValue(skuId, 'selected', '1');
            return itemInfo;
        } else {
            return false;
        }
    };


    /**
     * 更新_arrBugCounter中的count/selected(目的: 保持失效商品的delected状态)
     * @param buyCounter  商品清单
     * @private
     */
    function _set (buyCounter) {
        $.each(_arrBuyCounter, function(index, value) {
            if(value.skuId == buyCounter.skuId) {
                value.count = buyCounter.count;
                value.selected = buyCounter.selected;
            }
        });
        localStorage.setItem(NAME, JSON.stringify(_arrBuyCounter));
    }
    /**
     * 返回所有购买的清单,包括购买情况
     */
    this.getAll = function () {
        return _arrBuyCounter; //JSON.parse(localStorage[NAME]);
    };
    this.getDisable = function () {
        return _arrDisableCounter;
    }

    /**
     * 更新单个商品购买情况
     */
    function _setBuyCounter (buyCounter) {
        $.each(_arrBuyCounter, function(index, value){
            if(value.skuId == buyCounter.skuId){
                value.selected = buyCounter.selected;
                value.count = buyCounter.count;
            }
        });
    };


    /**
     * 清空购物车
     * 如果opts.storageTypeId为空，表示全部清空
     * 否则，只清空该ID下的商品
     *
     * opts.sku_list  需要清除的商品skuId数据(失效商品列表/已选中商品列表) 数据格式如下:
     * {skuId:skuId}, 如{'10223':'10223','12323:'12323'}
     * 适用场景: 清除失效宝贝, 确认下单清除选中商品
     *
     */
    this.empty = function ( opts ) {
        var that = this;
        that._leftTotal = 0;       // 剩余商品的数量
        that.leftBuyCounter = [];  //剩余商品清单,用于更新_arrBuyCounter
        var sku_list =  opts && opts.sku_list || null;  // 需要清除的商品skuId数据

        //更新剩余商品清单&剩余商品数量(加入购物车中其他仓库tab对应的商品清单)
        opts && opts.storageTypeId && this.getTabBuyCounter( opts.storageTypeId);

        //如有需要清空的商品,筛选出需要保留的商品,更新剩余商品清单
        if(sku_list){
            //更新剩余商品清单(加入未勾选商品)
            that.leftBuyCounter = that.leftBuyCounter.concat(
                //反选商品
                //已知需要清除的商品 skuId数据sku_list, 循环_arrBuyCounter, 找出sku_list中没有对应skuId的商品清单
                _arrBuyCounter.filter(function(v, k){
                    if(!sku_list[v.skuId]){
                        that._leftTotal += +v.count;
                    }
                    return !sku_list[v.skuId];
                })
            );

        }else{//没有特定清空商品, 点击清空按钮
            this.emptyDisable();
        }

        //更新_arrBuyCounter, 变为需要保留的商品清单
        _arrBuyCounter = that.leftBuyCounter;

        // 如果不存在opts，则设置nowTab为1；
        if ( !opts ) {
          opts = {};
          opts.storageTypeId = 1;
        }

        _buyTotal = that._leftTotal;  // 获取剩余数量
        _localSave();
        _setCartKey();
        //区别全部清空/部分清空
        if(opts && opts.sku_list){
            $(document).trigger('e-model-cart-update-total', {total: _buyTotal, nowTab: opts.storageTypeId, action: 'emptyDisable'});
        }else {
            $(document).trigger('e-model-cart-update-total', {total: _buyTotal, nowTab: opts.storageTypeId, action: 'empty'});
        }
        _sendLog(null, 3, {tabId: opts.storageTypeId}); // 数据上报*/
    };

    // 根据传入的仓库id，筛选出剩余商品(即另一个仓库的商品)
    this.getTabBuyCounter = function ( tabId ) {
        var that = this;
        if ( !tabId ) return null;

        //获得购物车中另一仓库的商品清单
        $.each(_arrBuyCounter,function(k,v){
            if(v.storageTypeId != tabId){
                that._leftTotal += +v.count;
                that.leftBuyCounter.push(v);
            }
        })
    };

    /**
     * 获取随机数，避免短时间内重复下单
     */
    this.getCartKey = function () {
        if (typeof window.localStorage == 'undefined') {
            return;
        }

        var key = localStorage.getItem(KEY);

        if (!key) {
            _setCartKey();
        }

        return localStorage.getItem(KEY);
    };

    /**
     * 获取本地数据，并去掉空记录
     */
    this.updateLocalSave = function() {
        _localGet();
    };

    /**
     * 设置随机数，避免短时间内重复下单
     */
    function _setCartKey() {
        if (typeof window.localStorage == 'undefined') {
            return;
        }
        localStorage.setItem(KEY, helper.randomKey());
    }

    /**
     * 验证是否可“添加到购物车”,目前主要是验证是否超过限制
     * @param skuId
     * @private
     */
    function _checkCanAdd(skuId) {
        // moq: 最小超订单
        // order_limit: 订购数量
        // inventory_limit: 库存限额
        // give_limit: 赠品不足
        if (_itemInfo[skuId]) {
            var item = _itemInfo[skuId];
            var currentCount = _getBuyCounter(skuId);
            //购买限额
            if (parseInt( currentCount ) >= parseInt( item.sale_info.order_limit ) || parseInt(item.sale_info.moq) > parseInt(item.sale_info.order_limit)) {
                return ERR_CODE.order_limit;
            }
            // 库存限额
            if (currentCount >= item.sale_info.inventory_num) {
                return ERR_CODE.inventory_num;
            }
            // 赠品不足
            var giftErrCode = checkGiveNum( currentCount, _itemInfo[skuId] );
            if ( giftErrCode ) return giftErrCode;

            // 可以继续添加商品
            return ERR_CODE.success;
        } else {
            return ERR_CODE.not_exist;
        }

        // 赠品异常
        // 赠品异常有两种情况，一种是赠品和买品相同，另一种是不同
        function checkGiveNum( currentCount, giveInfo ) {
          if ( giveInfo.promo_info && giveInfo.promo_info.give_list && giveInfo.promo_info.give_list.length ) {
            var giveList = giveInfo.promo_info.give_list;
            for (var i = 0, len = giveList.length; i < len; i++) {
              var item = giveList[i];
              var giveNum = Math.floor(+currentCount / +item.promo_detail.buy_qty) * +item.promo_detail.give_qty;
              var inventoryNum = +item.promo_detail.give_sku_info.inventory_num;
              // 赠品与买品不同
              if ( giveInfo.sku_info.sku_id != item.promo_detail.give_sku_info.sku_id ) {
                if ( giveNum > inventoryNum ) return ERR_CODE.give_limit;  // 1023 赠品不足
              // 赠品与买品相同
              } else {
                if ( giveNum + +currentCount + 1 > inventoryNum ) return ERR_CODE.inventory_num;  // 库存不足
              }
            }
          }
          return 0;
        }
    }

    /**
     * 更新购买数据
     * @param skuId
     * @param count
     * @param isRemove 默认不传,是否强制处理该元素（如果为0的情况下）
     * @private
     */
    function _updateBuyCounter(skuId, count, selected, isRemove) {
        var itemInfo = _itemInfo[skuId];
        // 获取商品仓库信息，默认为1：杂物百货
        var storageTypeId = itemInfo && itemInfo.sku_info.storage_type_id || '1';
        if(!isRemove) {
            //update mem
            var buyInfo = _getBuyInfo(skuId);
            if (buyInfo) {
                buyInfo.count = count;
                buyInfo.selected = selected;
            } else {
                //新添加的放到前面
                _arrBuyCounter.unshift({
                    skuId: skuId,
                    count: count,
                    selected: '1',
                    storageTypeId: storageTypeId
                });
            }
        } else {    //处理
            //对于为0的情况,进行过滤,避免长时间会累加太多数据
            for ( var i = _arrBuyCounter.length - 1; i >= 0; i-- ) {
                var _buyItem = _arrBuyCounter[i];
                if (_buyItem.skuId == skuId) {
                    _arrBuyCounter.splice(i, 1);    //删除掉
                    break;
                }
            }
        }
        //更新itemInfo，增加buy_info
        if (itemInfo) {
            itemInfo['buy_info'] = itemInfo['buy_info'] || {};
            itemInfo['buy_info']['count'] = count;
            itemInfo['buy_info']['selected'] = selected;
        }
        //_buyCounter[skuId] = count;
        //update store
        _localSave();
        // _lastUserUpdateAt = new Date();
        _setCartKey();
        $(document).trigger('e-model-cart-update-item', {skuId: skuId, itemInfo: itemInfo, count: count, selected: selected});
        $(document).trigger('e-item-list-update-all-selected');
    }

    /**
     *更新失效商品清单
     */
    this.updateDisableCounter = function (skuId, count, selected) {
        var disableInfo = _getDisableInfo(skuId);
        if (disableInfo) {
            disableInfo.count = count;
            disableInfo.selected = selected;
        } else {
            //新添加的放到前面
            _arrDisableCounter.unshift({
                skuId: skuId,
                count: count,
                selected: selected,
            });
        }
        _localSaveDisableItem();
    }
    this.disableTotal = function () {
        var totalNum = 0;
        if(!_arrDisableCounter.length){
            return 0;
        }
        $.each(_arrDisableCounter, function (index, value) {
            totalNum += value.count;
        });
        return totalNum;
    }

    /**
     *
     */
    this.emptyDisable = function () {
        _arrDisableCounter = [];
        _localSaveDisableItem();
    }
    /**
     * 设置当前活跃的仓库
     * 使用场景为：添加商品，进入购物车，则进入的是该仓库
     * By Gavin 2016-7-16
     */
    function _setActiveTabId( obj ) {
      var _preTabId = _getTabId();
      if ( obj && obj.action && obj.action == 'remove' ) {
        obj.tabId = _preTabId;
      }
      var _buyItem, _nowTabId = _preTabId;
      if ( obj.tabId ) _nowTabId = obj.tabId;
      if ( obj.skuId ) {
        _buyItem = _getBuyInfo(obj.skuId);
        _nowTabId =  _buyItem.storageTypeId;
      }
      if ( _nowTabId != _preTabId ) {
        _setTabId( _nowTabId );
      }
    }

    /**
     * 增量调整total值
     * @param diff
     * @private
     */
    function _updateTotalBy(diff, obj) {
        var tabId = _getTabId();
        var newObj = obj || {};
        var action, currentPrice;
        _setActiveTabId( newObj );  // 设置当前活跃的仓库
        if ( newObj.action ) action = newObj.action;
        _buyTotal += diff;
        // 获取当前销售价，用户购物车总价的加减
        currentPrice = _itemInfo[newObj.skuId] && _itemInfo[newObj.skuId].currentPrice || '';
        $(document).trigger('e-model-cart-update-total', {
          total: _buyTotal,
          nowTab: tabId,
          action: action,
          currentPrice: currentPrice,
          eventFromTarget: newObj.eventFromTarget
        });
    }



    ///**
    // * 验证,是否可以减小到购物车: 暂时没有用途 TODO
    // * @param skuId
    // * @returns {string}
    // * @private
    // */
    //function _checkCanSubtract (skuId) {
    //    //最小起订量（待定如何使用: 在购物车下单时,才需要关注）
    //    if(_itemInfo[skuId]) {
    //        var item = _itemInfo[skuId];
    //        var currentCount = _buyCounter[skuId];
    //        if (currentCount < item.sale_info.moq) {
    //            return ERR_CODE.moq;
    //        }
    //    }
    //}


    //////////////////////////
    ////TODO: 我设想的持久化,应该是可以异步化的,因为储存可能存在延迟或者失败?
    //
    /**
     * 将数据临时持久化于本地
     * @private
     */
    function _localSave() {
        if (typeof window.localStorage == 'undefined') {
            return;
        }
        localStorage.setItem(NAME, JSON.stringify(_arrBuyCounter));
    }

    /**
     * 将失效商品数据缓存到本地
     * @private
     */
    function _localSaveDisableItem() {
        if (typeof window.localStorage == 'undefined') {
            return;
        }
        localStorage.setItem(DISABLE, JSON.stringify(_arrDisableCounter));
    }

    /**
    * 将数据从本地持久化区读出来
    * @private
    */
    function _localGet() {
        if (typeof window.localStorage == 'undefined') {
            return;
        }
        var strBuyCounter = localStorage.getItem(NAME);
        if (strBuyCounter) {
            var buyCounter = JSON.parse(strBuyCounter);
            if (buyCounter && (buyCounter instanceof Array)) {
                _arrBuyCounter = buyCounter;
                _cleanCounter();    //清理不需要的空记录
            }
        }
    }

    /**
     * 销售地区读/写,如果zone变化了,则本地缓存数据也就无意义了,要清空处理
     */
    var DEFAULT_ZONE = '1000';
    function _getZone() {
        if (typeof window.localStorage == 'undefined') {
            return;
        }
        var zoneId = localStorage.getItem(KEY_ZONE_ID);
        if(!zoneId) {
            zoneId = DEFAULT_ZONE;
            _setZone(zoneId);
        }
        return zoneId;
    }
    function _setZone(zoneId) {
        if (typeof window.localStorage == 'undefined') {
            return;
        }
        localStorage.setItem(KEY_ZONE_ID, zoneId);
    }
    /**
     * 在购物车时、获取与设置当前的仓库ID
     */
    function  _getTabId() {
      return Storage.getItem("model-cart-current-tab") || null;
    }
    /**
     * 在购物车时、获取与设置当前的仓库ID
     */
    function  _setTabId( tabId ) {
      return Storage.setItem("model-cart-current-tab", tabId);
    }

    /**
     * 对于为0的情况,进行过滤,避免长时间会累加太多数据
     * @private
     */
    function _cleanCounter() {
        for ( var i = _arrBuyCounter.length - 1; i >= 0; i-- ) {
            var _buyItem = _arrBuyCounter[i];
            if (_buyItem.count == 0) {
                _arrBuyCounter.splice(i, 1);    //删除掉
            }
        }
    }



    //自动初始化LocalStorage数据
    // 条件：要判断当前zone_id是否原来的,如果不是,则清空
    if(!conf.userData.is_login) { //可能是未登录
        _zoneId = _getZone();   //以本地为准（不存在跨地域的冲突问题）
    } else {    //登录了,可能就存在地域变化的问题了
        var _oldZoneId = _getZone();
        if(_oldZoneId != conf.userData.account.zone_id) {   //如果获得的zone跟本地储存
            _zoneId = conf.userData.account.zone_id;
            _setZone(_zoneId);
            this.empty();
        } else {
            _zoneId = _oldZoneId;
        }
    }
    _localGet();
    //计算总购物数
    for ( var i = 0, len = _arrBuyCounter.length; i < len; i++ ) {
        var _buyItem = _arrBuyCounter[i];
        _buyTotal += _buyItem.count;
    }
};

var modelCart = new ModelCart();

module.exports = modelCart;
