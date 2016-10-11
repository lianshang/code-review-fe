var tpls = {
    MODALTPL : [
        '<div class="modal fade modal-wap {{if name}}{{name}}{{/if}}" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">',
            '<div class="modal-dialog modal-{{if size}}{{size}}{{else}}md{{/if}}">',
                '<div class="modal-content">',
                    '{{if head}}',
                        '<div class="modal-header">',
                            '<h2 class="modal-title">{{head}}</h2>',
                        '</div>',
                    '{{/if}}',
                    '{{if body}}',
                        '<div class="modal-body">',
                        '</div>',
                    '{{/if}}',
                    '<div class="modal-footer">',
                        '{{if extendBtn}}<button type="button" class="btn btn-primary modal-extend">{{extendBtn}}</button>{{/if}}',
                        '<button type="button" class="btn btn-primary modal-submit">确定</button>',
                        '{{if type=="confirm"}}<button type="button" class="btn btn-default modal-cancel" data-dismiss="modal">取消</button>{{/if}}',
                    '</div>',
                '</div>',
            '</div>',
        '</div>'
    ].join("")
    };

module.exports = tpls;