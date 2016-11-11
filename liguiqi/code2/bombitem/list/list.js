/**
 * Created by liguiqi on 16/8/24.
 */
var $ = require('common:widget/ui/jquery/jquery.js');
var Tables = require('common:widget/ui/new-tables/new-tables.js');
require('common:widget/ui/modal/modal.js');
var $mod = $('.mod-bombitem-list');
var $buyName = $(".buy-name");
var URL_LIST = '/mis/bomb/bombRelationList'; //列表数据的接口
var URL_DELETE = '/mis/bomb/delBombRelation'; //删除商品的接口
var URL_NAME = '/mis/give/getName'; //根据销售码获取商品名称
var URL_PACKAGE = '/item/package/getPackageNameById';  //根据套餐名称
var URL_ADD = '/mis/bomb/addBombRelation'; //添加商品的接口
var MSG_SUCCESS = '操作成功!';
var MSG_ALERT = '是否删除?';
var MSG_INPUT_ALERT = '请输入正确的区域销售码!';
var HEAD = ['销售码','商品名','爆炸贴名称','操作'];
var TPL_LIST = [
    '<table class="table table-striped table-bordered">',
        '<thead>',
            '<tr>',
            '{{each thead as head}}',
            '<th>{{head}}</th>',
            '{{/each}}',
            '</tr>',
        '</thead>',
        '<tbody>',
            '{{if tbody && tbody.length}}',
                '{{each tbody as body}}',
                    '<tr class="current-tr" data-id="{{body.sku_id}}">',
                        '<td>{{body.sku_id}}</td>',
                        '<td>{{body.sku_name}}</td>',
                        '<td>{{body.bomb_id | bomb_type_filter}}</td>',
                        '<td><button type="button" class="btn btn-link delete">删除</button></td>',
                    '</tr>',
                '{{/each}}',
            '{{else}}',
                '<tr><td colspan="4">暂无数据</td></tr>',
            '{{/if}}',
        '</tbody>',
    '</table>'
].join('');
var Action = function(opts) {
    this.opts = opts;
    this.init();
};
Action.prototype = {
    constructor: Action,
    /**
     * @description 初始化页面的函数
     * 函数只做两件事情,加载数据以及事件绑定
     */
    init: function() {
        this.renderTable();
        this.bindEvent();
    },
    /**
     * @description 前后端接口函数
     * @param {String} url 接口URL
     * @param {Object} param 接口所需参数
     * @param {String} type 接口类型 POST还是GET
     * @param {Function} sucCal 成功时候的回调函数
     */
    syncData : function (url,param,type,sucCal) {
        $.ajax({
            url: url,
            data: param,
            dataType: 'json',
            type: type
        }).done(function(response) {
            if (response && response.ret === 0) {
                sucCal(response);
            } else {
                $mod.find('.submit-modify').toggleClass('load');
                alert(response.msg);
            }
        }).fail(function (response) {
            alert(response.msg);
        });
    },
    filters : function (type) {
        var self = this;
        if (type == 'bombTypeFilter') {
            return function (bomb_type_filter) {
                return self.opts.bomb_list[bomb_type_filter] || '— —'
            };
        }
    },
    renderTable : function () {
        var self = this;
        var tables = new Tables({
            tpl: TPL_LIST,
            filters: {
                bombTypeFilter: self.filters('bomb_type_filter')
            },
            dataUrl: URL_LIST,
            queryParams: ['q','bomb_id'],
            setData: function (sourceData) {
                return {
                    thead: HEAD,
                    tbody: sourceData.content.list
                };
            },
            setPageTotal: function (sourceData) {
                return sourceData.content.count-0;
            },
            paging: true,
            pages: {
                size: 12
            }
        });
        tables.done(function (table, nav) {
            $mod.find(".list").append(table,nav);
        });
    },
    /**
     * @description ⌚️页面所有操作的绑定函数
     */
    bindEvent :function () {
        var self = this;
        $mod.on('click', '.add-bomb', function () {
            $('.add-bomb-modal').modal('show');
            /*页面进行初始化操作*/
            $mod.find('.sale-id').val('');
            $mod.find('.buy-name').val('');
        })
        .on('click', '.delete', function () {
            var itemId = $mod.find(this).parent().parent().data('id');
            self.cancelItem(itemId);
        })
        .on('input','.sale-id',function(){
            //输入销售码自动关联到商品名称
            var this_value = $(this).val();
            $mod.find('.buy-name').val('');
            self.syncData(URL_NAME,{sku_id:this_value},'POST',self.getItemName);
        })
        .on('click', '.submit-modify', function () {
            //保存添加的商品数据,保存成功之后reload页面
            if($(this).hasClass('load')){
                return;
            }
            var skuId = $mod.find('.sale-id').val();
            var sName = $mod.find('.buy-name').val();
            if (skuId.length<6 || sName.length<1 ) {
                alert(MSG_INPUT_ALERT);
            }else{
                $(this).toggleClass('load');
                var param = {
                    sku_id : skuId,
                    bomb_id : $(".add-bomb-modal select option:selected").val()
                };
                self.syncData(URL_ADD,param,'POST',self.reLoadPage);
            }
        });
    },
    /**
     * @description load页面,添加或删除数据成功之后需要渲染页面
     */
    reLoadPage : function () {
        alert(MSG_SUCCESS);
        window.location.reload();
    },
    /**
     * @description 删除/取消爆炸贴接口
     * @param {String} skuId 当前商品的销售码
     */
    cancelItem : function (skuId) {
        var ok = confirm(MSG_ALERT);
        if (ok) {
            this.syncData(URL_DELETE,{sku_id : skuId},'POST',this.reLoadPage);
        }
    },
    /**
     * @description 输入销售码后加载商品名称的回调函数
     * @param {Object} nameObj 传入的是对象值,主要是syncData函数要尽量保持一致,所以穿参没有过多简化
     * */
    getItemName : function (nameObj) {
        var name = nameObj.content.name;
        if(name){
            $buyName.val(name);
        }
    }
};
module.exports = Action;