<%require name="common:widget/css-base/src/table.less"%>
<%require name="common:widget/css-base/src/form.less"%>
<%require name="common:widget/css-base/src/utility.less"%>
<%require name="common:widget/css-base/src/modal.less"%>
<%$bomb_list = $tplData.content[1]%>
<%*首页爆炸贴商品列表*%>
<div class="mod-bombitem-list">
    <h1 class="clearfix">爆炸贴商品管理<button class="btn btn-primary add-bomb">新建</button></h1>
    <%widget name="common:widget/search-box/search-box.tpl" resetKey="q|bomb_id" filter="simple-select(bomb_type)" placeHolder="按销售码/商品搜索" queryKey="q" reset=true%>
    <div class="list"></div>
    <div class="modal add-bomb-modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
        <div class="modal-dialog modal-width" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">添加爆炸贴商品</h2>
                </div>
                <div class="modal-body">
                    <input class="add-remarks sale-id" type="text" placeholder="销售码" required>
                    <input class="add-remarks buy-name" type="text" placeholder="商品名称" readonly>
                    <select class="add-remarks area" name="rid" required empty="请输入爆炸贴">
                        <%foreach $bomb_list as $item%>
                        <option value="<%$item@key%>" ><%$item%></option>
                        <%/foreach%>
                    </select>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default cancel" data-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary submit-modify">确定</button>
                </div>
            </div>
        </div>
    </div>
</div>
<%script%>
    require.async("mis:widget/bombitem/list/list.js", function(Action) {
        new Action({
            bomb_list: <%$bomb_list|json_encode%>,
        });
    });
<%/script%>