var KEY = "a3554a844815bb0448ea8f5346ac7821";

var locate = {
    get: function (callback) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (location) {
                var url = "http://restapi.amap.com/v3/geocode/regeo";
                $.ajaxJSONP({
                    url: url,
                    data: {
                        key: KEY,
                        location: location.coords.longitude.toFixed(6) + "," + location.coords.latitude.toFixed(6)
                    },
                    success: function (data) {
                        if (data && data.status == 1 && callback && typeof callback === "function") {
                           callback(data);
                        }
                    }
                });
            }, showError, {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 30000
            });
        } else {
            return {text: "抱歉！您的浏览器无法使用地位功能", location: {}};
        }
    }
};

function showError(error) {
    var msg = '';

    switch (error.code) {
        case error.PERMISSION_DENIED:
            msg = "用户拒绝对获取地理位置的请求。";
            break;
        case error.POSITION_UNAVAILABLE:
            msg = "位置信息是不可用的。";
            break;
        case error.TIMEOUT:
            msg = "请求用户地理位置超时。";
            break;
        case error.UNKNOWN_ERROR:
            msg = "未知错误。";
            break;
    }
    //alert(msg);
}

module.exports = locate;
