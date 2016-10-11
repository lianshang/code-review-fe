var $ = require('common:widget/ui/jquery/jquery.js');
var Modal = require('common:widget/ui/confirm-modal/confirm-modal.js');

var GET_API = {

    /*数据统一维护*/
    getInfo: function () {
        return {
            modalName: 'msg-modal',
            MSG_FAIL: '获取数据失败'
        }
    },


    /*
     Alert信息
     */
    renderMModal: function ($mod, msg) {
        var data = this.getInfo();
        new Modal({
            modalMod: $mod,  //从asyncData传过来?，层级太长
            component: {
                name: data.modalName, //this.getInfo().modalName ?  分散使用1?
                head: msg
            }
        });
    },

    asyncData: function (url, params, $mod, callback,scope) {
        var self = this;
        $.ajax({
            url: url,
            data: params,
            type: 'POST',
            dataType: 'json'
        }).done(function (response) {
            if (response && response.ret === 0) {
                if(callback){
                    if (scope) {
                        callback.call(scope, response)
                    }else{
                        callback();
                    }
                }
            } else {
                self.errorHandler($mod, response.msg);
            }
        }).fail(function () {
            self.errorHandler($mod, self.getInfo().MSG_FAIL);
        });
    },

    /*
     获取信息失败，使用Alert弹窗组件显示信息
     */
    errorHandler: function ($mod, msg) {
        //取消禁止状态
        $mod.find('.submit').prop('disabled',false);
        this.renderMModal($mod, msg);
        $('.' + this.getInfo().modalName).modal('show');  //分散使用2
    }

};

module.exports = GET_API;