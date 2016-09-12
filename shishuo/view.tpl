<div class="mod-monitor-view">
    <div class="map-wrap">
        <div class="plan-map"></div>
        <div class="ui-wave-detail-view hide-wave-details"></div>
        <div class="ui-top-bar-view"></div>
        <div class="wave-type-change">
            <div>
            <label><input type="checkbox" class="all-wave-type-change"/>&nbsp;全部展开</label>
            </div>
            <div>
            <label><input type="checkbox" checked class="auto-calculat"/>&nbsp;自动计算结果</label>
            <label><input type="checkbox" checked class="current-manual-intervent"/>&nbsp;当前手工干预线路</label>
            <label><input type="checkbox" class="other-manual-intervent"/>&nbsp;其他手工干预线路</label>
            </div>
        </div>
    </div>
</div>
<%script%>
conf.transportationType =  <%json_encode($tplData.content.transportation_type)%>;
conf.status =  <%json_encode($tplData.content.config.status)%>;
conf.dcConf =  <%json_encode($tplData.content.DC_CONF)%>;
require.async('order:widget/monitor/view/view.js');
<%/script%>