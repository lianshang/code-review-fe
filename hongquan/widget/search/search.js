var $ = require('home:widget/ui/zepto/zepto.js');
var artTpl = require('home:widget/ui/tpl/tpl.js');
var tpls = require('home:widget/search/tpls.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var UIItemListView = require('home:widget/ui/ui-item-list-view/ui-item-list-view.js');
var helper = require('home:widget/ui/helper/helper.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');
var Loading = require('home:widget/ui/loading/loading.js');
var app = require('home:widget/ui/router/router.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Log = require('home:widget/ui/log/log.js');

var HISTORY_KEY = 'searchHistory';
var HISTORY_MAX_NUM = 10;
var API_SEARCH = '/item/sku/search';
var pn = 0;
var rn = 12;
var maxPn = null;
var isEnd = false;

var mainNav = app.mainNav;

var searchTypeList = {
    'scan': 3,
    'history': 2,
    'hotword': 1,
    'input': 0
};

var Action = function(opts) {
    this.$mod = opts.$el;
    this.opts = opts;
    this.history = Storage.getItem(HISTORY_KEY) || [];
    this.stopLoading = true;
    this.searchFrom = '';   //scan扫码 input输入
    this.isLoading = false;
    this.init();
};

Action.prototype = {
    init: function() {
        pn = 0;
        maxPn = null;
        isEnd = false;
        this.render();
        this.bindEvent();
    },
    render: function() {
        this.$mod.append(artTpl.compile(tpls.main)(this.opts));
        this.$main = $(window);
        this.$searchInput = this.$mod.find('.weui_input');
        this.$clearSearch = this.$mod.find('.i-clear');
        this.$empty = this.$mod.find('.no-result');
        this.$result = this.$mod.find('.result');
        this.$itemList = this.$mod.find('.result .list');
        this.$tool = this.$mod.find('.tool');
        this.$history = this.$mod.find('.history');
        this.$historyList = this.$history.find('.list');
        this.$back = this.$mod.find('.i-back');
        this.$loading = this.$mod.find('.loading');
        var query = this.opts.q;
        if (query) {
            this.search(query);
            this.$searchInput.val(query);
            this.$mod.addClass('searching');
        }
        // var headerHeight = this.$mod.find('.header').height();
        // var winHeight = $(window).height();
        // var innerHeight = winHeight - headerHeight;
        // this.$itemList.height(innerHeight);

        var headerHeight = this.$mod.find('.header').height();
        var winHeight = $(window).height();
        var innerHeight = winHeight - headerHeight;
        this.$result.height(innerHeight);

        this.renderHistory();
        this.isInWx() && this.$mod.find('.i-scan').removeClass('hide');
    },
    renderResult: function(list, now) {
        this.isLoading = false;
        if(this.opts.tips && this.opts.tips.txt && !this.$mod.find('.tips').length) {
            var $tips = $(artTpl.compile(tpls.tips)(this.opts.tips));
            this.$result.prepend($tips).css('padding-top', $tips.height());
        }
        var itemView = new UIItemListView().init({itemList: list, isEnd: isEnd, now: now});
        itemView.appendTo(this.$itemList);
        this.$result.removeClass('hide');
        //判断是否是新请求的数据，如果是那么置顶
        if(pn == rn){
            this.$result.scrollTop(0);
        }
        isEnd || this.$loading.removeClass('hide');
    },
    renderNoResult: function() {
        this.isLoading = false;
        this.stopLoading = true;
        this.$tool.removeClass('hide');
        this.$empty.removeClass('hide');
        this.$result.addClass('hide');
    },
    // updateBackUrl: function(type) {
    //     var bUrl = '';
    //     if (type === 'no-result') {
    //         bUrl = '/home/search';
    //     }
    //     this.$back.attr('href', );
    // },
    jump: function(query) {
        location.replace('/#home/search?q=' + encodeURIComponent(query) + '&frm=' + this.opts.frm);

        //更新hash
        app.cacheView.existCache() && app.cacheView.updateCacheHash(location.hash);

        app.updateTopHistoryHash(location.hash);
        // backbone bug https://github.com/jashkenas/backbone/issues/3857
        // app.navigate('home/search?q=' + encodeURIComponent(query) + '&frm=' + this.opts.frm, {trigger: true, replace: false});
    },
    toSearchBase: function() {
        this.$tool.removeClass('hide');
        this.$empty.addClass('hide');
        this.$loading.addClass('hide');
        this.$result.addClass('hide');
        this.stopLoading = true;
        this.$main.scrollTop(0);
    },

    backToSearch: function() {
        this.toSearchBase();
        this.$mod.addClass('back-to-search');
        //隐藏导航栏
        mainNav.hide();
    },
    backToResult: function() {
        this.$searchInput.val(this.opts.q);
        this.$tool.addClass('hide');
        isEnd || this.$loading.removeClass('hide');
        this.$result.removeClass('hide');
        this.$mod.removeClass('back-to-search');
        this.stopLoading = false;
        //显示导航栏
        mainNav.show();
    },
    clearSearch: function() {
        this.$searchInput.val('');
        this.toSearchBase();
        this.$mod.removeClass('back-to-search').removeClass('searching');
        this.opts.q = null;
        app.navigate('home/search?frm='+this.opts.frm, {trigger: true, replace: true});
        //隐藏导航栏
        mainNav.hide();
        // history.replaceState({}, '', helper.updateQuery({'q': ''}));
    },
    search: function(query, isOld) {
        var self = this;
        self.stopLoading = false;
        self.opts.q = query;
        this.$tool.addClass('hide');
        this.$mod.removeClass('back-to-search');

        //显示导航栏
        mainNav.show();

        if (!isOld) {
            pn = 0;
            maxPn = null;
            isEnd = false;
            self.$itemList.empty();
            self.$searchInput.is(':focus') && self.$searchInput.blur(); // 搜索后触发虚拟键盘收起
        }
        var page = Math.ceil( pn/rn ) + 1;
        //保存页数
        Storage.setItem("log-page", page);
        $.ajax({
            url: API_SEARCH,
            data: {
                pn: pn,
                rn: rn,
                q: query
            },
            dataType: 'json',
            success: function(data, status, xhr) {
                if (data && data.ret === 0) {
                    if (data.content && data.content.item_list && data.content.item_list.length) {
                        self.opts.tips || (self.opts.tips = data.content.tips);
                        maxPn || (maxPn = data.content.total);
                        pn += rn;
                        if (pn >= maxPn) {
                            isEnd = true;
                            self.$loading.addClass('hide');
                        }
                        //算是“结果页” -- 有结果
                        Log.send({
                            action: 'show',
                            pid: '110011',
                            detail: {
                                q: query,
                                type: self.searchFrom,
                                is_result: 0
                            }
                        });
                        //数据上报 滚动多少页
                        if ( page > 1 ) {
                            Log.scrollSend( page );
                        }
                        self.renderResult(data.content.item_list, parseInt(data.timestamp, 10) * 1000);
                    } else {
                        //算是“结果页” -- 无结果
                        Log.send({
                            action: 'show',
                            pid: '110011',
                            detail: {
                                q: query,
                                type: self.searchFrom,
                                is_result: 1
                            }
                        });
                        self.renderNoResult();
                    }
                } else if (data && data.ret === 100021) {
                        Alert.show(data.msg, function() {
                            location.reload();
                        });
                } else {
                    self.renderNoResult();
                }
            },
            error: function(xhr, errorType, error) {
                self.renderNoResult();
            }
        });
        self.updateHistory(query);
        self.renderHistory();
        // history.replaceState({}, '', helper.updateQuery({'q': encodeURIComponent(query)}));
    },
    renderHistory: function() {
        // this.history = Storage.getItem(HISTORY_KEY);
        if (this.history && this.history.length) {
            this.$historyList.html(artTpl.compile(tpls.history)({
                list: this.history
            }));
            this.$history.removeClass('hide');
        }
    },
    updateHistory: function(query) {
        var index = $.inArray(query, this.history);
        if (~index) {
            this.history.splice(index, 1);
        }
        this.history.unshift(query);
        if (this.history.length > HISTORY_MAX_NUM) {
            this.history = this.history.slice(0, HISTORY_MAX_NUM);
        }
        Storage.setItem(HISTORY_KEY, this.history);
    },
    clearHistory: function() {
        this.history = [];
        Storage.removeItem(HISTORY_KEY);
        this.$history.addClass('hide');
    },
    initScan: function() {
        var self = this;
        require.async('home:widget/ui/wexin-sdk/wexin-sdk.js', function() {
            $.ajax({
                url: '/common/weixin/getjsconfig',
                data: { url: window.location.href.split('#')[0] },
                dataType: 'json',
                success: function(data) {
                    if (data && data.ret === 0) {
                        wx.config($.extend({
                            debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                            jsApiList: ['scanQRCode'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                        }, data.content));
                        wx.ready(function(){
                            Loading.hide();
                            self.scan();
                        });
                        self.scanIsReady = true;
                    }  else if (data && data.ret == 100021) {
                        Alert.show(data.msg, function() {
                            location.reload();
                        });
                    }
                }
            });
        });
    },
    scan: function() {
        var self = this;
        wx.scanQRCode({
            needResult: 1, // 默认为0，扫描结果由微信处理，1则直接返回扫描结果，
            scanType: ["barCode"], // 可以指定扫二维码还是一维码，默认二者都有
            success: function (res) {
                var query = res.resultStr.replace(/^EAN_13,/, '');
                self.$searchInput.val(query);
                self.$mod.addClass('searching');
                self.searchFrom = searchTypeList.scan;
                self.jump(query);
                // app.navigate('home/search?frm='+self.opts.frm+'&q=' + encodeURIComponent(query), {trigger: true, replace: false});
                // self.search(query);
            },
            fail: function(res) {
              alert(res.errorMsg);
            }
        });
    },
    isInWx: function() {
        return navigator.userAgent.toLowerCase().match(/MicroMessenger/i) == "micromessenger";
    },
    bindEvent: function() {
        var self = this;
        var timer = null;
        // 是否直接调用扫描
        if ( this.opts && this.opts.action && this.opts.action == 'scan' ) {
          if (self.scanIsReady) {
              Loading.hide();
              self.scan();
          } else {
              self.initScan();
          }
        }
        self.$mod.on('search', '.weui_input',function(e) {
            var query = $.trim($(this).val());
            self.searchFrom = searchTypeList.input;
            query.length && self.jump(query);
            e.preventDefault();
        }).on('click', '.query-word', function() {
            var query = $(this).html();
            self.$searchInput.val(query);
            self.$mod.addClass('searching');
            self.searchFrom = searchTypeList.hotword;
            self.jump(query);
            // self.search(query);
        }).on('click', '.history-item', function() {
            var query = $(this).html();
            self.$searchInput.val(query);
            self.$mod.addClass('searching');
            self.searchFrom = searchTypeList.history;
            self.jump(query);
            // self.search(query);
        }).on(conf.evClick, '.i-clear', function() {
            self.clearSearch();
            // self.$mod.removeClass('searching');
            self.renderHistory();
        }).on(conf.evClick, '.clear', function() {
            self.clearHistory();
            self.renderHistory();
        }).on('submit', '.search-box', function(e) {
            e.preventDefault();
        }).on(conf.evClick, '.cancel', function() {
            //self.backToResult();
            if (self.opts.q) {
                app.navigate('#home/search?frm='+self.opts.frm, {trigger: true, replace: true});
            } else {
                var target = self.opts.frm;
                //清空缓存
                app.cacheView.cleanCacheView();
                window.location.href = target === 'category' ? '/#category' : '/#';
            }
        });

          /*  .on(conf.evTouchEnd, '.i-back', function() {
            if (self.opts.q) {
                app.navigate('home/search?frm='+self.opts.frm, {trigger: true, replace: true});
            } else {
                var target = self.opts.frm;
                window.location.href = target === 'category' ? '/#category' : '/';
            }
        });*/

        self.$mod.find('.search-box').on('submit', function(e) {
            e.preventDefault();
        });
        if (self.isInWx()) {
            self.$mod.on(conf.evClick, '.i-scan', function() {
                Loading.show('扫码准备中');
                if (self.scanIsReady) {
                    Loading.hide();
                    self.scan();
                } else {
                    self.initScan();
                }
            });
        }
        self.$result.on('scroll.search', function () {
            if (!self.stopLoading) {
                var $this = $(this);
                clearTimeout(timer);
                timer = setTimeout(function () {
                    var scrollTop = $this.scrollTop();
                    var height = $this.height();
                    var scrollHeight = self.$itemList.height();

                    if (scrollTop + height + 10 > scrollHeight) {
                        isEnd || self.search(self.opts.q, true);
                    }
                }, 100);
            }
        });
        self.$searchInput.on('click', function() { // replace 'focus' into 'click' for fastclick
            $(this).focus();
            self.$mod.removeClass('header-fixed');
            if (self.$searchInput.val().length && self.$tool.hasClass('hide')) {
                self.backToSearch();
            }
        }).on('blur', function() {
            self.$mod.addClass('header-fixed');
        }).on('input', function() {
            clearTimeout(timer);
            timer = setTimeout(function() {
                self.$mod.toggleClass('searching', self.$searchInput.val().length);
            }, 50);
        });
    }
};

var Model = Backbone.Model.extend({
  url: '/home/search',
  defaults: {data: null},
  initialize: function(options) {
    var self = this;
    self.fetch({
      data: {format: 'json'},
      dataType: 'json',
      success: function(_, data) {
        if (data && data.ret === 0) {
          self.set({data: data.content.hot_query_list, query: options.q});
        } else if (data && data.ret === 100021) {
            Alert.show(data.msg, function() {
                location.reload();
            });
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
    className: 'mod-search header-fixed',
    id: 'searchCanvas',
    initialize: function (options) {
        $(document.body).append(this.$el);
        this.model = new Model(options);
        this.listenTo(this.model, 'change:data', function() {
            this.action = new Action($.extend({
                $el: this.$el,
                hot_query_list: this.model.get('data')
            }, options));
        });
    },
    close: function () {
        this.unbindEvent();
    },
    unbindEvent: function() {
        $(window).off('.search');
    }
});

module.exports = View;
