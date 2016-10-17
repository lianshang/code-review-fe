<%$download_url = $tplData.content.download_url%>
<div id="app" class="mod-app">
	<div class="browser">请点击右上角,选择在浏览器中打开</div>
	<div class="content">
		<div class="logo">
			<img src="img/logo.png" alt="logo">
		</div>
		<div class="slogan">
			<p class="slogan-one">中小超市首选&nbsp;&nbsp;<strong>一站式掌上订货平台</strong></p>
			<p class="slogan-two">低价直供 / 厂商新货 / 优选正品 / 隔夜送达</p>
		</div>
		<div class="phone-image">
			<div class="phone-box">
				<img src="img/phone_content.jpg" class="phone-content" alt="phone content">
			</div>
		</div>
	</div>
	<div class="info-footer">
		<div class="download">
			<a href=<%$download_url%>>
				<img src="img/download_android.png" class="download-button" alt="download button">
			</a>
		</div>
		<div class="download">
			<a href="https://itunes.apple.com/cn/app/lian-shang-you-gong-zhong/id1072039085?l=en&mt=8">
				<img src="img/download_ios.png" class="download-button" alt="download button">
			</a>
		</div>
		<div class="info">
			<p>
				<a href="tel:400-711-5858" class="telephone">400-711-5858</a>
				<span>(周一至周五9:00 - 18:00)</span>
			</p>
			<p>service@lsh123.com</p>
		</div>
		<div class="footer">
			<p>Copyright&copy;<%$smarty.now|date_format:"Y"%>&nbsp;&nbsp;lsh123.com 版权所有&emsp;京ICP备15048550号</p>
		</div>
	</div>
</div>
<%script%>
    require.async('home:widget/app/app.js', function(action) {
        action();
    });
<%/script%>
