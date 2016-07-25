var $ = require('common:widget/ui/zepto/zepto.js');
var Backbone = require('common:widget/ui/backbone/backbone.js');
var T = require('common:widget/ui/tpl/tpl.js');
var Loading = require('common:widget/ui/loading/loading.js');
var helper = require('common:widget/ui/helper/helper.js');//这一页面中没有用到
var Alert = require('common:widget/ui/alert/alert.js');
var Confirm = require('common:widget/ui/confirm/confirm.js');

var app = require('sales:widget/ui/router/router.js');
var tpls = require('sales:widget/mymarket/tpls.js');
var ViewScrollSelect = require('sales:widget/ui/scroll-select/scroll-select.js');

var taskType = [
    {
        name:"未按时完成任务",
        type:"N",
        count:""
    },
    {
        name:"1天内拜访",
        type:"1",
        count:""
    },
    {
        name:"3天内拜访",
        type:"3",
        count:""
    },
    {
        name:"7天内拜访",
        type:"7",
        count:""
    },
    {
        name:"其他",
        type:"O",
        count:""
    }
];

var KEY_MARKET_TAG = 'user_type';

var Model = Backbone.Model.extend({
    url: function(){
        var that = this;
        return "/market/my/visitinfo";
    },
    defaults: function () {
        return {
            pn: 0,
            rn: 10,
            q: '',
            user_type: '',
            uid: '',
            list: null,
            toEnd: null,
            total: null,
            task_type: null,
            task_list: null,
            task_info: null
        };
    },
    initialize: function (options) {
        var that = this;    },
    _loadingList: false,
    getSubSales: function (opt) {
            var that = this;
            var url = '/market/my/getsubsales';
            var data = {uid:opt.uid};
            var opt = "sales";
            that.syncData(url,data,that.syncCallback,opt);
    },
    getList: function () {
        var that = this;
        var url = "market/my/getAbcdMarkets";
        var data = {
                q: that.get('q'),
                user_type: that.get('user_type'),
                uid: that.get('uid'),
                pn: that.get('pn'),
                rn: that.get('rn')
            };
        var options ="market";
        that.syncData(url,data,that.syncCallback,options);
    },
    /**
     * 获取任务相关内容及超市列表 v1.3新增内容
     * 由于“历史0单”和“近期沉睡”分为两个接口请求有别于原有的visitinfo接口，
     * 因此通过这个getTaskList方法来获取
     * @return {[type]} [description]
     */
    getTaskList : function(type){
        var that = this;
        var url;
        var type = type || that.get("user_type");
        if(type == "noOrder"){
            url = "/market/my/getNoOrder";
        }else{
            url = "/market/my/getSleepingMarket";
        }
        var data = {
            q: that.get('q'),
            user_type: that.get('user_type'),
            uid: that.get('uid'),
            pn: that.get('pn'),
            rn: that.get('rn'),
            tag: that.get('task_type') || ''
        };
        var opt = "task";
        that.syncData(url,data,that.syncCallback,opt);
    },
    /**
     * 销售端v1.3抽出的数据请求函数，观念来源于第一次codereview，
     * 出发点是这次版本开发中分成了三个接口来请求相关列表数据，
     * 因此考虑将异步请求方法抽离出来，降低代码重复。
     * @param  {[String]}   url      [接口地址]
     * @param  {[Object]}   data     [向后端发送的请求参数]
     * @param  {Function} callback [回调函数，处理逻辑业务相关]
     * @param  {[type]}   options  [在syncCallback中用于判断的参数]
     * @return {[type]}            [description]
     */
    syncData:function(url,data,callback,options){
        var that = this;
        if (that.get('toEnd')) {
            console.log('no more');
            return false;
        }
        Loading.show('数据载入中...');

        if (!navigator.onLine) {
            Loading.hide();
            Alert.show("您的网络似乎没有连接, 请检查网络后刷新页面重试!");
            return;
        }
        $.ajax({
            url: url,
            type: 'POST',
            dataType: 'json',
            data: data,
            timeout: 20000,
            cache: false,
            success:function(response) {
                response && response.ret ===0 &&response.content ? typeof callback === "function" && callback( response.content,options,that) : Alert.show( response.msg || "操作失败!" );
                that._loadingList = false;
            },
            error:function(errorMsg) {
                Loading.hide();
                that._loadingList = false;
                if (errorMsg === "timeout") {
                    Alert.show("网络请求超时!");
                } else {
                    Alert.show("您的网络似乎有问题, 请检查网络后重试!");
                }
            }
        })
    },
    /**
     * 异步请求的回调函数
     * @param  {[Object]} response [请求返回的数据]
     * @param  {[String]} options  [用于判断请求的是哪个接口]
     * @param  {[Model]} that     [将Model对象传入以便用于模型数据保存]
     * @return {[type]}          [description]
     */
    syncCallback: function(response,options,that){
        var toEnd = false;
        if(options != "sales"){
            var pn = that.get('pn') + response.data.length; //新pn
            that.set({pn: pn});
            if(response.total){
                if (response.total <= pn) {
                    toEnd = true;
                }
            }else if(response.market_count && response.market_count[0]){
                if (response.market_count[0].count <= pn) {
                    toEnd = true;
                }
            }else{
                toEnd = true;
            }
            
        }
        if(options === "market"){
            that.set({list: response.data, columnMap: response.columnMap, toEnd: toEnd, total: response.total});
        }else if(options === "sales"){
            that.set({subSales: response});
        }else{
            that.set({task_list: response.data, columnMap: response.columnMap, toEnd: toEnd, task_info: response.market_count});
        }
        Loading.hide();
    }
});

var View = Backbone.View.extend({
    tagName: 'div',
    className: 'mod-mymarket-visitplan',
    tabName: 'visitplan',
    events: {   
        'click .act-select-people': 'actionSelectPeople',
        'submit .weui_search_outer': 'actionSearch',
        'click .weui_navbar_item': 'actionSwitchTab',
        'click .weui_tab_bd .tag': 'actionSwitchTag',
        'click .market-item': 'actionViewMarket',
        'click .task-content' : 'actionOpenTaskList'
    },
    model: null,
    querys: null,
    // 以下两者用于判断是加载超市列表还是任务列表
    _renderTask:false,
    _renderList:false,
    _renderType:false,
    _renderTotal:true,
    initialize: function (options) {
        var that = this;
        var querys = options.querys;
        that.querys = querys;

        //绑定数据模型
        this.model = new Model({
            q: decodeURIComponent(querys.q || ''),
            user_type: querys[KEY_MARKET_TAG],
            uid: querys.uid
        });
        //基本框架渲染
        this.render();
        //事件绑定(先是M-V的侦听,再就是交互的补充事件)
        this.listenTo(this.model, "change:list", this.renderList);
        this.listenTo(this.model, "change:subSales", this.renderSales);
        // 监听是否需要渲染任务类型和任务列表
        this.listenTo(this.model, "change:task_info", this.renderTaskType);
        this.listenTo(this.model, "change:task_list", this.renderTaskList);
        //判断是进行超市列表加载还是任务列表加载
        if(querys.user_type == "noOrder" || querys.user_type == "scilent"){
            // that.model.set("task_type",querys.user_type);
            this.model.getTaskList(querys.user_type);
        }else{
            this.model.getList();
        }
        //数据获取启动
        if(conf.userData.level == 6) {
            this.model.getSubSales({uid: conf.userData.uid});   //找主管下面的uid
        }
        // 绑定事件
        this.bindEvent();
    },
    close: function () {
        var that = this;
        that.unbindEvent();
        if(that._viewScrollSelect) {
            that._viewScrollSelect.close();
            that._viewScrollSelect.remove();
        }
    },
    bindEvent: function () {
        var that = this;

        $(window).on('scroll.visitplan', function (e) {
            var canRun = that.checkNext();
            // 由于可能出现点击某一任务类型时前一类任务已经触发end的情况，因此这里注释了取消事件绑定
            // if (!canRun) {
            //     $(window).off('scroll.visitplan');
            // }
        });
        //搜索框的交互
        that.$el.on('focus.ui-bar', '#search_input', function () {
            var $weuiSearchBar = $('#search_bar');
            $weuiSearchBar.addClass('weui_search_focusing');
        }).on('blur', '#search_input', function () {
            var $weuiSearchBar = $('#search_bar');
            $weuiSearchBar.removeClass('weui_search_focusing');
            if ($(this).val()) {
                $('#search_text').hide();
            } else {
                $('#search_text').show();
            }
        }).on('input.ui-bar', '#search_input', function () {
            var $searchShow = $("#search_show");
            if ($(this).val()) {
                $searchShow.show();
            } else {
                $searchShow.hide();
            }
        }).on('touchend.ui-bar', '#search_cancel', function () {
            $("#search_show").hide();
            $('#search_input').val('');
        }).on('touchend.ui-bar', '#search_clear', function () {
            $("#search_show").hide();
            $('#search_input').val('');
            //清空,也得更新搜索
            that.jump({q: ''});
        });
    },
    unbindEvent: function () {
        var that = this;
        $(window).off('.visitplan');
        $(document).off('.visitplan');
        that.$el.off(".visitplan");
        that.$el.off(".ui-bar");
    },
    $alert: null,
    $confirm: null,
    render: function() {
        var that = this;
        that.$el.
        html(T.compile(tpls.main)({ level: conf.userData.level }))
            .addClass(that.className);
        that.$el.find('.ui-bar').html(T.compile(tpls.uiBar)({ q: that.model.get("q"), tab: that.tabName, sortType: that.model.get('sort'), tag: that.model.get(KEY_MARKET_TAG) }));
        $(document.body).append(this.$el);
    },
    renderSales: function(model, value) {
        var that = this;
        //找出当前的uid对应的name
        console.log(value);
        var name = null;
        for (var i = 0, len = value.length; i < len; i++) {
            var sale = value[i];
            if (sale.uid == that.querys.uid) {
                name = sale.sales_name;
                break;
            }
        }
        if (!name) {
            if (!that.querys.uid) {
                name = '全部';
            } else if (that.querys.uid == conf.userData.uid) {
                name = '自己';
            }
        }
        that.$el.find('.selected-people').html(name);
    },
    actionSwitchTab: function(e) {
        var that = this;
        var $target = $(e.currentTarget);
        var tab = $target.data('tab');
        var querys = app.query;
        querys = { uid: querys.uid }; //全局保留
        app.navigate('mymarket/' + tab + '?' + $.param(querys), { trigger: true, replace: false });
    },
    actionSwitchTag: function(e) {
        var that = this;
        var $target = $(e.currentTarget);
        var tag = $target.data('tag');
        var querys = app.query;
        if (tag == that.model.get(KEY_MARKET_TAG)) { //当前切换
            that.jump({ user_type: '' });
        } else {
            querys.user_type = tag;
            that.jump({ user_type: tag });
        }
    },
    actionSearch: function(e) {
        e.preventDefault();
        console.log(e);
        this.jump({ q: encodeURIComponent($('#search_input').val()) });
    },
    actionViewMarket: function(e) {
        var that = this;
        e.stopPropagation();
        var $current = $(e.currentTarget);
        var addressId = $current.data('address_id');
        app.navigate("mymarket/marketinfo?address_id=" + addressId + "&" + $.param(that.querys) + "&planfrom=1", { trigger: true, replace: false });
    },
    // v1.3新增内容，当点击任务类型容器时展开任务列表
    actionOpenTaskList: function(e) {
        var that = this;
        var render = false;
        var type = $(e.currentTarget).data("type");
        if ($(e.currentTarget).hasClass('close')) {
            $(".task-content").removeClass('close');
            that.model.set({ pn: 0, toEnd: false, task_list: [] });
            that.$el.find(".list-content").html("");
            that._renderTask = false;
        } else {
            $(".task-content").removeClass('close');
            $(e.currentTarget).addClass('close');
            that.model.set({ pn: 0, toEnd: false, task_list: [] });
            render = true;
            that._renderTask = true;
            that.$el.find(".list-content").html("");
        }
        if (render) {
            that.model.set("task_type", type);
            that.model.getTaskList();
        }
    },
    actionSelectPeople: function() {
        var that = this;
        var list = that.model.get('subSales');
        var uid = that.querys.uid;
        var options = [{
            value: '',
            name: '全部'
        }, {
            value: conf.userData.uid,
            name: '自己'
        }];
        for (var i = 0, len = list.length; i < len; i++) {
            options.push({ value: list[i].uid, name: list[i].sales_name });
        }
        if (!that._viewScrollSelect) {
            that._viewScrollSelect = new ViewScrollSelect();
        }
        that._viewScrollSelect.initList({ value: uid, options: options, title: '选择查看对象' });
        that._viewScrollSelect.onchange = function(item) {
            that.jump({ uid: item.value });
        };
    },
    renderList: function() {
        var that = this;
        this._firstpageLoaded = true;
        Loading.hide();
        var list = that.model.get("list");
        var type = that.model.get("user_type");
        var total = { count: that.model.get("total"), render: that._renderTotal, type: type };
        if (list.length > 0) {
            that.$el.find('.data-list').append(T.compile(tpls.list)({ list: list, querys: that.querys, total: total }));
            if (that.model.get('toEnd')) {
                that.$el.find('.data-list').append(tpls.end);
            }
        } else {
            if (that.model.get('total') == 0) {
                that.$el.find('.data-list').append(tpls.empty);
            }
        }
        that._renderList = true;
        that._renderTotal = false;
    },
    // v1.3新增内容，加载任务列表
    renderTaskList: function() {
        var that = this;
        var type = that.model.get("task_type");
        this._firstpageLoaded = true;
        that._renderList = false;
        Loading.hide();
        var list = that.model.get("task_list");
        var columnMap = that.model.get('columnMap');
        if (list.length > 0) {
            that.$el.find('.' + type).append(T.compile(tpls.list)({ list: list, querys: that.querys, type: type }));
            if (that.model.get('toEnd')) {
                that.$el.find('.' + type).append(tpls.end);
            }
        } else {
            if (that.model.get('total') == 0) {
                that.$el.find('.' + type).append(tpls.empty);
            }
        }
        that._renderTask = true
    },
    // v1.3新增内容，加载任务类型
    renderTaskType: function() {
        var that = this;
        if (!that._renderType) {
            that._renderType = true;
            var info = that.model.get("task_info");
            for (var i = 0; i < info.length; i++) {
                taskType[i].count = info[i].count;
            };
            that.$el.find('.data-list').append(T.compile(tpls.taskType)({ taskType: taskType }));
        }
    },
    jump: function(obj) {
        var that = this;
        var options = {
            trigger: true,
            replace: false
        };
        if (typeof obj.q != 'undefined') { //有q更新,则强制刷新
            app.navigate("mymarket/visitplan", { trigger: false, replace: false }); //先做变更,让路由变化,再做强制变更...避免条件一致不能刷新的情况..
            options.replace = true;
        }
        app.navigate("mymarket/visitplan?" + $.param($.extend(true, that.querys, obj)), options);
    },
    /**
     *
     * @returns {boolean} 如果操作失效了,则不再拉取了
     */
    checkNext: function () {
        var that = this;
        if (this.model.get('toEnd')) {
            console.log('is toEND NOT check!');
            return false;
        }
        //触底,则加载更多（TODO: 重复加载的问题） 已解决
        var $container = $(window);
        var scrollTop = $container.scrollTop();
        var height = $container.height();
        var scrollHeight = document.body.scrollHeight;

        if(that._renderList || that._renderTask){
            if (scrollTop + height + 300 > scrollHeight) {
                console.info('bottom');
                if(that._renderTask){
                    if(that.model.getTaskList()){
                        console.info('[loading show()]');
                    }
                    that._renderTask = false;//避免重复加载
                }else if(that._renderList) {  //如果可以下一页,则显示loading
                     this.model.getList()
                    console.info('[loading show()]');
                    that._renderList = false//避免重复加载
                }else{

                }
                //bottom
            }
            return true;
        }
    }
});


module.exports = View;