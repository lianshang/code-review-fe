var $ = require( 'common:widget/ui/jquery/jquery.js' );
var MonitoringMap = require( 'order:widget/monitor/line-monitoring-map/line-monitoring-map.js' );

$(function(){
    var $mod = $('.mod-monitor-view');
    var monitoringMap = new MonitoringMap($mod);

    /**
     * 0.右侧订单详情容器
     */
    function bindEvent(){
        $mod.on('change','.only-address',function(){
            $mod.find('.wave-detail-content').toggleClass('only-address-control');
        });
    }

    /**
     * 1.设置地图高度
     */
    function setMapHight() {
        $mod.find( ".plan-map" ).height( $( document.body ).outerHeight( true ) );
    }

    /**
     * 2.保证随着浏览器高度调整,地图高度随着变化
     */
    function resizeMapHight() {
        setMapHight();
        $( window ).resize( function () {          //当浏览器大小变化时
            setMapHight();
        } );
    }

    /**
     * 3.取消浏览器默认右键方法
     */
    function cancleDefaultRightClick() {

        document.body.oncontextmenu = function () { return false };
        document.body.ondragstart = function () { return false };

    }

    function init(){
        resizeMapHight();
        cancleDefaultRightClick();
        monitoringMap.init();
        bindEvent();
    }

    init();
});