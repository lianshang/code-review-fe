<%require name="common:widget/css-base/src/form.less"%>
<%$bread_crumb = [ [ "name" => "套餐商品管理", "url" => "/item/package/list" ],["name" => "添加套餐商品", "url" => ""] ]%>
<%$btn_bar = [ [ "name" => "保存", "type" => "btn", "url" => "" ,"class"=> "btn-primary save"] , [ "name" => "取消", "type" => "cancel", "url" => "" ]]%>
<%$btn_bar_view = [ [ "name" => "编辑", "type" => "edit", "url" => ""]]%>
<%$info = $tplData.content.sale_info%>
<%$sku_info = $tplData.content.sku_info%>
<%$page = $tplData.page%>
<%$item_list = $tplData.content.package_info.item_list%>
<%if $page.module=="item" && $page.controller=="package"%>
    <%$page_view=$page.action%>
<%/if%>

<div class="mod-package-view">
    <%widget name="common:widget/bread-crumb/bread-crumb.tpl" data=$bread_crumb%>
    <%if $page_view =="view"%>
        <%widget name="common:widget/btn-bar/btn-bar.tpl" data=$btn_bar_view%>
    <%else%>
        <%widget name="common:widget/btn-bar/btn-bar.tpl" data=$btn_bar%>
    <%/if%>

    <div class="content clearfix border-box <%if $page_view =="view"%>noborder<%/if%>">
        <div class="floated left col-7">
            <div class="package-info">
                <div class="field-group">
                    <label class="field-label">套餐名称</label>

                    <div class="readView"><%$sku_info.name|escape|default:'--'%></div>
                    <input class="field-control" name="name" value="<%$sku_info.name|escape%>" required
                           empty="请输入套餐名称"/>
                    <span class="field-msg"></span>
                </div>
                <div class="field-group">
                    <label class="field-label">所属分类</label>

                    <div class="read">套餐</div>
                </div>
                <div class="field-group">
                    <label class="field-label">每单限购量</label>

                    <div class="readView"><%$info.order_limit|default:'--'|escape%></div>
                    <input class="field-control" name="max" value="<%$info.order_limit|escape%>" invalid="请填写有效数字"  pattern="^[1-9]\d*$"
                           required
                           empty="请输入单限购量"/>
                    <span class="field-msg"></span>
                </div>
                <div class="field-group">
                    <label class="field-label">最小起订量</label>

                    <div class="readView"><%$info.moq|default:'--'|escape%></div>
                    <input class="field-control" name="min" value="<%$info.moq|escape%>" required  invalid="请填写有效数字"  pattern="^[1-9]\d*$"
                           empty="请输入最小起订量"/>
                    <span class="field-msg"></span>
                </div>
                <%*根据是否有套餐名称判断是否已新建*%>
                <%if $sku_info.name%>
                    <div class="field-group">
                        <label class="field-label">销售码</label>

                        <div class="read"><%$info.sku_id|default:'--'|escape%></div>
                    </div>
                <%/if%>
                <%if $item_list !=null%>
                    <div class="field-group">
                        <label class="field-label">套餐供货价</label>

                        <div class="read"><%$info.origin_price|default:'--'|escape%></div>
                    </div>
                    <div class="field-group">
                        <label class="field-label">套餐原售价</label>

                        <div class="read"><%$info.sale_price|default:'--'|escape%></div>
                    </div>
                    <div class="field-group">
                        <label class="field-label">套餐售价</label>

                        <div class="read"><%$info.package_price|default:'--'|escape%></div>
                    </div>
                    <div class="field-group">
                        <label class="field-label">套餐库存</label>

                        <div class="read"><%$info.inventory_num|default:'--'|escape%></div>
                    </div>
                <%/if%>

                <div class="field-group">
                    <%*edit编辑状态，view查看状态，new不显示状态*%>
                    <%if $sku_info.name && $page_view =="edit"%>
                        <label class="field-label">状态</label>
                        <select class="field-control" name="status">
                            <option value="">请选择...</option>
                            <option value="3"<%if $info.status == "3"%> selected<%/if%>>下架</option>
                            <option value="2"<%if $info.status == "2"%> selected<%/if%>>上架</option>
                        </select>
                        <span class="field-msg"></span>
                    <%elseif $page_view =="view"%>
                        <label class="field-label">状态</label>
                        <div class="readView"><%if $info.status==3%>下架<%elseif $info.status==2%>上架<%else%>--<%/if%></div>
                    <%/if%>
                </div>

            </div>
            <%*单品信息*%>
            <%foreach $item_list as $v  %>
                <div class="sku-item" data-skuid="<%$v.sku_id%>">
                    <div class="field-group">
                        <label class="field-label">商品名称</label>
                        <div class="read"><%$v.sku_name|default:'--'|escape%></div>
                        <%if $page_view =="edit"%>
                            <a href="javascript:;" class="delete-item">删除</a>
                        <%/if%>
                    </div>
                    <div class="field-group">
                        <label class="field-label">销售规格</label>

                        <div class="read"><%$v.sku_spec|default:'--'|escape%></div>
                    </div>
                    <div class="field-group">
                        <label class="field-label">销售单位</label>

                        <div class="read"><%$v.sale_unit_name|default:'--'|escape%></div>
                    </div>
                    <div class="field-group">
                        <label class="field-label">供货价</label>

                        <div class="read"><%$v.origin_price|default:'--'|escape%></div>
                    </div>
                    <div class="field-group">
                        <label class="field-label">原售价</label>

                        <div class="read"><%$v.sale_price|default:'--'|escape%></div>
                    </div>
                    <div class="field-group">
                        <label class="field-label">套餐内售价</label>

                        <div class="readView"><%$v.package_price|default:'--'|escape%></div>
                        <input class="field-control package-price" value="<%$v.package_price|escape%>" required custom="e-not-ling" cmsg="请输入正数"  invalid="请填写有效数字" pattern="^(\d*[0-9]\d*)(\.\d+)?$"
                               empty="请输入套餐内售价"/>
                        <span class="field-msg"></span>
                    </div>
                    <div class="field-group">
                        <label class="field-label">库存</label>

                        <div class="read"><%$v.inventory_num|default:'--'|escape%></div>
                    </div>
                    <div class="field-group">
                        <label class="field-label">套餐单品数量</label>

                        <div class="readView"><%$v.sale_unit|default:'--'|escape%></div>
                        <input class="field-control sale-unit" value="<%$v.sale_unit|escape%>" required  invalid="请填写有效数字"  pattern="^[1-9]\d*$"
                               empty="请输入单品数量"/>
                        <span class="field-msg"></span>
                    </div>

                </div>
            <%/foreach%>
            <%if $page_view =="view"%>
                <a href="/item/package/skuList?packageId=<%$smarty.get.packageId%>&sale_type=1&status=2" class="btn btn-primary">添加单品</a>
            <%/if%>
        </div>
        <div class="floated right col-5">
            <%*widget name="common:widget/image-viewer/image-viewer.tpl" id="skuImg" zoom_in_target=".image-zoom-container" img_list=$info.img_list*%>
            <%if $page_view =="view"%>
                <div class="image-viewer">
                    <%if $sku_info.img_list|count%>
                        <%foreach $sku_info.img_list as $item%>
                            <img src="<%$item.large%>"/>
                        <%/foreach%>
                    <%else%>
                        <div class="no-img">暂无图片</div>
                    <%/if%>
                </div>
            <%else%>
                <div class="image-uploader"></div>
            <%/if%>
        </div>

    </div>
</div>

<%script%>
    require.async("item:widget/package/view/view.jsx", function(Action) {
    Action({
        imgList: <%$sku_info.img_list|json_encode%>,
        pageview: <%$page_view|json_encode%>
    });
    });
<%/script%>