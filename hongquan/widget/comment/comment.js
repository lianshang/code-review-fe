/**
 * @require ../my-order-view.less
 * @type {[type]}
 */
var $ = require('home:widget/ui/zepto/zepto.js');
var TPL = require('home:widget/comment/tpl.js');
var artTpl = require('home:widget/ui/tpl/tpl.js');
// 引入星星评价组件
var Evaluate = require('home:widget/ui/evaluate/evaluate.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var helper = require('home:widget/ui/helper/helper.js')

//var URL_ORDER_VIEW = '/my/order/view';

var SCORE_MAP = {
  '商品质量': 'score_quality',
  '送货速度': 'score_speed',
  '配送服务': 'score_service'
};
var Action = function ( opts ) {
  this.$mod = opts.$el;
  this.opts = opts.tagList;
  this.opts.info = opts.info;
  console.log(this.opts);
  this.opts.order_id = opts.order_id;
  this.opts.redirectUrl = opts.redirectUrl;
  this._showedTags = {
    score_quality: [],
    score_speed: [],
    score_service: []
  };        //带纬度的需要显示的评价
  this.showedTags = [];         //需要显示的评价,用于渲染
  this.choosedTitles = [];     //已经选择的纬度


  this.returnValue = {
    star: {},     // 评分内容
    _tags: [],
    tags: "",
    content: ""      // 输入的内容
  };  // 评价模块，需要返回的评价内容
  this.init();
};
/*
*
* */
Action.prototype = {
  init: function () {
      this.opts.data = this.formatData();
      console.log(this.opts.data);
      this.render();
  },
  formatData: function() {
      var newData = this.opts.tag_list;
      var redirectUrl = this.opts.redirectUrl;
      var url = '/my/order/view?order_id=' + this.opts.order_id;
      url = redirectUrl ? redirectUrl : url;
      return {
          backUrl: url,
          title: '发表评论',
          tag_list: newData,
          evaluate: 'show'
      };
  },
  render: function () {
    this.$mod.append(artTpl.compile(TPL.content)(this.opts.data));
    this.renderInfo();
    // 渲染小星星评价
    this._renderComment();
    // 绑定事件
    this._bindPopWinEvent( this.opts.order_id );
  },
  _pad: function(num, len) {
    len = Math.pow(10, len || 2);
    return num < len ? ((len + num) + "").slice(1) : num + "";
  },
  renderInfo: function () {
    var self = this;
    artTpl.helper('date_filter', function(seconds) {
      if (seconds) {
        var date = new Date(seconds * 1000);
        var day = [
          date.getFullYear(),
          self._pad(date.getMonth() + 1, 2),
          self._pad(date.getDate(), 2)
        ];
        var time = [
          self._pad(date.getHours(), 2),
          self._pad(date.getMinutes(), 2)
        ];
        return day.join('-') + '&nbsp;&nbsp;' + time.join(':');
      } else {
        return '— —';
      }
    });

    var data = {
      order_id: self.opts.order_id,
      item: self.opts.info,
      imgScale : conf.dpr >= 2 ? 'small' : 'tiny'
    };
    self.$mod.find('header').after(artTpl.compile(TPL.info)(data));
    self.$mod.find('.info img').lazyload();
  },
  _renderComment: function () {
    new Evaluate({
      el: ".evaluate-star",
      titleArr: ["商品质量", "送货速度", "配送服务"],
      editable: true
    });
  },

  _bindPopWinEvent: function ( orderId ) {
    var self = this;
    var $evaluateText = self.$mod.find('.evaluate-text');

    self.$mod.on('click', '.el-btn', function ( e ) {
      $(this).toggleClass("selected");
      self._saveValue( $(this).data("id") );
      e.preventDefault();
    }).on('click', '.sub-evaluate', function ( e ) {
      var cbMsg = {};
      var _data = self._formatData( orderId );
      console.log(_data);
      $(this).prop("disabled",false);
      if ( !_data ) return;
      $.ajax({
        url: '/shopping/comment/add',
        dateType: 'json',
        type: 'POST',
        data: _data,
        success: function(data) {
          if (data && data.ret === 0) {
            Alert.show("评价成功！", function () {
              self._back();
            });
          } else if (data && data.ret === 100021) {
            Alert.show(data.msg, function() {
                location.reload();
            });
          } else {
            Alert.show(data.msg);
          }
        }
      });
    }).on('click', '.evaluate li', function (e) {
      // 如果选中评价超过三个，激活提交按钮
      // 同时保存评价的数量
      var _starRow = $(".evaluate"), _i = 0;
      var title = $(this).parents(".evaluate").find(".el-left").html();
      var num = ($(this).index()+1)*20;

      if(!$evaluateText.hasClass('active')){
        $evaluateText.addClass('active');
      }

      self._getTagList(SCORE_MAP[title],num);

      $.each( _starRow, function ( k, v ) {
        if ( $(_starRow[_i]).find(".i-star-full").length > 0 ) {
          _i++;
        }
      });
      self._saveStarValue( title, $(this).index() );
      if ( _i === 3 ) {
        self.$mod.find(".sub-evaluate").prop("disabled",false).addClass('active');
      }
    });
  },

  /**获得显示的评价标签
   *
   * @param  title  'string'   评价星级所属纬度
   * @param  num    'number'   星级
   *
     */
  _getTagList: function (title,num) {
    var data = this.opts.data.tag_list;
    this.showedTags = [];
    var tags = this.returnValue._tags;
    var selectedTags = [];

    //对应纬度对应tag
    this._showedTags[title] = data[title][num] ? data[title][num] : [];

    //获得数组格式的tagList,用于渲染
    for(var index in this._showedTags){
      if(this._showedTags[index].length){
        this.showedTags = this.showedTags.concat(this._showedTags[index]);
      }
    }
    console.log(this.showedTags);
    //添加属性selected,用于重新渲染时记住上次被选中的tag
    $.each(this.showedTags,function(index,value){
        value['selected'] = false;
    });

    /**
     * 为其他纬度(不是本次点击星级纬度)被选中tag的selected属性设为true
     */
    if(tags){
      for(var i = 0; i<tags.length; i++){
        this.showedTags.filter(function(value){
          if(value['tag_id'] == tags[i]){
            value['selected'] = true;
            selectedTags.push(tags[i]);
          }
        })
      }

      //更新tags(若当前纬度有被选中tag,会删除)
      this.returnValue._tags = selectedTags;
      this._saveValue();

    }
    this._renderTagList();
  },

  //渲染标签列表
  _renderTagList: function () {
    var data = {
      tag_list: this.showedTags
    }
    this.$mod.find('.el-tags .el-taglist').remove();
    this.$mod.find('.el-tags .title').after(artTpl.compile(TPL.tagList)(data));
  },

  _saveStarValue: function ( html, value ) {
    this.returnValue.star[SCORE_MAP[html]] = ( value + 1 ) * 20;
  },

  // 后退
  _back: function () {

    var redirectUrl = this.opts.redirectUrl;
    var url = '/my/order/view?order_id=' + this.opts.order_id;
    location.replace(redirectUrl ? redirectUrl : url);
  },

  _formatData: function ( orderId ) {
    var self = this;
    var _subData = {};
    var _nowData = self._getEvaluate();
    var _len = _nowData.content.length;
    if ( _len < 10 && _len > 0) {
      Alert.show("请至少输入10个字");
      return;
    }
    $.each( _nowData, function ( i, v ) {
      if ( i !== "_tags") {
        i === "star" ? $.extend( _subData, _nowData[i] ) : _subData[i] = _nowData[i];
      }
    })
    _subData.order_id = orderId;
    return _subData;
  },

  // 保存评价内容
  _saveValue: function ( val ) {
    var tags = this.returnValue._tags;
    if(val) {
      $.inArray(val, tags) < 0 ? tags.push(val) : tags.splice($.inArray(val, tags), 1);
    }
    this.returnValue.tags = JSON.stringify( tags );
  },

  // 取得所有评价数据
  _getEvaluate: function () {
    this.returnValue.content = $(".weui_textarea", ".el-textarea").val();
    return this.returnValue;
  }
}

var Model = Backbone.Model.extend({
  defaults: {
    data: null,
    tagList: null,
    info: null
  },
  initialize: function(options) {
    var self = this;
    self.id = options.id;
  },
  getData:function(){
    var self = this;
    $.ajax({
      url:'/my/order/getCommentInfo?order_id='+self.id,
      dataType: 'json',
      success:function(response){
        if(response && response.ret == 0){
          self.set({
            data: response.content,
            info: $.extend({},response.content.order_head,response.content.trans_info,{flag:response.content.flag}),
            tagList: response.content.tag_list,
          });

        }else{
          Alert.show(data.msg);
        }
      },
    });
  }
});

var View = Backbone.View.extend({
    model: null,
    className: 'mod-my-order-comment',
    id: 'myOrderCommentCanvas',
    initialize: function (options) {
        this.model = new Model(options);
        this.listenTo(this.model, 'change:data', function() {
          new Action({
            $el: this.$el,
            tagList: {tag_list:this.model.get('tagList')},
            info: this.model.get('info'),
            order_id: options.id,
            redirectUrl: options.url ? options.url : '',
          });
        });
        this.model.getData();
        $(document.body).append(this.$el);
    },

    close: function () {
        this.unbindEvent();
    },
    unbindEvent: function() {
        $(window).off('.myorderview');
    }
});

module.exports = View;
