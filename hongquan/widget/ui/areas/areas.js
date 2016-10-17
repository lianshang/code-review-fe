var $ = require('home:widget/ui/zepto/zepto.js');
var T = require('home:widget/ui/tpl/tpl.js');
var tpl = require('home:widget/ui/areas/tpl.js');

var baseUrl = "/common/region/getlist?fid=";

$.fn["initArea"] = function ( content ) {
    var $this = $(this);
    var $dialog = $("#uiAreas").length ? $("#uiAreas") : $(tpl.dialog).appendTo($("body"));
    var $p = $dialog.find(".province");
    var $c = $dialog.find(".city");
    var $co = $dialog.find(".county");
    var timer = null;

    var index = 0;
    var list = [
        {
            $target: $p,
            id: content ? content.province : $this.data("pid")
        },
        {
            $target: $c,
            id: content ? content.city : $this.data("cid")
        },
        {
            $target: $co,
            id: content ? content.county : $this.data("coid")
        }
    ];
    var max = list.length;

    requestArea(index, list[index].id, list[index].$target, true);
    bindEvents();

    /**
     * @param fid 当前区域的父级id
     * @param current 当前区域
     * @param $target 目标元素
     * @param init 是否在初始化
     * */
    function requestArea(fid, current, $target, init) {
        fid = fid ? fid : 0;

        $.ajax({
            url: baseUrl + fid,
            dataType: "json",
            success: function (response) {
                $target.empty().append(renderOptions(response.content.region_list, current));
                index++;

                if (index !== max) {
                    requestArea(init && current ? current : $target.val(), list[index].id, list[index].$target, init);
                }
            }
        });
    }

    function renderOptions(data, current) {
        var ops = '';

        for ( var i = 0, length = data.length; i < length; i++ ) {
            ops += T.compile(tpl.option)({rid: data[i].rid, name: data[i].name, cur: current});
        }

        return ops;
    }

    function getSelectedValue($select) {
        return $select.find('option').not(function () { return !this.selected }).text();
    }

    function bindEvents() {
        $this.on(conf.evClick, function () {
            // 这里当点击的时候停止0.5s后在显示
            // 原因：如果当前正在输入上一个表单，此时软键盘还在
            // 在有软键盘在的情况下，点击该表单，则会出现闪动现象
            // 个人认为是软键盘下去和mask出现两个行为产生了冲突
            // 所有就让mask出现晚0.5s
            clearTimeout( timer );
            timer = setTimeout( function () {
                $dialog.show();
            }, 500 );
            //$dialog.show();
        });

        $dialog.find("select").on("change", function () {
            if ($(this).data("index") != max - 1) {
                index = $(this).data("index") + 1;
                // 更新后面的数据
                requestArea($(this).val(), list[index].id, list[index].$target, false);
            }
        });

        $dialog.find(".confirm").on(conf.evTouchEnd, function (e) {
            $this.data("location", {
                province: {
                    value: $p.val(),
                    text: getSelectedValue($p)
                },
                city: {
                    value: $c.val(),
                    text: getSelectedValue($c)
                },
                county: {
                    value: $co.val(),
                    text: getSelectedValue($co)
                },
                text: getSelectedValue($p) + getSelectedValue($c) + getSelectedValue($co)
            });

            $this.val($this.data("location").text).trigger('e-area-change');
            $dialog.hide();

            // 防止tap的点透, 这里用touchend事件来代替tap事件
            // http://www.bubuko.com/infodetail-649496.html
            e.preventDefault();
        });
    }

    return this;
};
