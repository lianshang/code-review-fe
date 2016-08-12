<%require name="common:widget/css-base/src/form.less"%>
<%$info = $tplData.content%>
<%$bread_crumb = [ [ "name" => "全部超市列表", "url" => "/marketmanage/market/list" ], [ "name" => "超市信息", "url" => "" ] ]%>
<%$btn_bar = [ [ "name" => "完成", "type" => "save", "url" => "" ], [ "name" => "取消", "type" => "cancel", "url" => "" ] ]%>
<%$status_list = [ "1" => "未审核", "2" => "审核通过", "3" => "营业中", "4" => "停业", "5" => "审核未通过" ]%>
<%$county_info = $info.region[2]%>
<%$area_info = $info.region[3]%>

<%strip%>
<div class="mod-market-edit">
    <%widget name="common:widget/bread-crumb/bread-crumb.tpl" data=$bread_crumb%>
    <%widget name="common:widget/btn-bar/btn-bar.tpl" data=$btn_bar%>
    <div class="market-info">
        <div class="field-group">
            <label class="field-label">超市名称</label>
            <input class="field-control" value="<%$info.market_name|default:'— —'|escape%>" name="market_name"/>
        </div>
        <div class="image-zoom-container"></div>
        <div class="main">
                <input class="field-control" type="hidden" name="address_id" value="<%$info.address_id|default:'— —'%>" />
            <div class="field-group">
                <label class="field-label">邀请联系人</label>
                <input class="field-control" value="<%$info.invite_name|default:'— —'|escape%>" readonly/>
            </div>
            <div class="field-group">
                <label class="field-label">邀请码</label>
                <input class="field-control" value="<%$info.invite_code|default:'— —'|escape%>" readonly/>
            </div>
            <div class="field-group">
                <label class="field-label">会员账号</label>
                <input class="field-control" value="<%$info.cellphone|default:'— —'|escape%>" readonly/>
            </div>
            <div class="field-group">
                <label class="field-label">注册时间</label>
                <input class="field-control" value="<%$info.created_at|date_format:'%Y-%m-%d %H:%M:%S'|escape|default:'— —'%>" readonly/>
            </div>
            <div class="field-group">
                <label class="field-label">联系人</label>
                <input class="field-control" value="<%$info.contact_name|default:'— —'|escape%>" readonly/>
            </div>
            <div class="field-group">
                <label class="field-label">联系方式</label>
                <input class="field-control" value="<%$info.contact_phone|default:'— —'|escape%>" readonly/>
            </div>
            <div class="field-group">
                <label class="field-label">紧急联系人</label>
                <input class="field-control emerg-cellphone" value="<%$info.emerg_cellphone|default:''|escape%>" />
            </div>
            <div class="field-group">
                <label class="field-label">座机号码</label>
                <input class="field-control telephone" value="<%$info.telephone|default:''|escape%>" />
            </div>
            <div class="field-group">
                <label class="field-label">地址</label>
                <input class="field-control" name="address" value="<%$info.address|default:'— —'|escape%>" required empty="请输入地址"/>
            </div>
            <div class="field-group">
                <label class="field-label">状态</label>
                <select class="field-control item-status" name="status" required empty="请输入状态">
                    <option value="">请选择</option>
                    <%foreach $status_list as $item%>
                        <%if $item@key == 3 || $item@key == 4 || ($item@key == $info.status && $info.status != 1)%>
                                <%if $item@key != "5"%>
                                    <option value="<%$item@key%>"<%if $info.status == "<%$item@key%>"%> selected<%/if%>><%$item%></option>
                                <%/if%>                        
                        <%/if%>
                    <%/foreach%>
                </select>
                <span class="field-msg"></span>
            </div>
            <div class="field-group off-reason-close hide">
                <label class="field-label">停业原因</label>
                <select class="field-control off-reason" name="closed_remark_flag" >
                    <option value="">请选择</option>
                    <%foreach $info.close_options as $reason%>
                        <option value="<%$reason@key%>"<%if $info.status=='4' && $info.closed_remark_flag == "<%$reason@key%>"%> selected<%/if%>><%$reason|escape%></option>
                    <%/foreach%>
                </select>
                <span class="field-msg"></span>
            </div>
            <div class="field-group off-memo-close hide">
                <label class="field-label">原因备注</label>
                <textarea rows="3" cols="20" class="field-control other-reason hide" required empty="停业备注不能为空" name="closed_remark_info"><%$info.closed_remark_info%></textarea>
                <span class="field-msg"></span>
            </div>
            <div class="field-group">
                <label class="field-label">区域</label>
                <span class="region-select" validate custom="e-validate-region" cmsg="请输入区域信息"></span>
                <span class="field-msg"></span>
            </div>
            <%*
            <div class="field-group">
                <label class="field-label">区域</label>
                <input class="field-control" value="<%if $info.region[0] || $info.region[1] || $info.region[2]%><%$info.region[0].name|escape%>-<%$info.region[1].name|escape%>-<%$info.region[2].name|escape%><%else%>- -<%/if%>" readonly/>
            </div>
            <div class="field-group">
                <label class="field-label">片区</label>
                <select class="field-control area" name="rid" required empty="请输入片区">
                </select>
                <span class="field-msg"></span>
            </div>
            *%>
            <div class="field-group">
                <label class="field-label">运输区域</label>
                <select class="field-control freight-area" name="freight_id" required empty="请输入运输区域"></select>
                <span class="field-msg"></span>
            </div>
            <div class="field-group">
                <label class="field-label">地推负责人</label>
                <select class="field-control charger" name="uid" required empty="请输入地推负责人"></select>
                <span class="field-msg"></span>
            </div>
            <div class="field-group hide">
                <label class="field-label">注册点异常</label>
                <input class="field-control  register-address-abnormal" value="" readonly />
            </div>
            <%if $info.anti_cheat%>
            <div class="field-group">
                <label class="field-label">疑似作弊</label>
                <span class="">
                    <%foreach $info.anti_cheat.cheat_market as $item %>
                        &nbsp;&nbsp;<a href="/marketmanage/market/view?status=3&address_id=<%$item%>" target="_blank">查看疑似作弊超市<%$item@key+1%></a>&nbsp;&nbsp;
                    <%/foreach%>
                </span><!--放置疑似作弊超市的链接-->
            </div>
            <%/if%>
            <div class="field-group">
                <label class="field-label">地址备注</label>
                <span class="">
                    &nbsp;&nbsp;<input type="checkbox" id="car_limit"  <%if $info.trans_limit=='1'%>checked<%/if%> />&nbsp;&nbsp;<label for="car_limit">大车限行</label>
                </span>
            </div>
            <div class="field-group mark-status-item">
                <label class="field-label">打点状态</label>
                <input class="field-control marker-status" value="" readonly/>
            </div>
            <div class="floated right col-5">
                <%*widget name="common:widget/image-viewer/image-viewer.tpl" id="skuImg" zoom_in_target=".image-zoom-container" img_list=$info.img_list*%>&nbsp;&nbsp;
                <div class="image-uploader"></div>
            </div>
            <div class="field-group">
                <label class="field-label">地图打点</label>

                <div class="map-legend">
                    <ul>
                        <li>
                            <img src="/static/marketmanage/widget/ui/map/markerIcons/mark_bs1.png">
                            <button class="btn btn-default market">超市注册点</button>
                        </li>
                        <li>
                            <img src="/static/marketmanage/widget/ui/map/markerIcons/mark_bs2.png">
                            <button class="btn btn-default address">地址转译点</button>
                        </li>
                        <li>
                            <img src="/static/marketmanage/widget/ui/map/markerIcons/mark_bs3.png">
                            <button class="btn btn-default sale">销售打点</button>
                        </li>
                        <li>
                            <img src="/static/marketmanage/widget/ui/map/markerIcons/mark_bs4.png">
                            <button class="btn btn-default driver" >司机签收打点</button>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="field-group">
                <div class="mark-map"></div>
            </div>

        </div>
    </div>
</div>
<%/strip%>

<%script%>
    require.async('marketmanage:widget/market/edit/edit.jsx', function(action) {
        action({
            county_info: <%$county_info|json_encode%>,
            area_info: <%$area_info|json_encode%>,
            charger_info: '<%$info.uid%>',
            freight_info: '<%$info.freight_id%>',
            closed_remark_flag: '<%$info.closed_remark_flag%>',
            imgList: <%$info.img_list|json_encode%>,
            regionInfo: <%$info.region|json_encode%>,
            address: '<%$info.address|escape%>',
            position: <%$info.position|json_encode%>,
            data_info: <%$info|json_encode%>
        });
    });
<%/script%>
