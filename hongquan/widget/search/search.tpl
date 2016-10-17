<div id="searchCanvas" class="mod-search header-fixed"></div>
<%script%>
    conf.hotQueryList = <%$tplData.content.hot_query_list|json_encode%>;
    require.async('home:widget/search/search.js');
<%/script%>
