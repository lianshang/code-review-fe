<%require name="common:widget/css-base/src/table.less"%>
<%require name="common:widget/css-base/src/form.less"%>
<%require name="common:widget/css-base/src/utility.less"%>
<%*首页爆炸贴列表*%>
<div class="mod-hometag-list">
    <h1 class="clearfix">爆炸贴管理</h1>
    <div class="list">
        <table class="table table-striped table-bordered">
            <thead>
            <tr>
                <th>标签名称</th>
                <th>商品数量</th>
                <th>操作</th>
            </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
    <button type="button" class="btn btn-primary add">添加爆炸贴</button>
</div>
<%script%>
    require.async("mis:widget/bomb/list/list.js", function(Action) {
        new Action({

        });
    });
<%/script%>