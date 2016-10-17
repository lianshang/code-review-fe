var $ = require('home:widget/ui/zepto/zepto.js');

var loading = {
    tpl: [
        '<div id="uiWeuiLoading" class="weui_loading_toast" style="display: none;">',
        '<div class="weui_mask_transparent"></div>',
        '<div class="weui_toast">',
        '<div class="weui_loading">',
        '<div class="weui_loading_leaf weui_loading_leaf_0"></div>',
        '<div class="weui_loading_leaf weui_loading_leaf_1"></div>',
        '<div class="weui_loading_leaf weui_loading_leaf_2"></div>',
        '<div class="weui_loading_leaf weui_loading_leaf_3"></div>',
        '<div class="weui_loading_leaf weui_loading_leaf_4"></div>',
        '<div class="weui_loading_leaf weui_loading_leaf_5"></div>',
        '<div class="weui_loading_leaf weui_loading_leaf_6"></div>',
        '<div class="weui_loading_leaf weui_loading_leaf_7"></div>',
        '<div class="weui_loading_leaf weui_loading_leaf_8"></div>',
        '<div class="weui_loading_leaf weui_loading_leaf_9"></div>',
        '<div class="weui_loading_leaf weui_loading_leaf_10"></div>',
        '<div class="weui_loading_leaf weui_loading_leaf_11"></div>',
        '</div>',
        '<p class="weui_toast_content"></p>',
        '</div>',
        '</div>'
    ].join(""),
    show: function (text) {
        if (!this.$loading) {
            this.$loading = $(this.tpl).appendTo("body");
        }

        this.$loading.show().find(".weui_toast_content").text(text);
    },

    hide: function () {
        if (!this.$loading) {
            this.$loading = $(this.tpl).appendTo("body");
        }
        this.$loading.hide();
    },

    destroy: function () {
        this.$loading && this.$loading.remove();
        this.$loading = null;
    }
};

module.exports = loading;
