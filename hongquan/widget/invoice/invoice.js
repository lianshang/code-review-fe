var $ = require('home:widget/ui/zepto/zepto.js');
var TPL = require('home:widget/invoice/tpls.js');
var artTpl = require('home:widget/ui/tpl/tpl.js');
var Storage = require('home:widget/ui/localstorage/localstorage.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Confirm = require('home:widget/ui/confirm/confirm.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');

var Action = function(opts) {
    this.$mod = opts.$el;
    this.init();
    this.bindEvent();
};

Action.prototype = {
    init: function() {
        this.data = Storage.getItem('invoice') || {};
        this.render();
        this.mainFlag = false;
    },
    render: function() {
        var self = this;
        $.ajax({
            url: '/shopping/invoice/getconfig',
            dataType: 'json',
            success: function(data) {
                if (data && data.ret == 0) {
                    self.data['content_types'] = data.content.content_types;
                    //默认选择发票
                    self.data['need_invoice'] = '1';
                    self.$mod.append(artTpl.compile(TPL.content)(self.data));
                    self.$main = self.$mod.find('.main');
                } else if (data && data.ret == 100021) {
                    Alert.show(data.msg, function() {
                        location.reload();
                    });
                }
            }
        });
    },
    validate: function() {
        if (!this.$main.hasClass('type-vat') && this.$mod.find('.invoice-title-corp').prop('checked') && !this.$mod.find('.company-name').val().length ) {
            Alert.show('请填写单位名称！');
            return false;
        }
        return true;
    },
    bindEvent: function() {
        var self = this;
        var needInvoice = Storage.getItem('invoice') && Storage.getItem('invoice').need_invoice || "0";
        self.$mod.on('change', '.need-invoice', function() {
            if ($(this).prop('checked')) {
                if (self.mainFlag) {
                    self.$main.show();
                } else {
                    self.$main.append(artTpl.compile(TPL.main)(self.data));
                    self.mainFlag = true;
                }
            } else {
                self.$main.hide();
            }
        }).on('change', '[name=title_type]', function() {
            var $this = self.$mod.find('.invoice-title-corp');
            var $corp = self.$mod.find('.invoice-corp');
            if ($this.prop('checked')) {
                $corp.removeClass('hide');
            } else {
                $corp.addClass('hide');
            }
        }).on('change', '[name=invoice_type]', function() {
            var $this = self.$mod.find('.invoice-type-normal');
            if ($this.prop('checked')) {
                self.$main.removeClass('type-vat');
            } else {
                self.$main.addClass('type-vat');
            }
        }).on('click', '.btn-confirm', function() {
            if (self.validate()) {
                var params = {};
                var $inputs = self.$mod.find('input');
                    $.each($inputs, function(k, v) {
                        var $v = $(v);
                        var name = $v.attr('name');
                        if ($v.attr('type') == 'checkbox') {
                            params[name] = $v.prop('checked') ? '1' : '0';
                        } else if ($v.prop('checked') || $v.attr('type') == 'text' && params.title_type == '2') {
                            params[name] = $v.val();
                        }
                        if (name == 'need_invoice' && !$v.prop('checked')) {
                            return false;
                        } else if (name == 'invoice_type' && params[name] == "2") {
                            return false;
                        }
                    });
                Storage.setItem('invoice', params);
                Storage.removeItem('hasEdit');
                window.location.href = '/#shopping/order';
            }
        }).on('click','.i-back', function (e) {
            //是否编辑
            var hasEdit = Storage.getItem('hasEdit');
            //没有选择发票时,不提示
            if(needInvoice == '0'){
                e.preventDefault();
                self.goBack('是否放弃申请发票');
            }
            if(needInvoice != '0' && hasEdit){
                e.preventDefault();
                self.goBack('是否放弃修改发票信息');
            }

        }).on('change', 'input', function () {
            //用于标示是否有编辑
            var hasEdit = Storage.getItem('hasEdit');
            if(!hasEdit) {
                Storage.setItem('hasEdit', true);
            }
            console.log(hasEdit);
        })
    },
    goBack: function (msg) {
        Confirm.show(msg, function() {
            Storage.removeItem('hasEdit');
            window.location.href = '/#shopping/order';
        });
    }
};

var View = Backbone.View.extend({
    className: 'mod-invoice',
    initialize: function (options) {
        $(document.body).append(this.$el);
        new Action($.extend({$el: this.$el}, options));
    },
    close: function () {
        this.unbindEvent();
    },
    unbindEvent: function() {

    }
});

module.exports = View;
