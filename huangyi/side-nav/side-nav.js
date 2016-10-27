/*
 * rewrite by @hy
 * 2016/10/24
 *
 * 从urlGroups配置中读取模块配置渲染side-nav
 * 获取当前页面
 * 高亮当前页的item
 *
 * 当前不需要支持带参数的url
 */
var UrlGroups = require( 'common:widget/urlgroups/urlgroups.js' );      // 读取配置
var Page = conf.header.page;                                            // 当前页面
var EL = ".mod-side-nav";

var ITEM_HEIGHT = 71;                                                   // 每一个sideNav item的基础高度 + 1px的border
var OFFSET_TOP = 45;                                                    // 距顶部的距离
var PAGING_HEIGHT = 20;                                                 // 分页按钮的高度

var Tpl = {
    main: [
        '<div class="content">',
            '<span v-if="paging" class="paging-btn prep" :class="disabledStatus.prepDisabled ? \'disabled\' : \'\'">',
                '<i class="icon icon-triangle-up"></i>',
            '</span>',
            '<ul class="nav-list">',
                '<template v-for="item in listData">',
                    '<li class="{{item.className}}">',
                        '<a href="{{item.url}}" class="item" :class="item | setCurClass" target="_self">',
                            '<i v-if="item.icon" class="icon icon-{{item.icon}}"></i>',
                            '<span class="name">{{item.title}}</span>',
                        '</a>',
                    '</li>',
                '</template>',
            '</ul>',
            '<span v-if="paging" class="paging-btn next" :class="disabledStatus.nextDisabled ? \'disabled\' : \'\'">',
                '<i class="icon icon-triangle-down"></i>',
            '</span>',
        '</div>'
    ].join("")
};

init();

function init() {
    $$Component("side-nav", sideNav, {
        wrap: EL
    });

    $$Page({
        el: EL
    })
}

function sideNav(config) {
    var _config = $$isPlainObject( config ) ? config : {};

    var listData = getListData();
    var total = listData.length;
    var paging = calcPaging();

    _config.template = Tpl.main;

    _config.data = function () {
        return {
            listData: listData,
            total: total,
            paging: paging,
            pageIndex: 0,
            disabledStatus: {
                prepDisabled: false,
                nextDisabled: false
            }
        }
    };

    _config.filters = {
        setCurClass: setCurClass
    };

    _config.attached = function () {
        if (this.paging) {
            initPagingConf.call(this);
        }
    };

    _config.listeners = {
        "click .content .item": clearStorage,
        "click .prep": function(e, vm) {turnPage.call(vm, vm.pageIndex - 1, "prep");},
        "click .next": function(e, vm) {turnPage.call(vm, vm.pageIndex + 1, "next");}
    };

    return _config;
}

// 从UrlGroups读取的数据, 会根据角色不同而读取对应的列表配置
// 这里需要先把所有的数组中的数据先拼接好, 再返回给view渲染
function getListData() {
    var listData = [];
    $$each(UrlGroups, function (role) {
        listData = listData.concat(role);
    });
    return listData;
}

// 当需要分页时, 提供一个初始化分页配置的方法
// 1. 设置列表容器的高度, 容器高度为一个分页内容的总高度
// 2. 直接翻到当前module所在的分页
// 3. 设置当前分页的index值
function initPagingConf() {
    var self = this;
    var pageIndex = getCurrentPaging.call(self);

    setWrapHeight(self.$el, self.paging);
    turnPage.call(self, pageIndex);
    self.$set("pageIndex", pageIndex);
}

// 判断是否是当前页面对应的module
function isCurrentPage(item) {
    return item.url === Page || item.group.indexOf(Page) > -1;
}

// 设置标志current的class的返回值
function setCurClass(item) {
    var curClass = "";
    if (isCurrentPage(item)) {
        curClass = "cur";
    }
    return curClass;
}

// 获取当前module所在分页
function getCurrentPaging() {
    var list = this.listData;
    var curIndex = 0;

    $$each(list, function (item, index) {
        if (isCurrentPage(item)) {
            curIndex = index;
        }
    });
    return parseInt(curIndex / this.paging, 10);
}

// 获取sidenav最大高度, 即当前body可展示的高度
function getMaxHeight() {
    return document.body.clientHeight - OFFSET_TOP;
}

// 计算当前高度下可容纳多少个sidenav的item, 需要分页时给分页按钮留出空位
// @params hasPaging [string] 是否需要分页
function calcItemNum(hasPaging) {
    var maxHeight = getMaxHeight();
    // 有分页则给分页按钮留出高度
    if (hasPaging) {
        maxHeight -= PAGING_HEIGHT * 2;
    }
    var maxNum = maxHeight / ITEM_HEIGHT;
    return parseInt(maxNum, 10);
}

// 计算分页, 需要分页则返回分页大小, 无需分页则返回false
function calcPaging() {
    var listLength = 0;
    $$each(UrlGroups, function (role) {
        listLength += role.length;
    });
    return listLength > calcItemNum() ? calcItemNum(true) : false;
}

// 重置列表容器的高度, 为一个分页内容的高度
function setWrapHeight(el, size) {
    if (!size) {
        return;
    }
    el.style.height = (calcOffsetHeight(size) + PAGING_HEIGHT) + "px";
}

// 计算一个分页的总偏移高度
// @params size, 分页大小
// @params direction, up or down, default down
function calcOffsetHeight(size, direction) {
    if (typeof size !== "number") {
        return;
    }
    var offset = (size * ITEM_HEIGHT);
    if (direction === "down") {
        offset = -offset;
    }
    return offset;
}

/*
 * 翻页的一些方法
 * 已支持多分页
 * 1. 翻页方法
 * 2. 按钮状态变化
 * 3. 分页原理: 位置偏移
 */

// 点击翻页
// @params pageNum [number] 页码
// @params type [string] prep or next, default next 向上或向下翻
function turnPage(pageNum, type) {
    var self = this;
    var offset = calcOffsetHeight(self.paging, "down");
    self.pageIndex = pageNum;
    btnToggleDisabled(self);
    offsetYTransition(self.$el, (type === "down" ? -offset : offset) * pageNum);
}

// 分页按钮可点击状态变换
function btnToggleDisabled(vm) {
    var pageIndex = vm.pageIndex;
    var pageTotal = Math.ceil((vm.total / vm.paging), 10) - 1;

    if (pageIndex === 0) {
        // 第一页向上不能点
        vm.$set("disabledStatus.prepDisabled", true);
        vm.$set("disabledStatus.nextDisabled", false);
    } else if (pageIndex === pageTotal) {
        // 最后一页向下不能点
        vm.$set("disabledStatus.prepDisabled", false);
        vm.$set("disabledStatus.nextDisabled", true);
    } else {
        // 都能点击
        vm.$set("disabledStatus.prepDisabled", false);
        vm.$set("disabledStatus.nextDisabled", false);
    }
}

// 偏移变化
function offsetYTransition(el, offset) {
    getListWrap(el).style.transform = "translateY(" + offset + "px)";
}

// 获取列表容器
function getListWrap(el) {
    return $$(".nav-list", el)[0];
}

// 切换sidenav项时, 清空搜索相关的本地存储数据
function clearStorage() {
    localStorage.clear();
}