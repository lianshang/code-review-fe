var $ = require('common:widget/ui/jquery/jquery.js');
var Validator = require('common:widget/ui/validator/validator.js');
var React = require('common:widget/ui/react/react.js');
var ReactDOM = require('common:widget/ui/react/react-dom.js');
var helper = require('common:widget/ui/helper/helper.js');
var PreviewImgUploadList = require('common:widget/ui/form/preview-img-upload-list/preview-img-upload-list.jsx');


var Action = function (opts) {
    var $mod = $('.mod-package-view');
    var MSG_SUC = '保存成功';
    var MSG_FAIL = '保存失败，请重试';
    var validator = null;
    var URL_IMG_UPLOAD = '/res/img/upload?scene=item&message={{message}}';
    var URL_PACKAGE_ADD = '/item/package/addPackage';
    var URL_PACKAGE_UPDATE = '/item/package/updatePackage';
    var DETELE_API = '/item/package/delSkuForPackage';
    var packageId = helper.queryString('packageId');

    // 页面区分查看，编辑，新建
    var pageview = opts.pageview;
    function initImgUploader() {
        opts.imgList = opts.imgList || [];
        var validate = {
            required: true,
            cmsg: '请上传图片',
            custom: 'e-validate-img_list'
        };
        //图片组件，因没引入react报错，所以注释
      /*  ReactDOM.render(
            <PreviewImgUploadList max={10} show={opts.imgList.length+1} preview="medium"
                                  uploadURL={URL_IMG_UPLOAD} validate={validate}
                                  fileList={opts.imgList}/>,
            $mod.find('.image-uploader')[0]
        );*/
    }

    function initValidator() {
        validator = new Validator($mod, {});
    }

    /**
     * 初始化页面：查看，编辑，新增
     */
    function initPage() {
        if (pageview != 'view') {
            $mod.find('.readView').hide();
            initImgUploader();
        } else {
            $mod.find('.field-control').hide();
        }
    }

    function cancel() {
        if (pageview == 'new') {
            window.location.href = '/item/package/list';
        } else {
            window.location.href = window.location.href.replace('/' + pageview, '/view');
        }

    }

    function save(url, params) {
        $.ajax({
            url: url,
            data: params,
            dataType: 'json',
            type: 'POST'
        }).done(function (data) {
            if (data && data.ret === 0) {
                alert(MSG_SUC);
                //add接口返回packageId
                window.location.href = window.location.href.replace('/' + pageview, '/view') +(packageId ? '' : '?packageId='+data.content.packageId);
            } else {
                alert(data.msg || MSG_FAIL);
            }
        });
    }

    function gatherData() {
        var params = {};
        params['img'] = [];
        params['sku_list'] =[];
        var itemarr = [];
        $mod.find('.field-control[name]').each(function(k, v) {
            params[v.name] = v.value;
        });

        $mod.find('.file-id').each(function(k, v) {
            v.value.length && params['img'].push(v.value);
        });

        //获取单品售价和个数，不提前缓存
        $mod.find('.sku-item').each(function(k,v) {
            itemarr.push({
                num: $(v).find('.sale-unit').val(),
                package_price: $(v).find('.package-price').val(),
                sku_id: $(v).data('skuid')
            });

        });

        params['sku_list'] = itemarr;
        packageId ? params['package_id'] = packageId :'';
        return params;
    }

    function delSkuForPackage(params,$this) {
        $.ajax({
            url: DETELE_API,
            data: params,
            dataType: 'json',
            type: 'POST'
        }).done(function(data) {
            if (data && data.ret === 0) {
                alert('操作成功!');
                //删除数据，同时页面数据清除
                $this.remove();
            } else {
                alert(data.msg);
            }
        });
    }

    function bindEvent() {
        $mod.on('click', '.save', function () {
            if (validator.validateAll()) {
                //区分编辑和新建
                if (pageview == 'new') {
                    save(URL_PACKAGE_ADD, gatherData());
                } else {
                    //if ($skuItem.length <2 && confirm('套餐内单品种类不足2类，是否继续保存？')) {
                    save(URL_PACKAGE_UPDATE, gatherData());
                }

            }
        }).on('click', '.btn-cancel', function () {
            cancel();
        }).on('click', '.btn-edit', function () {
            //点击编辑跳转到编辑页带hash值
            window.location.href = window.location.href.replace('/view', '/edit');
        }).on('click', '.delete-item', function () {
            //不做任何判断，删除单品信息  http://lsy.dev.lsh123.com/item/package/delSkuForPackage?packageId=101658&id=7
            var $this = $(this).closest('.sku-item');
            var params = {
                packageId: packageId,
                skuId: $this.data('skuid')
            };
            if (confirm('确认删除此商品吗？')) {
                delSkuForPackage(params,$this);
            }

        });
        validator.eventCenter
            .on('validator-error', function (e, data) {
                Log.send(data.log);
            }).on('e-not-ling', function(e, data) {

                var $target = $(data.target);
                var def = data.def;
                if( $target.val()==0){
                    def.reject();
                }else{
                    def.resolve();
                }
            });
    }

    function init() {

        initPage();
        initValidator();
        bindEvent();
    }

    init();
};

module.exports = Action;
