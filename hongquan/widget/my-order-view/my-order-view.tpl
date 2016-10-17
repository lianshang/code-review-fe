<div id="myOrderViewCanvas" class="mod-my-order-view"></div>
<%script%>
    require.async(['home:widget/ui/zepto/zepto.js', 'home:widget/my-order-view/my-order-view.js'], function($, Action) {
        $(new Action({
            data: <%json_encode($tplData.content)%>,
            orderId: "<%$tplData.content.order_info.order_id%>",
            openId: "<%$tplData.content.openid%>"
        }));
    });
<%/script%>
