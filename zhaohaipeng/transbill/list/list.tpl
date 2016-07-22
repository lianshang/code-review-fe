<%require name="common:widget/css-base/src/table.less"%>

<div class="mod-transbill-list">
    <div class="bread-crumb">链商运单与运费管理</div>
    <div class="waybill-money">运费累计:<span>0</span></div>
    <div class="search"></div>
    <a class="export" target="_self">导出</a>
    <div class="tables"></div>
</div>
<%script%>
require.async('order:widget/transbill/list/list.js', function (transbill) {
    transbill();
});
<%/script%>