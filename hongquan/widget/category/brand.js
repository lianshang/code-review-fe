/**
 * brand-model
 * 品牌分类模型
 */
var $        = require('home:widget/ui/zepto/zepto.js');
var tpls     = require('home:widget/category/tpls.js');
var TPL      = require('home:widget/ui/tpl/tpl.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var Alert    = require('home:widget/ui/alert/alert.js');

var Model = Backbone.Model.extend({
  url: '/item/sku/getbrandlist',
  defaults: {
    brandList: null
  },
  initialize: function () {

  },
  // 请求分类数据
  getBrandList: function ( id ) {
    var self = this;
    self.fetch({
      dataType: 'json',
      timeout: '20000',
      cache: false,
      data: {
        cat: id
      },
      success: function ( _, response ) {
        if (response && response.ret === 0) {
          _.set({
            brandList: response.content && response.content.brand_list || [],
            alwaysChange: +new Date()
          });
        } else if (response && response.ret === 100021) {
          Alert.show(response.msg, function() {
              location.reload();
          });
        } else {
          console.log( "get brandlist error at category" );
        }
      },
      error: function ( _, error ) {
        console.error( error.responseText );
      }
    })
  }
});

var View = Backbone.View.extend({
  el: '.mod-category',
  model: null,
  initialize: function () {
    this.model = new Model();
    this.listenTo( this.model, "change:alwaysChange", this.render );
  },

  /**
   * render
   * 渲染品牌分类
   * 并触发结束事件
   */
  render: function () {
    var brandList = this.model.get("brandList");
    var $brandContainer = this.$('.items .brandes');
    if ( brandList && brandList.length === 0 ) {
      $brandContainer.html("");
    } else {
      $brandContainer.html( TPL.compile( tpls.brandBtn )( { brandes: brandList } ) );
    }
    // 通知其他页面已经更新完毕
    $(document).trigger('e-brand-update-over');
  },

  /**
   * getBrandList
   * 获取品牌列表
   */
  getBrandList: function ( id ) {
    this.model.getBrandList( id );
  },

  /**
   * changeBrand
   * @param {action} 品牌分类的行为
   */
  changeBrand: function ( action ) {
    var $brandes   = this.$(".brandes");
    var $brandMask = this.$(".brand-mask");
    var $brandList = this.$(".brand-list");
    var $brandBtn  = this.$(".brand-btn");
    var $items     = this.$(".items");
    if ( action === 'hide' ) {
      conf.brand = "";  // 在这里重新设置为空，是因为conf是全局的，当切换到其他分类时，该状态一直保存，因此需要切换分类的时候清空
      $brandMask.hide();
      return;
    }
    // 上下箭头切换
    if ( $brandBtn.hasClass("i-arrow-t") ) {
      $items.css({"overflow":"auto"});
      $brandBtn.removeClass("i-arrow-t").addClass("i-arrow-b");
    } else {
      $items.css({"overflow":"hidden"});
      $brandBtn.removeClass("i-arrow-b").addClass("i-arrow-t");
    }
    // 遮罩与品牌列表
    $brandMask.toggle() && $brandList.toggle();
  },

  /**
   * setBrandBtnValue
   * 当切换品牌时，设置按钮的选中效果
   */
  setCheckedBrand: function ( context, brand ) {
    var _curClass = "current";
    var $ele;
    if ( context ) {
      $ele = context;
      if ( $ele.hasClass( _curClass ) ) return;   // 如果点击的是已选中的品牌，则不进行操作
      $ele.addClass( _curClass ).siblings().removeClass( _curClass );
    } else if ( brand ) {
      $ele = this.$(".brandes");
      var $brand = $ele.find(".brand");
      var $brandBtn = $ele.find(".brand-btn");
      $.each( $brand, function ( k, v ) {
        $(v).removeClass( _curClass );
        var _brand = $(v).data("value");
        if ( _brand === brand ) {
          $(v).addClass( _curClass );
          $brandBtn.html( _brand );
        }
      })
    }
  },

  // 设置按钮文字
  setBrandBtnValue: function ( _currentBrand ) {
    var $brandBtn = this.$(".brand-btn");
    $brandBtn.html( _currentBrand === '' ? "全部品牌" : _currentBrand );
  }
});

module.exports = View;
