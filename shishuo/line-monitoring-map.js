var $ = require('common:widget/ui/jquery/jquery.js');
var Map = require('common:widget/ui/map/map.js');
var Loading = require('common:widget/ui/ui-loading/loading.js');
var T = require('common:widget/ui/tpl/tpl.js');
var tpls = require('order:widget/monitor/view/tpl.js');
//处理页面中接收到的数据并返回
var MonitoringModel = require('order:widget/monitor/line-monitoring-model/line-monitoring-model.js');

function MonitoringMap($mod) {

    this.$mod = $('.mod-monitor-view');
    this.$waveDetailView = this.$mod.find('.ui-wave-detail-view');    // 右侧订单详情容器

    this.handWork = {currentLine: [], otherLine: []};  // 手工干预线路
    this.autoMatic = {line: [], order: []};    // 自动线路与订单

    this.autoWaveData = null; // 处理后的自动线路数据
    this.handWaveData = null; // 处理后的手工干扰线路数据
    this.handCurrentWaveData = null; // 手工干扰当前的线路数据

    this.currentCovering = null; // 当前被选中的覆盖物

    this.handOrAutoFlag = [true, true, false]; // 控制自动计算、当前手工、其他手工
    this.isOpenFlag = false; // 全部展开的标记

    this.planMap = new Map({
        container: $mod.find( ".plan-map" ),
        readonly: true
    });

    this.monitoringModel = new MonitoringModel();
    this.COVERAGECONSTANT = this.monitoringModel.INITPOLYGONDATA;  // 由monitoringModel对象保管
    this.POLYGONCLASSNAME = this.monitoringModel.POLYGONCLASSNAME; // 关于初始化覆盖物时需要的固定    变量
    this.HANDORAUTOFLAGINDEX = {
        auto : 0 ,
        handCurrent : 1,
        handOther : 2
    };
}

var fn = MonitoringMap.prototype;

/**
 * 获取初始化覆盖物需要的处理过的数据
 * @param mapData
 */
fn.setInitMapData = function(mapData){
    var collect = this.monitoringModel.returnHandledCollect(mapData);
    this.autoWaveData = collect.autoWaveData;
    this.handWaveData = collect.handWaveData;
    this.handCurrentWaveData = collect.handCurrentWaveData;
};

/**
 * 利用格式化好的数据初始化覆盖物对象
 * @param mapCovering
 * @param mapData
 */
fn.initMapWaveCovering = function( mapCovering , mapData ){
    mapCovering.polygon =  this.initPolygon(mapData.polygonList);
    mapCovering.circle  =  this.initCircle(mapData.circleList);
    mapCovering.marker  =  this.initCircleSpots(mapData.markerList);
};

/**
 * 初始化散点
 * @param unplanOrderlist
 */
fn.initMapSpotCovering = function( unplanOrderlist ){
    // 自动--单个订单(散点)
    this.autoMatic.order = this.initSpot(
        this.monitoringModel
            .handleSpotData( unplanOrderlist )
    );
};

/**
 * 初始化圆形对应的地图覆盖物
 * @param waveInfo
 * @returns {{}}
 */
fn.initCircle = function (waveInfo) {
    var _this = this,
        circle = {},
        mapMarker = null;
    $.map( waveInfo , function ( wave , waveId ) {
        //返回绑定了地图时间的marker覆盖物
        mapMarker = _this.bindCoverEvent( _this.drawMarker( wave ) );
        circle[waveId] = mapMarker;
    });
    return circle;
};

/**
 * 初始化以一个线路为单位的小图标覆盖物
 * @param waveInfo
 * @returns {{}}
 */
fn.initCircleSpots = function ( waveInfo ) {
    var _this = this,
        mapWave = {};
    $.map( waveInfo , function ( orderList , waveId ) {
        mapWave[waveId] = _this.initSpot( orderList );
    });
    return mapWave;
};

/**
 * 初始化小图标对应的地图覆盖物
 * @param orderList
 * @returns {Array}
 */
fn.initSpot = function (orderList) {
    var _this = this,
        spots = [],
        mapMarker = null;
    $.map(orderList, function (orderInfo) {
        //返回绑定了地图时间的marker覆盖物
        mapMarker = _this.bindCoverEvent( _this.drawMarker( orderInfo ) );
        spots.push(mapMarker);
    });
    return spots;
};

/**
 * 初始化不规则图形的isShowPolygon属性,如果显示true,隐藏false
 * 1.自动--隐藏不规则图形、线路小点、显示圆形
 * 2.手工,其他线路--隐藏不规则图形、线路小点、圆形
 * 2.手工,当前线路--显示不规则图形、线路小点,隐藏圆形
 * 附注:初始化的时候元素都会显示在页面中,需要把要隐藏的做遍历,隐藏起来
 */
fn.initIsShowPolygon = function(){
    var _this = this;
    // 1.自动--隐藏生成线路的不规则线路、小点
    // 初始化不规则图形的isShowPolygon的状态值
    _this.toHide(
        _this.autoMatic.line.polygon ,
        function (k, v) { _this.syncIsShowPlygon(v,false); }
    );
    _this.toHide(_this.autoMatic.line.marker);

    // 2.手工,其他线路--隐藏不规则图像(需要标记状态)、小点、圆形
    // 初始化不规则图形的isShowPolygon的状态值

    _this.HideCircleAndPolygonAndSpot(
        _this.handWork.otherLine ,
        null ,
        function (k, v) { _this.syncIsShowPlygon(v,false); }
    );


    // 3.手工,当前线路--隐藏圆
    _this.toHide(_this.handWork.currentLine.circle);
};

/**
 * 设置地图的缩放级别和中心点
 * 附注:
 * 1、使用mapView.planMap.map.setCenter([lng,lat]);
 * 只能设置中心点,但是缩放级别没有,地图的缩放级别很小;
 * 2、使用mapView.planMap.map.setCcity('北京');
 * 会干扰中心点的设置,但可以将地图的缩放级别定位到城市。
 */
fn.initMapCenterAndLevel = function( waveInfo ){
    var _this = this;
    $.map( waveInfo , function ( wave ) {
        _this
            .planMap
            .map
            .setZoomAndCenter(10, [ wave.wave_info.pos.lng , wave.wave_info.pos.lat ]);
    });
};

/**
 * 初始化地图上所有的覆盖物对象
 * @param unplanOrderlist
 */
fn.initMapCovering = function( unplanOrderlist ){
    // 初始化手工干预当前的线路的不规则图像、原形、点
    this.initMapWaveCovering(this.handWork.currentLine , this.handCurrentWaveData );
    // 初始化手工干预其他的线路的不规则图像、原形、点
    this.initMapWaveCovering(this.handWork.otherLine , this.handWaveData );
    // 初始化自动生成的线路的不规则图像、原形、点
    this.initMapWaveCovering(this.autoMatic.line , this.autoWaveData );
    // 初始化自动散点
    this.initMapSpotCovering(unplanOrderlist);
    // 初始化仓库
    this.initWarehouse();
};

/**
 * 初始化地图覆盖物的双击事件
 */
fn.initdblClick = function(){
    this.bindCoveringDblclick( this.autoMatic.line );
    this.bindCoveringDblclick( this.handWork.currentLine );
    this.bindCoveringDblclick( this.handWork.otherLine );
};

/**
 * 在地图组件加载完成后初始化地图上面的覆盖物、覆盖物绑定事件等
 * @param responseWaveAndOrderData 返回的线路和订单的相关数据
 */
fn.initMapDetails = function ( responseWaveAndOrderData ) {
    var _this = this;
    // 设置地图的中心与显示级别
    _this.initMapCenterAndLevel( responseWaveAndOrderData.submit_info.current_wave_info );
    // 获取初始化覆盖物需要的处理过的数据
    _this.setInitMapData( responseWaveAndOrderData );
    // 初始化地图上所有的覆盖物对象
    _this.initMapCovering( responseWaveAndOrderData.unplan_orderlist );

    // 1.初始化不规则图像覆盖物的isShowPolygon;
    // 2.初始化覆盖物的显示状态
    _this.initIsShowPolygon();

    // 初始化地图覆盖物的双击事件
    _this.initdblClick();
    // 初始化顶部的工具栏
    _this.initTopBar( responseWaveAndOrderData );

};

/**
 * 为地图绑定e-map-complete事件,请求初始化地图详情的数据:线路与订单数据
 */
fn.mapComplete = function () {
    var _this = this;
    // 加载完成前展示loading
    Loading.show( "正在加载..." );
    // 绑定e-map-complete事件,加载完成后通过monitoringModel.getWaveDetails()
    // 请求地图上面的详情数据,拿到数据后通过initMapDetails函数来初始化地图上的覆盖
    // 物、以及为覆盖物绑定点击事件
    $(_this.planMap)
        .on('e-map-complete', function () {
            $.when(_this.monitoringModel.getWaveDetails())
                .done(function (response) {
                    _this.initMapDetails(response);
                })
                .done(function () {
                    Loading.hide();
                })
        });
};

/**
 * 展示线路隐藏圆
 * @param flags
 * @param waveList
 */
fn.showPolygon = function (flags, waveList) {
    var _this = this;
    $.each( flags , function (index, flag) {
        var waveInfo = waveList[index];
        flag && _this.showPolygonAndHideCircle( waveInfo.circle , waveInfo.polygon , waveInfo.marker ) ;
    });
};

/**
 * 是否显示圆,或者将线路和圆都隐藏
 * @param flags
 * @param waveList
 */
fn.isShowCircle = function (flags, waveList) {
    var _this = this;
    $.each(flags, function (index, flag) {
        flag ? _this.showCircleOrPolygon(waveList[index]) : _this.HideCircleAndPolygonAndSpot(waveList[index]);
    })
};

/**
 * 对左上角的复选框绑定事件
 */
fn.bindMapEvent = function () {
    var _this = this;

    // 给文档绑定按住ESC事件
    $(document).on("keydown", function (e) {
        _this.escPressed(e);
    });

    _this.$mod
        // 全部展开
        .on('change', '.all-wave-type-change', function () {
            _this.setOpenFlagCoveringRightReveal(
                $(this).prop('checked') ,
                [
                    _this.autoMatic.line ,
                    _this.handWork.currentLine ,
                    _this.handWork.otherLine
                ]
            );

        })
        // 自动计算线路
        .on('change', '.auto-calculat', function () {
            _this.setHandOrAutoCoveringRightReveal(
                $(this).prop('checked') ,
                _this.autoMatic.line ,
                _this.HANDORAUTOFLAGINDEX.auto ,
                _this.autoMatic.order
            );

        })
        // 当前手工线路
        .on('change', '.current-manual-intervent', function () {
            _this.setHandOrAutoCoveringRightReveal(
                $(this).prop('checked') ,
                _this.handWork.currentLine ,
                _this.HANDORAUTOFLAGINDEX.handCurrent
            );
        })
        // 其他手工线路
        .on('change', '.other-manual-intervent', function () {
            _this.setHandOrAutoCoveringRightReveal(
                $(this).prop('checked') ,
                _this.handWork.otherLine ,
                _this.HANDORAUTOFLAGINDEX.handOther
            );
        });
};

/**
 * 设置handOrAutoFlag属性的flag值
 * true选中显示当前种类的线路,false未选中不显示当前种类的线路
 * @param index
 * @param val
 */
fn.setHandOrAutoFlag = function (index,val){
    this.handOrAutoFlag[index] = val
};

/**
 * 设置isOpenFlag属性的flag值
 * true展开,false未全部展开
 * @param val
 */
fn.setIsOpenFlag = function (val){
    this.isOpenFlag = val
};

/**
 * 根据当前的flag设置自动、手工当前、手工其他几种覆盖物展示不规则图像还是展示圆
 * @param isChecked
 * @param waveItems
 */
fn.setOpenFlagCoveringRightReveal = function( isChecked , waveItems ){
    if ( isChecked ) {
        this.setIsOpenFlag( true );
        //显示线路隐藏圆
        this.showPolygon(this.handOrAutoFlag, waveItems);
    } else {
        this.setIsOpenFlag( false );
        //显示圆或者全部隐藏
        this.isShowCircle(this.handOrAutoFlag, waveItems);
    }
};

/**
 * 根据当前的flag设置自动、手工当前、手工其他几种覆盖物是否显示,展示不规则图像还是展示圆
 * @param isChecked 是否选中当前的复选框
 * @param list 覆盖物list
 * @param index flag的index
 * @param spot 散点,只有自动生成的有散点
 */
fn.setHandOrAutoCoveringRightReveal = function( isChecked , list , index , spot ){
    var _this = this;
    if ( isChecked ) {
        spot && _this.toShow( spot );
        _this.setHandOrAutoFlag(index,true);
        _this.isOpenFlag
            ? _this.showPolygonAndHideCircle( list.circle , list.polygon , list.marker )
            : _this.showCircleOrPolygon( list );
    } else {
        _this.setHandOrAutoFlag(index,false);
        _this.HideCircleAndPolygonAndSpot( list , spot );
    }
};

/**
 * 覆盖物双击事件时为设置他们的显示隐藏状态和他们的覆盖物显示状态
 * @param circleInfo
 * @param polygonInfo
 * @param markerList
 * @param contentDetails
 */
fn.setCoveringRightContent = function ( circleInfo , polygonInfo , markerList , contentDetails ){
    this.orderIsShowPolygon( circleInfo , polygonInfo , markerList , contentDetails.isShowPolygon );
    this.syncIsShowPlygon( polygonInfo , contentDetails.isShowPolygon );
    this.handleLastAndCurrentCoverings( contentDetails.isChecked , polygonInfo );
};

/**
 * 通过isShowPolygon的值来判断是显示Polygon还是circle
 * 1、isShowPolygon-true展示不规则图形和它对应的小图标
 * 2、isShowPolygon-false展示原形
 * @param circleInfo 原形:{ wave_id : circle }
 * @param polygonInfo 不规则图形:{ wave_id : polygon }
 * @param markerList 小图标:{ wave_id : markerList }
 * @param isShowPolygon 标记是否展示Polygon的参数
 */
fn.orderIsShowPolygon = function( circleInfo , polygonInfo , markerList , isShowPolygon ){
    isShowPolygon = isShowPolygon !== undefined ? isShowPolygon : polygonInfo.getExtData().isShowPolygon ;
    isShowPolygon
        ? this.showPolygonAndHideCircle( circleInfo , polygonInfo , markerList )
        : this.hidePolygonAndShowCircle( circleInfo , polygonInfo , markerList );
};

/**
 * 功能:检查覆盖物list是展示原形还是不规则图形和它对应的小图标,主要通过orderIsShowPolygon来执行具体的检查逻辑
 * @param waveList 存有线路,订单等覆盖物的对象格式
 */
fn.showCircleOrPolygon = function (waveList) {
    var _this = this;
    $.each( waveList.polygon, function (waveId, waveInfo) {
        _this.orderIsShowPolygon( waveList.circle[waveId] , waveInfo , waveList.marker[waveId] );
    });
};

/**
 * 不规则图像与原形上绑定不规则图形与原形的切换事件
 * @param line
 */
fn.bindCoveringDblclick = function ( line ) {
    var _this = this;

    $.each( line.circle , function ( waveId , circleInfo ) {
        circleInfo
            .on( 'dblclick' , function () {
                _this.setCoveringRightContent( circleInfo , line.polygon[waveId] , line.marker[waveId] , {
                    isShowPolygon : true,
                    isChecked : ''
                } );
                _this.checkisAllOpen();
            });

        line.polygon[waveId]
            .on( 'dblclick' , function () {
                _this.setCoveringRightContent( circleInfo , line.polygon[waveId] , line.marker[waveId] , {
                    isShowPolygon : false,
                    isChecked : 'checked'
                } );
                _this.setisNotAllOpen();
            });
    });
};

/**
 * 设置成不是全部展开的
 */
fn.setisNotAllOpen = function(){
    this.setIsOpenFlag( false );
    this.$mod.find('.all-wave-type-change').prop('checked', false);
};

/**
 * 检查是否全都选中展开了
 */
fn.checkisAllOpen = function(){
    var _this = this,
        polygonItems = [
            _this.autoMatic.line.polygon, //自动生成线路
            _this.handWork.currentLine.polygon, //当前手工干扰线路
            _this.handWork.otherLine.polygon //其他手工干扰线路
        ];
    _this.setIsOpenFlag( true );

    $.each( _this.handOrAutoFlag ,function( index , flag ){
        flag && $.map( polygonItems[index] , function( polygonInfo ){
            !polygonInfo.getExtData().isShowPolygon || !polygonInfo.getExtData().isOpenFlag && _this.setIsOpenFlag( false );
        });
    });

    _this.isOpenFlag && _this.$mod.find('.all-wave-type-change').prop('checked', true);

};

/**
 * 隐藏圆、小点、不规则线路
 * @param list
 * @param spot
 * @param callback
 */
fn.HideCircleAndPolygonAndSpot = function( list , spot , callback ){
    this.toHide( list.polygon , callback );
    this.toHide( list.marker );
    this.toHide( list.circle );
    spot && this.toHide( spot );
};

/**
 * 1.展示不规则线路
 * 2.展示不规则线路上对应的小点
 * 3.隐藏不规则线路对应的原形
 * @param circleInfo
 * @param polygonInfo
 * @param markerList
 */
fn.showPolygonAndHideCircle = function( circleInfo , polygonInfo , markerList ){
    this.toShow( polygonInfo );
    this.toShow( markerList );
    this.toHide( circleInfo );
};

/**
 * 1.隐藏不规则线路
 * 2.隐藏不规则线路上对应的小点
 * 3.展示不规则线路对应的原形
 * @param circleInfo
 * @param polygonInfo
 * @param markerList
 */
fn.hidePolygonAndShowCircle = function( circleInfo , polygonInfo , markerList ){
    this.toHide( markerList );
    this.toHide( polygonInfo );
    this.toShow( circleInfo );
};

/**
 * 为覆盖物绑定单击事件
 * @param Covering 订单、原形、不规则图形覆盖物对象
 * @returns {*} 最后返回绑定事件的覆盖物对象
 */
fn.bindCoverEvent = function (Covering) {
    var _this = this;

    // 覆盖物绑定单击事件,函数里面处理了三件事
    Covering.on('click', function () {
        // 1.获取覆盖物ExtData属性中存有的线路、订单数据,
        // 然后渲染右侧的线路、订单详情栏
        _this.renderWaveDetails( this.getExtData() );
        // 2.设置恢复上一个选中的覆盖物颜色,
        // 并将当前的覆盖物设置为选中
        _this.handleLastAndCurrentCoverings('checked', this);

    });

    return Covering;
};

/**
 * 判断是否有callback并隐藏覆盖物
 * @param waveId
 * @param covering
 * @param callback
 */
fn.orderHide = function ( waveId , covering , callback ){
    callback && callback( waveId , covering );
    covering.hide();
};

/**
 * 隐藏线路(不规则线路,圆形),订单(散点)
 * @param coveringList
 * @param callback
 */
fn.toHide = function (coveringList, callback) {
    var _this = this;
    coveringList.CLASS_NAME
        ? coveringList.hide()
        : $.each(coveringList, function (coveringInfoId, coveringInfo) {
                $.isArray(coveringInfo)
                    ? $.each( coveringInfo, function (coveringId, covering) { _this.orderHide(coveringId , covering , callback);})
                    : _this.orderHide(coveringInfoId , coveringInfo , callback);
          });
};

/**
 * 同步不规则图像覆盖物的isShowPlygon属性的值
 * @param polygonCovering
 * @param isShowPolygon
 */
fn.syncIsShowPlygon = function( polygonCovering , isShowPolygon ){
    polygonCovering.setExtData( $.extend(
        polygonCovering.getExtData() ,
        { isShowPolygon : isShowPolygon }
    ));
};

/**
 * 显示线路(不规则线路,圆形),订单(散点)
 * @param coveringList
 */
fn.toShow = function (coveringList) {
    coveringList.CLASS_NAME
        ? coveringList.show()
        : $.map(coveringList, function ( coveringInfo ) {
                $.isArray( coveringInfo )
                    ? $.map( coveringInfo , function ( covering ) { covering.show(); } )
                    : coveringInfo.show() ;
          });
};

/**
 * 设置覆盖物的content,从类型上面看有两种new AMap.Polygon和new AMap.Marker
 * 通过marker.CLASS_NAME来区分
 * @param checkedClass
 * @param marker
 * @param fillColor
 */
fn.setMarkerContent = function (checkedClass, marker, fillColor) {
    var _this = this;
    if (marker) {
        if (marker.CLASS_NAME === _this.POLYGONCLASSNAME) {
            marker.setOptions({
                fillColor: fillColor || marker.getExtData().fillColor
            });
        } else {
            _this.setCoveringContent(marker, checkedClass);
        }
    }
};

/**
 * 改变现在的选中未选中的背景颜色
 * @param checkedClass
 * @param currentCovering
 */
fn.handleLastAndCurrentCoverings = function (checkedClass, currentCovering) {
    var _this = this;
    // 1.清空上一个选中元素的颜色从蓝色变为原来的颜色
    _this.setMarkerContent( '' , _this.currentCovering );
    // 2.为当前选中的订单,圆,线路设置选中颜色
    _this.setMarkerContent( checkedClass , currentCovering , _this.COVERAGECONSTANT.onfillColor );
    // 3.记录当前选中的覆盖物对象
    _this.currentCovering = currentCovering;
};

/**
 * 初始化不规则区域对应的覆盖物
 * @param polygonList
 * @returns {{}}
 */
fn.initPolygon = function (polygonList) {
    var orderPolygon = {},
        _this = this;
    $.map(polygonList, function (polygonInfo, waveId) {

        var polygon = _this.bindCoverEvent(
            new AMap.Polygon({
                path: polygonInfo.path,//设置多边形边界路径
                strokeColor: polygonInfo.strokeColor, //线颜色
                strokeOpacity: _this.COVERAGECONSTANT.strokeOpacity, //线透明度
                strokeWeight: _this.COVERAGECONSTANT.strokeWeight,    //线宽
                fillColor: polygonInfo.fillColor, //填充色
                fillOpacity: _this.COVERAGECONSTANT.fillOpacity,  //填充透明度
                zIndex: polygonInfo.zIndex, //设置显示层级
                extData: polygonInfo
            })
        );
        polygon.setMap(_this.planMap.map);
        orderPolygon[waveId] = polygon;
    });
    return orderPolygon;
};


/**
 * 设置覆盖物(原形与散点的)的content
 * @param Covering
 * @param checkedClass
 */
fn.setCoveringContent = function (Covering, checkedClass) {
    var coveringData = Covering.getExtData();
    Covering.setContent(
        (coveringData.markerType === this.monitoringModel.MARKERTYPE.circle) ?
            this.monitoringModel.getDrawWaveView(coveringData, checkedClass).content :
            this.monitoringModel.getDrawOrderView(coveringData, checkedClass).content
    );
};

/**
 * 初始化地图后,显示物美仓库位置（北京物美商业集团仓库）
 */
fn.initWarehouse = function () {
    this.drawMarker({
        raiseOnDrag: true,
        offset: [-10, -15],
        pos: conf.dcConf.pos,
        topWhenMouseOver: true,
        content: '<div class="marker-wm-DC"></div>',
        title: conf.dcConf.name
    });
};

/**
 * 生成圆形、小图标、仓库位置需要的覆盖物
 * @param markerInfo
 */
fn.drawMarker = function (markerInfo) {
    var _this = this;
    return new AMap.Marker({
        draggable: false,
        cursor: 'pointer',
        map: _this.planMap.map,
        raiseOnDrag: markerInfo.raiseOnDrag || false,
        offset: markerInfo.offset && new AMap.Pixel(markerInfo.offset[0], markerInfo.offset[1]) || new AMap.Pixel(-10, -28),
        position: [markerInfo.pos.lng, markerInfo.pos.lat],
        topWhenMouseOver: markerInfo.topWhenMouseOver || false,
        content: markerInfo.content,
        zIndex: markerInfo.zIndex || 100,
        clickable: markerInfo.clickable || true,
        title: markerInfo.title || null,
        extData: markerInfo
    })
};


/**
 * 去掉选中的订单
 * @param e
 */
fn.escPressed = function (e) {
    var _this = this;
    if (e.which === 27) {
        //清空现在的选中的订单,线路(圆,不规则图形)背景颜色
        _this.handleLastAndCurrentCoverings('', null);
        //隐藏右侧的线路、订单详情
        _this.$waveDetailView.hide();
    }
};

/**
 * 渲染顶部信息栏
 * @param topBarData
 */
fn.initTopBar = function (topBarData) {
    var _this = this;
    $.map(topBarData.submit_info.current_wave_info, function ( wave ) {
        _this.$mod
            .find( '.ui-top-bar-view' )
            .append( T.compile( tpls.topBar )(
                _this.monitoringModel
                    .gatherTopBarData( wave , topBarData )
            ));
    });

};

/**
 * 渲染右侧线路信息栏
 * @param waveInfo
 */
fn.renderWaveDetails = function (waveInfo) {
    var _this = this;
    $.when(_this.monitoringModel.gatherWaveDetails(waveInfo))
        .done(function (waveInfo) {
            _this.$waveDetailView
                .show()
                .empty()
                .removeClass('hide-wave-details')
                .append(T.compile(tpls.sideBarMain)( waveInfo ));
        });
};

fn.init = function(){
    this.mapComplete();
    this.bindMapEvent();
};

module.exports = MonitoringMap;
