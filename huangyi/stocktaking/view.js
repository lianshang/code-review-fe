var validator = require( "common:widget/ui/vue/validator/validator.js" );
var Tables = require( "common:widget/ui/vue/tables/tables.js" );
var datePicker = require( "common:widget/ui/vue/datepicker/datepicker.js" );
var Search = require( "common:widget/ui/vue/search/search.js" );
var Modal = require( "common:widget/ui/custom-modal/custom-modal.js" );
var Store = require( "common:widget/ui/vue/vuex/store.js" );
Vue.use( validator );

var el = ".mod-stocktaking-view";
var detailsList = conf.pageContent.details || [];
var action = conf.pageInfo.action;
var info = conf.pageContent.title || {};

var modalTpl = {
    body: [
        '<div class="aligned center form-inline">',
            '<div v-show="!modalData.infoList.chooseLocationList.length">暂无库位</div>',
            '<template v-for="o in modalData.infoList.chooseLocationList">',
                '<fieldset>',
                    '<input value="{{o.locationId + \':\' + o.locationCode}}" v-model="modalData.infoList.choseList" type="checkbox">',
                    '<label>{{o.locationCode}}</label>',
                '</fieldset>',
            '</template>',
        '</div>'
    ].join("")
};

// $$Component( "tables", Tables, {
//     wrap: el,
//     dataSource: detailsList[0] || [],
//     pageing: false
// } );

initDetailsList();

$$Component("datepicker", datePicker, {
    wrap: el
});

$$Component("modal", Modal, {
    wrap: el,
    config: {
        uid: "chooseLocation",
        title: "选择库位",
        body: modalTpl.body,
        footer: {
            type: "confirm"
        }
    },
    handler: function (_, vm) {
        var locationList = vm.postData.locationList;
        var choseList = vm.infoList.choseList;

        locationList.splice(0, locationList.length); //确定指定的库位后先清空locationList, 再赋值

        formatEleToObj(choseList, locationList, "locationId", "locationCode");
        vm.$broadcast('hideModal', 'chooseLocation');
    }
});

$$Page( {
    el: el,
    data: {
        formData: conf.pageContent,
        // 库位: 控制指定或随机选项的相关内容显示, 默认指定方式;
        control: {
            appoint: true,
            random: false
        },
        // 库区、货架、商品、供商、指定库位列表等相关列表;
        infoList: {
            areaOptions: [],
            shelfOptions: [],
            itemOptions: [],
            supplierOptions: [],
            // 指定库位加载列表
            chooseLocationList: [],
            // 然而对于指定库位的情况, 指定库位和随机互斥, 借用choseList先存储选择的结果,
            // 确认选择后取出choseList覆盖locationList
            choseList: []
        },
        // 用于请求的相关数据;
        postData: {
            area: info.areaId || "0",
            shelf: info.storageId || "0",
            item: info.itemId || "0",
            supplier: info.supplierId || "0",
            locationNum: "",
            dueTime: info && info.dueTime ? info.dueTime : "",
            createdAt: info && info.createdAt ? info.createdAt : "",
            // 库位列表;
            // locationList {locationId: "", locationCode: ""}, 用于展示
            locationList: conf.pageContent.title ? conf.pageContent.title.locationList : []
        }
    },
    validation: {
        submit: function ( data ) {
            var postSource = data;
            var list = [];
            var locationList = this.vm.postData.locationList;
            // 后端只接收locationId的数组, 取出随机或指定的结果数组中每个对象的locationId, 放入postLocationList
            for (var i = 0; i < locationList.length; i++) {
                list.push(locationList[i].locationId);
            }
            postSource.locationList = list;

            if (action == "new") {  // 新增盘点任务
                $$http("/inhouse/stocktaking/create", postSource).then(function (data) {
                    alert("保存成功");
                    window.location.href = "/inhouse/stocktaking/list"
                }, fail);
            } else {                // 修改任务
                $$http("/inhouse/stocktaking/update", postSource).then(function (data) {
                    alert("修改成功");
                    window.location.href = "/inhouse/stocktaking/list"
                }, fail);
            }

        }
    },
    store: Store,
    created: function () {
        var self = this;

        // 先初始化库区和商品列表
        var options = [
            {
                // 库区
                url: "/inhouse/stocktaking/getarealist",
                handler: function (content) {
                    self.$set("infoList.areaOptions", content.AreaList);
                }
            }
            // {
            //     // 商品
            //     url: "/inhouse/stocktaking/getitemlist",
            //     handler: function (content) {
            //         self.$set("infoList.itemOptions", content.ItemList);
            //     }
            // }
        ];
        // 修改页面需要回显, 使用获取的库区值和商品值分别加载货架列表和供商列表
        if (action == "edit") {
            var opts = [
                // 货架
                {
                    url: "/inhouse/stocktaking/getstoragelist",
                    data: {areaId: info.areaId},
                    handler: function (content) {
                        self.$set("infoList.shelfOptions", content.StorageList);
                    }
                },
                // 供商
                {
                    url: "/inhouse/stocktaking/getsupplierlist",
                    data: {itemId: info.itemId},
                    handler: function (content) {
                        self.$set("infoList.supplierOptions", content.SupplierList);
                    }
                }
            ];
            options.concat(opts);
        }

        setList(options);

        formatEleToString(self.postData.locationList, self.infoList.choseList, "locationId", "locationCode", false);
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
        // modal显示时, locationList中的内容要选中, 传入当前内容和locationList中的每个对象做比较
        // 'isChecked': function (content) {
        //     var list = this.postData.locationList;
        //     for (var i = 0; i < list.length; i++) {
        //         if (list[i].locationId == content) {
        //             return true;
        //         }
        //     }
        //     return false
        // }
    },
    listeners: {
        "change .ac-select-method": function (e, vm) {
                vm.control.appoint = !vm.control.appoint;
                vm.control.random = !vm.control.random;
        },
        // 1.选择库区, 货架加载对应的列表,
        // 2.选择盘点商品, 加载对应的盘点供商列表
        // 3.盘点库位支持随机和指定
        //      3.1 将库区、货架、商品、供商选择的结果传给后端, 非必需, 参数精细筛选结果越精细
        //      3.2 选中随机, 在["name=locationNum"]输入随机数量, 请求获取随库位
        //      3.3 选中指定, 将选中结果以["name=locationId"]传给后端, locationNum默认为0
        // 4.最终结果以array形式、字段名为locationList; eg: [locationId1, locationId2...]

        // 选择库区, 更新货架list
        "change .ac-select-area": function (e, vm) {
            var areaValue = e.target.value;
            vm.postData.area = areaValue;
            $$http("/inhouse/stocktaking/getstoragelist", {areaId: areaValue}).then(function (data) {
                vm.infoList.shelfOptions = data.StorageList;
            })
        },
        "change .ac-select-shelf": function (e, vm) {
            vm.postData.shelf = e.target.value;
        },

        // 选择商品, 更新供商list
        // "change .ac-select-item": function (e, vm) {
        //     var itemValue = e.target.value;
        //     vm.postData.item = itemValue;
        //     $$http("/inhouse/stocktaking/getsupplierlist", {itemId: itemValue}).then(function (data) {
        //         vm.infoList.supplierOptions = data.SupplierList;
        //     })
        // },
        // 做了一版修改, 先做成输入框, 几千条数据需要做sug, 这里先用input替代
        "blur .ac-select-item": function (e, vm) {
            var itemValue = this.value;
            if (itemValue) {
                vm.postData.item = itemValue;
                $$http("/inhouse/stocktaking/getsupplierlist", {itemId: itemValue}).then(function (data) {
                    vm.infoList.supplierOptions = data.SupplierList;
                })
            }
        },
        "change .ac-select-supplier": function (e, vm) {
            vm.postData.supplier = e.target.value;
        },

        // 获取随机库位
        "click .ac-random-location": function (e, vm) {
            getLocationList(vm, "random");
        },

        // 指定库位, 默认随机值为0标识指定
        "click .ac-choose-modal": function (e, vm) {
            getLocationList(vm, "choose");
            vm.$broadcast('showModal', 'chooseLocation');
        }
        // "click .ac-modal-cancel": function (e, vm) {
        //     vm.$broadcast('hideModal', 'chooseLocation');
        // },

        // 选中指定库位写入locationList
        // "click .ac-choose-location": function (e, vm) {
        //     var locationList = vm.postData.locationList;
        //     var choseList = vm.infoList.choseList;
        //
        //     locationList.splice(0, locationList.length); //确定指定的库位后先清空locationList, 再赋值
        //
        //     formatEleToObj(choseList, locationList, "locationId", "locationCode");
        //     vm.$broadcast('hideModal', 'chooseLocation');
        // }
    }
} );

// 复合盘点任务有多次, 每次一个表格, 用自定义tables1、tables2...标签承载
function initDetailsList() {
    if (detailsList.length && detailsList.length > 0) {
        for (var i = 0; i < detailsList.length; i++) {
            $$Component( "tables" + i, Tables, {
                wrap: el,
                dataSource: detailsList[i] || [],
                pageing: false
            } );
        }
    }
}

// 获取库位列表
function getLocationList(vm, type) {
    var data = {
        areaId: vm.postData.area,
        storageId: vm.postData.shelf,
        itemId: vm.postData.item,
        supplierId: vm.postData.supplier,
        locationNum: type === "random" ? vm.postData.locationNum : "0"
    };
    $$http("/inhouse/stocktaking/getlocationlist", data).then(function (content) {
        if (type == "choose") {
            vm.infoList.chooseLocationList = content.LocationList || [];
        } else {
            vm.postData.locationList = content.LocationList || [];
            formatEleToString(vm.postData.locationList, vm.infoList.choseList, "locationId", "locationCode");
        }
    })
}

// 初始化choseList, 取出infoList.locationList的每个对象
// 复选框的双向绑定, 既要存id又要存code, 以obj不能实现
// 所以就拼成"id:code"的string形式, 遍历一次选择结果解析总比两层遍历搜索对应值得locationCode好吧, 都是泪。。。
// @param replace, 是否全部替换, 默认全替换
function formatEleToString(targetList, outputList, key, value, replace) {
    var locationList = targetList;
    var choseList = outputList;
    for (var i=0; i<locationList.length; i++) {
        var ele = locationList[i][key] + ":" + locationList[i][value];
        if (replace === undefined || replace == true) {
            choseList.splice(0, choseList.length); // 先清空choseList
        }
        choseList.push(ele);
    }
}
// 将"id:code"的string形式的数组每个元素转成{id: "",code: ""}形对象
function formatEleToObj(targetList, outputList, key, valueKey) {
    for (var i=0; i<targetList.length; i++) {
        var obj = {};
        obj[key] = targetList[i].split(":")[0];
        obj[valueKey] = targetList[i].split(":")[1];
        outputList.push(obj);
    }
}

// 获取列表
// options {"url": "", "data": "", "handler": function()}
// url , 必选
// data, 可选, 请求参数
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

function fail(msg) {
    alert(msg || "保存失败");
}