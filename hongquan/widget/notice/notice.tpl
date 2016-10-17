<div class="mod-notice">
    <h2>下面是做地址测试的</h2>
    <div class="form-wrap">
        <div class="">
            <label>定位:</label>
            <input type="hidden" name="location" />
            <span class="formatted_address"></span>
            <span class="sematic_description"></span>
            <button class="refresh-address">刷新地址信息</button>
        </div>
        <div>
            拍照:
            <div class="file-upload-wrap"></div>
        </div>
        <div>
            <label>地址:</label>
            <input type="text" name="address" />
        </div>
        <div>
            <label>超市名:</label>
            <input type="text" name="name" />
        </div>
        <div>
            <label>联系人:</label>
            <input type="text" name="contact_person" />
        </div>
        <div>
            <label>联系电话:</label>
            <input type="text" name="contact_phone" />
        </div>
    </div>
    <form action="/res/img/upitem" target="fileUploadIframeiir5ie93_4yh87" method="post" enctype="multipart/form-data" class="file-form">
        <input name="img_list[]" type="file" />
        <button>提交</button>
    </form>
</div>
<%script%>
    require.async('home:widget/notice/notice.js');
<%/script%>
