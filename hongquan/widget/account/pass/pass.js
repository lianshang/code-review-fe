var $ = require('home:widget/ui/zepto/zepto.js');
var tpl = require('home:widget/account/tpl.js');
var T = require('home:widget/ui/tpl/tpl.js');
require('home:widget/ui/form-validate/form-validate.js');
var Alert = require('home:widget/ui/alert/alert.js');

var $viewCanvas = $('#viewCanvas');

$(function () {
    var $mod = $viewCanvas.append(tpl.pass).find(".mod-account-pass");
    var $form = $mod.find(".pass-box");
    var $find = $mod.find(".submit");
    var $getCode = $mod.find(".get-code");

    var $cellphone = $mod.find("input[name='cellphone']");
    var $cellphone_clear = $cellphone.next();
    if($cellphone.val()==''){
        $cellphone_clear.hide();
    }else{
        $cellphone_clear.show();
    }

    var $password = $mod.find("input[name='password']");
    var $password_clear = $password.next();
    if($password.val()==''){
        $password_clear.hide();
    }else{
        $password_clear.show();
    }

    var $code = $mod.find("input[name='verify_code']");
    var $accountClear = $mod.find(".i-account-clear");

    var timer = null;
    
    $accountClear.on(conf.evTouchEnd, function (e) {
        e.preventDefault();
    }).on(conf.evClick, function (e) {
        var $currentInput = $(e.currentTarget);
        $currentInput.prev().val('');
        $(this).hide();
    });

    $form.on("submit", function () {
        return false;
    });

    $(document).on("keyup change", function (e) {
        if ($cellphone.val() && $password.val() && $code.val()) {
            $find.removeAttr("disabled");
        } else {
            $find.attr("disabled", "disabled");
        }
    });
    $('input').on('keyup',function(e){
        var $this = $(this);
        if($this.val()==''){
            $this.next().hide();
        }else{
            $this.next().show();
        }
    });


    $getCode.on("click", function () {
        if (!$cellphone.val()) {
            Alert.show("请输入正确的手机号!");
            return;
        }
        $.ajax({
            url: "/captcha/sms/sendfindpass",
            type: "POST",
            data: {cellphone: $cellphone.val()},
            dataType: "json",
            success: function (response) {
                if (response && response.ret === 0) {
                    Alert.show("验证码发送成功, 请注意查收");
                    startTicking(60);
                } else {
                    Alert.show(response.msg);
                }
            },
            error: function () {
                Alert.show("验证码发送失败!");
            }
        });
    });

    $find.on("click", function () {
        if ($form.formValidate()) {
            $.ajax({
                url: "/account/user/ajaxpwdreset",
                dataType: "json",
                data: $form.serialize(),
                type: "POST",
                success: function (response) {
                    if (response.ret === 0) {
                        Alert.show("密码找回成功!", function () {
                          location.href = "/account/user/login";
                        });
                    } else {
                        Alert.show(response.msg);
                    }
                },
                error: function () {
                    Alert.show("找回密码失败!");
                }
            });
        }
    });

    function startTicking(counting) {
        timer && clearInterval(timer);
        $getCode.attr("disabled", "disabled");
        timer = setInterval(function () {
            counting--;
            if (counting <= 0) {
                clearInterval(timer);
                $getCode.removeAttr("disabled").text("点击获取验证码");
            } else {
                $getCode.text(counting + "秒后重新获取");
            }
        }, 1000);
    }
});
