<%require name="home:widget/my-order-view/my-order-view.less"%>

<div id="myOrderDetailCanvas" class="mod-my-order-detail"></div>
<%script%>
    require.async(['home:widget/ui/zepto/zepto.js', 'home:widget/my-order-view/detail/detail.js'], function($, Action) {
        $(new Action({
            data: <%json_encode($tplData.content.detail_list)%>,
            userOrderId: "<%$tplData.content.order_id%>"
        }));
    });
<%/script%>
