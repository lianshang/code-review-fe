var $ = require('common:widget/ui/jquery/jquery.js');
var Tables = require('common:widget/ui/new-tables/new-tables.js');
var helper = require('common:widget/ui/helper/helper.js');
var Action = function (opts) {
    var $mod = $('.mod-package-sku-list');
    var thead = ['链商商品码', '销售码', '商品名称', '供货价', '销售价', '最小起订量', '限购数量/单', '库存量','仓储类型', '物美状态', '状态', '编辑人', '操作'];
    var TPL = [
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
                '<tr data-skuid="{{body.sku_id}}">',
                    '<td>{{body.sku_id || "— —"}}</td>',
                    '<td>{{body.item_id || "- -"}}</td>',
                    '<td>{{if body.sale_unit > 1 }}{{body.name}}*{{body.sale_unit}}{{else}}{{body.name || "— —"}}{{/if}}</td>',
                    '<td>{{body.kbetr || "— —"}}</td>',
                    '<td>{{body.sale_price || "— —"}}</td>',
                    '<td>{{body.moq || "— —"}}</td>',
                    '<td>{{body.order_limit || "- -"}}</td>',
                    '<td>{{body.inventory_num || "— —"}}</td>',
                    '<td>{{body.storage_type_name}}</td>',
                    '<td>{{body.mmsta | wmstatus_filter}}</td>',
                    '<td>{{body.status | lshstatus_filter}}</td>',
                    '<td>{{body.editor_name || "— —"}}</td>',
                    '<td>',
                        '<a href="/item/sale/view?sale_type=1&sku_id={{body.sku_id}}{{queryParams}}{{hash}}" target="_self">查看</a>',
                        '{{#body.sku_id | itemadd_filter}}',
                    /* '<a href="javascript:;" class="add-items {{if body.sku_id.isskuList}}disabled{{/if}}">&nbsp;&nbsp;添加</a>',*/
                    '</td>',
                '</tr>',
            '{{/each}}',
        '{{else}}',
            '<tr><td colspan="13">该搜索条件下没有对应的数据</td></tr>',
        '{{/if}}',
        '</tbody>',
        '</table>'
    ].join('');

    function wmstatusFilter (status) {
        return opts.wmStatusList[status] || '— —';
    }

    function lshstatusList (status) {
        return opts.lshStatusList[status] || '— —';
    }

    //判断添加按钮：是否为可添加状态
    function itemaddFilter (skuId) {
        //在这个数组中则不可添加
        if ($.inArray((+skuId), opts.skuList) >= 0) {
            return '<a class="added" href="javascript:;">&nbsp;&nbsp;添加</a>';
        } else {
            return '<a class="add-item" href="javascript:;">&nbsp;&nbsp;添加</a>';
        }
    }

    function generalTables () {
        var tables = new Tables({
            tpl: TPL,
            filters: {
                wmstatus_filter: wmstatusFilter,
                lshstatus_filter: lshstatusList,
                itemadd_filter: itemaddFilter
            },
            dataUrl: '/item/sale/getlist',
            queryParams: ['name', 'status', 'category_id','sale_type'],
            setData: function (sourceData) {
                return {
                    thead: thead,
                    tbody: sourceData.content.list
                };
            },
            setPageTotal: function (sourceData) {
                return sourceData.content.total;
            },
            paging: true,
            pages: {
                size: 12
            }
        });
        tables.done(function (table, nav) {
            $mod.find('.package-sku-list').append(table).append(nav);
        });
    }

    function addSkuForPackage (params,$this) {
        $.ajax({
            url: '/item/package/addSkuForPackage',
            data: params,
            dataType: 'json',
            type: 'POST'
        }).done(function(data) {
            if (data && data.ret === 0) {
                alert('操作成功!');
                //操作成功后变成不可操作状态
                $this.removeClass('add-item').addClass('added');
            } else {
                alert(data.msg);
            }
        });

    }


    function bindEvent() {

        $mod.on('click','.add-item', function () {
            var $this = $(this);
            var params = {
                packageId: helper.queryString('packageId'),
                skuId: $this.closest('tr').data('skuid')
            };
            addSkuForPackage(params,$(this));
        }).on('click', '.btn-finish', function () {
            //点击编辑跳转到编辑页带hash值
            window.location.href = window.location.href.replace('/skuList', '/edit');
        });
    }

    function init () {
        generalTables();
        bindEvent();
    }

    init();
};

module.exports = Action;
