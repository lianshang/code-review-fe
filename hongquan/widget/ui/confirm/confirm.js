var $ = require('home:widget/ui/zepto/zepto.js');

var Confirm = {
    tpl: [
        '<div class="weui_dialog_confirm ls-confirm-dialog" style="display: none;">',
        '<div class="weui_mask"></div>',
        '<div class="weui_dialog">',
        '<div class="weui_dialog_hd"><strong class="weui_dialog_title">confirm-title</strong></div>',
        '<div class="weui_dialog_bd">',
        'confirm-content',
        '</div>',
        '<div class="weui_dialog_ft">',
        '<a href="javascript:;" class="weui_btn_dialog default cancel">取消</a>',
        '<a href="javascript:;" class="weui_btn_dialog primary confirm">好</a>',
        '</div>',
        '</div>',
        '</div>'
    ].join(''),
    /**
     *
     * @param  {String|Object} content
     * @param onConfirm
     * @param onCancel
     * @param obj { cancelText: string, confirmText: string }
     */
    show: function (content, onConfirm, onCancel, obj) {
        var obj = obj || {};
        if ( typeof onCancel == 'object' ) obj = onCancel;
        var that = this;
        var title = '确认';
        var cancelText = obj.cancelText || '取消';
        var confirmText = obj.confirmText || '好';
        //参数兼容: 既支持配置html,又支持配置options
        if(content && typeof content == 'object') {
            var options = content;
            onConfirm = options.onConfirm;
            onCancel = options.onCancel;
            title = options.title || title;
            cancelText = options.cancelText || cancelText;
            confirmText = options.confirmText || confirmText;
            content = options.content || '';
        }
        if (!that.$confirm) {
            that.$confirm = $(this.tpl).appendTo("body");
        }
        that.$confirm.on('click.confirm', '.confirm', function (e) {
            that.$confirm.hide();
            if(onConfirm && typeof onConfirm == 'function') {
                onConfirm();
            }
            that.$confirm.off('.confirm');   //析构掉
        }).on('click.confirm', '.cancel', function (e) {
            that.$confirm.hide();
            if(onCancel && typeof onCancel == 'function') {
                onCancel();
            }
            that.$confirm.off('.confirm');   //析构掉
        });
        that.$confirm.show().find(".weui_dialog_bd").html(content);
        that.$confirm.show().find(".weui_dialog_title").html(title);
        that.$confirm.show().find(".cancel").html(cancelText);
        that.$confirm.show().find(".confirm").html(confirmText);
    },

    hide: function () {
        if (!this.$confirm) {
            this.$confirm = $(this.tpl).appendTo("body");
        }
        this.$confirm.hide();
    }
};

module.exports = Confirm;
