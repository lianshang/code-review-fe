<%script%>
    conf.currentNav = 'home';
    conf.activityId =  '<%$smarty.get.activity_id|default:""%>';
    conf.activityList =  <%json_encode($tplData.content.activity_list)%>;
    require.async('home:widget/activity/activity.js');
<%/script%>
