var $ = require('home:widget/ui/zepto/zepto.js');
var tpl = require('home:widget/account/tpl.js');
var T = require('home:widget/ui/tpl/tpl.js');
var helper = require('home:widget/ui/helper/helper.js');
require('home:widget/ui/form-validate/form-validate.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Confirm = require('home:widget/ui/confirm/confirm.js');

var $viewCanvas = $('#viewCanvas');

$(function () {
    var $mod = $viewCanvas.append(tpl.login).find(".mod-account-login");
    var $form = $mod.find(".login-box");
    var $login = $mod.find(".submit");
    var $name = $mod.find("input[name='username']");
    var $name_clear = $name.next();
    if($name.val()==''){
        $name_clear.hide();
    }else{
        $name_clear.show();
    }

    var $password = $mod.find("input[name='password']");
    var $password_clear = $password.next();
    if($password.val()==''){
        $password_clear.hide();
    }else{
        $password_clear.show();
    }

    var $from_verify_code = $mod.find(".from-verify-code");
    $from_verify_code.hide();
    var $verify_code = $mod.find(".verify-code");
    var counting = 0;
    var $accountClear = $mod.find(".i-account-clear");

    $(document).on("keyup change", function (e) {
        if ($name.val() && $password.val() ) {
            $login.removeAttr("disabled");
        } else {
            $login.attr("disabled", "disabled");
        }
    });
    
    $('input').on('keyup',function(e){
        var $this = $(this);
        //特殊处理验证码input
        if(!$this.hasClass('verifycode')){
            $from_verify_code.hide();
            if($this.val()==''){
                $this.next().hide();
            }else{
                $this.next().show();
            }
        }
    });


    $form.on("submit", function () {
        return false;
    });

    $login.on(conf.evTouchEnd, function (e) {
        e.preventDefault();
    }).on(conf.evClick, function () {
        login();
    });

    $verify_code.on(conf.evTouchEnd, function (e) {
        e.preventDefault();
    }).on(conf.evClick, function () {
        getCode();
    });

    $accountClear.on(conf.evTouchEnd, function (e) {
        e.preventDefault();
    }).on(conf.evClick, function (e) {
        var $currentInput = $(e.currentTarget);
        $currentInput.prev().val('');
        $(this).hide();
    });

    $(document).on("keydown", function (e) {
        if (e.which === 13) {
            e.preventDefault();
            login();
        }
    });

    // $mod.on(conf.evClick, ".i-back", function() {
    //     var redirectUrl = helper.queryString('redirectUrl');
    //     // 从购物车页面来的要返回购物车页面，其他回首页
    //     if (redirectUrl) {
    //         if (~redirectUrl.search(/\/#shopping\/cart/g)){
    //         //     redirectUrl = '/#shopping/cart';
    //         // } else if (~redirectUrl.search(/\/my/g)) {
    //         //     redirectUrl = '/#my';
    //         } else {
    //             redirectUrl = '/';
    //         }
    //     } else {
    //         redirectUrl = '/';
    //     }
    //     window.location.href = redirectUrl;
    // });

    function login() {
        if (!navigator.onLine) {
            Alert.show("您的网络似乎没有连接, 请检查网络后刷新页面重试!");
            return;
        }
        if ($form.formValidate()) {
            $.ajax({
                url: "/account/user/ajaxlogin",
                dataType: "json",
                data: $form.serialize(),
                type: "POST",
                success: function (response) {
                    if (response.ret === 0) {
                        var redirectUrl = (helper.queryString('redirectUrl') || '') + location.hash; // 后端自动跳转获取不到锚点部分，只替换了URI部分，此处为#特殊处理
                        location.replace(redirectUrl ? redirectUrl : "/");
                    }else if(response.ret =='1004'){
                        Confirm.show('切换账号需要验证手机号, 是否继续?', function() {
                            $from_verify_code.show();
                            getCode();
                        });
                    } else {
                      Alert.show(response.msg);
                    }
                },
                error: function () {
                  Alert.show("登录失败!");
                }
            });
        }
    };
    function getCode() {
        if ($name.val()) {
            $.ajax({
                url: "/captcha/sms/sendverifyunusual",
                type: "POST",
                data: {cellphone: $name.val()},
                dataType: "json",
                success: function (response) {
                    if (response && response.ret === 0) {
                        Alert.show("验证码发送成功, 请注意查收");
                        counting = 60;
                        startCounting();
                    } else if (response.ret === '1004'){
                        $from_verify_code.show();
                    }else {
                        Alert.show(response.msg);
                    }
                },
                error: function () {
                    Alert.show("验证码发送失败!");
                }
            });
        }else {
            Alert.show("请输入号码");
        }
    };
    function startCounting() {
        var timer = null;

        if (!counting || counting <= 0) {
            return;
        }

        $verify_code.attr("disabled", "disabled");
        $login.attr("disabled", "disabled");
        timer = setInterval(function () {
            counting--;
            if (counting <= 0) {
                clearInterval(timer);
                $verify_code.removeAttr("disabled").text("点击获取验证码");
                counting = 0;
            } else {
                $verify_code.text(counting + "秒后重新获取");
            }
        }, 1000);
    };

});
