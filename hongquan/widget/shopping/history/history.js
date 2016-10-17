var $ = require('home:widget/ui/zepto/zepto.js');
var TPL = require('home:widget/shopping/history/tpls.js');
var artTpl = require('home:widget/ui/tpl/tpl.js');
var UIItemListView = require('home:widget/ui/ui-item-list-view/ui-item-list-view.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var Loading = require('home:widget/ui/loading/loading.js');
var Alert = require('home:widget/ui/alert/alert.js');
var catesNav = require('home:widget/ui/cates-nav/cates-nav.js');
var Log = require('home:widget/ui/log/log.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');

var API_LIST = '/shopping/history/getlist';
var pn = 0;
var rn = 12;
var maxPn = null;
var isEnd = false;
var timer = null;

var Action = function(opts) {
    this.$mod = opts.$el;
    this.data = opts.data;
    this.id = opts.data[0] ? opts.data[0].catid : null;
    this.init();
    this.bindEvent();
};

Action.prototype = {
    init: function() {
        pn = 0;
        maxPn = null;
        isEnd = false;
        Loading.show('数据加载中...');
        this.renderCates();
        this.$history = this.$mod.find('.history');
        if (this.id != null) {
            this.getHistory();
        } else {
            this.renderEmpty();
        }
    },
    reset: function() {
        maxPn = null;
        pn = 0;
        isEnd = false;
        this.$history.html('');
    },

    bindEvent: function() {
        var self = this;

        this.$mod.on('e-cates-nav-change', function(e,opts) {
            Loading.show('数据加载中...');
            self.id = opts&&opts.cat_id?opts.cat_id:'';
            self.reset();
            self.getHistory();
        });

        $(window).on('scroll.history', function() {
            if ( !self.isScroll ) {
              var $this = $(this);
              clearTimeout(timer);
              timer = setTimeout(function() {
                  var scrollTop = $this.scrollTop();
                  var height = $this.height();
                  var scrollHeight = document.body.scrollHeight;
                  if ( (scrollTop + height + 10 > scrollHeight) && !isEnd) {
                      self.getHistory();
                      self.isScroll = true;  // 已经滚动了
                  }
              }, 100);
            }
        });
    },
    renderCates: function() {
        this.$mod.html(TPL.content);
        new catesNav({
            $el: this.$mod,
            className: '.history-cates',
            catesList: this.data
        });
    },
    getHistory: function() {
        var self = this;
        //第几页
        var page =  Math.ceil( pn/rn ) + 1;
        //保存页数
        Storage.setItem("log-page", page);
        $.ajax({
            url: API_LIST,
            dataType: 'json',
            data: {
                catid: self.id,
                pn: pn,
                rn: rn
            },
            success: function(data) {
                Loading.hide();
                if (data && data.ret === 0) {
                    if (!maxPn) {
                        maxPn = data.content.total;
                    }
                    if (maxPn) {
                        pn += rn;
                        if (pn >= maxPn) {
                            isEnd = true;
                        }
                        self.renderHistory({itemList: data.content.history_list, isEnd: isEnd, now: parseInt(data.timestamp, 10) * 1000});
                        //数据上报
                        if ( page > 1 ) {
                            Log.scrollSend( page );
                        }
                    } else {
                        self.renderEmpty();
                    }
                } else if (data && data.ret === 100021) {
                    Alert.show(data.msg, function() {
                        location.reload();
                    });
                } else {
                    self.renderEmpty();
                }
            },
            error: function() {
                Loading.hide();
                self.renderEmpty();
            }
        });
    },
    renderHistory: function(data) {
        var itemView = new UIItemListView().init(data);
        itemView.appendTo(this.$history);
        this.isScroll = false;
    },
    renderEmpty: function() {
        this.$history.html(artTpl.compile(TPL.empty)({}));
        this.isScroll = false;
    }
};

var Model = Backbone.Model.extend({
  url: '/shopping/history',
  defaults: {data: null},
  initialize: function(options) {
    var self = this;
    self.fetch({
      data: {format: 'json'},
      dataType: 'json',
      success: function(_, data) {
        if (data && data.ret === 0) {
          self.set({data: data.content.cat_list});
        }
      },
      error: function (model, response, options) {
        if (options.textStatus === "parsererror") {
            Alert.show("您需要登录!", function() {
                location.reload();
            });
        }
      }
    });
  }
});

var View = Backbone.View.extend({
    model: null,
    className: 'mod-shopping-history header-fixed',
    events: {
      'click .i-back': 'goBack'
    },
    initialize: function () {
        $(document.body).append(this.$el);
        this.model = new Model();
        this.listenTo(this.model, 'change:data', function() {
          new Action({
            $el: this.$el,
            data: this.model.get('data')
          });
        });
    },
    close: function () {
        this.unbindEvent();
    },
    goBack: function () {
      history.go(-1);
    },
    unbindEvent: function() {
        $(window).off('.history');
    }
});

module.exports = View;
