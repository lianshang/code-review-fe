<header class="status-bar">
    <span>商品详情</span>
</header>
<%$itemKey=$smarty.get.id%>
<%$itemInfo=$itemList[$itemKey]%>
<main>
    <div class="pic">
        <img src="<%$itemInfo.img%>" />
    </div>
    <div class="info">
        <h3 class="name"><%$itemInfo.name%></h3>
        <p class="init-price"><%$itemInfo.init_price%></p>
        <p class="promo-price"><%$itemInfo.promo_price%></p>
    </div>
    <div class="detail">
        <h2>商品信息</h2>
        <table>
            <tbody>
            <tr>
                <td>分类</td>
                <td><%$itemInfo.category%></td>
            </tr>
            <tr>
                <td>品牌</td>
                <td><%$itemInfo.brand%></td>
            </tr>
            <tr>
                <td>产地</td>
                <td>---</td>
            </tr>
            <tr>
                <td>规格</td>
                <td><%$itemInfo.size%></td>
            </tr>
            <tr>
                <td>生产日期</td>
                <td><%$itemInfo.date%></td>
            </tr>
            <tr>
                <td>保质期</td>
                <td><%$itemInfo.expiration%></td>
            </tr>
            </tbody>
        </table>
    </div>

</main>
<footer class="main-menu">
    <a href="./index" class="menu">首页</a>
    <span class="menu active">详情</span>
    <span></span>
    <span></span>
</footer>