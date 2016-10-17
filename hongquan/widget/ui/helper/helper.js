var r20 = /%20/g;
var rSpace = /\+/g;

var helper = {
	/**
	 * 生成一个随机的字符串（形如：iba6nelt_2p3in）
	 * @returns {string}
	 */
	randomKey: function () {
		return (+(new Date)).toString(36) + '_' + Math.ceil((10e6 * Math.random())).toString(36);
	},

	/**
	 * 通过jQuery的html()放入DOM时使用的编码函数，上面两个函数的升级版
	 * 非安全变量（包括通过jQuery的data()函数取出的字符）必须通过此编码
	 * @param {string} str 需要被过滤的字符串
	 */

	escapeToHtml: function (str) {
		str += '';
		str = str.replace(/<|>|"/g, function (match) {
			var result;
			switch (match) {
				case '<':
					result = '&lt;';
					break;
				case '>':
					result = '&gt;';
					break;
				case '"':
					result = '&quot;';
					break;
				default:
					result = match;
			}
			return result;
		});
		return str;
	},

	/**
	 * 查询url参数
	 * 原来的queryString无法获取单页面应用的参数，这里修改一下
	 * 没有和原来的做整合，因为不确定其他地方用的怎么样
	 * */
	_queryString: function ( key ) {
		var reg = new RegExp('(^|&)' + key + '=([^&]*)(&|$)', 'i');
		if ( window.location.hash.split("?")[1] ) {
			var result = window.location.hash.split("?")[1].match(reg);
			if ( result ) {
				var value = decodeURIComponent(result[2]) || '';
				return value.replace(rSpace, ' ');
			} else {
				return null;
			}
		} else {
			return null;
		}
	},

	/**
	 * 查询url参数
	 * */
	queryString: function (key) {
		var reg = new RegExp('(^|&)' + key + '=([^&]*)(&|$)', 'i');
        var result = window.location.search.substr(1).match(reg);
		if (result != null) {
			var value = decodeURIComponent(result[2]) || '';

			return value.replace(rSpace, ' ');
		}
		return null;
	},

	/**
	 * 查询全部url参数
	 * 会以对象形式返回
	 * */
	queryLocationSearch: function (url) {
		var search = "";
		var result = {};
		if (url) {
			if (url.indexOf('?') >= 0) {
				search = url.substr(url.indexOf('?') + 1);
			}
		} else {
			search = window.location.search.substr(1);
		}
		if (search.length) {
			var params = search.split("&");
			for ( var i = 0, length = params.length; i < length; i++ ) {
				var item = params[i].split("=");
				// 对于空格, 正常情况下,是转义为 '+'(W3C); 但是encodeURIComponent是将' ' 转义为 '%20' (RFC)
				//RFC 1738: ' ' -> '%20' 同时包括(php) rawurlencode/encodeURIComponent
				// 表单的POS,GET: ' ' -> '+'  同时包括(php) urlencode, (jQuery) $.params()
				var key = decodeURIComponent(item[0]) || '';
				var value = decodeURIComponent(item[1]) || '';
				result[key.replace(rSpace, ' ')] = value.replace(rSpace, ' ');
			}
		}

		return result
	},
	/**
     * 更新url参数
     * 切换到新的url
     */
    updateQuery: function(params) {
        var search = this.queryLocationSearch();
        for(var i in params) {
            var li = params[i];
            if (li.length) {
                search[i] = li;
            } else {
                delete search[i];
            }
        }
        params = [];
        for(var i in search) {
            if (search.hasOwnProperty(i)) {
                var li = search[i];
                params.push(i + '=' + search[i]);
            }
        }
        search = params.join('&');
        return window.location.pathname + (search.length ? '?' : '') + search;
    }
};

module.exports = helper;
