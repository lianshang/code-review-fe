<%strip%>
    <script>
        window.conf || (window.conf = {});
        conf.userData = <%json_encode($user_data)%>;
        conf.page = <%json_encode($page)%>;
        conf.dpr = window.devicePixelRatio;
        if (conf.isPC) {
        	conf.imgScale = "large";
        } else {
        	if (conf.dpr >=2) {
        		conf.imgScale = 'medium';
        	} else {
        		conf.imgScale = 'small';
        	}
        }
        //conf.imgScale = conf.dpr >= 2 ? 'medium' : 'small';
        //conf.imgScale = conf.isPC ? 'large' : ( conf.dpr >= 2 ? 'medium' : 'small' );
    </script>
<%/strip%>