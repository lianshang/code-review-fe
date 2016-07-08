<%require name="common:widget/css-base/src/table.less"%>
<%$bread_crumb = [ [ "name" => "套餐商品列表", "url" => "/item/package/list" ],["name" => "添加套餐商品","type" => "link", "url" => "/item/package/new" ],["name" => "添加单品","type" => "link", "url" => "" ]]%>
<%$btn_bar = [ [ "name" => "完成", "type" => "finish", "url" => "" ] ]%>
<%$content = $tplData.content%>
<div class="mod-package-sku-list">
    <%widget name="common:widget/bread-crumb/bread-crumb.tpl" data=$bread_crumb%>
    <%widget name="common:widget/btn-bar/btn-bar.tpl" data=$btn_bar%>
    <%widget name="common:widget/search-box/search-box.tpl" placeHolder="按商品名称/链商商品码搜索"%>
    <div class="package-sku-list"></div>
</div>

<%script%>
    require.async("item:widget/package/skuList/skuList.js", function(Action) {
    Action({
        wmStatusList: <%$content.wmStatusList|default:[]|json_encode%>,
        lshStatusList: <%$content.lshStatusList|default:[]|json_encode%>,
        skuList:  <%$content.skuList|default:[]|json_encode%>
    });
    });
<%/script%>