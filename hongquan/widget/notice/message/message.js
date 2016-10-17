/**
 * 消息通道组件（暂支持postmessage）
 * 用例:
 *  1. 支持一次事件侦听
 * msg.one('msg-file-upload-idxxx', function (e, data) {
 *  console.log(data);
 * });
 */

var Message = function () {
    //this._func = {
    //    //'eventType': []
    //};
    this._oneFunc = {
    };
    this._init();
};

Message.prototype = {
    constructor: Message,
    _init: function () {
        this._bindMessage();
    },
    /**
     * 根据事件类型,处理注册的事件和传递数据
     * @param type
     * @param data
     * @private
     */
    _fire: function (type, data) {
        var _this = this;
        //var funcList = _this._func[type];
        //if(funcList && funcList.length > 0) {
        //    for(var i = 0; i < funcList.length; i++) {
        //        funcList[i].call(null, {type: type}, data);
        //    }
        //}
        var oneFuncList = _this._oneFunc[type];
        if(oneFuncList && oneFuncList.length > 0) {
            for(var i = 0; i < oneFuncList.length; i++) {
                oneFuncList[i].call(null, {type: type}, data);
            }
            _this._oneFunc[type] = [];
        }
    },
    /**
     * 侦听 postmessage的事件,并作事件解包,要求事件内容为 {type: 'msg-xxx', data: []} 格式的json字符串
     * @private
     */
    _bindMessage: function () {
        var _this = this;
        function handMessage(event){
            event = event || window.event;
            ////验证是否来自预期内的域，如果不是不做处理，这样也是为了安全方面考虑
            //if(event.origin === 'http://www.postmessage1.com'){
            //    //document.getElementById('divMessage').innerHTML = event.data;
            //}
            var msg = event.data;
            if(msg && typeof(msg) == 'string') {
                msg = JSON.parse(msg);
            }
            if(msg.type) {
                _this._fire(msg.type, msg.data);
            } else {
                //console.warn('ERROR format [postmessage]! ignore!');
                //console.log(event);
            }
        }
        //给window对象绑定message事件处理
        if (window.addEventListener) {
            window.addEventListener("message", handMessage, false);
        } else {
            window.attachEvent("onmessage", handMessage);
        }
    },
    /**
     * 绑定一次事件;这里暂不区分事件的来源（比如是postmessage/还是普通的页面数据, 建议业务通过type定义方式划分:e-xxx msg-xx）
     * @param type
     * @param handler
     */
    one: function (type, handler) {
        if(type) {
            this._oneFunc[type] = this._oneFunc[type] || [];
        }
        this._oneFunc[type].push(handler);
    }
};

module.exports = new Message();