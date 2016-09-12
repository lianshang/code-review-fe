var $ = require( 'common:widget/ui/jquery/jquery.js' );
var Loading = require( 'common:widget/ui/loading/loading.js' );
var helper = require( 'common:widget/ui/helper/helper.js' );
var Alert = require( 'common:widget/ui/alert/alert.js' );

function MonitoringModel(){

    this.autoWaveData = {}; // 自动生成的线路数据
    this.handWaveData = {}; // 手工干预生成的同一次提交的其他线路
    this.handCurrentWaveData = {}; // 手工干预生成的同一次提交的当前线路

    this.ORDERCOVERINGOFFSET = [-8,-30]; // 由订单生成的小图标覆盖物的offset值
    this.WAVECOVERINGVIEW = [                // 由线路生成的圆形覆盖物,需要根据线路的
        { offset:[ -20, -25 ] , size:'s' }, // 半径(最远的两个订单的距离的一半)来区
        { offset:[ -30, -30 ] , size:'m' }, // 分订单的size(大小),根据圆形图标的大小
        { offset:[ -40, -45 ] , size:'l' }  // 来进一步确定offset值
    ];
    this.MARKERTYPE = { // 通过这个类型来区分marker的类型,是圆形还是小图标
        circle:'circle'
    };
    this.DATATYPE = {
        auto: 'auto',
        handCurrent: 'handCurrent',
        handOther: 'handOther'
    };
    this.URLGETDETAIL = 'monitor/getdetail';// 获取地图中的所有线路与订单数据
    this.URLGETORDERLIST = 'plan/getorderlist';// 获取自动线路的公里数
    this.RESTRICTION = 'o'; //大车限行
    this.YESTERDAY = 'y'; //昨天的订单
    this.AUTOMAPSIZE = {
        polygonIndex : 100,
        orderIndex : 200,
        waveIndex : 300,
        strokeColor : "#949392", // 线颜色
        fillColor : "#bcbbb9" //填充色
    };
    this.HANDMAPSIZE = {
        polygonIndex : 400,
        orderIndex : 500,
        waveIndex : 600,
        strokeColor : "#FF33FF", // 线颜色
        fillColor : "#1791fc" //填充色
    };
    this.INITPOLYGONDATA = {
        strokeOpacity: 0.2, //线透明度
        strokeWeight: 3,    //线宽
        fillOpacity: 0.35,
        onfillColor:'#0623fb' // 选中后的填充颜色
    };
    this.POLYGONCLASSNAME = 'AMap.Polygon'; // 遮盖物ploygon的classname


}
var fn = MonitoringModel.prototype;

/**
 * 订单列表根据地址的id进行查重,并将重复地址的订单合并到一起,
 * 存到addressList中并返回
 * @param orderList 订单列表的数据源
 * @returns {{}} 返回地址列表
 */
fn.checkAdrRepeat = function ( orderList ){
    var addressList = {};
    $.map(orderList,function(orderInfo){
        var addressId = orderInfo.address_info.address_id;
        //校驗地址是否已重複
        if ( addressList[ addressId ] ) {
            // 这个订单的地址已经重复了
            addressList[ addressId ].push( orderInfo );
            orderInfo = $.extend( orderInfo ,{
                // 訂單地址重複,在orderInfo中做標記
                isEcho : true,
                address_id : addressId
            });

        } else {
            // 訂單地址第一次出現在addressList中,為這個訂單創建一個數組,
            // 然後把當前的orderInfo放入到addressList中
            addressList[ addressId ] = [];
            addressList[ addressId ].push( orderInfo );
        }
    });

    return {
        addressList : addressList ,
        orderList : orderList
    };
};

/**
 * 添加地址信息到content属性和extData属性中,方便覆盖物渲染
 * @param addressList  存入了地址信息的列表对象
 * @param orderList  订单信息列表
 * @returns {*}
 */
fn.addAdrInfoToOrderList = function ( addressList , orderList ){
    $.map(orderList,function(orderInfo){
        if (orderInfo.isEcho) {
            var oneAdrList = addressList[orderInfo.address_id];
            orderInfo = $.extend(
                orderInfo,
                {
                    content : "<div class='echo-address-marker'>" + oneAdrList.length + "</div>",
                    extData : {  addressList: oneAdrList }
                }
            );
        }
    });
    return orderList;
};

/**
 * 分析订单重合问题,筛选超市订单,归整为每个超市下对应的订单
 * @param orderList 訂單信息集合
 * @returns {*}
 */
fn.orderAdrRepeatInfo = function ( orderList ) {
    var _this = this;
    if ( orderList && orderList.length > 0 ) {
        var orderInfo = {};
        // 检查订单地址是否重复,并记录将重复地址返回
        orderInfo = _this.checkAdrRepeat( orderList );
        // 添加地址信息到content属性和extData属性中,方便覆盖物渲染
        orderList = _this.addAdrInfoToOrderList( orderInfo.addressList , orderInfo.orderList );
    }
    return orderList;
};

/**
 * 处理订单数据
 * @param orderList
 * @param orderIndex
 * @param type
 * @returns {{waveOrder: *, path: *}}
 */
fn.handleOrderData = function ( orderList , orderIndex ,type ){
// 画线路-多边形覆盖物时使用的坐标点数组[[lnt,lag],[lnt,lag]…]
    var path = [],
    waveOrder = [],
        _this = this;
    // 分析订单重合问题,筛选超市订单,归整为每个超市下对应的订单
    orderList = _this.orderAdrRepeatInfo( orderList );

    // 整理订单的数据
    // 1、输出plygonPos用来画线路-多边形覆盖物;
    // 2、输出waveOrder用来画订单-小图标覆盖物。
    $.map(orderList,function( orderInfo ) {
        //收集一个线路下的所有订单的坐标,
        //并放到plygonPos中用来画多边形覆盖物
        path.push( [
            orderInfo.pos.lng , //经度
            orderInfo.pos.lat  //纬度
        ] );
        orderInfo = $.extend( orderInfo , { type : type } );
        waveOrder.push(
            $.extend(
                orderInfo,
                // getIcon设置订单的content[通过new marker生成的覆盖物,
                // 需要通过设置他的content属性来确定这个覆盖物在地图上显示的样式]
                // offset[覆盖物的偏移量]
                _this.getDrawOrderView(orderInfo,'') ,
                {
                    // 自动生成线路上的订单和散点的zIndex--200;
                    // 手工生成线路上的订单的zIndex--500;
                    zIndex : orderIndex
                }
            )
        );
    });
    return {
        waveOrder:waveOrder,
        path:path
    };
};

/**
 * 输出处理过的数据对象
 * @param response
 * @returns
 * {{
     * autoWaveData: ({}|*),
     * handWaveData: ({}|*),
     * handCurrentWaveData: ({
         * markerInfo: Object,
         * polygonInfo: Object,
         * circleInfo: Object,
         * orderAddres: Object
     * }|*)
 * }}
 */
fn.returnHandledCollect = function( response ){
    var _this = this;

    _this.autoWaveData = _this.handleWaveAndOrderData({
        waveList : response.wave_list,
        type : _this.DATATYPE.auto
    });
    _this.handWaveData = _this.handleWaveAndOrderData({
        waveList : response.submit_info.submit_wave_info,
        type : _this.DATATYPE.handOther
    });
    _this.handCurrentWaveData = _this.handleWaveAndOrderData({
        waveList : response.submit_info.current_wave_info,
        type : _this.DATATYPE.handCurrent
    });
    return {
        autoWaveData: _this.autoWaveData,
        handWaveData: _this.handWaveData,
        handCurrentWaveData: _this.handCurrentWaveData
    };
};

/**
 * 处理线路,订单的数据,生成可以绘制覆盖物的数据结构
 * @param waveAndOrderDataCollect
 * @returns {{
        *     markerList: object,
        *     polygonList: object,
        *     circleList: object,
        *     orderAddres: object
        * }}
 */
fn.handleWaveAndOrderData = function (waveAndOrderDataCollect){
    var _this = this,
        handleWaveOrOrderData = {
            markerList : {} ,
            polygonList : {} ,
            circleList : {}
        },
    //处理数据时通过type来区分自动生成的订单、线路与手工干预生成的订单、线路
    //主要是为了设置覆盖物的样式时可以通过type来进行区分
    type = waveAndOrderDataCollect.type;
    $.map( waveAndOrderDataCollect.waveList ,function(wave,waveId){
        var waveInfo = wave.wave_info,
            orderData = {},
            polygonIndex = _this.HANDMAPSIZE.polygonIndex,
            orderIndex = _this.HANDMAPSIZE.orderIndex,
            waveIndex = _this.HANDMAPSIZE.waveIndex,
            strokeColor = _this.HANDMAPSIZE.strokeColor, // 线颜色
            fillColor = _this.HANDMAPSIZE.fillColor; // 填充色
        if( type === _this.DATATYPE.auto ){
            polygonIndex = _this.AUTOMAPSIZE.polygonIndex;
            orderIndex = _this.AUTOMAPSIZE.orderIndex;
            waveIndex = _this.AUTOMAPSIZE.waveIndex;
            strokeColor = _this.AUTOMAPSIZE.strokeColor ; //线颜色
            fillColor = _this.AUTOMAPSIZE.fillColor ; //填充色
        }

        //返回处理过后的订单list
        orderData = _this.handleOrderData( wave.order_list , orderIndex ,type);
        handleWaveOrOrderData.markerList[waveId] = orderData.waveOrder;
        waveInfo = $.extend( waveInfo , { type : type } );

        handleWaveOrOrderData.circleList[waveId] = $.extend(
            // getCirIcon设置订单的content[通过new marker生成的覆盖物,
            // 需要通过设置他的content属性来确定这个覆盖物在地图上显示的样式]
            // offset[覆盖物的偏移量]因为线路原形覆盖物的图标根据两个最远订单
            // 的距离的一半为半径分为:大、中、小三种所以需要分别设置偏移量
            _this.getDrawWaveView(waveInfo,''),
            waveInfo,
            {
                // 自动生成线路的圆形的zIndex--300;
                // 手工生成线路的圆形的zIndex--600;
                zIndex : waveIndex ,
                order_list : wave.order_list ,
                type : type
            }
        );
        handleWaveOrOrderData.polygonList[waveId] = {
            path : orderData.path,
            wave_info : waveInfo,
            order_list : wave.order_list,
            strokeColor : strokeColor , // 线颜色
            fillColor : fillColor , // 填充色
            zIndex : polygonIndex , // 设置显示层级
            type : type ,
            isShowPolygon : true // 地图上当前展示的是否是展开的不规则线路图
                                 // true 是; false 不是。
        } ;

    });
    return handleWaveOrOrderData;
};

/**
 * 通过类型(type),是否被选中(checked)
 * 以及订单信息中的是否大车限行(restriction_flag)、
 * 是否是今天的订单(day_flag)等信息来判断生成覆盖物的class
 * @param orderList 订单信息列表
 * @param checked 是否被选中,值为''时是没选中,值为'checked'是选中
 * @returns {{content: *, offset: *[]}}
 */
fn.getDrawOrderView = function (orderList,checked){
    var _this = this;
    // 用来设置覆盖物对象的content属性,渲染覆盖物的样式
    var drawCoveringContent = _this.getOrderContent( orderList , checked ) ;

    // 如果是一个地址多个订单的情况,需要在content中增加样式显示出来
    if(orderList.isEcho && orderList.content){
        drawCoveringContent = drawCoveringContent + orderList.content ;
    }
    // 返回订单marker的content与offset
    return {
        content : drawCoveringContent ,
        offset : _this.ORDERCOVERINGOFFSET // 单个订单的小图标需要设置offset值,来精确定位到地图上
    };
};

/**
 * 通过类型(type),是否被选中(checked)
 * 以及订单信息中的是否大车限行(restriction_flag)、
 * 是否是今天的订单(waveday_flag)等信息来判断生成覆盖物的class
 * @param waveInfo 订单信息列表
 * @param checked 是否被选中,值为''时是没选中,值为'checked'是选中
 * @returns {{content: *, offset: *[]}}
 */
fn.getDrawWaveView = function (waveInfo,checked){
    var markerCon = '';//返回的circle marker的content内容
    var offset = [];//返回circle marker的offset内容
    var _this = this;
    /**
     *  switch大中小圆
     *  内部逻辑判断为,线路中是否含有昨日订单,是否含有特殊提示订单
     *  1.不含昨日订单,不含特殊订单
     *  2.不含昨日订单,含特殊订单
     *  3.含昨日订单,不含特殊订单
     *  4.含昨日订单,含特殊订单
     *
     */
    switch ( parseInt(waveInfo.radius_flag) ) {
        case 1:
            markerCon = _this.getWaveContent(waveInfo,checked,_this.WAVECOVERINGVIEW[0].size);
            offset = _this.WAVECOVERINGVIEW[0].offset;
            break;
        case 2:
            markerCon = _this.getWaveContent(waveInfo,checked,_this.WAVECOVERINGVIEW[1].size);
            offset = _this.WAVECOVERINGVIEW[1].offset;
            break;
        case 3:
            markerCon = _this.getWaveContent(waveInfo,checked,_this.WAVECOVERINGVIEW[1].size);
            offset = _this.WAVECOVERINGVIEW[2].offset;
            break;
    }
    //返回订单marker的content与offset,还有markerType与小订单区分
    return { content : markerCon, offset : offset , markerType : _this.MARKERTYPE.circle };
};

/**
 * 返回订单对应小图标的content属性的具体内容
 * @param orderInfo 订单信息
 * @param checked 是否被选中,值为''时是没选中,值为'checked'是选中
 * @returns {string}
 */
fn.getOrderContent = function (orderInfo,checked){
    var info = this.getContent(orderInfo);
    return '<div class="marker-' + removeKong([info.restriction,checked,info.type,info.yesterday]) + '-un-plan-order"></div>';
};


/**
 * 返回线路对应圆形的content属性的具体内容
 * @param waveInfo 线路信息
 * @param checked 是否被选中,值为''时是没选中,值为'checked'是选中
 * @param size 表示圆形图标的三种size:大--l 中--m 小--s
 * @returns {string}
 */
fn.getWaveContent = function (waveInfo,checked,size){
    var info = this.getContent(waveInfo);
    return '<div class="marker-' + removeKong([info.restriction,info.yesterday,info.type,checked,'wave',size]) + '"><span>'  + waveInfo.address_count + '点<br>' + waveInfo.container_count + '箱' + '</span></div>';
};


/**
 * 通过restriction_flag,waveday_flag[线路],day_flag[订单],type等因素
 * 决定覆盖物的content的class内容,这个函数主要是输出几个决定性的参数
 * @param info
 * @returns {{restriction: string, yesterday: string, type: string}}
 */
fn.getContent = function (info){
    var restriction = '';
    var yesterday = '';
    var type = this.DATATYPE.auto;
    // restriction_flag == 1大车限行
    // restriction_flag == 2不限行
    // 大车限行的线路用o标记
    ( info.restriction_flag == 1 ) && ( restriction = this.RESTRICTION );
    // waveday_flag == 1 昨天的线路
    // waveday_flag == 2 今天的线路
    // 昨天的线路用y标记
    ( info.waveday_flag == 1 ) && ( yesterday = this.YESTERDAY );
    ( info.day_flag == 1 ) && ( yesterday = this.YESTERDAY );

    // info.type来区分手工生成的订单与自动生成的订单
    // 1. 线路以及线路下的订单都经过了函数handleWaveAndOrderData处理,这些数据都带上了type,
    //    自动:type === 'auto';手工:type === 'hand'。
    // 2. 由于手工干预的都是线路与线路上对应的订单,没有散点,所以手工生成的订单数据中都有type === 'hand'的标记
    //    而自动生成的有散点,这些数据没有经过函数handleWaveAndOrderData处理,所以没有type属性,而他们的type === 'auto'
    //    所以在这里有这样的逻辑处理

    (info.type !== this.DATATYPE.auto) && (type = '') ;

    return {
        restriction : restriction,
        yesterday : yesterday,
        type : type
    }
};

/**
 * 请求数据的工具函数
 * @param action
 * @param params
 * @param callback
 * @param dtd
 */
fn.syncData = function ( action , params , callback , dtd ){
    var error = '操作失败!';
    Loading.show( "正在加载..." );
    $.ajax({
        url: '/order/'+action,
        data: params,
        type: 'GET',
        dataType: 'json'
    }).done(function (response) {
        if(response){
            if (response.ret === 0) {
                callback(response.content);
            } else {
                Alert.show( response.msg || error ,function(){
                    Loading.hide();
                });
                dtd && dtd.reject();
            }
        }else{
            Alert.show( error ,function(){
                Loading.hide();
            });
            dtd && dtd.reject();
        }
    }).fail( function () {
        Alert.show( error ,function(){
            Loading.hide();
        });
        dtd && dtd.reject();
    } );
};
/**
 * 初始化地图上面的数据
 */
fn.getWaveDetails = function(){
    var _this = this,
        dtd = $.Deferred();
    //初始化页面中的自动生成、手工干预的线路与散点订单数据
    Loading.show( "正在加载..." );
    _this.syncData( _this.URLGETDETAIL ,{
        plan_id : helper.queryString('plan_id') ,
        wave_id : helper.queryString('wave_id')
    }, function( response ){
        dtd.resolve(response);
    } );
    return dtd.promise();
};

/**
 * 将waveInfo的信息进行整合然后返回,主要为了右侧的订单详情提供信息
 * @param waveInfo
 * @param mileage
 * @private
 */
fn._gatherWaveInfo = function(waveInfo , mileage){

    if(waveInfo.order_list){
        waveInfo.marketList = waveInfo.order_list;
    }else if( waveInfo.extData ){
        waveInfo.marketList = waveInfo.extData.addressList;
    }else{
        waveInfo.marketList = [{
            address_info : waveInfo.address_info,
            container_count : waveInfo.container_count,
            restriction_flag : waveInfo.restriction_flag,
            order_id : waveInfo.order_id
        }];
    }
    return $.extend(waveInfo,
        {
            mileage : parseFloat(mileage).toFixed(1) ,
            transportationType : conf.transportationType
        }
    )
};

/**
 * 收集线路订单的信息,为渲染tpl模板做准备
 * @param waveInfo
 * @returns {*}
 */
fn.gatherWaveDetails = function ( waveInfo ){
    var _this = this,
        dtd = $.Deferred();
    if( waveInfo.mileage == -1 ){
        _this.syncData( _this.URLGETORDERLIST , {
            plan_id : waveInfo.plan_id,
            wave_id : waveInfo.wave_id
        } , function( response ){
            dtd.resolve( _this._gatherWaveInfo( waveInfo , response.wave_info.mileage ) );
        } , dtd );

    }else{
        dtd.resolve( _this._gatherWaveInfo( waveInfo , waveInfo.mileage ) );
    }
    return dtd.promise();
};

/**
 * 处理散点的数据
 * @param unplanOrderlist
 * @returns {Array}
 */
fn.handleSpotData = function( unplanOrderlist ){
    // 初始化自动类型的散点
    return this.handleOrderData( unplanOrderlist , this.AUTOMAPSIZE.orderIndex, this.DATATYPE.auto ).waveOrder;
};

/**
 * 收集顶部信息栏的数据
 * @param wave
 * @param topBarData
 */
fn.gatherTopBarData = function(wave,topBarData){
    return $.extend(
        wave.wave_info,
        {
            statusConf: conf.status,
            plan_time: (new Date(topBarData.plan_info.plan_time * 1000)).toLocaleString()
        }
    )
};

/**
 * 去除数组中的空值
 * @param arr
 * @returns {string}
 */
function removeKong(arr){
    return $.map(arr,
        function(value){
            if(value){
                return value;
            }
        }).join('-');
}

module.exports = MonitoringModel;
