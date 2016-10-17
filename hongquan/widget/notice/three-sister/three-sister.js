/**
 * （谨以此纪念天天爬楼梯上班的日子!)
 * 根据预设的字段规则,生成表单编辑/浏览的视图
 *
 * */

var $ = require('home:widget/ui/zepto/zepto.js');
var artTpl = require('home:widget/ui/tpl/tpl.js');
var helper = require('home:widget/notice/helper/helper.js');
var message = require('home:widget/notice/message/message.js');
var Alert = require('home:widget/ui/alert/alert.js');

//require('common:widget/ui/datepicker/jquery-datepicker/date.js');// 原始日期对象扩展
//require('common:widget/ui/datepicker/jquery-datepicker/datetimepicker.js');
//require('common:widget/ui/datepicker/jquery-datepicker/locales/bootstrap-datetimepicker.zh-CN.js');


//require('common:widget/ui/bootstrap/modal/modal.js');


//    //纺织、皮革> 棉类面料 > 府绸: 主要用途可触发具体用途的异步数据获取； 还有一个standardType 作为属性模板
//    //
//
//    //case 1：列表
//    //case 2：输入框
//
//    //standardType 标准类型（比如颜色，有预览色）
//    //isSpecAttr => 可定义属性
//    //isSupportDefinedValues => 支持定义值（右侧扩展项）
//    //isSpecPicAttr => 可指定属性图片（颜色？）
//    //precomment => 可出现一个注释 (例子见：仪器仪表> 室内环保检测仪器 > 消毒机)
//    //isSuggestion => 出现一个 pop 选择框（例子见：电子元器件> 集成电路(IC)）
//    //inputType:3 单选
//    //inputType:2 多选
//    //inputType:1 sug+输入框(可自定义)
//    //inputType:0 文本输入框

////
//var templateInfoSample = [{
//    "name": "pack_desc",          //KEY NAME: id字符串,属性的唯一标识
//    "label": "包装单位汉字描述",    //KEY LABEL: 文字串,表单项标识
//    "required": 1,                //VALUE 验校is_required: 1/0, 是否必填项
//    "fieldType": "string",        //VALUE 标准校验方式: number/string/byte, 校验方式 （number: .和数字, string: 任意字符, byte: 按字节校验文字长度）
//    "pattern": '^.+$',            //VALUE 校验的正则要求 （如果有pattern,则忽略fieldType）
//    "inputType": 'input',               //field layout方式:
////    //inputType:3 单选 (radio)
////    //inputType:2 多选 (checkbox)
////    //inputType:1 可下拉选择的输入框(可自定义) (inputSelect)
////    //inputType:0 文本输入框 (input)
////    //inputType:? 可sug的下拉框 (sugSelect)
//    //inputType: (date) 日期控件
//    //inputType: (dateRange) 日期范围,要求成对出现
//    //inputType: (group) 单行组织的多个表单项
//      //inputType: (imageList) 【未实现】
//      //inputType: (image) 【未实现】
//
//
//    "featureValues": [],          //VALUE预设的下拉框选择内容: 根据不同的inputType,使用方式不同
//    "comment": "<b>招商货架分配使用</b>，请务必准确<br/>填写，[attachment id=1]填写方式点此示意图[/attachment]",   //注释
//    "attachments": {
//            '1': {
//                type: 'img',
//                    action: 'pop',
//                    link: 'http://dev.lsh123.com/static/home/widget/help/show-sample/img/photo-sample_1f52566.jpg'
//            }
//      },
//    "defaultValue": "",           //默认值
//    "unit": ""                    //单位
//    , "maxlength": 60              //最大长度（默认值为60）
//},
//    //分组展现形式
//    {
//        "name": "",          //KEY NAME: id字符串,属性的唯一标识
//        "label": "包装单位汉字描述",    //KEY LABEL: 文字串,表单项标识
//        "inputType": "group",
//        "groupType": "",
//        "pattern": "",
//        "group": [{
//            "name": "pack_desc1",          //KEY NAME: id字符串,属性的唯一标识
//            "label": "包装单位汉字描述",    //KEY LABEL: 文字串,表单项标识
//            "required": 1,                //VALUE 验校is_required: 1/0, 是否必填项
//            "fieldType": "string",        //VALUE 标准校验方式: number/string/byte, 校验方式 （number: .和数字, string: 任意字符, byte: 按字节校验文字长度）
//            "pattern": '^.+$',            //VALUE 校验的正则要求 （如果有pattern,则忽略fieldType）
//            "inputType": 'input',
//            "featureValues": [],          //VALUE预设的下拉框选择内容: 根据不同的inputType,使用方式不同
//            "comment": "填写基本包装的汉字单位，如瓶、包、个、件、双等",   //注释
//            "defaultValue": "",           //默认值
//            "unit": "",                    //单位
//            "maxlength": 60              //最大长度（默认值为60）
//        }, {
//            "name": "pack_desc2",          //KEY NAME: id字符串,属性的唯一标识
//            "label": "包装单位汉字描述",    //KEY LABEL: 文字串,表单项标识
//            "required": 1,                //VALUE 验校is_required: 1/0, 是否必填项
//            "fieldType": "string",        //VALUE 标准校验方式: number/string/byte, 校验方式 （number: .和数字, string: 任意字符, byte: 按字节校验文字长度）
//            "pattern": '^.+$',            //VALUE 校验的正则要求 （如果有pattern,则忽略fieldType）
//            "inputType": 'input',
//            "featureValues": [],          //VALUE预设的下拉框选择内容: 根据不同的inputType,使用方式不同
//            "comment": "填写基本包装的汉字单位，如瓶、包、个、件、双等",   //注释
//            "defaultValue": "",           //默认值
//            "unit": "",                    //单位
//            "maxlength": 60              //最大长度（默认值为60）
//        }, {
//            "name": "pack_desc3",          //KEY NAME: id字符串,属性的唯一标识
//            "label": "包装单位汉字描述",    //KEY LABEL: 文字串,表单项标识
//            "required": 1,                //VALUE 验校is_required: 1/0, 是否必填项
//            "fieldType": "string",        //VALUE 标准校验方式: number/string/chinese, 校验方式 （number: .和数字, string: 任意字符, chinese: 按字节校验文字长度）
//            "pattern": '^.+$',            //VALUE 校验的正则要求 （如果有pattern,则忽略fieldType）
//            "inputType": 'input',
//            "featureValues": [],          //VALUE预设的下拉框选择内容: 根据不同的inputType,使用方式不同
//            "comment": "填写基本包装的汉字单位，如瓶、包、个、件、双等",   //注释
//            "defaultValue": "",           //默认值
//            "unit": "",                    //单位
//            "maxlength": 60              //最大长度（默认值为60）
//        }]
//    }];

var tpls = {
    propertyRow: [
        '<div class="ls-form-group property-item property-item-{{featureItem.name}} {{className}}" data-input-type="{{featureItem.inputType}}">',
        '<label class="ls-form-label">',
        '{{if featureItem.required}}<i class="i-required">*</i>{{/if}}{{featureItem.label}}</label>',
        '<div class="ls-form-field">',
        '{{#fieldStr}}',
        '{{if featureItem.unit}}<span class="unit-tip">{{featureItem.unit}}</span>{{/if}}',
        '<span class="field-msg">{{#featureItem.comment | filter_attachment}}</span>',
        '</div></div>'
    ].join(''),
    propertyDateRange: [
        '{{#fromStr}}',
        '<span>--</span>',
        '{{#toStr}}'
    ].join(''),
    propertyGroupItem: [
        '<div class="property-item-group-sub">',
        '{{featureItem.label}}',
        '{{#fieldStr}}',
        '{{if featureItem.unit}}<span class="unit-tip">{{featureItem.unit}}</span>{{/if}}',
        '</div>'
    ].join(''),
    inputType_radio: [   //radio
        '{{each featureItem.featureValues}}',
        '<label>',
        '<input class="ls-form-control" type="radio" name="radio-{{featureItem.name}}"',
        ' custom="e-validate-radio" cmsg="请选择{{featureItem.label}}"',
        ' {{if featureItem.required}} required="required"{{/if}} data-fieldType="{{featureItem.fieldType}}"',
        ' data-property-name="{{featureItem.name}}" {{if $value.value==propertyValue}} checked="checked"{{/if}} value="{{$value.value}}" />',
        '{{$value.label||$value.value}}',
        '</label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
        '{{/each}}'
    ].join(''),
    inputType_input: [   //input
        '<input class="ls-form-control" type="text" placeholder="{{featureItem.placeholder}}" maxlength="{{featureItem.maxlength||60}}"',
        ' {{if featureItem.fieldType=="string"}} pattern="^.{1,60}$"{{else if featureItem.fieldType=="number"}} pattern="^[\\d\\.]{1,60}$"{{/if}}',
        ' info="{{featureItem.comment | filter_attachment}}"',
        ' empty="请填写{{featureItem.label}}"',
        ' {{if featureItem.fieldType=="string"}}',
        '  invalid="最多输入60个汉字"',
        '{{else if featureItem.fieldType=="number"}}',
        ' invalid="请输入有效数字"',
        '{{else if featureItem.fieldType=="chinese"}} custom="e-validate-chinese" cmsg="请输入有效的长度"{{/if}}',
        ' {{if featureItem.required}} required="required"{{/if}} data-fieldType="{{featureItem.fieldType}}"',
        ' data-property-name="{{featureItem.name}}" value="{{propertyValue}}" />'
    ].join(''),
    inputType_checkbox: [
        '{{each featureItem.featureValues}}',
        '<label>',
        '<input class="ls-form-control" type="checkbox" name="checkbox-{{featureItem.name}}"',
        ' custom="e-validate-checkbox" cmsg="请选择{{featureItem.label}}"',
        ' {{if featureItem.required}} required="required"{{/if}} data-fieldType="{{featureItem.fieldType}}"',
        ' data-property-name="{{featureItem.name}}" {{if (","+(propertyValue||"")+",").indexOf(","+($value.value || "")+",") > -1}} checked="checked"{{/if}} value="{{$value.value}}" />',
        '{{$value.label||$value.value}}',
        '</label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
        '{{/each}}'
    ].join(''),
    inputType_inputSelect: [   //input+select
        '<select class="ui-input-select ls-form-control"',
        ' {{if featureItem.required}} required="required"{{/if}} data-fieldType="{{featureItem.fieldType}}"',
        ' info="{{featureItem.comment}}"',
        ' empty="请选择{{featureItem.label}}"',
        ' invalid="选择项，可以输入，最多输入30个汉字"',
        ' data-property-name="{{featureItem.name}}" pattern="^.{1,30}$" data-value="{{propertyValue}}" value="{{propertyValue}}">',
        '<option value="">请选择或输入...</option>',
        '{{each featureItem.featureValues}}',
        '<option{{if $value.value==propertyValue}} selected="selected"{{/if}} value="{{$value.value}}">{{$value.label||$value.value}}</option>',
        '{{/each}}',
        '</select>'
    ].join(''),
    inputType_select: [   //select
        '<select class="ls-form-control"',
        '{{if featureItem.required}} required="required"{{/if}} data-fieldType="{{featureItem.fieldType}}"',
        ' info="{{featureItem.comment}}"',
        ' empty="请选择{{featureItem.label}}"',
        ' data-property-name="{{featureItem.name}}" value="{{propertyValue}}">',
        '<option value="">请选择...</option>',
        '{{each featureItem.featureValues}}',
        '<option{{if $value.value==propertyValue}} selected="selected"{{/if}} value="{{$value.value}}">{{$value.label||$value.value}}</option>',
        '{{/each}}',
        '</select>'
    ].join(''),
    'inputType_sugSelect': [
        '<select class="ui-sug-select ls-form-control"',
        ' {{if featureItem.required}} required="required"{{/if}} data-fieldType="{{featureItem.fieldType}}"',
        ' info="{{featureItem.comment | filter_attachment}}"',
        ' empty="请选择{{featureItem.label}}"',
        ' invalid="选择项，可以输入，最多输入30个汉字"',
        ' data-ui-sug="true"',
        ' data-property-name="{{featureItem.name}}" pattern="^.{1,30}$" value="{{propertyValue}}" data-value-label="{{propertyValueLabel}}" data-value="{{propertyValue}}">',
        '<option value="">请选择或输入...</option>',
        '{{each featureItem.featureValues}}',
        '<option{{if $value.value==propertyValue}} selected="selected"{{/if}} value="{{$value.value}}">{{$value.label||$value.value}}</option>',
        '{{/each}}',
        '</select>'
        //,'<input class="ls-form-control ui-ls-sug"',
        //'{{if featureItem.required}} required="required"{{/if}} data-fieldType="{{featureItem.fieldType}}"',
        //' info="{{featureItem.comment}}"',
        //' empty="请输入{{featureItem.label}}"',
        //' data-property-name="{{featureItem.name}}" value="{{propertyValueLabel}}" data-value-label="{{propertyValueLabel}}" data-value="{{propertyValue}}"  />'
    ].join(''),
    'inputType_textarea': [
        '<textarea type="text" class="ls-form-control form-control"',
        ' {{if featureItem.required}} required="required"{{/if}} data-fieldType="{{featureItem.fieldType}}"',
        ' info="{{featureItem.comment}}"',
        ' empty="请选择{{featureItem.label}}"',
        ' invalid="请选择合法的日期"',
        ' pattern="^\\d{4}-\\d{2}-\\d{2}$"',
        ' data-property-name="{{featureItem.name}}">{{propertyValue}}</textarea>'
    ].join(''),
    'inputType_image': [
        '<input type="text" class="ls-form-control form-control file-url"',
        ' {{if featureItem.required}} required="required"{{/if}} data-fieldType="{{featureItem.fieldType}}"',
        ' data-property-name="{{featureItem.name}}" value="{{propertyValue}}"',
        '/>',
        '<form action="" target="fileUploadIframe{{randomKey}}" method="post"',
        ' enctype="multipart/form-data" class="file-form image">',
        '<input type="hidden" name="callback" class="callback" />',
        '<label class="file-button-wrap">',
        '<input type="file" accept="image/*" name="fileUp" class="file" />',
        '<span class="file-button btn btn-primary">上传</span>',
        '</label>',
        '</form>'
    ].join(''),
    'inputType_imageList': [
        '<div class="file-list"></div>'
    ].join(''),
    'fileItem': [
        '<div class="file-wrap file-required {{if data==null}} file-empty{{/if}}">',
        '<div class="delete">删除</div>',
        '<div class="cover-tip">点击重新上传</div>',
        '<div class="preview-wrap"{{if data==null}} style="display: none;"{{/if}}>',
        '<img class="file-preview"{{if data==null}}{{else}} src="{{data.small}}"{{/if}} />',
        '</div>',
        '<iframe name="fileUploadIframe{{randomKey}}" style="display: none;"></iframe>',
        '<form action="/res/img/upitem" target="fileUploadIframe{{randomKey}}" method="post"',
        ' enctype="multipart/form-data" class="file-form">',
        '<input type="hidden" name="callback" class="callback" />',
        '<label class="file-button-wrap">',
        '<input type="file" name="fileUp" class="file" />',
        '<span class="file-button btn btn-primary">上传</span>',
        '</label>',
        '</form>',
        '<input class="file-id" data-file-item="img_list[]"',
        'custom="e-validate-img_list" cmsg="请上传商品图片"',
        ' type="hidden" name="img_list[]"',
        '{{if data}}value="{{data.id}}"{{/if}}  />',
        '</div>'
    ].join(''),
    'inputType_date': [
        '<input type="text" class="ls-form-control form-control date datepick"',
        ' {{if featureItem.required}} required="required"{{/if}} data-fieldType="{{featureItem.fieldType}}"',
        ' info="{{featureItem.comment}}"',
        ' empty="请选择{{featureItem.label}}"',
        ' invalid="请选择合法的日期"',
        ' pattern="^\\d{4}-\\d{2}-\\d{2}$"',
        ' data-property-name="{{featureItem.name}}" value="{{propertyValue}}" />'
    ].join(''),
    'inputType_dateRange': [
        '<input type="text" class="ls-form-control form-control date datepick"',
        ' {{if featureItem.required}} required="required"{{/if}} data-fieldType="{{featureItem.fieldType}}"',
        ' info="{{featureItem.comment}}"',
        ' empty="请选择{{featureItem.label}}"',
        ' invalid="请选择合法的日期"',
        ' pattern="^\\d{4}-\\d{2}-\\d{2}$"',
        ' data-property-name="{{featureItem.name}}" value="{{propertyValue}}" />'
    ].join(''),
    viewRowProperty: [
        '<div class="ls-column-group">',
        '<div class="ls-column-label">{{featureItem.label}}</div>',
        '<div class="ls-column-content">{{propertyValueLabel}} {{if featureItem.unit}} ({{featureItem.unit}}){{/if}}</div>',
        '</div>'].join(''),
    attachmentDialog: [
        '<div class="modal fade modal-attachment" tabindex="-1" role="dialog">',
        '<div class="modal-dialog" role="document">',
        '<div class="modal-content">',
        '<div class="modal-header">',
        '<h4 class="modal-title"></h4>',
        '</div>',
        '<div class="modal-body"></div>',
        '<div class="modal-footer">',
        '<button type="button" class="btn btn-primary confirm">确认</button>',
        //'<button type="button" class="btn btn-default" data-dismiss="modal">取消</button>',
        '</div>',
        '</div>',
        '</div>',
        '</div>'
    ].join('')
    , 'uploadURL': 'http://ne.dev.lsh123.com/res/img/upitem'
};

/**
 * 根据输入的特殊标记,生成对应的事件交互入口（如弹窗查看图片等）; 后续,有事件代理响应相应的操作
 * "[attachment id=123]查看示意[/attachment]" => '<a href="#attachment" data-attachment="123">查看示意</a>'
 *
 * @param str
 */
function filter_attachment(str) {
    if (str) {
        str = str.replace(/\[attachment\s+id=(\w+)\](.*?)\[\/attachment\]/, function (m, $1, $2) {
            return '<a class="attachment" href="#attachment" data-attachment-id="' + $1 + '">' + $2 + '</a>';
        });
        return str;
    } else {
        return '';
    }
}
artTpl.helper('filter_attachment', filter_attachment);
var attachments = {};


var ThreeSister = function () {
    var renderType = '';    //渲染模式: edit/preview/view/audit
    var templateInfo = [];  //表单字段模板
    var $container = null;
    //var data = {};          //表单数据

    this.init = function (options) {
        renderType = options.type;
        templateInfo = options.templateInfo;
        $container = options.to;

        //bind Event
        $(document).on('mouseover', '.field-msg a[data-attachment-id]', function (e) {
            e.preventDefault();

            var id = $(this).attr('data-attachment-id');
            var actionConfig = attachments[id];
            var actionType = actionConfig.type;
            var action = actionConfig.action;
            var link = actionConfig.link;

            if (actionType == 'img') {
                //pop dialog
                var $dialog = $('.modal-attachment');
                if ($dialog.length == 0) {
                    $(document.body).append(artTpl.compile(tpls.attachmentDialog)({}));
                    $dialog = $('.modal-attachment');
                    $dialog.on("click", ".confirm", function () {
                        $dialog.modal("hide");
                    });
                }
                $dialog.find('.modal-title').html('示意图');
                $dialog.find('.modal-body').html('<img style="width:100%;" src="' + link + '" />');
                $dialog.modal('show');
            }
        });
    };
    this.bindEvent = function () {
        var opts = {
            format: "yyyy-mm-dd",
            autoclose: true,
            language: 'zh-CN',
            todayHighlight: true,
            minView: 'month'
        };
        // 时间控件初始化
        $.each($(".datepick", $container), function (k, v) {
            var $v = $(v);
            $v.datetimepicker(opts)
        });

        //处理dateRange时间间隔限制联动
        $.each($('[data-input-type=dateRange]', $container), function (k, v) {
            var $from = $(v).find('.datepick').eq(0);
            var $to = $(v).find('.datepick').eq(1);

            $from.on('show', function (e) {
                    // $v.data('datetimepicker').setStartDate(new Date());
                })
                .on('changeDate', function (e) {
                    var UTCDate = new Date(e.date.getTime() + e.date.getTimezoneOffset() * 60000);
                    // console.log(UTCDate);
                    $to.data('datetimepicker').setStartDate(UTCDate);
                });
            $to.on('changeDate', function (e) {
                var UTCDate = new Date(e.date.getTime() + e.date.getTimezoneOffset() * 60000);
                // console.log(UTCDate);
                $from.data('datetimepicker').setEndDate(UTCDate);
            });
        });

        //文件上传逻辑
        //绑定文件选择逻辑
        $container.on('change', '.file-form.image .file', function (e) {
            var $file = $(this);
            var $form = $file.closest('.file-form');
            var $fileUrl = $form.prevAll('.file-url');
            //验证文件是否合法，如果合法则启动上传逻辑，否则警告格式不对
            var fileName = $file.val();
            if (fileName == '') {
                return;
            }
            var filePattern = /\.(png|jpg|jpeg|bmp)$/i;
            //console.log('FILE:' + fileName);

            if (!filePattern.test(fileName)) {
                Alert.show('文件格式不支持！支持格式为jpeg,png,bmp');
            } else {
                //生成callback
                var randomKey = helper.randomKey();
                var callback = 'CALLBACK_' + randomKey;
                var msg = 'msg-fileupload' + randomKey;

                //每次都更新一下
                var formAction = tpls.uploadURL + ( (tpls.uploadURL.indexOf('?') > -1) ? '&' : '?') + 'message=' + msg;
                $form.attr('action', formAction);   //每次都更新一下
                $form.find('.callback').val(callback);
                message.one(msg, function (e, data) {
                    if (data && data.ret == 0) {
                        console.log(data.content);
                        $fileUrl.val(data.content.small);
                        $fileUrl.trigger('validator-force').trigger('e-ui-change', data.content);
                        $file.val('');
                    } else {
                        if (data.ret == 413) {
                            Alert.show('上传失败:文件大小超过5M限制,请重新选择!');
                        } else {
                            Alert.show('上传失败:' + data.msg);
                        }
                    }
                });
                $form.submit();
            }
        });

        $container.find('.file-list').each(function (i, item) {
           var $fileList = $(item);
            var imgControl = new ImgListController();
            imgControl.init({
                to: $fileList,
                max: 1,
                min: 1,
                imgList: []
            });
            imgControl.render();
            imgControl.bindUIEvent();
            imgControl.bindLogic();
            $fileList.data('three-sister-instance', imgControl);
        });
    };


    this.render = function (data, options) {
        switch (renderType) {
            case 'edit':
                return this._renderEdit(data, options);
                break;
            case 'view':
                return this._renderView(data, options);
            default :

        }
    };
    this._renderEdit = function (data, options) {

        /**
         * 根据property name 尝试判断是否有值
         * @param name
         */
        function findPropertyValue(name) {
            // console.log(name);
            var defaultValueList = data;

            for (var i = 0; i < defaultValueList.length; i++) {
                var p = defaultValueList[i];
                if (p.name == name) {
                    return p.value || '';
                    break;
                }
            }
            return '';
        }

        function findPropertyValueLabel(featureItem, value) {
            // console.log(name);
            var defaultValueList = featureItem.featureValues || [];

            for (var i = 0; i < defaultValueList.length; i++) {
                var p = defaultValueList[i];
                if (p.value == value) {
                    return p.label || p.value;
                    break;
                }
            }
            return '';
        }


        //测试根据分类商品属性模板，生成填写表单
        var formStr = [];
        var productFeatureList = templateInfo;
        for (var i = 0; i < productFeatureList.length; i++) {
            var featureItem = productFeatureList[i];
            var fieldStr = '';
            var className = '';

            if (featureItem.inputType == 'group') {   //多组的输入框
                className = 'property-item-group';
                for (var m = 0; m < featureItem.group.length; m++) {
                    var subItem = featureItem.group[m];
                    var _subFieldStr = _renderItem(subItem);

                    fieldStr += artTpl.compile(tpls.propertyGroupItem)({featureItem: subItem, fieldStr: _subFieldStr});
                }
            } else if (featureItem.inputType == 'dateRange') {   //时间区间（后续可以考虑拆到group里）
                //默认是成对出现的，所以一会i还需要++一次
                className = 'property-item-date-range';
                var fromStr = '';
                var toStr = '';

                var featureItem1 = featureItem;
                fromStr = _renderItem(featureItem1);
                i++;

                var featureItem2 = productFeatureList[i];
                toStr = _renderItem(featureItem2);

                fieldStr = artTpl.compile(tpls.propertyDateRange)({fromStr: fromStr, toStr: toStr});
            } else {
                fieldStr = _renderItem(featureItem);
            }
            function _renderItem(_featureItem) {
                var propertyName = _featureItem.name;
                var propertyValue = findPropertyValue(propertyName) || _featureItem.defaultValue;
                var propertyValueLabel = findPropertyValueLabel(_featureItem, propertyValue) || propertyValue;
                var inputTypeTpl = 'inputType_' + _featureItem.inputType;
                if (_featureItem.inputType == 'select' && _featureItem.featureValues.length > 50) {
                    inputTypeTpl = 'inputType_sugSelect';
                } else {

                }
                //init comment-attachments
                if (featureItem.attachments) {
                    attachments = $.extend(attachments, featureItem.attachments);
                }
                if (!tpls[inputTypeTpl]) {
                    return (' NO TPL: ' + inputTypeTpl);
                }
                return artTpl.compile(tpls[inputTypeTpl])({
                    featureItem: _featureItem,
                    propertyValueLabel: propertyValueLabel,
                    propertyValue: propertyValue
                });
            }

            function _renderDateRange(itemFrom, itemTo) {

            }

            var formRow = '';
            formRow = artTpl.compile(tpls.propertyRow)({
                fieldStr: fieldStr,
                featureItem: featureItem,
                className: className
            });
//    console.log(formRow);
            formStr.push(formRow);
        }

//根据自定义属性，添加自定义项 findPropertyValue(propertyName)
        var defaultValueList = data;

        for (var i = 0; i < defaultValueList.length; i++) {
            var p = defaultValueList[i];
            if (p.is_diy) {   //如果是自定义属性，需要还原出来
                var newRowStr = artTpl.compile(tpls.propertyDiyRow)({"item": {name: p.name, value: p.value}});
                formStr.push(newRowStr);
            }
        }


        if ($container) {
            $container.html(formStr.join(''));
        } else {
            return formStr.join('');
        }
    };
    this._renderView = function (data, options) {


        /**
         * 根据property name 尝试判断是否有值
         * @param name
         */
        function findPropertyValue(name) {
            // console.log(name);
            var defaultValueList = data;

            for (var i = 0; i < defaultValueList.length; i++) {
                var p = defaultValueList[i];
                if (p.name == name) {
                    return p.value || '';
                    break;
                }
            }
            return '';
        }

        function findPropertyValueLabel(featureItem, value) {
            // console.log(name);
            var defaultValueList = featureItem.featureValues || [];

            if (featureItem.inputType == 'checkbox') {
                var valueList = [];
                for (var i = 0; i < defaultValueList.length; i++) {
                    var p = defaultValueList[i];
                    if ((',' + value + ',').indexOf (',' + p.value + ',') > -1) {
                        valueList.push(p.label || p.value);
                    }
                }
                return valueList.join(',');
            } else {
                for (var i = 0; i < defaultValueList.length; i++) {
                    var p = defaultValueList[i];
                    if (p.value == value) {
                        return p.label || p.value;
                        break;
                    }
                }
            }

            return '';
        }


        //测试根据分类商品属性模板，生成填写表单
        var renderStr = [];
        var productFeatureList = templateInfo;
        for (var i = 0; i < productFeatureList.length; i++) {
//    var fieldStr = [];
            var featureItem = productFeatureList[i];
            var fieldStr = '';
            var className = '';
            if (featureItem.inputType == 'group') {
                className = 'property-item-group';
                for (var m = 0; m < featureItem.group.length; m++) {
                    var subItem = featureItem.group[m];
                    var _subFieldStr = _renderItem(subItem);

                    fieldStr += artTpl.compile(tpls.propertyGroupItem)({featureItem: subItem, fieldStr: _subFieldStr});
                }
            } else {
                fieldStr = _renderItem(featureItem);
            }
            function _renderItem(_featureItem) {
                var propertyName = _featureItem.name;
                var propertyValue = findPropertyValue(propertyName) || _featureItem.defaultValue;
                var propertyValueLabel = findPropertyValueLabel(_featureItem, propertyValue) || propertyValue;
                return artTpl.compile(tpls.viewRowProperty)({
                    featureItem: _featureItem,
                    propertyValueLabel: propertyValueLabel,
                    propertyValue: propertyValue
                });
            }

            //var formRow = '';
            //formRow = artTpl.compile(tpls.propertyRow)({
            //    fieldStr: fieldStr,
            //    featureItem: featureItem,
            //    className: className
            //});
//    console.log(formRow);
            renderStr.push(fieldStr);
        }

        if (options && options.to) {
            $(options.to).html(renderStr.join(''));
        } else {
            return renderStr.join('');
        }
    };
    this.parse = function (options) {
        var propertiesData = [];
        var container = options.container;


        function getSingleInput(item) {
            var $field = $(item);
            var fieldName = $field.attr('data-property-name');
            var fieldValue = $field.val();
            if ($field.hasClass('ui-input-select, ui-sug-select')) {
                fieldValue = $field.attr('data-value');
            }
            //填入表单数据中
            if (fieldValue && fieldValue.length > 0) {
                var propertyObj = {name: fieldName, value: fieldValue, is_diy: false};
                var unit = $field.closest('.ls-form-group').find('.unit').text();
                if (unit) {
                    propertyObj.unit = unit;
                }
                return propertyObj
            } else {
                return false;
            }
        }

        $(container).find('.ls-form-group[data-input-type]').each(function (i, item) {
            var $formGroup = $(this);
            var inputType = $formGroup.attr('data-input-type');
            var $field = $formGroup.find('[data-property-name]:not(:disabled)');
            var fieldName = $field.attr('data-property-name');
            var fieldValue = '';

            if (inputType == 'radio') {
                var $realRadio = $field.filter(':checked');
                fieldValue = $realRadio.val();
            } else if (inputType == 'checkbox') {
                var $realCheckbox = $field.filter(':checked');
                var valueList = [];
                $realCheckbox.each(function (n, checkbox) {
                    valueList.push($(checkbox).val());
                });
                fieldValue = valueList.join(',');
            } else if (inputType == 'group') {
                //一个group的情况
                $field.each(function (n, item) {
                    var propertyObj = getSingleInput(item);
                    if (propertyObj) {
                        propertiesData.push(propertyObj);
                    }
                });
                return;
            } else {
                //一个input/select..的情况
                var propertyObj = getSingleInput($field);
                if (propertyObj) {
                    propertiesData.push(propertyObj);
                }
                return;
            }

            //填入表单数据中(radio /checkbox)
            if (fieldValue && fieldValue.length > 0) {
                var propertyObj = {name: fieldName, value: fieldValue, is_diy: false};
                var unit = $field.closest('.ls-form-group').find('.unit').text();
                if (unit) {
                    propertyObj.unit = unit;
                }
                propertiesData.push(propertyObj);
            }
        });
//    $container.find('#generalFormFields [data-diy-name]').each(function (i, item){
//        var fieldName = $(this).attr('data-diy-name');
//        var fieldValue = $(this).val();
//        if(!fieldName) {
//            return;
//        }
//        //填入表单数据中
//        if(fieldValue && fieldValue.length > 0) {
//            propertiesData.push({name: fieldName, value: fieldValue, is_diy: true});
//        }
//    });

        return propertiesData;
    };
};


var ImgListController = function () {
    var $fileList;
    var uploadFileList = [];    //已经上传的图片列表
    var maxShow = 6;
    var minShow = 3;

    this.init = function (options) {
        $fileList = $(options.to);
        uploadFileList = options.imgList || [];
        maxShow = options.max || maxShow;
        minShow = options.min || minShow;
    };
    this.render = function () {
//初始化文件上传表单逻辑
        var targetLength = Math.min(maxShow, Math.max(uploadFileList.length, minShow));
        for (var i = 0; i < targetLength; i++) {
            //绑定表单的提交目标: preview, input
            var randomKey = helper.randomKey();
            var imgData = uploadFileList[i];
            if (!imgData) {
                imgData = {id: ''};
                uploadFileList[i] = imgData;
            }
            var formStr = artTpl.compile(tpls.fileItem)({requiredCount: minShow, data: imgData, randomKey: randomKey});  //可能没有数据，但是渲染时有判断
            $fileList.append(formStr);
        }
    };

    this._updateView = function () {
        //如果最后一片被上传，且总数未超过6个，则新生成一个元素
        var total = uploadFileList.length;
        var lastData = uploadFileList[total - 1];
        if ((total < minShow) || (lastData.id && total < maxShow - 1)) {
            //[上传]
            // 如果操作最后一个

            //[删除]
            // 当前项,再在后面补一个空的
            // 当前项,如果最后一个不为空,则补一个;否则不补

            var newImgData = {id: ''};
            uploadFileList.push(newImgData);  //empty NEW
            var randomKey = helper.randomKey();
            var formStr = artTpl.compile(tpls.fileItem)({data: newImgData, randomKey: randomKey});  //可能没有数据，但是渲染时有判断
            $fileList.append(formStr)
        }
        var $lasFile = $fileList.find('.file-wrap:last-child');
        $lasFile.find('.file-id').trigger('validator-force');   //force validate
    };

    this.bindLogic = function () {
        var THIS = this;
        //绑定文件选择逻辑
        $fileList.on('change', '.file-wrap .file-form .file', function (e) {
            var $file = $(this);
            var $form = $file.closest('.file-form');
            var $fileWrap = $file.closest('.file-wrap');
            var index = $fileWrap.index();  //相对位置
            //验证文件是否合法，如果合法则启动上传逻辑，否则警告格式不对
            var fileName = $file.val();
            if (fileName == '') {
                return;
            }
            var filePattern = /\.(png|jpg|jpeg|bmp)$/i;
            //console.log('FILE:' + fileName);

            if (!filePattern.test(fileName)) {
                Alert.show('文件格式不支持！支持格式为jpeg,png,bmp');
            } else {
                //生成callback
                var randomKey = helper.randomKey();
                var callback = 'CALLBACK_' + randomKey;
                var msg = 'msg-fileupload' + randomKey;

                //每次都更新一下
                var formAction = tpls.uploadURL + ( (tpls.uploadURL.indexOf('?') > -1) ? '&' : '?') + 'message=' + msg;
                $form.attr('action', formAction);   //每次都更新一下
                $form.find('.callback').val(callback);
                message.one(msg, function (e, data) {
                    Alert.show('message');
                    if (data && data.ret == 0) {
                        var imgData = data.content;

                        //验证图片是否重复
                        var fileExisted = false;
                        for (var m = 0; m < uploadFileList.length; m++) {
                            if (uploadFileList[m].id == imgData.id) {
                                fileExisted = true;
                                break;
                            }
                        }
                        $file.val('');  //reset
                        if (fileExisted) {
                            Alert.show('请勿上传重复的图片');
                            return;
                        } else {
                            uploadFileList[index] = imgData;   //直接替掉原有的
                        }


                        $fileWrap.find('.file-preview').attr('src', imgData.small).parent().show();
                        var $fildId = $fileWrap.removeClass('file-empty').find('.file-id');
                        $fildId.val(imgData.id)
                            .trigger('validator-force');    //force validate


                        THIS._updateView();
                        console.log(imgData);
                    } else {
                        if (data.ret == 413) {
                            Alert.show('上传失败:文件大小超过5M限制,请重新选择!');
                        } else {
                            Alert.show('上传失败:' + data.msg);
                        }
                    }
                });
                $form.submit();
            }
        });

        //点击删除,如果是前三张内,则后面的图片前移（至少保留三张）
        $fileList.on('click', '.file-wrap .delete', function () {
            var $fileWrap = $(this).closest('.file-wrap');
            var index = $fileWrap.index();  //相对位置
            uploadFileList.splice(index, 1);
            $fileWrap.remove();

            THIS._updateView();
            //$fileWrap.find('.file-wrap .file-form .file').val('');
            //$fileId.val('').trigger('validator-force');    //force validate
            //$fileWrap.addClass('file-empty').find('.preview-wrap').hide();
        });
        //绑定删除操作
    };
    this.bindUIEvent = function () {
    };
    this.parse = function () {
        //4. 获取 图片 信息
        var fileList = [];
        var formData = {};
        var $formGroup = $fileList.closest('.ls-form-group');
        $formGroup.removeClass('ls-form-invalid ls-form-required');    //reset

        $formGroup.find('input[data-file-item]').each(function (i, item) {
            var $field = $(this);
            var fieldName = $(this).attr('name');
            var fieldValue = $field.val();

            if ($field.hasClass('ui-input-select, ui-sug-select')) {
                fieldValue = $field.attr('data-value');
            }
            //
            //
            //var retValue = validateField($(this), {action: 'submit'});
            //if(retValue === false){ //校验没有通过
            //    fileInvalid = true;
            //} else {
            //    fieldValue = retValue.value;
            if (fieldValue.length > 0) {
                fileList.push(fieldValue);
            }
            //}
        });
        //if(fileList.length < 2 || fileInvalid){ //必须有两个（第一个、第二个必须）
        //    if(!firstInvalidElement){
        //        $formGroup.get(0).scrollIntoView();
        //    }
        //    $formGroup.addClass('ls-form-required');    //error
        //    inValid = true;
        //}
        //表单校验，以及对值填写的校验
        formData['img_list[]'] = fileList;
        return formData;
    };
};


module.exports = ThreeSister;
