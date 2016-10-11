<%require name="common:widget/css-base/src/form.less"%>
<%require name="common:widget/css-base/src/modal.less"%>
<%$bread_crumb = [ [ "name" => "我的任务", "url" => "/task/list" ],["name" => "匹配数据", "url" => ""] ]%>
<%$btn_bar = [[ "name" => "确认并匹配", "type" => "success", "url" => "" ],[ "name" => "无匹配项", "type" => "fail", "url" => ""],[ "name" => "审核通过", "type" => "approve", "url" => ""],[ "name" => "跳过", "type" => "next", "url" => ""] ]%>
<%$btn_search = [ [ "name" => "搜索", "type" => "search", "url" => "" ] ]%>
<div class="mod-view-match">
    <%widget name="common:widget/bread-crumb/bread-crumb.tpl" data=$bread_crumb%>
    <div class="left"></div>
    <div class="right">
        <div class="options">
            <a class="backList" href="/task/list" target="_self">返回我的任务列表</a>
            <%widget name="common:widget/btn-bar/btn-bar.tpl" data=$btn_bar%>
            <input type="text" class="field-control search-input" placeHolder="输入关键词搜索"/>
            <%widget name="common:widget/btn-bar/btn-bar.tpl" data=$btn_search%>
        </div>
        <div class="content">
            <div class="top"></div>
            <div class="item-content">
                <div class="item-right"></div>
                <div class="item-search"></div>
            </div>
        </div>
    </div>
</div>

<%script%>
    require.async("task:widget/user/view/view.js", function(View) {
        new View({
            com_list: <%$tplData.conf.com_list|json_encode%>,
            task_id_list: <%$tplData.content.task_id_list|json_encode%>
        });
    });
<%/script%>