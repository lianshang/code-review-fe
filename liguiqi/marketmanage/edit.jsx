var $ = require('common:widget/ui/jquery/jquery.js');
var artTpl = require('common:widget/ui/tpl/tpl.js');
var helper = require('common:widget/ui/helper/helper.js');
var Validator = require('common:widget/ui/validator/validator.js');
require('common:widget/ui/tooltip/tooltip.js');
require('common:widget/ui/datetimepicker/datetimepicker.js');
require('common:widget/ui/datetimepicker/locales/bootstrap-datetimepicker.zh-CN.js');
var React = require('common:widget/ui/react/react.js');
var ReactDOM = require('common:widget/ui/react/react-dom.js');
var Regions = require('common:widget/ui/regions/regions.jsx');
var Map = require('marketmanage:widget/ui/map/map.js');
var PreviewImgUploadList = require('common:widget/ui/form/preview-img-upload-list/preview-img-upload-list.jsx');
var action = function (opts) {
    var $mod = $('.mod-market-edit');
    var MSG_SUC = '保存成功';
    var MSG_FAIL = '保存失败，请重试';
    var API_FINISH = '/marketmanage/market/update';
    var API_SALES = '/marketmanage/market/getsales';
    var API_FREIGHT_AREA = '/marketmanage/freight/list';
    var URL_IMG_UPLOAD = '/res/img/upload?scene=item&message={{message}}';
    var API_GET_GPS = "/marketmanage/market/getgps";
    var $offReasonClose = $mod.find(".off-reason-close");
    var $offMemoClose = $mod.find(".off-memo-close");
    var $otherReason = $mod.find(".other-reason");
    var $itemStatus = $mod.find(".item-status");
    /*地图打点图标对象-高亮形式*/
    var imgRsMap = {
        "market": "/static/marketmanage/widget/ui/map/markerIcons/mark_rs1.png",
        "address": "/static/marketmanage/widget/ui/map/markerIcons/mark_rs2.png",
        "sale": "/static/marketmanage/widget/ui/map/markerIcons/mark_rs3.png",
        "driver": "/static/marketmanage/widget/ui/map/markerIcons/mark_rs4.png"
    };
    /*地图打点图标对象-正常形式*/
    var imgBsMap = {
        "market": "/static/marketmanage/widget/ui/map/markerIcons/mark_bs1.png",
        "address": "/static/marketmanage/widget/ui/map/markerIcons/mark_bs2.png",
        "sale": "/static/marketmanage/widget/ui/map/markerIcons/mark_bs3.png",
        "driver": "/static/marketmanage/widget/ui/map/markerIcons/mark_bs4.png"
    };
    var posArr = [{"lng": 19, "lat": 33}, {"lng": 14, "lat": 22}];
    var offSetArr = [{"lng": -10, "lat": -33}, {"lng": -7, "lat": -22}];
    /*位置数组,用于存储批市坐标点*/
    var POLYGON = [];
    /*地推负责人*/
    var TPL_SALES = [
        '<option value="">请选择</option>',
        '{{each list as item}}',
        '<option value="{{item.uid}}" {{if item.uid == selVal}} selected{{/if}}>{{item.admin_name}}</option>',
        '{{/each}}'
    ].join('');
    /*运输区域*/
    var TPL_FREIGHT_AREA = [
        '<option value="">请选择</option>',
        '{{each list as item}}',
        '<option value="{{item.freight_id}}" {{if item.freight_id == selVal}} selected{{/if}}>{{item.name}}</option>',
        '{{/each}}'
    ].join('');
    var validator = null;
    //地图对象
    var markMap = null;
    //异步接口获取的GPS数据
    var GPSDATA = null;
    var marpos = [];
    /**
     * markerList地图上点marker对象的集合
     * {
     *      marker: ,   //超市打点
     *      address: ,  //地址转译点
     *      sale: ,     //销售打点
     *      driver: ,   //司机签收点
     * }
     */
    var markerList = {};
    var initValidator = function () {
        validator = new Validator($mod, {tipEvent: null});
    };
    var initToolTip = function () {
        $('[data-toggle="tooltip"]').tooltip();
    };
    var initImgUploader = function () {
        opts.imgList = opts.imgList || [];
        opts.imgList = opts.imgList.length ? opts.imgList.slice(0, 1) : [];
        ReactDOM.render(
            <PreviewImgUploadList max={1} show={1} preview="medium" uploadURL={URL_IMG_UPLOAD}
                                  fileList={opts.imgList}/>,
            $mod.find('.image-uploader')[0]
        );
    };
    /**
     * 初始化负责人数据列表
     */
    var initCharger = function (response,defaultVal) {
        $mod.find('.charger').html(artTpl.compile(TPL_SALES)({
            list: response.content.salesman_list,
            selVal: defaultVal
        }));
    };
    /**
     * 初始化运输区域数据列表
     */
    var initFreightArea = function (response,defaultVal) {
        $mod.find('.freight-area').html(artTpl.compile(TPL_FREIGHT_AREA)({
            list: response.content,
            selVal: defaultVal
        }));
    };

    /**
     *
     * 地图打点逻辑
     * status 3营业中 4停业
     * flag 1打点正常（相距100米内）
     *
     * 已编辑页面，也就是同步数据status等于3或4时，获取正确的打点坐标，同时隐藏打点状态字段
     * 未编辑页面，异步获取GPS数据，此时判断flag，不为1，则为打点异常，打点状态字段标红，并地图显示多个打点位置
     * flag为1，则打点准确，显示用户注册的点位
     * 保存:如果用户重新打点，也就是marpos有值，则保存marpos；如果用户未打点，获取地图上目前显示的坐标，保存
     *
     */
    /**
     * 初始化地图打点
     */
    var initMap = function () {
        markMap = new Map({
            container: $mod.find('.mark-map'),
            province: opts.regionInfo.length > 0 ? opts.regionInfo[0].name : '',
            city: opts.regionInfo.length > 0 ? opts.regionInfo[1].name : '',
            position: opts.position,
            cursor: "pointer",
            unMarker: true,
            readonly: false
        });
        //地图加载完成后执行的方法
        $(markMap).on('e-map-complete', function () {
            //地图上鼠标是手指
            markMap.map.setDefaultCursor("pointer");
            //获取几个坐标信息
            getGPS();
            //地图上的事件绑定
            mapEvent();
        });
    };

    /**
     * 异步获取地图打点信息
     */
    var getGPS = function () {
        var address_id = helper.queryLocationSearch().address_id;
        $.ajax({
            url: API_GET_GPS,
            data: {address_id: address_id},
            dataType: 'json'
        }).done(function (response) {
            /**
             * 判断打点状态
             * 1.不正确:flag不为1,且之前打过点(即异步获取的real_gps中有值);
             * 2.正确:隐藏打点状态提示
             */
            if (response.content.flag != 1 && !response.content.real_gps.lng) {
                $(".marker-status").val(response.content.msginfo).css("color", "red");
            } else {
                $(".mark-status-item").hide();
            }
            //存储异步请求返回的数据
            GPSDATA = response;
            /**
             * 根据返回的数据在地图上显示点
             * 超市注册点:user_gps
             * 地址转译点:geo_gps
             * 销售打点:sale_gps
             * 司机签收点:tran_gps
             * 正确点位:real_gps
             * 返回数据中,经纬度存在即打点,否则相应按钮为不可选中状态
             */
            //超市注册点
            funMarkMap(response.content.user_gps, 'market');
            //地址转译点
            funMarkMap(response.content.geo_gps, 'address');
            //销售打点
            funMarkMap(response.content.sale_gps, 'sale');
            //司机签收点
            funMarkMap(response.content.tran_gps, 'driver');
            //正确点位
            if (response.content.real_gps.lng) {
                markerList.customer = generateMarker({
                    position: [response.content.real_gps.lng, response.content.real_gps.lat],
                    icon: "http://webapi.amap.com/theme/v1.3/markers/b/mark_rs.png",
                    imageSize : new AMap.Size(19, 33)
                });
                markerList.customer.setzIndex(1000);
            }
            /*疑似批发超市信息*/
            if (response.content.wholesale == 1) {
                var abnormalArea = response.content.wholesale_info;
                $('.register-address-abnormal').parent().show().end().val(abnormalArea.info);
                /*生成一个遮盖物,表示是批市区域*/
                var polygonArr = [];
                var childArr = [];
                $.each(abnormalArea.area[0], function (key, value) {
                    childArr.push(value.lng - 0);
                    childArr.push(value.lat - 0);
                    polygonArr.push(childArr);
                    childArr = [];
                });
                POLYGON = polygonArr;
                abnormalAreaMaker(polygonArr);
                /*生成一个遮盖物,表示是批市区域*/
            } else {
                $('.register-address-abnormal').parent().hide();
            }
            /*疑似批发超市信息*/
            markMap.map.setFitView();
        });

    };
    //地图事件
    var mapEvent = function () {
        //地图鼠标插件,用于在地图上打点
        var mouseTool = new AMap.MouseTool(markMap.map);
        mouseTool.marker({
            icon: new AMap.Icon({
                imageSize: new AMap.Size(19, 33),  //图标所用图片大小
                image: "http://webapi.amap.com/theme/v1.3/markers/b/mark_rs.png"
            }),
            offset: new AMap.Pixel(-10, -31),
            isTop: true,
            zIndex: 1000
        });
        //监听地图上的鼠标方法,操作完成(覆盖物生成后)执行,获取新的点为客服打点
        var markerDraw = AMap.event.addListener(mouseTool, "draw", function (object) {
            if (markerList.customer) {
                markMap.map.remove(markerList.customer);
            }
            markerList.customer = object.obj;
        });
        //获取新打的点的坐标
        markMap.map.on("click", function (e) {
            marpos = [];
            var point = {
                x: e.lnglat.lng,
                y: e.lnglat.lat
            };
            /*判断当前鼠标所点击的点是否在批市范围内*/
            if (windingNumber(point, POLYGON) == 'out') {
                /*打点坐标不在批市范围内,允许打点,存储该点的坐标值*/
                marpos.push(e.lnglat.lng);
                marpos.push(e.lnglat.lat);
            } else {
                /*打点坐标在批市范围内,不允许打点,弹出提示信息,并且清空点的坐标*/
                alert('批市范围内不能打点!');
                marpos = [];
                markMap.map.remove(markerList.customer);
            }
        });
        //鼠标在按钮上移上移出
        $mod.on("mouseover", ".map-legend li", function () {
            //当前按钮为选中状态,且按钮是可点击状态(点位坐标存在)
            var btnObj = $(this).find("button");
            if (!btnObj.attr("select") && !btnObj.attr("disabled")) {
                //按钮添加hover属性
                changeMapStyle(btnObj.addClass, markMap.map.add, markerList, btnObj);
            }
            //鼠标移到不同的按钮上,对应地图上的图标高亮显示
            setMapIcon(markerList, btnObj, posArr[0], offSetArr[0],true);
        });
        $mod.on("mouseout", ".map-legend li", function () {
            //鼠标移出操作
            var btnObj = $(this).find("button");
            if (!btnObj.attr("select")) {
                changeMapStyle(btnObj.removeClass, markMap.map.remove, markerList, btnObj);
            }
            setMapIcon(markerList, btnObj, posArr[1], offSetArr[1],false);
        });
        //button点击事件
        $mod.on("click", ".map-legend li button", function () {
            var btnObj = $(this);
            if (btnObj.attr("select")) {
                btnObj.removeAttr("select");
                btnObj.removeClass("btn-primary");
                if (btnObj.hasClass("market") && markerList.market) {
                    markMap.map.remove(markerList.market);
                } else if (btnObj.hasClass("address") && markerList.address) {
                    markMap.map.remove(markerList.address);
                } else if (btnObj.hasClass("sale") && markerList.sale) {
                    markMap.map.remove(markerList.sale);
                } else if (btnObj.hasClass("driver") && markerList.driver) {
                    markMap.map.remove(markerList.driver);
                }
            } else {
                btnObj.attr("select", "true");
                btnObj.addClass("btn-primary");
                if (btnObj.hasClass("market") && markerList.market) {
                    markMap.map.add(markerList.market);
                } else if (btnObj.hasClass("address") && markerList.address) {
                    markMap.map.add(markerList.address);
                } else if (btnObj.hasClass("sale") && markerList.sale) {
                    markMap.map.add(markerList.sale);
                } else if (btnObj.hasClass("driver") && markerList.driver) {
                    markMap.map.add(markerList.driver);
                }
            }
            markMap.map.setFitView();
        });
    };

    //生成覆盖物marker
    var generateMarker = function (opts) {
        var marker = new AMap.Marker({
            draggable: false,
            cursor: 'hand',
            map: markMap.map,
            raiseOnDrag: true,
            offset: new AMap.Pixel(-7, -22),
            position: opts.position,
            topWhenMouseOver: true,
            //content: opts.content,
            icon: new AMap.Icon({
                imageSize: opts.imageSize || new AMap.Size(14, 22),  //图标所用图片大小
                image: opts.icon
            }),
            clickable: false,
            zIndex: 100,
            isTop: false
        });
        return marker;
    };
    /**
     * @description 绘制多边形的遮罩物,区域内表示疑似批市
     * @param {Array} opts 坐标数组
     *
     **/
    var abnormalAreaMaker = function (opts) {
        var polygon = new AMap.Polygon({
            path: opts,//设置多边形边界路径
            strokeColor: "#ee2200", //线颜色
            strokeOpacity: 0.2, //线透明度
            strokeWeight: 3,    //线宽
            clickable: false,
            fillColor: "#ee2200", //填充色
            fillOpacity: 0.35//填充透明度
        });
        polygon.setMap(markMap.map);
    };

    /**
     * @description 回转数法判断点是否在多边形内部
     * @param {Object} p 待判断的点，格式：{ x: X坐标, y: Y坐标 }
     * @param {Array} poly 多边形顶点，数组成员的格式同 p
     * @return {String} 点 p 和多边形 poly 的几何关系
     */
    function windingNumber(p, poly) {
        var px = p.x,
            py = p.y,
            sum = 0;
        for (var i = 0, l = poly.length, j = l - 1; i < l; j = i, i++) {
            var sx = poly[i].lng,
                sy = poly[i].lat,
                tx = poly[j].lng,
                ty = poly[j].lat;
            // 点与多边形顶点重合或在多边形的边上
            if ((sx - px) * (px - tx) >= 0 && (sy - py) * (py - ty) >= 0 && (px - sx) * (ty - sy) === (py - sy) * (tx - sx)) {
                return 'on';
            }
            // 点与相邻顶点连线的夹角
            var angle = Math.atan2(sy - py, sx - px) - Math.atan2(ty - py, tx - px);
            // 确保夹角不超出取值范围（-π 到 π）
            if (angle >= Math.PI) {
                angle = angle - Math.PI * 2;
            } else if (angle <= -Math.PI) {
                angle = angle + Math.PI * 2;
            }
            sum += angle;
        }
        // 计算回转数并判断点和多边形的几何关系
        return Math.round(sum / Math.PI) === 0 ? 'out' : 'in';
    }

    /**
     * @description 绘制打点数据方法
     * @param {Object} content --- 数据点坐标
     * @param {String} source  --- 数据点类型
     * */
    function funMarkMap(content, source) {
        if (content.lng) {
            markerList[source] = generateMarker({
                position: [content.lng, content.lat],
                icon: imgBsMap[source]
            });
            markMap.map.add(markerList[source]);
            $("." + source).attr("select", "true").addClass("btn-primary");
        } else {
            $("." + source).attr("disabled", "true");
        }
    }

    /**
     *  @description 修改按钮的样式,当鼠标移入的时候,添加btn-hover样式,当鼠标
     *               移出的时候移除掉btn-hover样式;
     *
     *  @param {function} changeStyle 添加或是移除样式的回调函数
     *  @param {function} changeMap  添加或事删除地图数据点的回调函数
     *  @param {Object} markerList 绘制地图的对象
     *  @param {Object} btnObj 按钮对象
     */
    function changeMapStyle(changeStyle,changeMap,markerList,btnObj) {
        if (!btnObj.hasClass("btn-primary")) {
            changeStyle("btn-hover");
        }
        $.each(markerList,function(key,value) {
            if(btnObj.hasClass(key) && value){
                changeMap(value);
            }
        });
    }


    /**
     *  @description 修改地图的Icon样式
     *  @param {Object} posObj 位置坐标
     *  @param {Object} offObj 偏移坐标
     *  @param {Object} markerList 绘制地图的对象
     *  @param {Object} btnObj 按钮对象
     *  @param {Boolean} flag 标记对象,用于判断读取高亮图标对象还是正常图标对象
     */
    function setMapIcon(markerList, btnObj, posObj, offObj,flag) {
        var imgMap = flag?imgRsMap:imgBsMap;
        $.each(markerList, function (key, value) {
            if (btnObj.hasClass(key) && value) {
                value.setIcon(new AMap.Icon({
                    image: imgMap[key],
                    imageSize: new AMap.Size(posObj.lng, posObj.lat)
                }));
                value.setOffset(new AMap.Pixel(offObj.lng, offObj.lat));
            }
        });
    }

    /**
     *  @description 抽象出ajax 方法
     *  @param {function} syncParam  回调函数
     *  @param {Object} syncParam ajax对象需要的参数,主要有URL,params和type
     *  @param {Object} renderData 回调函数参数,如果不需要则不传递该参数,调用回调函数的时候需要进行判断
     */
    function syncData(syncParam,callback,renderData) {
        // body...
        $.ajax({
            url: syncParam.url,
            data: syncParam.params,
            dataType: 'json',
            type: syncParam.type
        }).done(function (response) {
            if (response && response.ret === 0) {
                if(renderData){
                    callback(response,renderData);
                }else{
                    callback(response);
                }
            }
        }).fail(function(){
            alert(response.msg || MSG_FAIL);
        });
    }
    /**
     *
     */
    var initRegion = function () {
        var defaults = [];
        var regionInfo = opts.regionInfo;
        $.each(regionInfo, function (k, v) {
            defaults.push(v.rid);
        });
        appendRegion(4, defaults);
    };
    /**
     *
     */
    var appendRegion = function (type, defaults) {
        defaults = defaults || [];
        regionSelect = $mod.find('.region-select');
        ReactDOM.render(
            <Regions defaultValues={defaults} num={type}/>,
            regionSelect[0]
        );
    };
    /**
     * 初始化片区数据列表
     */
    var init = function () {
        initRegion();
        var areaInfo = opts.area_info;
        var chargerInfo = opts.charger_info;
        var freightInfo = opts.freight_info;
        if (areaInfo && areaInfo.rid && areaInfo.rid.length) {
            var chargerParam = {
                url : API_SALES,
                params : {
                    rid : areaInfo.rid
                },
                type : 'GET'
            };
            syncData(chargerParam,initCharger,chargerInfo);
            var freightAreaParam = {
                url : API_FREIGHT_AREA,
                params : {
                    rid : areaInfo.rid
                },
                type : 'GET'
            };
            syncData(freightAreaParam,initFreightArea,freightInfo);
        }
        initValidator();
        initImgUploader();
        bindEvent();
        initMap();
        initToolTip();
        offReasonCloseShow($itemStatus);
    };

    /**
     * 获取可编辑状态表单值
     */
    var gatherData = function () {
        var data = {};
        var regions = $mod.find('.search-item');
        $mod.find('.field-control[name]').each(function (k, v) {
            data[v.name] = v.value;
        });
        regions.length && (data['rid'] = regions[regions.length - 1].value);
        //var position = markMap.getMarkPos();
        data['emerg_cellphone'] = $(".emerg-cellphone").val();
        data['telephone'] = $(".telephone").val();
        // 当进行过打点操作，将提交新打点的坐标，否则提交原有坐标
        /**
         * 获取坐标逻辑
         * 1.如果打过点,传新打的点坐标
         * 2.没打新点,原来有real_pos,则传原有real_pos
         * 3.没打新点,原来没有real_pos,则传原有user_gps
         * 4.打点不合格,且没有正确的地址,则提示需要重新打点
         *
         */
        if (marpos && marpos.length > 0) {
            data['position'] = {
                lng: marpos[0],
                lat: marpos[1]
            };
        } else {
            if (GPSDATA.content.flag != 1 && !GPSDATA.content.real_gps.lng) {
                alert("请打点!");
                return false;
            } else {
                if (GPSDATA.content.real_gps.lng) {
                    data['position'] = {
                        lng: GPSDATA.content.real_gps.lng,
                        lat: GPSDATA.content.real_gps.lat
                    };
                } else {
                    data['position'] = {
                        lng: GPSDATA.content.user_gps.lng,
                        lat: GPSDATA.content.user_gps.lat
                    };
                }
            }
        }
        data['img_list'] = [];
        $mod.find('.file-id').each(function (k, v) {
            v.value.length && data['img_list'].push(v.value);
        });
        if (data['img_list'].length == 0) {
            data['img_list[]'] = '';
        }
        //停业原因，0没有停业过,保存时不改变停业原因
        if (opts.closed_remark_flag == 0 && $itemStatus.val() == 3) {
            data['closed_remark_flag'] = '0';
        }
        //大车限行  勾选时下发参数1  不够选时下发参数2
        data['trans_limit'] = '2';
        var transLimit = $('#car_limit').is(':checked');
        if (transLimit == true) {
            data['trans_limit'] = '1';
            
        }
        return data;
    };
    /**
     * 点击完成，保存数据
     */
    var save = function () {
        alert(MSG_SUC);
        window.location.href = window.location.href.replace('/edit', '/view');
    };

    /**
     * 点击取消跳转到view页
     */
    var cancel = function () {
        window.location.href = window.location.href.replace('/edit', '/view');
    };

    function offReasonCloseShow($this) {
        if ($this.val() == 4) {
            //停业+其他
            $offReasonClose.show();
            $offReasonClose.find('.off-reason').attr("required",'required');
            if ($mod.find(".off-reason").val() == 4) {
                $offMemoClose.show();
                $otherReason.attr("required",'required');
            } else {
                $offMemoClose.hide();
                $otherReason.removeAttr("required");
            }
        } else {
            $offReasonClose.hide();
            $offReasonClose.find('.off-reason').removeAttr("required");
            $offMemoClose.hide();
            $otherReason.removeAttr("required");
        }
    }

    function offMemoCloseShow($this) {
        if ($this.val() == "4") {
            $offMemoClose.show();
            $otherReason.attr("required",'required');
        } else {
            $offMemoClose.hide();
            $otherReason.removeAttr("required");
        }
    }

    var bindEvent = function () {
        $mod.find('.mod-btn-bar')
            .on('e-btnbar-save', function () {
                if (validator.validateUntilError()) {
                    if (marpos && marpos.length > 0 || opts.data_info.status == 3 || opts.data_info.status == 4) {
                        var syncParam = {
                            url : API_FINISH,
                            params : gatherData(),
                            type : 'POST'
                        };
                        syncData(syncParam,save);
                    } else {
                        alert("保存失败，请标注超市位置");
                    }
                }
            }).on('e-btnbar-cancel', function () {
                cancel();
            });
        validator.eventCenter
            .on('e-validate-region', function (e, data) {
                var def = data.def;
                var regions = data.target.find('.search-item');
                if (regions.length == 4 && regions[4 - 1].value != -10000) {
                    def.resolve();
                } else {
                    def.reject();
                }
            })
            .on('validator-error', function (e, data) {
                Log.send(data.log);
            });
        $mod.on('change', 'select[data-index=4]', function () {
            var val = $(this).val();
            var chargerParam = {
                url : API_SALES,
                params : {
                    rid : val
                },
                type : 'GET'
            };
            syncData(chargerParam,initCharger);
            var freightAreaParam = {
                url : API_FREIGHT_AREA,
                params : {
                    rid : val
                },
                type : 'GET'
            };
            syncData(freightAreaParam,initFreightArea);
            /*initCharger(val);
            initFreightArea(val);*/
        }).on('change', '.item-status', function () {
            offReasonCloseShow($(this));
        }).on('change', '.off-reason', function () {
            offMemoCloseShow($(this));
        });
    };
    /**
     * 初始化入口
     */
    init();
};

module.exports = action;