/*
 * rewrite by @hy
 * 2016/10/24
 *
 * 获取当前url所属的module
 * 读取对应module的urlGroups配置
 */

var UrlGroups = require( 'common:widget/urlgroups/urlgroups.js' );      // 读取配置
var Page = conf.header.page;                                            // 当前页面
var EL = ".mod-nav";

var LEFT_OFFSET = 80;                                                   // 距body左侧的宽度, 即sideNav宽度
var PADDING_COL = 15;                                                   // 垂直方向的padding宽度
var MORE_BTN_LEN = 50;                                                  // 点击显示更多按钮的预留宽度

var Tpl = {
    main: [
        '<ul class="list-wrap">',
            '<li v-for="item in listData">',
                '<a href="{{item.url}}" target="_self" class="nav-item" :class="item | currentClass">{{item.name}}</a>',
            '</li>',
            '<li>',
                '<span v-if="moreListData.length" class="has-more ac-show-more" title="更多">',
                    '<i class="icon icon-more"></i><i v-show="showMoreList" class="arrow"></i>',
                '</span>',
                '<ul v-show="showMoreList" class="more-list-wrap">',
                    '<li v-for="moreItem in moreListData">',
                        '<a href="{{moreItem.url}}" target="_self" :class="moreItem | currentClass">{{moreItem.name}}</a>',
                    '</li>',
                '</ul>',
            '</li>',
        '</ul>'
    ].join("")
};

init();

function init() {
    $$Component("nav-comp", renderNav, {
        wrap: EL
    });

    $$Page({
        el: EL
    })
}

function renderNav(config) {
    var _config = $$isPlainObject( config ) ? config : {};

    var list = getCurrentList();

    _config.template = Tpl.main;

    _config.data = function () {
        return {
            listData: list,
            moreListData: [],
            showMoreList: false
        }
    };

    _config.attached = function () {
        var sliceIndex = calcSliceIndex(this);
        if (sliceIndex !== -1) {
            this.listData = list.slice(0, sliceIndex);
            this.moreListData = list.slice(sliceIndex);
        }
    };

    _config.filters = {
        currentClass: currentClass
    };

    _config.listeners = {
        "click .header-nav-item": clearStorage,
        "click .ac-show-more": function (e, vm) {toggleMoreList(vm);}
    };

    return _config;
}

// 获取当前module对应的urls列表
function getCurrentList() {
    var urls = [];
    $$each(UrlGroups, function (classes) {
        $$each(classes, function (module) {
            var url = module.url;
            var group = module.group;

            if (url === Page || group.indexOf(Page) > -1) {
                urls = module.urls;
            }
        })
    });
    return urls;
}

// 当前controller对应的所有action
function currentClass(item) {
    var className = "";
    if (item.url === Page || item.subpages.indexOf(Page) > -1) {
        className = "current";
    }
    return className;
}

/*
 * 当页面宽度不足, nav内容过长时, 显示一部分信息, 其余使用浮窗展示
 * 1. 累加每个item宽度, 与maxWidth比较;
 * 2. 超出maxWidth部分的内容放入more-list数组中;
 */

// 获取最大宽度, body宽 - sideNav宽 - 2 * nav padding宽 - "more"按钮宽
function getMaxWidth() {
    return document.body.clientWidth - LEFT_OFFSET - 2 * PADDING_COL - MORE_BTN_LEN;
}

// 获取nav中所有item
function getNavItems(el) {
    return $$(".nav-item", el);
}

// 对列表进行切割, 分为可显示出和显示不全的两部分, 计算页面无法显示的item的下标, 若无下标则返回-1
function calcSliceIndex(vm) {
    var maxLength = getMaxWidth();
    var itemsTotalLen = 0;
    var sliceIndex = -1;
    $$each(getNavItems(vm.$el), function (item, index) {
        itemsTotalLen += item.clientWidth;
        if (itemsTotalLen > maxLength && sliceIndex === -1) {
            sliceIndex = index;
            return false;
        }
    });
    return sliceIndex;
}

// 更多内容列表的显隐
function toggleMoreList(vm) {
    vm.$set("showMoreList", !vm.showMoreList);
}

function clearStorage() {
    localStorage.clear();
}
