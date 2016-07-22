var jQuery = $ = require( 'common:widget/ui/jquery/jquery.js' );
var helper = require( 'common:widget/ui/helper/helper.js' );
var Search = require( 'common:widget/ui/search/search.js' );
var Tables = require( 'common:widget/ui/tables/tables.js' );
var modal = require( 'common:widget/ui/custom-modal/custom-modal.js' );
var T = require( 'common:widget/ui/tpl/tpl.js' );
var Alert = require( 'common:widget/ui/alert/alert.js' );
require( 'common:widget/ui/date/date.js' );

var $mod = $( '.mod-transbill-list' );
var SHIPLIST = '/order/transbill/getshiplist';
var UPDATEMONEY = '/order/transbill/updatemoney';
var UPDATEORDER = '/order/transbill/move';
var EXIST = '/order/transbill/exist';
var EXPORT = '/order/transbill/export';
var COULDMOVE = false;
var tpls = {
    "orderList": [
        '<div class="order-list-head"><span>订单号</span><span>物美运单号</span></div>',
            '<ul class="order-list">',
                '{{each orders as order}}',
                    '<li> <input type="checkbox" class="order-item" id="{{order.shipping_id}}"> <span class="order-id">{{order.order_id}}</span><span class="waybill-no">{{order.waybill_no}}</span></li>',
                '{{/each}}',
            '</ul>',
        '<div class="order-list-foot"><input type="checkbox" class="select-all"> 全选</div>'
    ].join( '' )
};

var transbill = function () {

    var init = function () {
        this.selectAll = false;
        bindEvent();
    };

    var search = Search( [
        {
            "type": "timeRange",
            "key": {
                "begin": "date_begin",
                "end": "date_end"
            },
            "placeholder": {
                "begin": "开始时间",
                "end": "结束时间"
            }
        },
        {
            "type": "input",
            "key": "waybill_no",
            "placeholder": "按物美运单号搜索"
        },
        {
            "type": "input",
            "key": "q",
            "placeholder": "按链商运单号/司机/电话搜索"
        }
    ], $mod.find( ".search" ));

    //表格
    Tables( {
        queryParams: search.get( "getkeys" ),
        filters: {
            "setShippingCount": {
                key: "shipping_id_count",
                helper: function ( content ) {
                    if ( content == 0 ) {
                        return "0";
                    }else{
                        return content;
                    }
                }
            },
            "setWaybillCount": {
                key: "waybill_no_count",
                helper: function ( content ) {
                    if ( content == 0 ) {
                        return "0";
                    }else{
                        return content;
                    }
                }
            },
            "setWaybillNo": {
                key: "waybill_no",
                helper: function ( content ) {
                    if ( $.isArray(content) && content.length>0 ) {
                        return content.join('<br>');
                    }else{
                        return  "---";
                    }
                }
            },
            "setTime": {
                key: "created_at",
                helper: function ( content ) {
                    if ( content ) {
                        var newDate = new Date( content * 1000 );
                        return Date.format( newDate, "yyyy-MM-dd hh:mm:ss" );
                    } else {
                        return "---"
                    }
                }
            },
            "setOperation": {
                key: "operation",
                helper: function ( content, data ) {
                    var resul = [
                        '<a class="modify-waybill" waybill="' + data.waybill_no + '" transbill="' + data.trans_bill_id + '">调整运单</a>',
                        '<a href="/order/transbill/view?trans_bill_id=' + data.trans_bill_id + '" >详情</a>',
                        '<a class="modify-money" waybillID="' + data.waybill_no + '" transbill="' + data.trans_bill_id + '" transMoney="'+data.trans_money+'">修改运费</a><br>',
                        '<a href="/order/transbill/brview?trans_bill_id=' + data.trans_bill_id + '" >订单修改记录</a>',
                        '<a href="/order/transbill/mrview?trans_bill_id=' + data.trans_bill_id + '" >运费修改记录</a>'
                    ].join( '' );
                    return resul;
                }
            }
        },
        pages: {
            size: 12,
            onload: function ( response ) {
                $( ".waybill-money span" ).html( response.content.totalmoney ? response.content.totalmoney : 0 );
            }
        }
    }, $mod.find( ".tables" ) );

    // 调整运单摸态框
    var mdlwaybill = new modal( {
        uid: 'waybill',
        title: '调整运单',
        tpl: {
            header: [
                '<div class="modal-waybill-title"><span class="transbill">当前链商运单号: <em></em></span><span class="waybill">当前物美运单号: <em></em></span></div>',
                '<div class="field-group ">',
                '<input type="text" placeholder="添加目标链商运单号" class="aim-transbill">',
                '<span class="search-error undefined-error">目标运单不存在</span>',
                '<span class="search-error same-error">目标运单不能与当前运单相同</span>',
                '</div>'
            ].join( '' ),
            body: [
                '<div class="field-group waybill-body ">',

                '</div>'
            ].join( '' ),
            footer: [
                '<button class="cancel btn btn-default btn-lg" data-dismiss="modal">取消</button>',
                '<button class="submit btn btn-primary btn-lg">确定</button>'
            ].join( "" )
        }
    } ).render();


    // 修改运费摸态框
    var mdlmoney = new modal( {
        uid: 'money',
        title: '修改运费',
        tpl: {
            body: [
                '<div class="field-group ">',
                '<span><input type="radio" name="waybill-money" value="527.86" class="radio-money one"> 527.86</span>',
                '<span><input type="radio" name="waybill-money" value="300.00" class="radio-money two"> 300.00</span>',
                '<span><input type="radio" name="waybill-money" value="0.00" class="radio-money three"> 0.00</span>',
                '<span><input type="text" placeholder="其他费用" class="input-money"><span class="money-error">请输入正确金额</span></span>',
                '<input type="hidden" class="last-money">',
                '</div>'
            ].join( '' ),
            footer: [
                '<button class="cancel btn btn-default btn-lg" data-dismiss="modal">取消</button>',
                '<button class="submit btn btn-primary btn-lg">确定</button>'
            ].join( "" )
        }
    } ).render();


    var bindEvent = function () {


        //调整运费时,需要传递的参数
        var moneyParams = {};

        //调整运单按钮点击操作,获取当前链商运单下的订单,生成调整模板
        $mod.on( 'click', '.modify-waybill', function () {
            var that = this;
            var params = { trans_bill_id: $( this ).attr( "transbill" ) };
            $(".aim-transbill").val("");
            $(".search-error" ).hide();
            $.ajax( {
                url: SHIPLIST,
                data: params,
                dataType: "json",
                type: "POST",
                error: function () {
                    Alert.show("请求失败!");
                }
            } ).done(function(response){
                console.log( response );
                //调整运单时,当前链商运单下的订单
                var orders = response.content.list;
                //订单列表模板
                var orderList = T.compile( tpls.orderList )( { orders: orders } );
                //显示整个调整运单模板
                mdlwaybill.show();
                //全选订单关闭
                that.selectAll = false;
                //当前链商运单对应的物美运单
                var waybill = $( that ).attr( "waybill" ).split(',' ).join('<br>');
                //将模板中所需显示的链商运单,物美运单,订单列表填充进调整运单模板
                $( ".transbill em" ).html( $( that ).attr( "transbill" ) );
                $( ".waybill em" ).html( waybill );
                $( ".waybill-body" ).html( orderList );
                //绑定运单调整中订单操作相关方法
                orderListOpera();
            });

        } )
        //调整运费按钮点击操作,
        .on( 'click', '.modify-money', function () {
            //当前运费
            var transMoney = $( this ).attr( "transMoney" );
            //其他费用输入框
            var inputMoney = $( ".input-money" );
            //隐藏的用于获取最终选择或者填充的运费输入框
            var lastMoney = $( ".last-money" );
            //显示运费调整模板
            mdlmoney.show();
            //调整运费时,需要参数trans_bill_id(链商运单号)
            moneyParams["trans_bill_id"] = $( this ).attr( "transbill" );
            //根据当前的运费,初始化运费调整模板
            if(transMoney==527.86){
                $("input.one").prop("checked","checked");
                inputMoney.val( "" );
                lastMoney.val( 527.86 );
            }else if(transMoney==300){
                $("input.two").prop("checked","checked");
                inputMoney.val( "" );
                lastMoney.val( 300 );
            }else if(transMoney==0){
                $("input.three").prop("checked","checked");
                inputMoney.val( "" );
                lastMoney.val( 0 );
            }else{
                inputMoney.val( transMoney );
                lastMoney.val( transMoney );
            }

        } )
        //导出功能
        .on( 'click', '.export', function () {
            window.location.href = EXPORT+'?'+$.param(helper.queryLocationSearch());
        } );
        //调整运单时,每次目标运单的输入都需要验证两种情况
        //1.目标运单是否与当前运单相同
        //2.目前运单是否存在
        $( '.modal-waybill .aim-transbill' ).on('keyup',function(){
            //当前运单
            var nowTransbill = $(".transbill em" ).html();
            //目标运单
            var aimTransbill = $(this ).val();
            //1.目标运单是否与当前运单相同,提示相同错误信息
            if(nowTransbill == aimTransbill){
                $(".same-error" ).show();
            }else{
                //2.目前运单是否存在,
                // {
                //      1.不存在,提示不存在信息
                //      2.存在,将可以移动的参数设置为true
                // }
                console.log("aimTransbill");
                console.log(aimTransbill);
                $.ajax( {
                    url: EXIST,
                    data: {trans_bill_id:aimTransbill },
                    dataType: "json",
                    type: "POST",
                    success: function(response){
                        if(response.content.exist){
                            COULDMOVE = true;
                        }else{
                            COULDMOVE = false;
                            $(".undefined-error" ).show();
                        }
                    },
                    error: function () {
                        Alert.show("请求失败!");
                    }
                } );
            }

        })
        //输入时隐藏目标运单的校验错误提示信息
        .on('keydown',function(){
            $(".same-error" ).hide();
            $(".undefined-error" ).hide();
        });

        //调整运单后,提交操作
        $( '.modal-waybill' ).on( 'click', '.submit', function () {
            //原链商运单号
            var transBillNo = $(".modal-waybill .transbill em" ).html();
            //目标链商运单号
            var aimTransBillNo = $(".modal-waybill .aim-transbill" ).val();
            //要移动的订单列表
            var shipList = [];
            //移动接口所需参数
            var data = {};
            data["src_trans_bill_id"] = transBillNo;
            data["dst_trans_bill_id"] = aimTransBillNo;
            //再次校验目标运单是否为空
            if(!aimTransBillNo){
                Alert.show("请填写目标链商运单!");
                return ;
            }
            //根据所选,获取需要移动的订单id
            $.each($(".order-item"),function(){
                var $this = $(this);
                if($this.prop("checked")){
                    shipList.push($this.attr("id"));
                }
            });

            if(!shipList.length>0){
                Alert.show("请选择要调整的订单!");
                return ;
            }else{
                data["shipping_id"] = shipList;
            }

            if(COULDMOVE){
                console.log("移动了");
                console.log(data);
                $.ajax( {
                    url: UPDATEORDER,
                    data: data,
                    dataType: "json",
                    type: "POST",
                    success: function(response){
                        console.log(response);
                        if(response && !response.msg){
                            mdlwaybill.hide();
                            Alert.show( shipList.length+'个订单已成功转移至运单'+aimTransBillNo, function () {
                                window.location.reload();
                            } );
                        }else{
                            Alert.show(response.msg);
                        }

                    },
                    error: function () {
                        Alert.show("请求失败!");
                    }
                } );
            }else{
                Alert.show("请输入正确的目标运单号!");
            }

        });

        //存取选择或者输入金额的文本框,每次选择金额或者输入金额,会将最终确认金额存入此文本框
        var $lastMoney = $( ".last-money" );
        //调整运费后提交操作
        $( '.modal-money' ).on( 'click', '.submit', function () {
            if ( $lastMoney.val() ) {
                moneyParams[ "trans_money" ] = $lastMoney.val();
                mdlmoney.hide();
                $.ajax( {
                    url: UPDATEMONEY,
                    data: moneyParams,
                    dataType: "json",
                    type: "POST",
                    success: function ( response ) {
                        if(response && !response.msg){
                            Alert.show( '修改成功', function () {
                                window.location.reload();
                            } );
                        }else{
                            Alert.show(response.msg);
                        }
                    },
                    error: function ( ) {
                        Alert.show("请求失败!");
                    }
                } );
            }else{
                alert("请选择或输入金额!");
            }
        } )
        //选择金额时,将选择金额存起来,同时清空输入其他金额文版框的内容
        .on( 'click', '.radio-money', function () {
            var money = $( this ).val();
            $lastMoney.val( money );
            $( ".input-money" ).val( "" );
        } )
        //输入其他金额时
        //{
        //  1.输入格式正确,将输入金额存储,同时清除金额radio的选中属性
        //  2.输入格式不正确,提示错误格式提示信息,清空缓存的金额
        // }
        .on( 'keyup', '.input-money', function () {
            if(/^\d+.?\d{0,2}$/.test($( this ).val())){
                $lastMoney.val( $( this ).val() );
                $(".radio-money" ).each(function(){
                    $(this ).prop('checked',false);
                });
                $(".money-error" ).hide();
            }else{
                $(".money-error" ).show();
                $lastMoney.val("");
            }

        } );

    };

    //调整运单模态框,订单列表的选择操作
    // {
    //  1.全选及反选
    //  2.单选
    // }
    var orderListOpera = function(){
        var that = this;
        //全选及反选操作:点击全选,所有订单置为选中状态;反选,取消所有订单的选中状态
        $( ".select-all" ).on( 'click', function () {
            if ( that.selectAll ) {
                $( ".order-item" ).each( function () {
                    $( this ).prop( "checked", false );
                } );
                that.selectAll = false;
            } else {
                $( ".order-item" ).each( function () {
                    $( this ).prop( "checked", true );
                } );
                that.selectAll = true;
            }
        } );

        //在订单列表中单选达到全选状态,或者取消全选
        $( ".order-item" ).on( 'click', function () {
            if ( !$( this ).prop( "checked" ) ) {
                that.selectAll = false;
                $( ".select-all" ).prop( "checked", false );
            } else {
                that.selectAll = true;
                $( ".order-item" ).each( function () {
                    if ( !$( this ).prop( "checked" ) ) {
                        that.selectAll = false;
                    }
                } );
                if ( that.selectAll ) {
                    $( ".select-all" ).prop( "checked", true );
                }
            }
        } );
    };

    init();
};
module.exports = transbill;