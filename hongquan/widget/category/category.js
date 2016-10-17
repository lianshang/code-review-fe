var $              = require('home:widget/ui/zepto/zepto.js');
var TPL            = require('home:widget/ui/tpl/tpl.js');
var tpls           = require('home:widget/category/tpls.js');
var helper         = require('home:widget/ui/helper/helper.js');
var Backbone       = require('home:widget/ui/backbone/backbone.js');
var itemModel      = require('home:widget/category/item.model.js');
var brandView      = require('home:widget/category/brand.js');
var CartMainModel  = require('home:widget/cart/cart.main.model.js');
var UIItemListView = require('home:widget/ui/ui-item-list-view/ui-item-list-view.js');
var app            = require('home:widget/ui/router/router.js');
var Log = require('home:widget/ui/log/log.js');

require('home:widget/ui/lazyload/lazyload.js');

var modName = 'mod-category';

var Model = Backbone.Model.extend({
  defaults: {
    tips: null,
    tipsAlwaysChange: null
  },
  initialize: function () {},
  getTips: function ( cat_id ) {
    var cat_list = conf.categoryList || [];
    for (var i = 0, len = cat_list.length; i < len; i++) {
      var cate = cat_list[i];
      if ( cate.cat_id == cat_id ) {
        this.set({tips: {
          data: cate.tips,
          alwaysChange: +new Date()
        }});
      }
    }
  }
});

var View = Backbone.View.extend({
    className: modName,
    model: null,

    addEvent: function(){
        var that = this;
        var _events = {
          'click .i-item-add': 'actionAdd',
          'click .i-item-subtract': 'actionSub',
          'click .header .header-input': 'actionSearch'
        };
        _events[conf.evClick + " .brand-btn,.brand,.brand-mask"] = function () {
          that.changeBrand("toggle");
        };
        _events[conf.evClick + " .cate-lv1,.cate-lv2"] = function () {
          that.changeBrand("hide");
        };
        _events[conf.evClick + " .brand"] = 'switchBrand';
        _events[conf.evClick + " .cate-lv1"] = 'changeFirstCate';
        _events[conf.evClick + " .cate-lv2"] = 'changeSecondCate';
        return _events;
    },

    events: function () {
      return this.addEvent();
    },

    actionSearch: function ( e ) {
      e.preventDefault();
      var $target = $(e.target);
      if ( $target.hasClass('i-scan') ) {
        app.navigate('#home/search?frm=home&action=scan', {trigger: true, replace: true});
      } else {
        app.navigate('#home/search?frm=home', {trigger: true, replace: true});
      }
    },

    // 加车时，把原价隐藏掉
    actionAdd: function ( e ) {
      var $ele = $( e.target );
      var $del = $ele.parent().parent().find('.operation del').hide();
    },

    // 减车时，把原价显示
    actionSub: function ( e ) {
      var $ele = $( e.target );
      var $del = $ele.parent().parent().find('.operation del').hide();
      var count = $ele.next().text();
      if ( count == 0 ) $del.show();
    },

    initialize: function (options) {
      this.model = new Model();
      this.renderViewFrame();
      this.brandView = new brandView(); // 引入brand
      this.listenTo(this.model, "change:tips", this.renderTips);
      CategoryView($.extend({$el: this.$el}, options, {
        brandView: this.brandView,
        _fixHeight: this._fixHeight,
        cateModel: this.model
      }));
      $(document).trigger("e-main-nav-change", "category");
      this.bindEvent();
    },

    /**
     * renderViewFrame
     * 渲染页面骨架
     */
    renderViewFrame: function () {
      this.$el.data( 'view-mod', modName );
      this.$el.html( TPL.compile( tpls.categoryViewCanvas )( {} ) );
      $(document.body).append( this.$el );
    },

    /**
     * 事件绑定
     */
    bindEvent: function () {
      var that = this;
      // $(window).on('resize.category load.category',
      //     function () {
      //         setTimeout(that._fixHeight, 50);
      //     } //如果不延迟,可能算的 DOM height还是上一屏的
      // );

      // 品牌渲染完毕触发此事件
      $(document).off('e-brand-update-over.category');
      $(document).on('e-brand-update-over.category', function () {
        that._fixHeight();  // 设置.cates定高
        that.brandView.setCheckedBrand( null, conf.brand );  // 当页面刷新时，设置选中的品牌按钮
      })
    },

    /**
     * getBrand
     */
    switchBrand: function ( e ) {
      var $ele = $( e.target );
      var _currentBrand = $ele.data("value");
      var _currentCategoryId = helper._queryString("cat_id");
      this.brandView.setBrandBtnValue( _currentBrand );               // 设置按钮文字
      this.brandView.setCheckedBrand( $ele );                         // 设置品牌的选中效果
      itemModel.changeCategory( _currentCategoryId, _currentBrand );  // 改变分类，并提交当前选中的品牌名称
    },

    /**
     * changeBrand
     * @param {action} 品牌分类的行为
     */
    changeBrand: function ( action ) {
       this.brandView.changeBrand( action );
    },

    /**
     * changeFirstCate
     */
    changeFirstCate: function ( e ) {
      if ( e.target.nodeName.toLowerCase() === 'span' ) {
        e.target = $( e.target ).parent()[0];
      }
      var $this = $(e.target);
      var $cateLv2 = $this.next('.cates-lv2');
      var newCategoryId = $this.data('cat_id');
      if ($this.hasClass('active')) {
        // 只有在没有展开的情况下，才去重新请求接口，并展开该分类
        // if ( $this.hasClass('shrink') )
        itemModel.changeCategory( newCategoryId );
        //对于没有子分类的一级分类，不用重复加载
        if ( $cateLv2.children().length ) $this.toggleClass('shrink');
      } else {
        $this.removeClass('shrink');
        this.model.getTips( newCategoryId );  // 生成tips
        itemModel.changeCategory( newCategoryId );
        // 如果没有二级分类，则隐藏小三角
        $this[ !$cateLv2.children().length ? 'addClass' : 'removeClass' ]('noIcon');
      }
      this.updateBrandList( newCategoryId );
      this.$('.cate-lv2').removeClass('active');
    },

    /**
     * renderTips
     */
    renderTips: function () {
      var that  = this;
      var $tips = that.$(".tips");
      var tips  = that.model.get("tips").data || {};
      if ($tips.length) $tips.remove();
      if (tips.txt && tips.url) that.$('.header').after(TPL.compile(tpls.categoryTips)(tips));
      that._fixHeight(); // 当tips加载出来，就进行height重调
    },

    /**
     * changeSecondCate
     */
    changeSecondCate: function ( e ) {
      if ( e.target.nodeName.toLowerCase() === 'span' ) {
        e.target = $( e.target ).parent()[0];
      }
      var $this = $(e.target);
      var newCategoryId = $this.data('cat_id');
      if ( $this.hasClass("active") ) return;
      this.updateBrandList( newCategoryId );
      itemModel.changeCategory( newCategoryId );
    },

    // 更新分类
    updateBrandList: function ( cateId ) {
      this.$('.brandes').empty();
      this.brandView.getBrandList( cateId ); //更新品类列表
    },

    /**
     * _fixHeight
     * 调整滚动区域高度
     */
    _fixHeight: function () {
      /*
       $(window).height()   // => 838 (viewport height)
       $(document).height() // => 22302
       */
      var headerHeight = this.$('.header').height();
      var tipsHeight   = this.$('.tips').height();
      var brandHeight  = this.$('.brandes').height();
      var footerHeight = $('.mod-main-nav').height();
      var winHeight    = $(window).height();
      var innerHeight  = winHeight - headerHeight - tipsHeight - footerHeight;
      this.$('.cates').height(innerHeight);
      this.$('.items .item-list').height(innerHeight - brandHeight);
    },

    close: function () {
        this.unbindEvent();
    },

    unbindEvent: function() {
        $(window).off('.category');
        $(document).off('.category');
    }
});

var CategoryView = function (opts) {
    var that = this;
    var $viewCanvas = opts.$el;
    var _itemListView = new UIItemListView();
    var _currentCategoryId = '';
    var _indexCates = {}; // 类别数据索引
    var _firstpageLoaded = false;
    var brandView = opts.brandView;
    var _fixHeight = opts._fixHeight;
    var cateModel = opts.cateModel;

    function init() {
        if (conf.categoryList) {
            conf.categoryId = opts.id;
            conf.brand = opts.brand;
            _init();
            render();
            bindEvent();
        } else {
            $.ajax({
                url: '/category?format=json&cat_id=' + opts.id,
                dataType: 'json',
                success: function(data) {
                    if (data && data.ret === 0) {
                        conf.categoryList = data.content.cat_list;
                        // conf.itemList = data.content.item_list;
                        conf.tips = data.content.tips;
                        conf.categoryId = opts.id;
                        conf.brand = opts.brand;
                        _init();
                        render();
                        bindEvent();
                    }
                }
            });
        }
    }

    // 当初始化分类时，如果有购买，且有原价，则隐藏原价。
    function fixAddView () {
      var $items = $viewCanvas.find(".item");
      $items.each(function ( index, item ) {
        var $item = $(item);
        var $moq  = $item.find('.moq');
        var count = +($item.find('.buy-count').text());
        if ( count || $moq.length ) {
          $item.find('.operation del').hide();
        }
      })
    }

    function _initIndexCate(cateData, pId) {
        $.each(cateData, function(k, v) {
            var hasChild = v.list && v.list.length;
            _indexCates[v.cat_id] = pId != undefined ? [pId, k] : [k] ;
            if (hasChild) {
                _initIndexCate(v.list, k);
            }
        });
    }


    function _init() {
        var firstCategory = null;
        $.each(conf.categoryList, function( index, item ) {
            if ( index === 0 ) firstCategory = item;
        });
        var targetCategoryId = conf.categoryId;
        // 得到分类数据（id-pos）索引
        _initIndexCate(conf.categoryList);
        //处理当前显示的分类
        if (targetCategoryId && _indexCates[targetCategoryId]) {
            _currentCategoryId = targetCategoryId;
        } else if (firstCategory) {
            _currentCategoryId = firstCategory.cat_id;
        }
        cateModel.getTips( _currentCategoryId );
        // 请求品牌分类数据
        brandView.getBrandList( _currentCategoryId );
        app.navigate( "category?cat_id="+_currentCategoryId+"&brand="+conf.brand, {trigger: false, replace: true});
    }

    function render() {

        // 分类
        _renderCategoryTo($viewCanvas.find('.cates ul'));
        //$viewCanvas.find('.items .active-cate').html(_currentCategoryName);


        //初始化数据
        $(document).on('e-item-model-data-ready.category', function (e, data) {
            _firstpageLoaded = true;
            _itemListView.init({
                itemList: data.item_list,
                isEnd: data.isEnd,
                now: data.now
            });
            var itemContainer = $viewCanvas.find('.items ul');
            // 渲染商品列表
            _itemListView.appendTo(itemContainer);
            itemContainer.find("img").lazyload({container: itemContainer}); //重复尝试做lazyload
            $viewCanvas.find('.items .loading').hide();
            fixAddView();
        });
        $(document).on('e-item-model-category-change.category', function (e, data) {
            var newCategoryId  = data.currentCategoryId;
            var newBrandValue  = data.currentBrand;
            var $curCate = $viewCanvas.find('.cates li[data-cat_id="'+ _currentCategoryId+'"]');
            var $newCate = $viewCanvas.find('.cates li[data-cat_id="'+ newCategoryId+'"]');
            var $curCateParent = $curCate.hasClass('cate-lv1') ? $curCate : $curCate.parent().prev('.cate-lv1');
            var $newCateParent = $newCate.hasClass('cate-lv1') ? $newCate : $newCate.parent().prev('.cate-lv1');
            var $container = $viewCanvas.find('.cates'); // 左侧容器
            var scrollFlag = !$newCateParent.hasClass('active'); // 是否需要修改滚动条位移
            var logDetail = {category_id: newCategoryId}; //上报数据的detail属性
            var logAction = 'show';

            // 获取新分类距离左侧容器顶部的距离（必须在更新分类显隐之前取值）
            var fixTop = $newCateParent.offset().top - $viewCanvas.find('.header').height();
            //更新分类显示状态
            $curCate.removeClass('active');
            $curCateParent.removeClass('active');
            $newCate.addClass('active');
            $newCateParent.addClass('active');
            //判断是否选中第一个子类,如果有则加一个标识
            $curCateParent.removeClass('active-first-sub');
            if($newCate.index() == 0) {
                $newCateParent.addClass('active-first-sub');
            }
            if (scrollFlag) {
                // 计算新的滚动条位移
                var newTop = $newCateParent.position().top; // 新分类在左侧容器中的绝对位置
                var newScrollTop = newTop - fixTop; // 计算新的滚动条位移
                $container.scrollTop(newScrollTop);
            }
            _currentCategoryId = newCategoryId;

            //reset商品显示列表
            _firstpageLoaded = false;
            $viewCanvas.find('.items ul').empty();  //reset
            $viewCanvas.find('.items .loading').show();
            Log.pid = '110016';

            //品牌数据上报
            if(newBrandValue){
                logAction = 'click';
                $.extend(logDetail,{brand_click : 0, brandName : newBrandValue, extend : ''});
            }
            Log.send({  //切换分类页
                action: logAction,
                pid: Log.pid,
                detail: logDetail
            });
            app.navigate( "category?cat_id="+newCategoryId+"&brand="+newBrandValue, {trigger: false, replace: true} );
        });

        // 商品
        itemModel.init({
            cat: _currentCategoryId,
            brand: opts.brand
        }, true);
        // _scrollIntoView();
        setTimeout(_scrollIntoView, 50);
        //_itemListView.appendTo($viewCanvas.find('.items ul'));
        //$mod.find('.items ul').html(_itemListView.renderString());
    }
    // 使当前选中分类能够在可视区域展示
    function _scrollIntoView() {
        var $curCate = $viewCanvas.find('.cates li[data-cat_id="'+ _currentCategoryId+'"]');
        if ($curCate.hasClass('cate-lv2')) { // 二级分类先优先让其所属的一级分类滚进可视区域
            var $cates = $viewCanvas.find('.cates');
            $curCateParent = $curCate.parent().prev('.cate-lv1');
            $curCateParent[0].scrollIntoView();
            // 如果该二级分类底部不在可视区域里，则优先让二级分类滚进可视区域
            if ($curCate.position().top + $curCate.height() > parseInt($cates.css('height'), 10) + $cates.scrollTop()) {
                $curCate[0].scrollIntoView();
            }
        } else { // 一级分类直接滚进可视区域
            $curCate[0].scrollIntoView();
        }
    }

    function _renderCategoryTo($container) {
        var cateStr = [];
        var categoryList = conf.categoryList || [];
        var activePos = _indexCates[_currentCategoryId];
        if (activePos && !isNaN(activePos[1])) {
          categoryList[activePos[0]].list[activePos[1]].active = true;
        }

        cateStr.push(TPL.compile(tpls.categoryItem)({
                list: categoryList,
                active: _indexCates[_currentCategoryId]
            })
        );
        $container.html(cateStr.join(''));

        // 如果没有二级菜单，则不显示小黑三角
        var $activeLi = $container.find('.cate-lv1.active');
        $activeLi[ !$activeLi.next().children().length ? 'addClass' : 'removeClass' ]('noIcon');
    }

    function bindEvent() {
        //自动触发加载
        $viewCanvas.find('.item-list').on('scroll', function (e) {
            if (!_firstpageLoaded) { //容器回撤,也有可能导致此事件触发;所以在页面没准备好前,不用响应
                return;
            }
            //触底,则加载更多（TODO: 重复加载的问题）
            var scrollTop = $(this).scrollTop();
            var height = $(this).height();
            var scrollHeight = $(this)[0].scrollHeight;

            if (scrollTop + height + 10 > scrollHeight) {
                if(itemModel.nextPage()) {  //如果可以下一页,则显示loading
                    $viewCanvas.find('.items .loading').show();
                }
            }
        });
    }

    this.changeCategory = function (newCategoryId) {
        $viewCanvas.find('.cates li[data-cat_id="'+ newCategoryId+'"]')[0].scrollIntoView();
        itemModel.changeCategory(newCategoryId);
    };

    init();
};

module.exports = View;
