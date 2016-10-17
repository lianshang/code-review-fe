var tpl = {
    dialog:[
        '<div class="weui_dialog_alert ui-areas" id="uiAreas" style="display: none;">',
            '<div class="weui_mask"></div>',
            '<div class="weui_dialog">',
                '<div class="weui_dialog_hd"><strong class="weui_dialog_title">请选择所在区域</strong></div>',
                '<div class="weui_dialog_bd">',
                    '<div class="top">',
                        '<div class="area-content"><label>省份:</label><select class="province" data-index="0"></select></div>',
                        '<div class="area-content"><label>城市:</label><select class="city" data-index="1"></select></div>',
                        '<div class="area-content"><label>地区:</label><select class="county" data-index="2"></select></div>',
                    '</div>',
                    '<div class="list"></div>',
                '</div>',
                '<div class="weui_dialog_ft">',
                    '<a class="weui_btn_dialog primary confirm">确定</a>',
                '</div>',
            '</div>',
        '</div>'
    ].join(""),

    option:'<option value="{{rid}}" {{if cur == rid}}selected{{/if}}>{{name}}</option>'
};

module.exports = tpl;