var $ = require('home:widget/ui/zepto/zepto.js');
var T = require('home:widget/ui/tpl/tpl.js');
var B = require('home:widget/ui/backbone/backbone.js');
var U = require('home:widget/collection/tpls.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Confirm = require('home:widget/ui/confirm/confirm.js');
var Loading = require('home:widget/ui/loading/loading.js');
var UIItemListView = require('home:widget/ui/ui-item-list-view/ui-item-list-view.js');
var Model = require('home:widget/collection/collection.model.js');
var catesNav = require('home:widget/ui/cates-nav/cates-nav.js');

var View = B.View.extend({
  className: 'mod-collection header-fixed',
  events: {
    'click .edit,.done': 'edit',
    'click label': 'checkOn',
    'click .sub-btn.active': 'submit'
  },

  initialize: function () {
    this.renderUI();
    Loading.show('数据加载中...');
    this.model = new Model();
    this.listenTo(this.model, 'change:collections', this.render);       // 生成商品列表
    this.listenTo(this.model, 'change:cateList', this.renderCate);      // 生成分类列表
    this.listenTo(this.model, 'change:editable', this.renderEditable);  // 设置编辑按钮状态
    this.listenTo(this.model, 'change:editStatus', this.editAction);    // 删除框的状态
    this.listenTo(this.model, 'change:checkedNum', this.updateNum);     // 更新选中数量
    this.listenTo(this.model, 'change:errMsg', this.errorHandle);       // 错误处理
    this.listenTo(this.model, 'change:deleteStatus', this.afterDelete); // 删除后处理
    this.listenTo(this.model, 'change:isEnd', this.changeEndStatus);    // 是否数据请求完毕

    // 滚动数据
    this.timer = null;  // 定时器
    this.isEnd = false; // 是否加载完
    this.catId = '';    // 当前的cat_id
  },

  // 滚动时，是否数据请求完毕
  changeEndStatus: function () {
    this.isEnd = this.model.get('isEnd');
  },

  /**
   * 渲染内容
   */
  render: function () {
    var collections = this.model.get('collections');
    if ( collections && collections.length > 0  ) {
      this.renderList( collections );
      this.scrollFresh();
    } else {
      this.renderNoData();
    }
    Loading.hide();
  },

  /**
   * 滚动刷新
   */
  scrollFresh: function () {
    var that = this;
    $(window).on('scroll.collect', function() {
      var $this = $(this);
      clearTimeout(that.timer);
      that.timer = setTimeout(function() {
        var scrollTop = $this.scrollTop();
        var height = $this.height();
        var scrollHeight = document.body.scrollHeight;
        if (scrollTop + height + 10 > scrollHeight) {
          if ( !that.isEnd ) {
            Loading.show('数据加载中...');
            that.model.pn += 12;
            that.model.getList({catid: that.catId, pn: that.model.pn});
          }
        }
      }, 100);
    });
  },

  // 如果没有可加载的数据则显示“没有更多数据了”
  // toggleEndState: function () {
  //   var $itemToEnd = this.$('.item-to-end');
  //   var isEnd = this.isEnd;
  //   if ( isEnd ) {
  //     $itemToEnd.show();
  //   } else {
  //     $itemToEnd.hide();
  //   }
  // },

  /**
   * 渲染分类
   */
  renderCate: function () {
    var that = this;
    var data = {};
    var cateList = this.model.get('cateList');
    // 加载cateNav组件
    new catesNav({
      $el: this.$el,
      className: '.category',
      catesList: cateList
    });
    this.$el.off('e-cates-nav-change');
    this.$el.on('e-cates-nav-change', function( e, opts ) {
      if ( opts ) {
        that.catId = opts.cat_id;
        that.updateCate( opts.cat_id );
      }
    });
  },

  /**
   * 加载用户界面
   */
  renderUI: function () {
    $(document.body).append( this.$el.html( U.ui /* 此处没有加载数据，可不用compile */) );
  },

  /**
   * 数据为空时
   */
  renderNoData: function () {
    this.$('.nodata').show();
    this.$(".coupon-tips-container").hide();
  },

  /**
   * 渲染商品列表，如果在编辑状态，则进入编辑模式
   * @param {collections} [{},{}]   收藏商品列表
   */
  renderList: function ( collections ) {
    var editStatus = this.model.get('editStatus');
    this.$('.nodata').hide();
    this.$('.collections').empty();
    (new UIItemListView()).init({itemList: collections}).appendTo( this.$('.collections') );
    // 如果此时在编辑状态，则选择分类后，依然进入编辑状态
    if ( editStatus ) {
      var deleteList = this.model.get('deleteList');
      this.editAction();
      this._itemAction( deleteList, 'checked' );
    }
  },

  /**
   * 编辑按钮的状态
   */
  renderEditable: function () {
    var editable = this.model.get('editable');
    if ( !editable ) {
      this.$('.edit').addClass('disabled');
    }
  },

  /**
   * 错误处理
   */
  errorHandle: function () {
    var errMsg = this.model.get('errMsg');
    Loading.hide();
    if ( errMsg.type && errMsg.type == 'reload' ) {
      Alert.show( errMsg.msg, function () {
        location.reload();
        return;
      });
    } else {
      Alert.show( errMsg );
    }
  },

  /**
   * 切换分类时，同时改变分类的文字与状态
   * @param {ele} jquery object
   */
  updateCate: function ( catId ) {
    Loading.show('数据加载中...');
    var editStatus = this.model.get('editStatus');
    this.model.pn = 0;
    this.model.set('isEnd', false);
    // 设置cate的状态
    this.$('.collections').empty(); // 清空DOM
    this.model.set('collections', null, {silent: true});
    this.model.getList({catid: catId, pn: 0, fromCate: true});
    // 如果此时处于编辑模式，则将选中的数量清空
    if ( editStatus ) {
      this.model.set('checkedNum', 0);
      this.model.set('deleteList', null);
    }
  },

  /**
   * 商品的编辑状态
   */
  edit: function ( e ) {
    var $target = $(e.target);
    var editable = this.model.get('editable');
    var editStatus = this.model.get('editStatus');
    if ( editable ) {
      this._changeHeader( editable, $target );
      this.model.changeEditStatus();
      this.model.set('checkedNum', 0);
    }
  },

  /**
   * 获取选中状态
   */
  checkOn: function ( e ) {
    var $target = $( e.target );
    // 手机端会先触发label，然后在触发input，这里过滤掉label
    if ( $target[0].nodeName.toLowerCase() == 'label' ) return;
    var isChecked = $target.prop('checked');
    var action = isChecked ? 'add' : 'sub';
    var skuId = this._getSkuId( $target );
    this.model.updateNum( action, skuId );
  },

  /**
   * 提交删除申请
   */
  submit: function () {
    var that = this;
    var deleteList = this.model.get('deleteList');
    if ( deleteList && deleteList.length > 0 ) {
      Confirm.show('确认删除？', function () {
        Loading.show('删除中...');
        that._itemAction( deleteList, 'remove' ); // 先从DOM中删除
        that.model.batchDelete(); // 请求数据进行更新
      });
    }
  },

  /**
   * 删除完成的后期处理，包括：如果删除完为空，则进行提示，同时修改相应的cate的数量
   */
  afterDelete: function () {
    Loading.hide();
    var status = this.model.get('deleteStatus');
    var checkedNum = this.model.get('checkedNum');
    var collections = this.model.get('collections');
    // 如果删除的数量和收藏的数量一样多，则表示清空操作，此时需要重新刷新页面
    if ( collections.length == checkedNum ) {
      location.reload();
      return; // 如果不return，后面的代码会继续执行
    }
    this.emptyCollections();      // 重新渲染列表
    this.model.getList({catid: this.catId, pn: 0}); // 重新请求数据
    this.model.set('checkedNum', 0); // 更新底部删除按钮
    this.model.set('deleteStatus', null, {silent: true});  // 不触发change事件
  },

  // 清空模型中的collections
  emptyCollections: function () {
    this.model.set('collections', [], {silent: true});
  },

  /**
   * 更新底部按钮，当选中数量为0时，为不可用状态
   */
  updateNum: function () {
    var nowNum = this.model.get('checkedNum');
    var $subBtn = this.$('.sub-btn');
    var $num = this.$('.sub-btn span');
    if ( nowNum > 0 ) {
      $subBtn.removeClass('disabled').addClass('active');
    } else {
      $subBtn.addClass('disabled').removeClass('active');
    }
    numStr = nowNum > 0 ? '（' + nowNum + '）' : '';
    $num.html( numStr );
  },

  /**
   * 改变icon的状态
   */
  _changeIconStatus: function () {
    var $triangle = this.$('.trigger i');
    $triangle.toggleClass('i-triangle-t i-triangle-b');
  },

  // 切换header文字，同时进入编辑状态隐藏查询框
  _changeHeader: function ( status, ele ) {
    var $header = this.$('.header');
    var $title = this.$('h1', $header);
    var $headerCom = this.$('.i-back,.category');
    if ( status ) {
      var onEdit = ele.hasClass('edit');
      ele.text( onEdit ? '完成' : '编辑' );
      $title.text( onEdit ? '编辑收藏' : '我的收藏');
      $headerCom[ onEdit ? 'hide' : 'show' ]();
      ele.toggleClass('edit done');
    }
  },

  /**
   * 获取选中商品的sku_id
   */
  _getSkuId: function ( ele ) {
    if ( !ele ) return;
    var skuId = null;
    ele.parents().each(function ( i, v ) {
      var $item = $(v);
      if ( $item.hasClass('item')) {
        skuId = $item.data('sku_id');
        return skuId;
      }
    });
    return skuId;
  },

  /**
   * 当删除一些收藏的时候，先临时从DOM中删除
   * @param deleteList [{},{}] 删除列表
   * @param action string 动作，是删除，还是选中
   */
  _itemAction: function ( deleteList, action ) {
    if ( !deleteList || deleteList.length === 0 ) return;
    var deleteItem = [];
    var $item = this.$(".item");
    deleteList.forEach(function ( v, i ) {
      $item.forEach(function ( v, j ) {
        if ( $($item[j]).data('sku_id') == deleteList[i] ) {
          if ( action === 'remove' ) {
            $( $item[j] ).remove();
          } else if ( action === 'checked' ) {
            $( $item[j] ).find('input').prop('checked', true);
          }
        }
      })
    })
  },

  /**
   * 显示删除框
   */
  editAction: function () {
    var $item        = this.$('.item');
    var $subBtn      = this.$('.sub-btn');
    var $checkBox    = this.$('.checkbox');
    var status       = this.model.get('editStatus');
    var $itemContent = this.$('.item-content'), checkHtml;
    if ( status ) {
      $item.addClass('weui_cells_checkbox');
      // 这里循环生成html，为了获得不同的for--id值
      // 过程比较复杂，大致为：先生成选择框label，然后把itemContent移到里面去
      // 移到里面去是为了能够点击每个item的时候都能选中input框
      // 这里面的操作全部为DOM操作，性能较低
      for (var i = 0,len = $itemContent.length; i < len; i++) {
        checkHtml = T.compile(U.checkHtml)({index:i});
        $(checkHtml).insertBefore( $itemContent[i] );
        var $label = this.$('label');
        $($label[i]).append( $itemContent[i] );
      }
      $checkBox = this.$('.checkbox');
      $subBtn.addClass("animate");
    } else {
      // 当取消编辑时，需要把移入到content中的checkbox移动到外面来
      // 暂时没有想到更好的方法去实现
      $item.removeClass('weui_cells_checkbox');
      $subBtn.removeClass("animate");
      for (var j = 0, length = $itemContent.length; j < length; j++) {
        $($itemContent[j]).insertAfter($checkBox[j]);
      }
      $checkBox.remove();
    }
  },

  close: function () {
    $(window).off('.collect');
  }
});

module.exports = View;
