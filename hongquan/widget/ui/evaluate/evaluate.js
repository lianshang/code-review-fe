var $ = require('home:widget/ui/zepto/zepto.js');
var T = require('home:widget/ui/tpl/tpl.js');

var tpl = [
  "{{each titles as list}}",
    "<div class='evaluate'>",
      "<div class='el-item'>",
        "<div class='el-fl el-left'>{{list}}</div>",
        "<div class='el-fl el-center'>",
          "<ul>",
            '{{each num as star}}',
              '<li class="iconf el-star i-star-empty"></li>',
            '{{/each}}',
          "</ul>",
        "</div>",
        "<div class='el-fl el-right'></div>",
      "</div>",
    "</div>",
  "{{/each}}"
].join("");

var MAP = {
  star20: "很差",
  star40: "差",
  star60: "一般",
  star80: "好",
  star100: "很好"
};

/**
 * 评价组件
 * @param el       'string' or 'jquery object'    渲染的空间
 * @param titleArr 'array'                        标题数组，比如["速度", "态度", "人气"]
 * @param data     'object'                       评价数据，则表明是查看评价，不会绑定事件
 * @param editable 'boolean'                      true or false, default: false
 */

var Evaluate = function( opts ){
  this.$el = typeof opts.el === 'string' ? $( opts.el ) : opts.el;
  this.titleArr = opts.titleArr || [];      // 所有评价的标题
  this.starRow = null;                      // 每一行
  this.starNum = [1,2,3,4,5];               // 有多少个星星，先这么处理了，简介语法不能使用for循环
  this.editable = opts.editable || false;   // 是否绑定事件，默认不绑定

  this.init( opts );
};

Evaluate.prototype = {
  /**
   * init
   * @param opts 'object'
   */
  init: function ( opts ) {
    // 从data中提取标题或者从直接传入标题
    this.data = opts.data && this.formatData( opts.data ) || null;
    this._titleArr = this.data && this.data.titleArr || this.titleArr;
    this.render( { titles: this._titleArr, num: this.starNum } );

    this.setStar( this.data );
    opts.editable && this.bindEvent();
  },

  /**
   * formatData
   * 数据格式化，将传入的数据格式成数组
   * @param titles 'object'
   */
  formatData: function ( data ) {
    var _data = { titleArr: [], scoreArr: [] };
    for (var key in data) {
      if (data.hasOwnProperty( key )) {
        _data.titleArr.push( key );
        _data.scoreArr.push( data[key] );
      }
    }
    return _data;
  },

  /**
   * render
   * 视图渲染
   * @param titles 'object'
   */
  render: function ( data ) {
    this.$el.html(T.compile( tpl )( data ));
    this.starRow = this.$el.find(".evaluate");
  },

  /**
   * bindEvent
   */
  bindEvent: function () {
    var self = this;
    this.$el.on("click", ".el-star", function ( e ){
      var current = $(this).index();
      var num = ( current + 1 ) * 20;
      $(this).addClass("i-star-full").siblings().removeClass("i-star-full");
      self.setSelectedStar( $(this).parent().find(".el-star"), num );
      self.setStarHtml( $(this).closest(".evaluate"), num );
    });
  },

  /**
   * setStarHtml
   * 设置星星对应的评价信息
   * @param el 'string'   就是 self.starRow，即“.evaluate”
   * @param num 'number'  当前选中星星的index
   */
  setStarHtml: function ( el, num ) {
    $(el).find(".el-right").html( MAP[ "star" + num ] );
  },

  /**
   * setStar
   * 如果传入数据，则渲染指定数量的选中的星星
   * @param data 'array'
   * 例如：[ 4, 3, 5 ]
   */
  setStar: function ( data ) {
    if ( !data || !data.scoreArr ) return;
    var self = this;
    $.each( data.scoreArr , function ( i, v ) {
      var liArr = $(self.starRow[i]).find(".el-star");
      self.setSelectedStar( liArr, parseInt( v ) );
      self.setStarHtml( self.starRow[i], parseInt( v ) );
    })
  },

  /**
   * setSelectedStar
   * 点亮选中的星星
   * @param liArr 'jquery object'  当前li对象
   * @param num   'number'         评价等级
   */
  setSelectedStar: function ( liArr, num ) {
    if ( typeof num !== 'number' && Object.prototype.toString.call( liArr ) !== '[object Object]' ) {
      return;
    }
    num ++;
    for ( var i = 20; i < num; i += 20 ) {
      var j = parseInt( i / 20 ) - 1;
      $( liArr[j] ).addClass("i-star-full");
    };
  },

  constructor: Evaluate
}

module.exports = Evaluate;
