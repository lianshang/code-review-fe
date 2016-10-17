/**
 * 收藏页 -- 模型
 * @author by Gavin 2016-7-28
 */
var $ = require('home:widget/ui/zepto/zepto.js');
var B = require('home:widget/ui/backbone/backbone.js');
var Log = require('home:widget/ui/log/log.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');

var Model = B.Model.extend({
  defaults: {
    collections: null,  // 收藏数据
    cateList: null,     // 分类列表
    editable: null,     // 编辑按钮是否可点击
    editStatus: false,  // 当前商品的编辑状态 true 表示正在编辑，false表示不是编辑状态
    checkedNum: 0,      // 选中商品的数量
    deleteList: null,   // 删除商品列表
    errMsg: '',         // 错误信息
    deleteStatus: null, // 删除商品返回状态
    maxCount: 0,        // 收藏商品的总数
    isEnd: false        // 翻页，是否到头了
  },

  // 错误码统一管理
  ERROR_CODE: {
    0: '返回数据格式错误',
    1: '数据返回异常',
    2: '数据请求失败'
  },

  /**
   * 当页面初始化时，立即请求数据
   */
  initialize: function () {
    this.getList();
  },

  /**
   * 获取收藏商品列表
   * @param {opts} object
   * @param {opts.catid} number  分类ID
   * @param {opts.pn} number     起始页
   * @param {opts.rn} number     结束页
   */
  getList: function ( opts ) {
    var _opts = this.formatData( opts );
    //第几页
    var page =  Math.ceil( _opts.pn/_opts.rn ) + 1;
    //保存页数
    Storage.setItem("log-page", page);
    this.fetch({
      url: '/collect/sku/getlist',
      data: _opts,
      datatype: 'JSON',
      timeout: 20000,
      success: function ( _, data ) {
        if ( data && data.ret === 0 ) {
          if ( data.content && data.content.sku_list ) {
            var oldCollect = _.get('collections');
            if ( oldCollect === null ) oldCollect = [];
            if ( _opts.fromCate && data.content.sku_list.length == 0 ) {
              _.set('errMsg', {type: 'reload', msg: '检测到收藏品出现变化，本页将会刷新'});
              return;
            }
            _.set({
              // 每次请求的数据都追加到原来的数组上
              collections: oldCollect.concat(data.content.sku_list),
              editable: data.content.total > 0 ? true : false,
              cateList: data.content.cat_list,
              maxCount: data.content.total
            });
            _.setIsEnd(); // 是否滚动到头了
            //数据上报
            //数据上报 滚动多少页
            if ( page > 1 ) {
              Log.scrollSend( page );
            }
          } else {
            _.set('errMsg', _.ERROR_CODE[0]);
          }
        } else {
          _.set('errMsg', _.ERROR_CODE[1]);
        }
      },
      error: function ( _, err ) {
        _.set('errMsg', _.ERROR_CODE[2]);
      }
    });
  },

  /**
   * 滚动时请求数据，判断是否已经没有数据了
   */
  setIsEnd: function () {
    var currentCount = this.get('collections').length;
    var maxCount = this.get('maxCount');
    if ( currentCount >= maxCount ) {
      this.set('isEnd', true);
    }
  },

  /**
   * 格式化数据
   * @param from this.getList()
   */
  pn: 0,
  formatData: function ( opts ) {
    var defaults = {
      catid: '',
      pn: this.pn,
      rn: 12
    };
    var newOpt = $.extend({}, defaults, opts);
    return newOpt;
  },

  /**
   * 切换商品编辑状态
   */
  changeEditStatus: function () {
    this.set('editStatus', !this.get('editStatus'));
  },

  /**
   * 更新选中收藏商品的数量，同时更新删除商品列表
   * @param {action} string 'add' or 'sub'  编辑收藏品的动作
   * @param {skuId}  number 商品sku_id
   */
  updateNum: function ( action, skuId ) {
    if ( !action || !skuId ) return;
    var nowNum = +(this.get('checkedNum'));
    var deleteList = this.get('deleteList') || [];
    if ( action == 'add' ) {
      deleteList.push( skuId );
      this.set({checkedNum: nowNum + 1, deleteList: deleteList});
    } else if ( action == 'sub' ) {
      deleteList.splice(deleteList.indexOf(skuId), 1);
      this.set({checkedNum: nowNum - 1, deleteList: deleteList});
    }
  },

  /**
   * 批量删除收藏商品
   */
  batchDelete: function () {
    var deleteList = this.get('deleteList');
    this.fetch({
      url: '/collect/sku/del',
      data: {sku_list: deleteList},
      datatype: 'json',
      timeout: 20000,
      success: function ( _, res ) {
        if ( res && res.ret === 0 ) {
          _.set('deleteStatus', res.content.status);
        } else {
          _.set('errMsg', that.ERROR_CODE[1]);
        }
      },
      error: function ( _, err ) {
        _.set('errMsg', that.ERROR_CODE[2]);
      }
    });
  },

});

module.exports = Model;
