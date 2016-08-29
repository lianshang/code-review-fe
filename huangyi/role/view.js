var validator = require( "common:widget/ui/vue/validator/validator.js" );
var Tables = require( "common:widget/ui/vue/tables/tables.js" );
var datePicker = require( "common:widget/ui/vue/datepicker/datepicker.js" );
var Search = require( "common:widget/ui/vue/search/search.js" );
var Modal = require( "common:widget/ui/custom-modal/custom-modal.js" );
var Store = require( "common:widget/ui/vue/vuex/store.js" );
Vue.use( validator );

var el = ".mod-role-view";
var action = conf.pageInfo.action;
var info = conf.pageContent;

var testData = [
    {
        title: "baseinfo",
        desc: "基础数据",
        level2List: [
            {
                title: "itemManage",
                desc: "商品管理",
                detailList: [
                    {
                        title: "view_item",
                        desc: "查看商品"
                    },
                    {
                        title: "edit_item",
                        desc: "编辑商品"
                    }
                ]
            },
            {
                title: "itemManage3",
                desc: "商品管理3",
                detailList: [
                    {
                        title: "view_item3",
                        desc: "查看商品"
                    },
                    {
                        title: "edit_item3",
                        desc: "编辑商品"
                    }
                ]
            }
        ]
    },
    {
        title: "baseinfo2",
        desc: "基础数据2",
        level2List: [
            {
                title: "itemManage2",
                desc: "商品管理2",
                detailList: [
                    {
                        title: "view_item2",
                        desc: "查看商品"
                    },
                    {
                        title: "edit_item2",
                        desc: "编辑商品"
                    }
                ]
            }
        ]
    }
];

var permissionList = testData;//info.permossionList || {}; // 后端数据没好, 先自己弄个假数据

var modalTpl = {
    body: [
        '<template v-for="level in modalData.infoList.allotList">',
            '<div>',
                '<h2 class="top-title">',
                    '<input type="checkbox" value="{{level.title}}" class="ac-check-level1" data-top="{{level.title}}" v-model="modalData.postData.level1CheckList">',
                    '<label>{{level.desc}}</label>',
                '</h2>',
                '<div class="divider"></div>',
                '<fieldset v-for="level2 in level.level2List">',
                    '<ul class="level-top">',
                        '<li>',
                            '<input value="{{level2.title}}" data-top="{{level.title}}" type="checkbox" v-model="modalData.postData.level2CheckList" class="ac-check-level2"/>{{level2.desc}}',
                            '<ul class="level-second">',
                                '<li  v-for="level3 in level2.detailList" class="check-items">',
                                    '<input value="{{level3.title}}" type="checkbox" v-model="modalData.postData.level3CheckList" class="ac-check-level3" data-father="{{level2.title}}" data-top="{{level.title}}"/>{{level3.desc}}',
                                '</li>',
                            '</ul>',
                        '</li>',
                    '</ul>',
                '</fieldset>',
            '</div>',
        '</template>'
    ].join("")
};

$$Component("datepicker", datePicker, {
    wrap: el
});

$$Component("allotmodal", Modal, {
    wrap: el,
    config: {
        uid: "allotPermission",
        title: "分配权限",
        body: modalTpl.body,
        footer: {
            type: "confirm"
        }
    },
    handler: function (e, vm) {
        vm.postData.allocList = vm.postData.level3CheckList;
        console.log(vm.postData.allocList);
        vm.$broadcast('hideModal', 'allotPermission');
    },
    cancel: function (e, vm) {
        console.log(e);
        console.log(vm);
    }
});

$$Page( {
    el: el,
    data: {
        formData: info,
        infoList: { // 相关列表: 组别
            groupList: [],
            // 权限分配的数据
            allotList: permissionList
        },
        postData: {
            level1CheckList: [],  // 1级目录相关权限选中的列表
            level2CheckList: [],  // 2级目录相关权限选中的列表
            level3CheckList: info && info.role ? info.role.permission : [],  // 3级目录相关权限选中的列表
            allocList: info && info.role ? info.role.permission : []         // 点击确认后将level3CheckList中的结果赋值给allocList, 保存时发送此数组
        }
    },
    validation: {
        submit: function ( data ) {
            var url = action == "new" ? "/sys/role/addrole" : "/sys/role/updaterole";
            var postData = data;
            postData.ptitles = this.vm.postData.allocList;
            if (action == "edit") {
                postData.id = $$lh.queryString("id");
            }

            $$http(url, postData).then(function () {
                alert("保存成功");
                window.location.href = "/sys/role/list";
            }, function (msg) {
                alert(msg || "请求失败")
            })
        }
    },
    store: Store,
    created: function () {
        var self = this;
        action === "edit" && initPermissionList(self.postData.level3CheckList, permissionList, self);
    },
    filters: {
        // 拼接数组中每个对象的指定key值
        'joinValue': function (content, key) {
            var keyArr = [];
            if ($$.isArray(content) && content.length) {
                for(var i = 0; i < content.length; i++) {
                    keyArr.push(content[i][key]);
                }
            }
            return keyArr.join(",  ");
        }
    },
    listeners: {
        // 全选分配相关交互
        "click .ac-permission-modal": function (e, vm) {
            vm.$broadcast('showModal', 'allotPermission');
        },

        // 选中一级目录操作权限
        "change .ac-check-level1": function (e, vm) {
            var that = this;
            var title = that.value;
            $$each(permissionList, function (v) {
                if (v.title == title) {
                    // 所有二级目录
                    var list = v.level2List;
                    whetherCheckedAll(list, vm.postData.level2CheckList, that.checked);
                    $$each(list, function (value) {
                        // 所有三级目录
                        whetherCheckedAll(value.detailList, vm.postData.level3CheckList, that.checked);
                    })
                }
            })
        },
        // 选中二级目录操作权限
        "change .ac-check-level2": function (e, vm) {
            // 三层结构, 最顶层放在data的top中
            var that = this;
            var title = that.value;
            var top = that.dataset.top;
            $$each(permissionList, function (v) {
                if (v.title == top) {
                    $$each(v.level2List, function (value) {
                        // 选中所有三级目录
                        if (value.title == title) {
                            var list = value.detailList;
                            whetherCheckedAll(list, vm.postData.level3CheckList, that.checked);
                        }
                    });
                    // 判断一级目录是否需要选中
                    whetherCheckedFather(v.level2List, vm.postData.level2CheckList, top, vm.postData.level1CheckList);
                }
            });
        },
        // 选中三级目录操作权限
        "change .ac-check-level3": function (e, vm) {
            var that = this;
            var topKey = that.dataset.top;
            var fatherKey = that.dataset.father;
            $$each(permissionList, function (v) {
                if (v.title == topKey) {
                    var list = v.level2List;
                    $$each(list, function (value) {
                        if (value.title == fatherKey) {
                            // 判断二级父目录是否需要选中
                            whetherCheckedFather(value.detailList, vm.postData.level3CheckList, fatherKey, vm.postData.level2CheckList);
                            // 再判断一级目录是否需要选中
                            whetherCheckedFather(list, vm.postData.level2CheckList, topKey, vm.postData.level1CheckList);
                        }
                    })
                }
            });
        }
    }
} );

// 获取列表
// options {"url": "", "data": "", "handler": function()}
// options.url , 必选
// options.data, 可选, 请求参数
function getList(option, success) {
    if (option && option.url) {
        var postData = option.data === undefined ? {} : option.data;
        $$http(option.url, postData).then(function (content) {
            success(content)
        })
    }
}

// 设置列表
function setList(options) {
    $$.each(options, function (_, option) {
        getList(option, option.handler);
    })
}

/*
* 权限操作相关函数
* 后端权限列表以json格式返回, 精确到对每个module的controller的增删查改操作
*
* 1. 操作上级目录, 选中上级目录时, 下级目录全选或全取消;
* 2. 操作下级目录, 下级目录全选中的, 上级目录也要选中; 未全选的, 上级目录不选;
*
* 先约定好了的json结构, 不一样就diao死后端
*/

// 下级目录全选或者全不选
// @param childArr  {array}         下级目录数组
// @param targetArr {array}         目标数组, 对目标数组做相应的操作
// @param isCheck   {boolean}       全选或全取消, 对目标数组做相应的操作, 默认全选, true
function whetherCheckedAll(childArr, targetArr, isCheck) {
    $$each(childArr, function (item) {
        var index = $$.inArray(item.title, targetArr);             // 这样是严格要求每个item是个Object, key在title对象里
        if ((isCheck === undefined || true) && index === -1) {     // checked all
            targetArr.push(item.title);
        } else if (isCheck === false && index !== -1) {            // cancel all
            targetArr.splice(index, 1);
        }
    })
}

// 是否选中父级目录
// 例如, 比较的两个数组, 目标数组是level3CheckList, 比较数组为当前元素所在的数组
// @param childArr  {array}         操作对象中子列表
// @param curArr    {array}         当前选中的所有的子目录数组, 即level3CheckList, 或level2CheckList
// @param fatherKey {string}        父元素的key值, 把父元素的key加入上级列表的数组
// @param targetArr {array}         目标数组, 对目标数组做相应的操作
function whetherCheckedFather(childArr, curArr, fatherKey, targetArr) {
    var index = $$.inArray(fatherKey, targetArr);
    if (isAllin(curArr, childArr) && index === -1) {
        targetArr.push(fatherKey);
    } else if (!isAllin(curArr, childArr) && index !== -1) {
        targetArr.splice(index, 1);
    }
}

// 目标数组是否包含参照数组的所有元素
// @param targetArr    {array}        目标数组
// @param compareArr   {array}        参照数组
function isAllin(targetArr, compareArr) {
    if (!$$.isArray(targetArr) || !$$.isArray(compareArr)) {
        return
    }
    var length = compareArr.length;
    var count = 0;
    $$each(targetArr, function (v) {
        var tarVal = v;
        $$each(compareArr, function (value) {
            // 这样是严格要求每个item是个Object, key在title对象里
            tarVal === value.title && count ++;
        })
    });
    return length === count
}

/*
 * end 权限操作相关函数
 */

// 蛋疼的编辑页回写初始化函数, 先简单实现, 相当于一个个选中后端返回的三级权限的数组, 去触发父校验父目录是否也需要选中
// 针对每个二级、三级列表调用一次, 判断是否需要选中其父元素
// @param  content   {array}         当前选中的第三级权限数组
// @param  perList   {json}          权限列表json
function initPermissionList(content, perList, vm) {
    $$each(perList, function (itemLevel1) { //循环一级
        $$each(itemLevel1.level2List, function (itemLevel2) { //循环二级
            if (isAllin(content, itemLevel2.detailList)) {
                vm.postData.level2CheckList.push(itemLevel2.title);
            }
        });
        if (isAllin(vm.postData.level2CheckList, itemLevel1.level2List)) {
            vm.postData.level1CheckList.push(itemLevel1.title);
        }
    })
}

// TODO 选中回显
// 1. 如果选中所有的权限, 则显示 "所有权限";
// 2. 如果选中所有的module下的权限, 则显示module.desc + "所有"; 如"系统管理所有"
// 3. 如果选中所有controller下的权限, 则显示controller.desc + "所有"; 如"账号管理所有"
// 4. 如果只选中部分, 则显示部分; 如"新增角色"