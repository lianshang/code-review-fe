var $ = require('home:widget/ui/zepto/zepto.js');
var tpl = require('home:widget/account/tpl.js');
var T = require('home:widget/ui/tpl/tpl.js');
var Location = require('home:widget/ui/locate/locate.js');
var areas = require('home:widget/ui/areas/areas.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var Loading = require('home:widget/ui/loading/loading.js');
var Model = require('home:widget/account/regist/regist.model.js');
require('home:widget/ui/form-validate/form-validate.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Confirm = require('home:widget/ui/confirm/confirm.js');

var RegistView = Backbone.View.extend({
    el: $('#viewCanvas'),

    // events: {
    //     "tap .next": "verify",
    //     "tap .submit-regist": "submitRegist",
    //     "tap .verify-code": "getCode",
    //     "submit .regist-box": "preventSubmit",
    //     "touchend .cancel-verify": "goToEdit",
    //     "touchend .regist-agree": "goToAgree",
    //     "touchend .account-regist-agree .i-back": "goToVerify"
    // },

    // 新添加方法，为events添加额外的事件
    addEvent: function(){
        var _events = {
            "submit .regist-box": "preventSubmit"
        };
        _events[conf.evClick + " .next"] = "verify";
        _events[conf.evClick + " .submit-regist"] = "submitRegist";  //用touchend在ios微信下点击并弹框后焦点仍在按钮上
        _events[conf.evClick + " .verify-code"] = "getCode";
        _events[conf.evTouchEnd + " .cancel-verify"] = "goToEdit";
        _events[conf.evTouchEnd + " .regist-agree"] = "goToAgree";
        _events[conf.evTouchEnd + " .account-regist-agree .i-back"] = "goToVerify";
        _events["keyup input"] = "enableBtn";
        _events["e-area-change input"] = "enableBtn";
        return _events;
    },

    events: function(){
        var that = this;
        return that.addEvent();
    },

    initialize: function () {
        this.listenTo(this.model, "change:status", this.render);
        this.listenTo(this.model, "change:counting", this.startCounting);
    },

    render: function () {
        var status = this.model.get("status");

        if (status === "editing") {
            var $wrap = this.$el.html(T.compile(tpl.regist)(this.model.get("content")));
            var $btn = this.$el.find('button:disabled');
            $wrap.find(".area-input").initArea(this.model.get("content"));
            Location.get(this.setLocation);
            // 如果是返回的，激活按钮
            if ( this.model.get("btn") ) $btn.prop('disabled', false);
        } else if (status === "verifying") {
            this.$el.html(T.compile(tpl.registVerify)({cellphone: this.model.get("content").cellphone}));
        } else if (status === "approving") {
            this.$el.html(T.compile(tpl.registApprove)({}));
        } else if (status === "agreeing") {
            var self = this;
            require.async('home:widget/account/regist/agree-tpl.js', function(agreeTpl) {
                self.$el.html(T.compile(agreeTpl)({}));
                // 如果是被嵌入到app中，则隐藏头部
                self.getAppVersion() && self.$el.find('.header').hide();
            });
        }
    },

    /**
     * 获取嵌入的app版本号
     * @return {string} 嵌入的app版本号
     */
    getAppVersion: function() {
        var ua = navigator.userAgent;
        var reg = new RegExp('lianshang_[^\/]+\/(.+)$', 'g');
        var result = reg.exec(ua) || [];
        return result[1];
    },

    next: function () {
        var data = this.$(".regist-main-form").serializeArray();
        var $area = this.$(".area-input");
        var areaData = $area.data("location");
        var location = this.$(".location").data("location");
        var content = {};
        var _content = this.model.get("content");

        for ( var i = 0, length = data.length; i < length; i++ ) {
            if (data[i].name === "area") {
                content["province"] = areaData ? areaData.province.value : _content.province;
                content["city"] = areaData ? areaData.city.value : _content.city;
                content["county"] = areaData ? areaData.county.value : _content.county;
                content["area"] = areaData ? areaData.text : _content.area;
            } else {
                content[data[i].name] = data[i].value;
            }
        }

        // 定位信息
        if (location) {
            content["location"] = location;
        }

        this.model.set({content: content, status: "verifying"});
    },

    enableBtn: function() {
        var result = true;
        this.$el.find("[data-vtype]").each(function(k, v) {
            if (!$(v).val()) {
                result = false;
                return false;
            }
        });
        var $btn = this.$el.find('button:disabled');
        if (result) {
            $btn.prop('disabled', false);
        } else {
            $btn.prop('disabled', true);
        }
    },

    verify: function () {
        var that = this;

        if (that.$(".regist-main-form").formValidate()) {
            var cellphone = that.$("input[name='cellphone']").val();
            var inviteCode = that.$("input[name='invite_code']").val();
            Loading.show("校验手机号码...");
            that._verifyPhone(cellphone, function () {
                if(inviteCode) {
                    that._verifyInviteCode(inviteCode, function () {
                        that.checkArea();
                    });
                } else {
                    that.checkArea();
                }
            });
        }
    },
    _verifyPhone: function (cellphone, callback) {
        var that = this;
        $.ajax({
            url: "/account/user/checkcellphone",
            data: {cellphone: cellphone},
            dataType: "json",
            timeout: 20000,
            success: function (response) {
                if (response && response.ret === 0) {
                    Loading.hide();
                    if (!response.content) {
                        callback();
                    } else {
                        Alert.show("该手机号已注册!");
                    }
                } else {
                    Alert.show(response.msg);
                }
            },
            error: function () {
                Loading.hide();
                Alert.show("手机号检验失败!");
            }
        });
    },
    /**
     * 校验邀请码,完成后回调
     * @param code
     * @param callback
     * @private
     */
    _verifyInviteCode: function (code, callback) {
        Loading.show("校验邀请码...");
        var areaData = this.$(".area-input").data("location") || this.model.get("content");
        var coCode = areaData.county.value || areaData.county;
        var formData = {
            invite_code: code,
            county: coCode
        };
        $.ajax({
            url: "/account/user/checkcode",
            data: formData,
            dataType: "json",
            timeout: 20000,
            success: function (response) {
                Loading.hide();
                if (response && response.ret === 0) {
                    Loading.hide();
                    if (response.content.is_valid) {
                        callback();
                    } else {
                        Alert.show("邀请码无效，请重新输入！");
                    }
                } else {
                    Alert.show(response.msg);
                }
            },
            error: function () {
                Loading.hide();
                Alert.show("邀请码校验失败!");
            }
        });
    },

    // 校验地址
    checkArea: function () {
      var that = this;
      var location = that.$(".location").data("location");
      var adCode = location ? location.adcode : null;
      var areaData = that.$(".area-input").data("location") || that.model.get("content");
      var coCode = areaData.county.value || areaData.county;
      var message = "所选地址区域与您当前所处位置不一致，可能导致送货延迟。请您确认地址信息填写无误。";
      // 如果获取地址失败，直接进入下一步
      if ( !adCode ) {
        that.next();
        return;
      }
      // 如果获取到地址，进行检验
      if ( adCode && adCode === coCode ) {
        that.next();
      } else {
        Confirm.show( message, function (){
          that.next();
        }, function () {
          return;
        });
      }
    },

    submitRegist: function (e) {
        if (this.$(".regist-box").formValidate()) {
            var content = this.model.get("content");
            var $password = this.$("input[name='password']");
            var $code = this.$(".verifycode");

            this.model.submitRegist($password.val(), $code.val());
        }
        e.preventDefault();
    },

    getCode: function () {
        this.model.getCode();
    },

    preventSubmit: function () {
        return false;
    },

    startCounting: function () {
        var that = this;
        var $codeBtn = that.$(".verify-code");
        var counting = that.model.get("counting");
        var timer = null;

        if (!counting || counting <= 0) {
            return;
        }

        $codeBtn.attr("disabled", "disabled");

        timer = setInterval(function () {
            counting--;
            if (counting <= 0) {
                clearInterval(timer);
                $codeBtn.removeAttr("disabled").text("点击获取验证码");
                that.model.set({counting: 0});
            } else {
                $codeBtn.text(counting + "秒后重新获取");
            }
        }, 1000);
    },

    setLocation: function (location) {
        var $location = this.$(".location");
        var info = location && location.regeocode;

        if ($location.length && info) {
            var l = info.addressComponent.streetNumber.location.split(",");

            $location.val(info.formatted_address).data("location", {
                longitude: l[0],
                latitude: l[1],
                province: info.addressComponent.province,
                city: info.addressComponent.province,
                county: info.addressComponent.district,
                address: info.formatted_address,
                citycode: info.addressComponent.citycode,
                adcode: info.addressComponent.adcode
            });
        }

    },

    goToEdit: function (e) {
        e.preventDefault();
        this.model.set({status: "editing", btn: true});
    },

    goToVerify: function () {
        this.model.set({status: "verifying"});
    },

    goToAgree: function () {
        this.model.set({status: "agreeing"});
    }
});

module.exports = RegistView;
