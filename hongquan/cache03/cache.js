/**
 * Created by lsh on 16/10/20.
 */
function CacheView(router) {
    //绑定router
    this.router = router;
    //cacheView对象，储存cache的对象
    this.cacheView = {};
    //进入或者操作hash的集合
    this.historyHash = [];
    //缓存配置列表
    this.NEED_CACHE_LIST = ['pageSearch', 'pageCategory', 'pageActivity'];
    //底部导航配置参数
    this.NAV_PARAMS = {
        pageSearch: {
            hideMenu: true
        },
        pageCategory: {
            hideMenu: false,
            nav: 'category'
        },
        pageActivity: {
            hideMenu: true
        }
    };
    //详情页配置
    this.ITEM_NAME = 'pageItem';
    //当前页面
    this.currentPage;
    this.initialize();
};

CacheView.prototype = {
    /*
     * 初始化方法
     * */
    initialize: function () {
        this.pushHash();
        this.bindEvents();
    },
    /*
     * 页面是否在缓存列表中
     * */
    inCacheList: function (pageName) {
        var needCacheList = this.NEED_CACHE_LIST,
            length = needCacheList.length;
        while (length--) {
            if (pageName === needCacheList[length]) {
                return true;
            }
        }
        return false;
    },
    /*
     * 检验当前路由回调是不是缓存页面
     *
     * 主要是根据backbone的execute方法。干预是否进入路由回调。
     * 主要判断两种情况：
     * 1、如果当前页面是详情页，而且存在上级页面：检验上级页面是否在
     * 缓存配置列表，如果在，那么设置当前的缓存对象（此时详情页的view
     * 还没有指给currentView），隐藏view，设置currentView为null,
     * 这样router的clean方法找不到currentView，就不会销毁view。
     * 然后执行详情页的路由回调方法。
     *   如果不存在上级页面或者不是详情页，该怎么走 怎么走。
     *
     * 2、如果当前页面是缓存页面，而且上级页面是详情页。拿取当前的hash
     * 值匹配缓存对象的hash值，如果相同的话，说明需要加载缓存页面，那么
     * 进行的操作：调用router的clean方法，清除详情页的view和设置底部导航。
     * 设置当前的currentView,显示当前的view,配置toCallbackAble为false,
     * 不走入路由回调。
     *
     * 3、其他的情况，不进行拦截，不进行处理，还是走原来的方法
     * */
    routerLoad: function (callback, args, pageName, context) {
        //拿取上级页面的名称
        var prePageName = this.getCurrentPageName();
        var toCallbackAble = true,
            preHash;
        /*
         * 第一种情况如果上级页面存在 且 当前的页面是详情页。
         * */
        if (prePageName && this.ITEM_NAME === pageName) {
            /*
             * 判断上级页面是否在缓存配置里面
             * */
            if (this.inCacheList(prePageName)) {
                preHash = this.getPreHash();
                //设置缓存对象
                this.setCacheView(this.getCurrentView(), preHash);
                //隐藏当前的view
                this.hideCacheView();
                //这里将currentView置为null,就不会被clean
                this.setCurrentView(null);
                //详情页隐藏底部的导航栏
                this.hideMainNav();
            }
        }

        /*
         * 如果上一级页面详情页和当前页面是缓存页面
         * */
        else if (prePageName && prePageName == this.ITEM_NAME) {
            var cacheView = this.getCacheView();
            //判断是否是缓存页面
            if (this.inCacheList(pageName) && this.getCurHash() === cacheView['hash']) {
                //清除router.currentView
                this.routerClean(this.NAV_PARAMS[pageName]);
                //搜索页面，特殊处理一下
                if ('pageSearch' === pageName) {
                    this.showMainNav();
                }
                //这里将currentView设置为当前的view
                this.setCurrentView(cacheView['view']);
                //显示当前的view
                this.showCacheView();
                //设置不走入路由回调
                toCallbackAble = false;

            } else {
            //如果不是缓存页面或者 是缓存页面但是页面的hash不一致，那么我们对缓存对象进行销毁。
                this.cleanCacheView();
            }
        }


        if (toCallbackAble && callback) callback.apply(context, args);

        //这个方法必须放在最底部，因为上面的getCurrentPageName才可以拿到上级页面。
        this.setCurrentPageName(pageName);
    },
    /*
     * 设置当前的页面名称
     * */
    setCurrentPageName: function (pageName) {
        this.currentPage = pageName;
    },
    /*
     * 拿取当前的页面
     * */
    getCurrentPageName: function () {
        return this.currentPage;
    },
    /*
     * 设置router currentView
     * */
    setCurrentView: function (view) {
        this.router.currentView = view;
    },
    /*
     * 拿取router currentView
     * */
    getCurrentView: function () {
        return this.router.currentView;
    },
    /*
     * 拿到当前的hash
     * */
    getCurHash: function () {
        return location.hash;
    },
    /*
     * 拿到上一个页面的hash
     * */
    getPreHash: function () {
        var history = this.historyHash,
            length = history.length;
        return length >= 2 ? history[length - 2] : null;
    },
    /*
     * 显示缓存视图
     * */
    showCacheView: function () {
        this.cacheView && this.cacheView.view.$el.show();
    },
    /*
     * 隐藏缓存视图
     * */
    hideCacheView: function () {
        this.cacheView && this.cacheView.view.$el.hide();
    },
    /*
     * 显示底部的导航栏
     * */
    showMainNav: function () {
        this.router.mainNav.show();
    },
    /*
     * 隐藏底部的导航栏
     * */
    hideMainNav: function () {
        this.router.mainNav.hide();
    },
    /*
     * 清除router.currentView方法
     * */
    routerClean: function (options) {
        this.router.clean(options);
    },
    /*
     * 设置缓存
     * */
    setCacheView: function (view, hash) {
        this.cacheView.view = view;
        this.cacheView.hash = hash;
    },
    //清除缓存对象
    cleanCacheView: function () {
        var cache = this.getCacheView(),
            view = cache.view;
        if (view) {
            if (view.close) {
                view.close();
            }
            view.undelegateEvents(); //解除现有事件 events
            view.remove(); //移除View的DOM容器
        }
        this.cacheView = {};
    },
    /*
     * 拿到当前缓存
     * */
    getCacheView: function () {
        return this.cacheView;
    },
    /*
     * 检测hash值变化，暂时只做兼容hashchange事件的浏览器
     * */
    bindEvents: function () {
        var that = this;
        var addEventListener = window.addEventListener || function (eventName, listener) {
                return attachEvent('on' + eventName, listener);
            };
        addEventListener('hashchange', function () {
            that.pushHash();
        }, false);
    },
    /*
     * 保存hash值
     * */
    pushHash: function () {
        this.historyHash.push(location.hash);
    }
};

module.exports = CacheView;
