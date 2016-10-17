/**
 * @require address.less
 */

var $ = require('home:widget/ui/zepto/zepto.js');
var tpl = require('home:widget/address/tpl.js');
var T = require('home:widget/ui/tpl/tpl.js');
var areas = require('home:widget/ui/areas/areas.js');
var Backbone = require('home:widget/ui/backbone/backbone.js');
var AddressModel = require('home:widget/address/address.model.js');
var app = require('home:widget/ui/router/router.js');
var Loading = require('home:widget/ui/loading/loading.js');
require('home:widget/ui/form-validate/form-validate.js');
var Location = require('home:widget/ui/locate/locate.js');
var Alert = require('home:widget/ui/alert/alert.js');
var Confirm = require('home:widget/ui/confirm/confirm.js');
var Log = require('home:widget/ui/log/log.js');

var AddressView = Backbone.View.extend({
    model: null,

    className: 'mod-address',

    // events: {
    //     "tap .action": "takeAction",  //用touchend在ios微信下点击并弹框后焦点仍在按钮上
    //     "tap .delete": "confirmDelete",
    //     "tap .confirm": "deleteAddress",
    //     "tap .cancel": "cancelDelete",
    //     "tap .edit": "handleEdit",
    //     "touchend .back-to-order": "backToOrder",
    //     "change .address-radio": "comfirmSelect"
    // },
    // 新添加方法，为events添加额外的事件
    addEvent: function(){
        var _events = {
            "change .address-radio": "comfirmSelect"
        };
        _events[conf.evTouchEnd + " .back-to-order"] = "backToOrder";
        _events[conf.evClick + " .action"] = "takeAction";  //用touchend在ios微信下点击并弹框后焦点仍在按钮上
        _events[conf.evClick + " .delete"] = "confirmDelete";
        _events[conf.evClick + " .confirm"] = "deleteAddress";
        _events[conf.evClick + " .cancel"] = "cancelDelete";
        _events[conf.evClick + " .edit"] = "handleEdit";
        return _events;
    },

    events: function(){
        var that = this;
        return that.addEvent();
    },

    initialize: function (options) {
        $(document.body).append(this.$el);
        this.model = new AddressModel();
        this.listenTo(this.model, "change:list", this.render);
        this.listenTo(this.model, "change:alwaysChange", this.renderCurrent);
        this.listenTo(this.model, "change:selected", this.renderOptionalList);
        options = options.split('/') || [];
        var action = options[0] || '';
        switch (action) {
            case '':
                this.model.getList();
                Log.send({
                    action: 'show',
                    pid: '110007',  //我的-地址管理
                    detail: {}
                });
                break;
            case 'add':
                this.model.newAddress(options[1]);
                break;
            case 'select':
                this.model.getOptionalList(options[1]);
                break;
            case 'edit':
                this.model.getAddress(options[1], options[2]);
                break;
        }
    },

    render: function () {
        Loading.hide();
        this.$el.html(T.compile(tpl.list)(this.model.get("list")));
    },

    renderCurrent: function () {
        Loading.hide();
        var current = this.model.get("current") || {};
        var onChoosing = this.model.get("onChoosing");

        this.$el.html(T.compile(tpl.address)({
            title: $.isEmptyObject(current) ? "新增地址" : "修改地址",
            ars: current,
            action: $.isEmptyObject(current) ? "add" : "update",
            onChoosing: onChoosing
        })).find(".area-input").initArea();
        Location.get( this._setLocation );
    },

    renderOptionalList: function () {
        Loading.hide();
        var selected = this.model.get("selected").split("|")[0];
        this.$el.html(T.compile(tpl.optionalList)({
            address_list: this.model.get("optionalList").address_list,
            selected: selected
        }));
    },

    _setLocation: function ( location ) {
      var info = location && location.regeocode.addressComponent;
      var $area = this.$(".area-input");
      $area.data("GPS", {
        citycode: info.citycode,
        adcode: info.adcode
      });
    },

    takeAction: function (e) {
        var that = this;
        if (this.$el.find("form").formValidate()) {
            var area = this.$(".area-input").data("location");
            var location = this.$(".area-input").data("GPS");
            var coCode = area ? area.county.value : null;
            var adCode = location ? location.adcode : null;
            var message = "所选地址区域与您当前所处位置不一致，可能导致送货延迟。请您确认地址信息填写无误。";
            // 如果定位失败或者没有获取到地址
            if ( !adCode || !area ) {
              that._next( e );
              return;
            }
            if ( coCode && adCode && coCode === adCode ) {
                that._next( e );
            } else {
                Confirm.show( message, function () {
                  that._next( e );
                }, function () {
                  return ;
                })
            }
        }
        e.preventDefault();
    },

    _next: function ( e ) {
        Loading.show("保存中...");
        var $this = $(e.target);
        var action = $this.data("action");
        var formData = this.$el.find("form").serializeArray();
        var $area = this.$el.find(".area-input");
        var areaData = $area.data("location");
        var _data = {};

        for ( var i = 0, length = formData.length; i < length; i++ ) {
            var input = formData[i];

            if (input.name === "area") {
                _data["province"] = areaData ? areaData.province.value : $area.data("pid");
                _data["city"] = areaData ? areaData.city.value : $area.data("cid");
                _data["county"] = areaData ? areaData.county.value : $area.data("coid");
            } else if (input.name === "is_default") {
                _data["is_default"] = input.value === "on" ? "1" : "0";
            } else {
                _data[input.name] = input.value;
            }
        }

        if (action === "update") {
            this.model.updateAddress(_data);
        } else {
            this.model.addAddress(_data);
        }
    },

    confirmDelete: function () {
        this.$el.find(".delete-confirm").show();
    },

    deleteAddress: function () {
        this.model.deleteAddress(this.$el.find("form").data("id"));
    },

    cancelDelete: function () {
        this.$el.find(".delete-confirm").hide();
    },

    handleEdit: function (e, reset) {
        var $radios = this.$(".address-radio");

        this.$(".edit").toggle();
        this.$(".weui_cells").toggleClass("weui_cells_access");
        this.$(".address-radio").toggle();
        $radios.attr("disabled") ? $radios.removeAttr("disabled") : $radios.attr("disabled", "disabled");
        this.$(".weui_icon_checked").toggle();

        this.$(".weui_check_label").off(conf.evClick);
        !reset && this.$(".weui_check_label").one(conf.evClick, function () {
            app.navigate("my/address/edit/" + $(this).data("id") + "/true", {trigger: true});
        });
    },

    comfirmSelect: function (e) {
        this.model.backToOrder($(e.target).closest("label").data("id"));
    },

    backToOrder: function (e) {
        e.preventDefault();
        this.$(".address-radio").attr("disabled") ? this.handleEdit(null, true) : this.model.backToOrder(this.$(".address-radio:checked").closest("label").data("id"));
    }
});

module.exports = AddressView;
