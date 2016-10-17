<header class="status-bar">
    <span>链商</span>
</header>
<main>
    <div class="activity">
        <img src="./img/baba.png" />
    </div>
    <div class="list">
        <%foreach $itemList as $key=>$item%>
            <div class="box clearfix">
                    <div class="pic">
                        <a href="./view?id=<%$key%>">
                        <img src="<%$item.img%>" />
                        </a>
                    </div>
                    <div class="info">
                        <a href="./view?id=<%$key%>">
                            <h3 class="name"><%$item.name%></h3>
                            <p class="init-price"><%$item.init_price%></p>
                            <p class="promo-price"><%$item.promo_price%></p>
                        </a>
                    </div>
            </div>
        <%/foreach%>
        <%*<div class="box">*%>
            <%*<a href="./view?id=?" class="clearfix">*%>
                <%*<div class="pic">*%>
                    <%*<img src="http://www.lsh123.com/img/ac/29f1688f136c97c01b7c81" />*%>
                <%*</div>*%>
                <%*<div class="info">*%>
                    <%*<h3 class="name">农夫山泉</h3>*%>
                    <%*<p class="init-price">25.2</p>*%>
                    <%*<p class="promo-price">25.2</p>*%>
                <%*</div>*%>
            <%*</a>*%>
        <%*</div>*%>
        <%*<div class="box">*%>
            <%*<a href="./view?id=?" class="clearfix">*%>
                <%*<div class="pic">*%>
                    <%*<img src="http://www.lsh123.com/img/ac/29f1688f136c97c01b7c81" />*%>
                <%*</div>*%>
                <%*<div class="info">*%>
                    <%*<h3 class="name">农夫山泉</h3>*%>
                    <%*<p class="init-price">25.2</p>*%>
                    <%*<p class="promo-price">25.2</p>*%>
                <%*</div>*%>
            <%*</a>*%>
        <%*</div>*%>
        <%*<div class="box">*%>
            <%*<a href="./view?id=?" class="clearfix">*%>
                <%*<div class="pic">*%>
                    <%*<img src="http://www.lsh123.com/img/ac/29f1688f136c97c01b7c81" />*%>
                <%*</div>*%>
                <%*<div class="info">*%>
                    <%*<h3 class="name">农夫山泉</h3>*%>
                    <%*<p class="init-price">25.2</p>*%>
                    <%*<p class="promo-price">25.2</p>*%>
                <%*</div>*%>
            <%*</a>*%>
        <%*</div>*%>
        <%*<div class="box">*%>
            <%*<a href="./view?id=?" class="clearfix">*%>
                <%*<div class="pic">*%>
                    <%*<img src="http://www.lsh123.com/img/ac/29f1688f136c97c01b7c81" />*%>
                <%*</div>*%>
                <%*<div class="info">*%>
                    <%*<h3 class="name">农夫山泉</h3>*%>
                    <%*<p class="init-price">25.2</p>*%>
                    <%*<p class="promo-price">25.2</p>*%>
                <%*</div>*%>
            <%*</a>*%>
        <%*</div>*%>
    </div>
</main>