var jQuery = $ = require( 'common:widget/ui/jquery/jquery.js' );
var T = require( 'common:widget/ui/tpl/tpl.js' );

/**
 * 地域选择组件
 *
 * 使用方式
 * regionSelect( {
 *    region: 非必填,已含有区域信息时必填
 *    $mod: 必填,调用本组件的模块dom对象
 *    url: 必填,获取地区列表的接口
 * } );
 *
 */

//参数region的数据数据格式
//var region = [
//    {
//        name: "北京市",
//        rid: "11",
//        fid: "0",
//        level: "1",
//        is_open: "1"
//    },
//    {
//        name: "市辖区",
//        rid: "1101",
//        fid: "11",
//        level: "2",
//        is_open: "1"
//    },
//    {
//        name: "东城区",
//        rid: "110101",
//        fid: "1101",
//        level: "3",
//        is_open: "1"
//    },
//    {
//        name: "广渠门",
//        rid: "11010113",
//        fid: "110101",
//        level: "4",
//        is_open: "1"
//    }
//];

var TPL = [
    '<select class="field-control region region-level-{{level}}" level="{{level}}">',
        '<option value="">请选择</option>',
        '{{if list && listLen>0}}',
            '{{each list as item}}',
                '<option value={{item.rid}}{{if item.rid == selVal}} selected{{/if}}>{{item.name}}</option>',
            '{{/each}}',
        '{{/if}}',
    '</select>'
].join( '' );
var OPTION = [
    '<option value="">请选择</option>',
    '{{if list && listLen>0}}',
        '{{each list as item}}',
            '<option value={{item.rid}}{{if item.rid == selVal}} selected{{/if}}>{{item.name}}</option>',
        '{{/each}}',
    '{{/if}}'
].join('');

var regionSelect = function ( opts ) {

    region = opts.region || null;

    var $regionSelect = opts.$mod.find( '.region-select' ) || $( '.region-select' );

    if ( $.isArray( region ) && region.length ) {
        $.each(region,function(){
            var self = this;
            //先显示出来
            genarateSelect([self],self.rid);
            //再重绘下拉中的内容
            $.ajax( {
                url: opts.url,
                data: { fid: self.fid },
                dataType: 'json',
                type: 'POST',
                error: function(){
                    alert("请求失败!");
                }
            } ).done(function(response){
                if(response && !response.msg){
                    var list = response.content.list;
                    var dom = ".region-level-"+self.level;
                    if( $.isArray(list) && list.length>0){
                        //为避免出现重复项,先清空原有的下拉框中的选项,再填充改层级所有选项
                        $(dom ).html("").append( T.compile( OPTION )( {
                            listLen: list.length,
                            list: list,
                            selVal: self.rid
                        } ) );
                    }
                }else{
                    alert(response.msg);
                }
            });
        })
    }else{
        initArea( { fid: 0 } );
    }

    /**
     * 初始化
     * 根据{ fid: fid }传入的上层id,生成新的筛选列表
     * curlevel为当前点击的层级,用于清除该层级后面的下拉框
     */
    function initArea( data,curlevel ) {
        $.ajax( {
            url: opts.url,
            data: data,
            dataType: 'json',
            type: 'POST'
        } ).done( function ( response ) {

            if ( response && response.ret === 0 ) {

                //新的可选择的地址列表
                var list = response.content.list;

                //目前页面上已经存在的地址选择框
                var domList = $( 'select.region' );

                //当前所选择的层级
                var level = curlevel;

                //更换所选地址后,后面的地址筛选框需要重置
                $.each( domList, function ( k, v ) {
                    if ( k >= level ) {
                        v.remove();
                    }
                } );

                //如果接口回传有新的列表则生成新的下拉框
                if( $.isArray(list) && list.length>0){
                    genarateSelect( list, list[ 0 ].fid );
                }

            }

        } );

    }

    //生成下拉框
    function genarateSelect( list, fid ) {
        $regionSelect.append( T.compile( TPL )( {
            level: list[ 0 ].level,
            listLen: list.length,
            list: list,
            selVal: fid
        } ) );

    }
    //下拉框每次更新选项,自动生成后续的子级下拉框
    $regionSelect.on( 'change', 'select.region', function () {
        initArea( { fid: $( this ).val() },$( this ).attr('level') );
    } );


};

module.exports = regionSelect;
