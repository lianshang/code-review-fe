var $ = require('common:widget/ui/jquery/jquery.js');
require('common:widget/ui/modal/modal.js');
var artTpl = require('common:widget/ui/tpl/tpl.js');
var tpls = require('common:widget/ui/confirm-modal/tpl.js');
/**
 * @param opts
 * modalMod 弹窗append的节点
 * Component 弹窗组成name，head，body，type,size,extendBtn
 * 三种事件 submit,cancel,extend
 *   例：
 *   new Modal({
             modalMod : this.$mod, //dom节点
             component: {
                 name: "confirm-modal" //弹窗标志 控制弹窗显隐
                 head: "弹窗测试",
                 size: "sm",   //弹框大小参数 lg md sm
                 type: "confirm",  //默认type 是 alert弹窗
                 extendBtn: "全部", //第三个按钮
             },
             submit:function(){
               this.formatData()
           }
         });
 * @constructor
 */
var Modal = function (opts) {
    this.opts = opts;
    this.component = this.opts.component;
    this.$modalMod = this.opts.modalMod;
    this.$mod = null;
    this.tpl = tpls.MODALTPL;

    this.init();

};

Modal.prototype = {
    init: function () {
        //modal生成的dom节点必填，否则不进行modal生成     ？异常判断dom节点
        if (!this.$modalMod || this.$modalMod.length != 1) {
            //console.log("需要传入modal生成的dom节点");
            return;
        }
        this._renderModal();
        this._bindEvent();
    },

    /*
     生成modal
     */
    _renderModal: function () {
        //在wap节点 生成modal
        this.$modalMod.append(artTpl.compile(this.tpl)(this.component));
        this._getModalNode();
        //生成modal-content
        this.$mod.find('.modal-body').html(this.component.body);
    },

    /*
     获取$mod，给$mod赋值，有必要单写一个函数吗？
     */
    _getModalNode: function () {
        this.$mod = this.$modalMod.find('.' + this.component.name);
    },

    _getFunction: function (type, $btn) {
        var self = this;
        if (self.opts[type]) {
            self.opts[type]();
            if (type == "submit" && $btn) {
                //默认alert弹框，确定弹框取消
                $btn.closest('.modal-wap').modal('hide');
            }
        }
    },

    /*
     事件处理
     */
    _bindEvent: function () {
        var self = this;
        //点击按钮，执行callback方法
        self.$mod.on("click", '.modal-submit', function () {
            self._getFunction('submit', $(this));
        }).on("click", '.modal-cancel', function () {
            self._getFunction('cancel');
            // self.opts.cancel && self.opts.cancel();
        }).on("click", '.modal-extend', function () {
            self._getFunction('extend');
            // self.opts.extend && self.opts.extend();
        });
    }

};

module.exports = Modal;
