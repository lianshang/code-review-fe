var $ = require('home:widget/ui/zepto/zepto.js');

var Alert = {
    tpl: [
        '<div class="weui_dialog_alert ls-alert-dialog" style="display: none;">',
        '<div class="weui_mask"></div>',
        '<div class="weui_dialog">',
        '<div class="weui_dialog_hd"><strong class="weui_dialog_title">提示</strong></div>',
        '<div class="weui_dialog_bd">',
        'alert',
        '</div>',
        '<div class="weui_dialog_ft">',
        '<a class="weui_btn_dialog primary confirm">好</a>',
        '</div>',
        '</div>',
        '</div>'
    ].join(''),
    inputBox: [
        '<div class="weui_cells weui_cells_form">',
          '<div class="weui_cell">',
                '<div class="weui_cell_bd weui_cell_primary">',
                    '<input class="weui_input" type="text">',
                '</div>',
            '</div>',
        '</div>'
    ].join(''),
    show: function (html, onConfirm, confirmText) {
        var that = this;
        var confirmText = confirmText || '好'
        if (!that.$alert) {
            that.$alert = $(this.tpl).appendTo("body");
            that.$alert.find('.confirm').text( confirmText );
        }
        that.$alert.on('click.alert', '.confirm', function (e) {
            that.$alert.hide();
            if(onConfirm && typeof onConfirm == 'function') {
                onConfirm();
            }
            that.$alert.off('.alert');   //析构掉
        });
        that.$alert.show().find(".weui_dialog_bd").html(html);
    },

    prompt: function (html, onPrompt) {
      var that = this;
      if (!that.$alert) {
          that.$alert = $(this.tpl).appendTo("body");
      }

      that.$alert.show().find(".weui_dialog_bd").html(that.inputBox);
      that.$alert.find(".confirm").html("确定");
      that.$alert.find(".weui_input").prop('placeholder', html);

      that.$alert.on('click.prompt', '.confirm', function (e) {
        var code = that.$alert.find(".weui_input").val();
        that.$alert.hide();

        if(onPrompt && typeof onPrompt == 'function') {
            onPrompt( code );
        }

        that.$alert.off('.prompt');
      })
    },

    hide: function () {
        if (!this.$alert) {
            this.$alert = $(this.tpl).appendTo("body");
        }
        this.$alert.hide();
    }
};

module.exports = Alert;
