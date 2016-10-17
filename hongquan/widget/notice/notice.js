var $ = require('home:widget/ui/zepto/zepto.js');
var tpls = require('home:widget/category/item/tpls.js');
var TPL = require('home:widget/ui/tpl/tpl.js');
var Validator = require('home:widget/notice/validator/validator.js');
var ThreeSister = require('home:widget/notice/three-sister/three-sister.js');
var WebUploader = require('home:widget/notice/webuploader.fis.js');
var Alert = require('home:widget/ui/alert/alert.js');


function getLocation() {
    //获取GPS坐标
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showMap, showError, {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 30000
        });
    } else {
        Alert.show("您的浏览器不支持使用HTML 5来获取地理位置服务");
    }
}

function showMap(value) {
    var longitude = value.coords.longitude;
    var latitude = value.coords.latitude;
    //alert("坐标经度为：" + latitude + "， 纬度为：" + longitude);
    getAddress(latitude, longitude);
}

function getAddress(latitude, longitude) {
    //alert("坐标经度为：" + latitude + "， 纬度为：" + longitude);

    var url = 'http://api.map.baidu.com/geocoder/v2/?ak=lK85bUTiyOBRyMBt6UyyZlkt&coordtype=wgs84ll&callback=?&location='+latitude+','+longitude+'&output=json&pois=0';
    //alert(url);
    $.ajaxJSONP({
        url: url,
        success: function(data){
            if(data.status == 0) {
                $('.formatted_address').html(data.result.formatted_address);
                //alert(data.result.formatted_address);
                $('.sematic_description').html(data.result.sematic_description);
                //alert(data.result.sematic_description);
            }
        }
    });
}

getLocation();

$('.refresh-address').on('click', function (e) {
   getLocation();
});

function showError(error) {
    var msg = '';

    switch (error.code) {
        case error.PERMISSION_DENIED:
            msg = "用户拒绝对获取地理位置的请求。";
            break;
        case error.POSITION_UNAVAILABLE:
            msg = "位置信息是不可用的。";
            break;
        case error.TIMEOUT:
            msg = "请求用户地理位置超时。";
            break;
        case error.UNKNOWN_ERROR:
            msg = "未知错误。";
            break;
    }
    Alert.show(msg);
}


var normalTpl = [
    {    //图片列表
    "comment": "",
    "defaultValue": "",
    "featureValues": [],
    "fieldType": "string",
    "group": [],
    "inputType": "imageList",
    "label": "\u56fe\u7247",
    "maxlength": "",
    "name": "img",
    "pattern": "",
    "required": 1,
    "unit": ""
}];


var $mod = $('.file-upload-wrap');

var initFormData = {};


var NormalController = function (){
    var formBuilder = null;
    this.init = function (){
        formBuilder = new ThreeSister();
        formBuilder.init({
            type: 'edit',
            to: $mod,
            templateInfo: normalTpl
        })
    };
    this.render = function (){
        formBuilder.render(initFormData, {
        });
        formBuilder.bindEvent();
    };
    this.bindLogic = function (){
    };
    this.bindUIEvent = function (){
        //$mod.on('e-ui-change', '.file-url', function (e, data) {
        //    var url = data.small;
        //    $('.img-preview').find('.img').attr('src',url);
        //});
    };
    this.parse = function (){
        var formData = {};
        var propertiesData = formBuilder.parse({container: $normalForm});
        formData['properties'] = JSON.stringify(propertiesData);
        return formData;
    };
};


var normalController = new NormalController();
normalController.init();
normalController.render();
normalController.bindUIEvent();



// 初始化Web Uploader
var uploader = WebUploader.create({

    // 选完文件后，是否自动上传。
    auto: true,

    // swf文件路径
    swf: '',

    // 文件接收服务端。
    server: 'http://webuploader.duapp.com/server/fileupload.php',

    // 选择文件的按钮。可选。
    // 内部根据当前运行是创建，可能是input元素，也可能是flash.
    pick: '#filePicker',

    // 只允许选择图片文件。
    accept: {
        title: 'Images',
        extensions: 'gif,jpg,jpeg,bmp,png',
        mimeTypes: 'image/*'
    }
});
