var $ = require('home:widget/ui/zepto/zepto.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Log = require('home:widget/ui/log/log.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');


var ItemModel = function () {
    var _pn = 0;
    var _rn = 12;
    var _cat = '';
    var _catItemList = {};
    var _total = Number.MAX_VALUE; //翻页最大数量,避免超过还取
    var _isLoading = false;
    var _loadingStamp = 0;  //标记数据请求的时间戳,一旦过期【比如切换分类了,则这个数据请求已经没有意义了】,则忽略了（类似于回调的机制）
    var _brand = "";  // 品牌
    var xhrIsRequesting = null;

    this.init = function (options) {
        _cat = options.cat;
        _brand = options.brand;
        _pn = 0;
        _getNextData(true);   //init Load
    };
    /**
     * changeCategory
     */
    this.changeCategory = function (categoryId, brand ) {
        var oldCat = _cat;
        _cat = categoryId;
        _brand = brand || "";
        _pn = 0;    //reset
        _getNextData(true);    //init Load
        //trigger事件,暂无用处
        $(document).trigger('e-item-model-category-change', {
            oldCategoryId: oldCat,
            currentCategoryId: _cat,
            currentBrand: _brand
        });
    };
    this.getPage = function (pn) {

    };
    this.nextPage = function () {
        if(_pn >= _total) {
            console.warn('data reach total!');
            return false;   //没有了
        } else {
            return _getNextData();  //返回执行状态（有可能失败,因为有loading时）
        }
        //return _catItemList[_cat];
    };
    this.prevPage = function () {
    };

    this.asyncGetPage = function (cat, pn, callback) {
        callback(data);
    };

    /**
     *
     * @param isForce 是否强制请求（用在初始化或者切换分类的情况下）
     * @returns {boolean}
     * @private
     */
    function _getNextData (isForce) {
        if (!isForce && _isLoading) {    //不能作下一个操作
            console.warn('item.model _isLoading');
            return false;
        } else {
            _isLoading = true;  //（可以有超时操作, 将数据丢弃或者中止Ajax请求 TODO）

            _loadingStamp = (new Date()).toString(36) + Math.ceil((10e6 * Math.random())).toString(36);
            var currentStamp = _loadingStamp;
            var page = 0; //第几页

            if ( xhrIsRequesting && xhrIsRequesting.readyState !== 4 ) {
              xhrIsRequesting.abort();
            }
            xhrIsRequesting = $.ajax({
                type: 'GET',
                url: '/item/sku/getlist',
                data: {cat: _cat, pn: _pn, rn: _rn, brand: _brand},
                dataType: 'json',
                timeout: 10000,
                cache: false,
                success: function(data){
                    if (currentStamp != _loadingStamp) {
                        console.warn('[data timestamp outdate! ignore!]');
                        return;
                    }
                    if (data && data.ret == 0) {
                        _pn = _pn + data.content.item_list.length;
                        if (!_catItemList[_cat]) {
                            _catItemList[_cat] = [];    //按分页存
                        }
                        _catItemList[_cat].push(data.content.item_list);
                        _total = data.content.total;
                        var isEnd = false;
                        if (_pn >= _total) {
                            isEnd = true;
                        }

                        //数据上报
                        page = Math.ceil(_pn/_rn);
                        //保存页数
                        Storage.setItem("log-page", page);

                        $(document).trigger('e-item-model-data-ready', {
                            item_list: data.content.item_list,
                            total: data.content.total,
                            isEnd: isEnd,
                            now: parseInt(data.timestamp, 10) * 1000
                        });
                        _isLoading = false; //成功执行,才能恢复状态
                        if ( page > 1 ) {
                            Log.scrollSend( page );
                        }
                    } else if (data && data.ret == 100021) {
                        Alert.show(data.msg, function() {
                            location.reload();
                        });
                    } else {
                        console.warn('data load fail');
                    }
                },
                error: function(xhr, type){
                    //alert('Ajax error!')
                }
            });
            return true;
        }
    }
};

var itemModel = new ItemModel();

module.exports = itemModel;
