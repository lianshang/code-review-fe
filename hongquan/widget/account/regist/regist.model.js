var Backbone = require('home:widget/ui/backbone/backbone.js');
var $ = require('home:widget/ui/zepto/zepto.js');
var Alert = require('home:widget/ui/alert/alert.js');

var RegistModel = Backbone.Model.extend({
    url: "/",

    defaults: function () {
        return {
            status: "",
            counting: 0,
            content: {}
        };
    },

    getCode: function () {
        var that = this;
        $.ajax({
            url: "/captcha/sms/sendregister",
            type: "POST",
            data: {cellphone: that.get("content").cellphone},
            dataType: "json",
            success: function (response) {
                if (response && response.ret === 0) {
                    Alert.show("验证码发送成功, 请注意查收");
                    that.set({counting: 60});
                } else {
                    Alert.show(response.msg);
                }
            },
            error: function () {
                Alert.show("验证码发送失败!");
            }
        });
    },

    submitRegist: function (password, code) {
        var that = this;
        var content = $.extend(true, {}, that.get("content"));

        content["password"] = password;
        content["verify_code"] = code;

        $.ajax({
            url: "/account/user/ajaxregister",
            type: "POST",
            data: content,
            dataType: "json",
            success: function (response) {
                if (response && response.ret === 0) {
                    if (response.content.status == "0") {
                        that.set({status: "approving"});
                    } else {
                        location.href = "/";
                    }
                } else {
                    Alert.show(response.msg);
                }
            },
            error: function () {
                Alert.show("注册失败!");
            }
        });
    }
});

module.exports = new RegistModel;
