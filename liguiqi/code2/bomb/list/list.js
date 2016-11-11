/**
 * Created by liguiqi on 16/8/24.
 */
var $ = require('common:widget/ui/jquery/jquery.js');
var artTpl = require('common:widget/ui/tpl/tpl.js');
var $mod = $('.mod-hometag-list');
var $form = $mod.find('tbody');
var URL_SAVE = '/mis/bomb/addBomb';
var URL_LIST = '/mis/bomb/bomblist';
var URL_DELETE = '/mis/bomb/delBomb';
var MSG_SUCCESS = '操作成功!';
var MSG_CANCEL = '取消';
var MSG_ALERT = '请输入标签名称!';
var TPL_LIST = [
    '{{each list as item}}',
        '<tr data-id="{{item.id}}">',
            '<td class="id field-group">',
                '<input type="text" class="input-text id-input field-control {{if item.id != \'\'}}hide{{/if}}" required>',
                '<span class="read {{if item.id == \'\'}}hide{{/if}}">{{item.name}}</span>',
            '</td>',
            '<td class="count">{{if item.sku_count == 0}}--{{else }}{{item.sku_count}}{{/if}}</td>',
            '<td class="handle">',
                '<button type="button" class="btn btn-link save {{if item.id != \'\'}}hide{{/if}}">保存</button>&nbsp',
                '<button type="button" class="btn btn-link cancel {{if item.id != \'\'}}hide{{/if}}">取消</button>',
                '<button type="button" class="btn btn-link delete {{if item.id == \'\'}}hide{{/if}}">删除</button>',
            '</td>',
        '</tr>',
    '{{/each}}'
].join('');
var Action = function() {
    this.init();
};
Action.prototype = {
    constructor: Action,
    /**
     * @description 初始化页面的函数
     * 函数只做两件事情,加载数据以及事件绑定
     */
    init: function() {
        this.syncData(URL_LIST,{},'GET',this.intTpl);
        this.bindEvent();
    },
    /**
     * @description 前后端接口函数
     * @param {String} url 接口URL
     * @param {Object} param 接口所需参数
     * @param {String} type 接口类型 POST还是GET
     * @param {Function} callback 回调函数
     */
    syncData : function (url,param,type,callback) {
        $.ajax({
            url: url,
            data: param,
            dataType: 'json',
            type: type
        }).done(function(response) {
            if (response && response.ret === 0) {
                callback(response);
            } else {
                alert(response.msg);
            }
        }).fail(function (response) {
            alert(response.msg);
        });
    },
    /**
     * @description 初始化页面拼装的TPL,然后根据接口返回的数据进行渲染
     * @param {Object} renderData 渲染数据的对象
     */
    intTpl : function (renderData) {
        var list = renderData.content.list;
        $form.append(artTpl.compile(TPL_LIST)({
            list: list
        }));
    },
    /**
     * @description ⌚️页面所有操作的绑定函数
     */
    bindEvent :function () {
        var self = this;
        $mod.on('click', '.add', function () {
            $form.append(artTpl.compile(TPL_LIST)({
                list: [{
                    id : '',
                    name : '',
                    sku_count : 0
                }]
            }));
        })
        .on('click', '.cancel,.delete', function () {
            var item = $mod.find(this).parent().parent();
            var action =  $mod.find(this).text();
            self.cancelItem(item,action);
        })
        .on('click', '.save', function () {
            var tagName = $mod.find(this).parent().parent().find('.id-input').val();
            self.saveItem(tagName);
        });
    },
    /**
     * @description 保存爆炸贴数据
     * @param {String} tagName 爆炸贴名称
     */
    saveItem : function (tagName) {
        if(tagName.length<1){
            alert(MSG_ALERT);
            return;
        }
        this.syncData(URL_SAVE,{name:tagName},'POST',this.reLoadPage);

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
     * @param {Object} currentNode 当前行
     * @param {String} action 操作类型,值为"删除","取消"
     */
    cancelItem : function (currentNode,action) {
        var ok = confirm('是否'+action);
        if (ok) {
            if(action==MSG_CANCEL){
                currentNode.remove();
            }else{
                this.syncData(URL_DELETE,{id : currentNode.data('id')},'POST',this.reLoadPage);
            }
        }
    }
};
module.exports = Action;