<%assign var="info" value=$tplData.content%>
<%assign var="conf" value=$tplData.content.conf%>
<%assign var="action" value=$tplData.page.action%>
<div class="mod-role-view">
    <form class="view-table-layout form-control <%if $action == 'view' %>is-view<%/if%>" novalidate v-validate submit="submit">
        <table>
            <tr>
                <%if $action=='edit'%>
                    <input value="<%$smarty.get.uid%>" name="uid" type="hidden"/>
                <%/if%>
                <td>
                    <label>角色名称</label>
                    <input value="<%$info.role.role%>" name="role"/>
                    <span class="btn btn-white ac-permission-modal">分配权限</span>
                </td>
                <%*
                <td>
                    <label>账号状态</label>
                    <select name="status">
                        <%foreach $conf.status as $item%>
                        <option value="<%$item@key%>" <%if $info.user.status == $item@key%>selected<%/if%>><%$item%></option>
                        <%/foreach%>
                    </select>
                </td>
                *%>
            </tr>
        </table>

        <div class="btns-wrap">

        </div>

        <%if $action != 'view'%>
            <div class="btns-wrap in-bottom">
                <button class="btn-primary">保存</button>
                <a class="btn-white btn" href="/sys/role/list">取消</a>
            </div>
        <%/if%>
    </form>

    <allotmodal></allotmodal>

</div>
<%script%>
    //require.async(conf.pageInfo.module + ':widget/'+conf.pageInfo.controller +'/' + conf.pageInfo.action+'/' +conf.pageInfo.action +'.js');
    require.async('sys:widget/role/view/view.js');
<%/script%>