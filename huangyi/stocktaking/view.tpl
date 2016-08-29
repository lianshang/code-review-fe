<%assign var="info" value=$tplData.content.title%>
<%assign var="conf" value=$tplData.content.conf%>
<%assign var="details" value=$tplData.content.details%>
<%assign var="action" value=$tplData.page.action%>

<div class="mod-stocktaking-view">
    <form class="form-control view-table-layout <%if $action=='view'%>is-view<%/if%>" novalidate v-validate submit="submit">
        <table>
            <tr>
                <td>
                    <label>任务编号: </label>
                    <%if $action == "new"%>
                        <input name="takingId" value="<%$tplData.content.takingId%>" class="disabled">
                    <%else%>
                        <input name="takingId" value="<%$info.takingId%>" class="disabled"/>
                    <%/if%>
                </td>
                <td>
                    <label>盘点类型: </label>
                    <select name="viewType">
                        <option value="false">--请选择--</option>
                        <%foreach $conf.viewType as $op%>
                            <option value="<%$op@key%>" <%if $op@key == $info.viewType%>selected<%/if%>><%$op%></option>
                        <%/foreach%>
                    </select>
                </td>
                <td>
                    <label>盘点性质: </label>
                    <select name="planType">
                        <option value="false">--请选择--</option>
                        <%foreach $conf.planType as $op%>
                            <option value="<%$op@key%>" <%if $op@key == $info.planType%>selected<%/if%>><%$op%></option>
                        <%/foreach%>
                    </select>
                </td>
            </tr>
        </table>

        <div class="divider"></div>
        <table>
            <tr>
                <td>
                    <label>盘点库区: </label>
                    <select name="areaId" class="ac-select-area">
                        <option value="0">--选择库区--</option>
                        <option v-for="op in infoList.areaOptions" value="{{op.locationId}}" :selected="formData.title&&formData.title.locationId==op.locationId">{{op.locationCode}}</option>
                    </select>
                </td>
                <td>
                    <label>盘点货架: </label>
                    <select name="storageId" class="ac-select-shelf">
                        <option value="0">--选择货架--</option>
                        <option v-for="op in infoList.shelfOptions" value="{{op.locationId}}" :selected="formData.title&&formData.title.storageId==op.locationId">{{op.locationCode}}</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td colspan="3">
                    <label>盘点库位</label>
                    <textarea style="width: 615px; height: 64px" :value="postData.locationList | joinValue 'locationCode'" class="disabled" placeholder="完成选择自动回填"></textarea>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <label>盘点商品: </label>
                    <input name="itemId" value="<%$info.itemId%>" class="ac-select-item"/>
                    <%*
                    <select name="itemId" class="ac-select-item" style="width: 550px">
                        <option value="0">--选择商品--</option>
                        <option v-for="op in infoList.itemOptions" value="{{op.itemId}}" :selected="formData.title&&formData.title.itemId==op.itemId">{{op.itemName}}</option>
                    </select>
                    *%>
                </td>
                <td>
                    <label>盘点供商: </label>
                    <select name="supplierId" class="ac-select-supplier">
                        <option value="0">--盘点供商--</option>
                        <option v-for="op in infoList.supplierOptions" value="{{op.supplierId}}" :selected="formData.title&&formData.title.supplierId==op.supplierId">{{op.supplierName}}</option>
                    </select>
                </td>
            </tr>
            <%if $action != 'view'%>
            <tr>
                <td colspan="3">
                    <label>选择盘点库位: </label>
                    <select class="ac-select-method">
                        <option value="0">指定</option>
                        <option value="1">随机</option>
                    </select>

                    <span class="btn btn-white ac-choose-modal" v-if="control.appoint">指定库位</span>

                    <template v-if="control.random">
                        <input v-model="postData.locationNum" placeholder="输入随机数值"/>
                        <span class="btn btn-white ac-random-location">获取随机库位</span>
                    </template>
                </td>
            </tr>
            <%/if%>
            <tr>
                <td>
                    <label>要求结束时间: </label>
                    <datepicker :value.sync="postData.dueTime" name="dueTime"></datepicker>
                </td>
            </tr>
        </table>

        <%if $action == "view"%>
            <div class="divider"></div>
            <table>
                <tr>
                    <td>
                        <label>创建人: </label>
                        <input name="planner" value="<%$info.planner%>" />
                    </td>
                    <td>
                        <label>任务创建时间: </label>
                        <datepicker :value.sync="postData.createdAt" name="createdAt"></datepicker>
                    </td>
                </tr>
                <tr>
                    <td>
                        <label>盘点完成时间: </label>
                        <datepicker :value.sync="formData.title.updatedAt" name="updatedAt"></datepicker>
                    </td>
                    <td>
                        <label>执行人: </label>
                        <input value="<%$details[0][0].operator%>" />
                    </td>
                </tr>
            </table>
            <tables0></tables0>

            <%foreach $details as $item%>
                <%if $item@index > 0%>
                    <div class="divider"></div>
                    <table>
                        <tr>
                            <td>
                                <label>复核执行人: </label>
                                <input name="planner" value="<%$details[$item@index][0].operator%>" />
                            </td>
                            <td>
                                <label>复核完成时间: </label>
                                <input name="createdAt" value="<%$details[$item@index][0].updatedAt%>" />
                            </td>
                        </tr>
                    </table>
                    <tables<%$item@index%>></tables<%$item@index%>>
                <%/if%>
            <%/foreach%>

        <%/if%>

        <%if $action != 'view'%>
            <div class="btns-wrap in-bottom">
                <button class="btn-primary submit">保存</button>
                <a class="btn btn-white" href="/inhouse/stocktaking/list">取消</a>
            </div>
        <%/if%>
    </form>

    <modal></modal>
</div>
<%script%>
    //require.async(conf.pageInfo.module + ':widget/'+conf.pageInfo.controller +'/' + conf.pageInfo.action+'/' +conf.pageInfo.action +'.js');
    require.async('inhouse:widget/stocktaking/view/view.js');
<%/script%>