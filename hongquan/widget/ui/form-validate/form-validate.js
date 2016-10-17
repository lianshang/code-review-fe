var $ = require('home:widget/ui/zepto/zepto.js');
var Alert = require('home:widget/ui/alert/alert.js');
$.fn["formValidate"] = function () {
    var $form = $(this);
    //固定验证模式
    var vType = {
        "empty": {
            type: "empty",
            pattern: "^[\\s\\S]+$"
        },
        "cellphone": {
            type: "cellphone",
            pattern: "^1[0-9]{10}$"
        },
        "password": {
            type: "password",
            pattern: "^[A-Za-z0-9]{6,16}$"
        }
    };
    var passed = true;

    if (!$form.length || $form[0].nodeName.toLowerCase() !== "form") {
        return passed;
    }
    
    $form.find("input").each(function () {
        var $input = $(this);
        var type = $input.data("vtype"); // 校验类型
        var msg = $input.data("msg") || "表项不合法!"; // 报错信息
        var value = $.trim($input.val());
        var pattern = $input.attr("pattern");   //自定义或配置的验证模式

        if (!pattern) { //如果没有自定义pattern,则尝试通过vtype获取
            if(!type || !vType[type]) {
                return true;
            } else {
                pattern = vType[type].pattern;
            }
        }
        //if (type === vType.empty.type) {
        //    pattern = vType.empty.pattern;
        //} else if (type === vType.cellphone.type) {
        //    pattern = vType.cellphone.pattern;
        //} else if (type === vType.password.type) {
        //    pattern = vType.password.pattern;
        //}

        if (pattern && !new RegExp(pattern).test(value)) {
            Alert.show(msg);
            passed = false;
            return false;
        } else {
            return true;
        }
    });

    return passed;
};
