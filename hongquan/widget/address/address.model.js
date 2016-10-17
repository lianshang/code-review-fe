var Backbone = require('home:widget/ui/backbone/backbone.js');
var Order = require('home:widget/ui/order/order.js');
var helper = require('home:widget/ui/helper/helper.js');
var Loading = require('home:widget/ui/loading/loading.js');
var Alert = require('home:widget/ui/alert/alert.js');

var AddressModel = Backbone.Model.extend({
    defaults: function () {
        return {
            list: null,
            optionalList: null,
            selected: "",
            current: null
        };
    },

    url: "/account/address/getlist",

    getList: function () {
        var that = this;

        that.fetch({
            dataType: "json",
            timeout: 20000,
            success: function (_, response) {
                if (response && response.ret === 0) {
                    that.set({list: response.content});
                } else {
                    that.set({list: []});
                    if (response && response.ret === 100021) {
                        Alert.show(response.msg, function() {
                            location.reload();
                        });
                    }
                }
                Loading.hide();
            },
            error: function () {
                Loading.hide();
                that.set({list: []});
            }
        });
    },

    getOptionalList: function (addressId) {
        var that = this;

        that.fetch({
            dataType: "json",
            timeout: 20000,
            success: function (_, response) {
                if (response && response.ret === 0) {
                    that.set({optionalList: response.content, selected: addressId + "|" + Math.random()});
                } else {
                    that.set({optionalList: []});
                    if (response && response.ret === 100021) {
                        Alert.show(response.msg, function() {
                            location.reload();
                        });
                    }
                }
                Loading.hide();
            },
            error: function () {
                Loading.hide();
                that.set({optionalList: []});
            }
        });
    },

    getAddress: function (addressId, onChoosing) {
        var that = this;

        that.fetch({
            url: "/account/address/get?address_id=" + addressId,
            dataType: "json",
            timeout: 20000,
            success: function (_, response) {
                if (response && response.ret === 0) {
                    that.set({current: response.content, onChoosing: onChoosing, alwaysChange: Math.random()});
                } else if (response && response.ret === 100021) {
                    Alert.show(response.msg, function() {
                        location.reload();
                    });
                } else {
                    Alert.show("获取地址失败!");
                }
                Loading.hide();
            },
            error: function () {
                Loading.hide();
                Alert.show("获取地址失败!");
            }
        });
    },

    newAddress: function (onChoosing) {
        this.set({current: [], onChoosing: onChoosing, alwaysChange: Math.random()});
    },

    addAddress: function (data) {
        var that = this;
        $.ajax({
            url: "/account/address/create",
            dataType: "json",
            data: data,
            timeout: 20000,
            type: "POST",
            success: function (response) {
                Loading.hide();
                if (response && response.ret === 0) {
                    if (that.get("onChoosing")) {
                        that.set({onChoosing: false});
                        Alert.show("新增地址成功!", function () {
                          location.href = "/#my/address/select/" + response.content.address_id;
                        });
                        return;
                        //that.backToOrder(response.content.address_id);
                    }
                    Alert.show("新增地址成功!", function () {
                        location.href = "/#my/address";
                    });
                } else if (response && response.ret === 100021) {
                    Alert.show(response.msg, function() {
                        location.reload();
                    });
                } else {
                    Alert.show(response.msg);
                }
            },
            error: function () {
                Loading.hide();
                Alert.show("新增失败!");
            }
        });
    },

    updateAddress: function (data) {
        var that = this;
        $.ajax({
            url: "/account/address/update",
            dataType: "json",
            data: data,
            timeout: 20000,
            type: "POST",
            success: function (response) {
                Loading.hide();
                if (response && response.ret === 0) {
                    if (that.get("onChoosing")) {
                        that.set({onChoosing: false});
                        Alert.show("修改地址成功!", function () {
                          location.href = "/#my/address/select/" + response.content.address_id;
                        });
                        return;
                        //AddressRouter.navigate("select/" + response.content.address_id, {trigger: true});
                        //that.backToOrder(response.content.address_id);
                    }
                    Alert.show("修改地址成功!", function () {
                        location.href = "/#my/address";
                    });
                } else if (response && response.ret === 100021) {
                    Alert.show(response.msg, function() {
                        location.reload();
                    });
                } else {
                    Alert.show(response.msg);
                }
            },
            error: function () {
                Loading.hide();
                Alert.show("保存失败!");
            }
        });
    },

    deleteAddress: function (id) {
        var that = this;
        $.ajax({
            url: "/account/address/delete?address_id=" + id,
            dataType: "json",
            timeout: 20000,
            success: function (response) {
                if (response && response.ret === 0) {
                    if (that.get("onChoosing")) {
                        that.set({onChoosing: false});
                        location.href = "/#my/address/select/" + id;
                    } else {
                        location.href = "/#my/address";
                    }
                } else {
                    Alert.show(response.msg);
                }
                Loading.hide();
            },
            error: function () {
                Loading.hide();
                Alert.show("删除失败!");
            }
        });
    },

    backToOrder: function (addressId) {
        Order.create({addressId: addressId});
    }
});

module.exports = AddressModel;
