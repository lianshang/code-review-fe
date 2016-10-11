var $ = require('common:widget/ui/jquery/jquery.js');
var tpls = require('task:widget/user/view/tpl.js');
var helper = require('common:widget/ui/helper/helper.js');
var artTpl = require('common:widget/ui/tpl/tpl.js');
var GET_API = require('task:widget/user/ui/get-api/get-api.js');
var Validator = require('common:widget/ui/validator/validator.js');
var Modal = require('common:widget/ui/confirm-modal/confirm-modal.js');

var View = function (opts) {
    this.$mod = $('.mod-view-match');
    this.$left = this.$mod.find('.left');
    this.$top = this.$mod.find('.top');
    this.$content = this.$mod.find('.item-right');
    this.$search = this.$mod.find('.item-search');
    this.$input = this.$mod.find('.search-input');
    this.$itemContent = this.$mod.find('.item-content');
    this.DETAIL_API = '/task/MatchDetail';
    this.UPDATE_API = '/task/UpdateStatus';
    this.SEARCH_API = '/task/GetSearchCom';
    this.NEXT_API = '/task/GetNextOne';
    this.TASK_ID = helper.queryString('task_id');
    this.TASK_TYPE = helper.queryString('task_type');
    this.ZONE_ID = helper.queryString('zone_id');
    this.PARAMS = {
        task_id: this.TASK_ID,
        task_type: this.TASK_TYPE
    };
    this.COM_ID = helper.queryString('com_id');
    this.competList = opts.com_list;
    this.taskList = opts.task_id_list;
    this.validator = null;

    this.init();
};
View.prototype = {
    constructor: View,
    init: function () {
        //渲染页面
        GET_API.asyncData(this.DETAIL_API, this.PARAMS, this.$mod, this.getDetailList, this);  //this 改变作用域

        this.bindEvent();
        this.initValidator();
        this.renderMModal();
    },

    bindEvent: function () {
        var self = this;
        self.$mod.on("click", ".btn-success", function () {
            self.save('save');
        }).on("click", ".btn-approve", function () {
            self.save('approve');
        }).on("click", ".btn-fail", function () {
            $('.fail-modal').modal('show');
        }).on("click", ".btn-next", function () {
            self.jumpItem();
        }).on("click", ".img,.icon-gouxuan", function () {
            var $this = $(this);
            if (!$this.hasClass('img')) {
                //icon点击，找到遮盖的图片元素
                $this = $this.siblings('.img');
            }
            self.iconSelectedHandle($this);
        }).on("click", ".btn-search", function () {
            self.submitSearch();
        });
        $(document).on("keydown", function (e) {
            e.which === 13 && self.submitSearch();
        });
    },

    /**
     * 图片勾选样式
     */
    iconSelectedHandle: function ($icon) {
        var self = this;
        var $itemINfo = $icon.closest('.item-info');
        var $eaView = $itemINfo.find('.ea-view');
        var $eaNum = $eaView.siblings('.ea-num');
        var $otherItem = $itemINfo.siblings('.item-info');
        //新增的第二份搜索出的数据
        var $extendItem = $itemINfo.parent().siblings().find(".item-info");
        // 增加对勾icon
        $otherItem.find('.iconfont').removeClass('icon-gouxuan');
        $extendItem.find('.iconfont').removeClass('icon-gouxuan');
        $icon.siblings('.iconfont').toggleClass('icon-gouxuan');
        if (self.TASK_TYPE == 2) {
            //竞品填写EA
            $otherItem.find('.ea-num').focus().addClass('hide').removeAttr('required');
            $extendItem.find('.ea-num').focus().addClass('hide').removeAttr('required');
            $otherItem.find('.ea-view').removeClass('hide');
            $extendItem.find('.ea-view').removeClass('hide');
            $eaView.toggleClass('hide');
            $eaNum.toggleClass('hide');
            //添加EA校验
            if ($eaNum.hasClass('hide')) {
                $eaNum.removeAttr('required').blur();
            } else {
                $eaNum.focus().prop('required', true);
            }
        }
    },

    submitSearch: function () {
        var self = this;
        var params = {
            key_words: self.$input.val(),
            com_id: self.COM_ID,
            zone_id: self.ZONE_ID,
            task_type: self.TASK_TYPE
        };
        GET_API.asyncData(self.SEARCH_API, params, self.$mod, self.searchItem, self);
    },


    save: function (name) {
        var params = this.getData(1, this.$mod.find('.icon-gouxuan').closest('.item-info'));
        //确认匹配必须勾选商品
        if (params.match_data.r_map.com_id) {
            if (this.validator.validateAll()) {
                $('.save-modal').modal('show');
            }
        } else {
            if (name == 'save') {
                $('.tip-modal').modal('show');
            } else {
                $('.fail-modal').modal('show');
            }
        }
    },

    renderMModal: function () {
        var self = this;
        new Modal({
            modalMod: self.$mod,
            component: {
                name: "save-modal",
                size: "sm",
                head: "确认提交吗？",
                type: "confirm"
            },
            submit: function () {
                GET_API.asyncData(self.UPDATE_API, self.getData(1, self.$mod.find('.icon-gouxuan').closest('.item-info')), self.$mod, self.jumpItem, self);

            }
        });
        new Modal({
            modalMod: self.$mod,
            component: {
                name: "fail-modal",
                size: "sm",
                head: "确认当前商品无匹配项吗？",
                type: "confirm"
            },
            submit: function () {
                GET_API.asyncData(self.UPDATE_API, self.getData(2, self.$mod.find('.icon-gouxuan').closest('.item-info')), self.$mod, self.jumpItem, self);

            }
        });
        new Modal({
            modalMod: self.$mod,
            component: {
                name: "tip-modal",
                size: "sm",
                head: "请选择匹配商品！"
            }
        });
    },

    jumpItem: function () {
        //跳到下个商品
        var count = this.taskList.indexOf(this.TASK_ID);
        if (count != -1) {
            GET_API.asyncData(this.NEXT_API, {task_id: this.taskList[count + 1]}, this.$mod, this.nextTask, this);
        }
    },

    searchItem: function (list) {
        //数据去重
        var arr = $.map(this.$mod.find('.item-right .item-info'), function (v, k) {
            return +$(v).data('item');

        });

        if (list.content) {
            var uniqueList = $.map(list.content, function (v, k) {
                if ($.inArray(+v.com_key, arr) == -1) {
                    return v;
                }
            });
        }

        this.renderItems(uniqueList, this.$search);
        this.$itemContent.scrollTop(350);
    },

    initValidator: function () {
        this.validator = new Validator(this.$mod, {
            tipEvent: null
        });
    },
    getData: function (mapStatus, matchNode) {
        var self = this;
        var $leftItem = self.$mod.find('.main-item-info');
        var $ea = $leftItem.find('.ea-view');
        var rightMap = {};
        if (mapStatus == 2) {
            rightMap = {
                ea_num: '',
                com_id: '',
                com_key: ''
            }
        } else {
            rightMap = {
                ea_num: self.TASK_TYPE == 2 ? matchNode.find('.ea-num').val() : matchNode.find('.ea-view').text(),
                com_id: matchNode.data('com'),
                com_key: matchNode.data('item')
            }
        }

        return {
            match_data: {
                t_map: {
                    task_id: self.TASK_ID,
                    task_type: self.TASK_TYPE,
                    zone_id: self.ZONE_ID,
                    map_status: mapStatus,
                    map_id: $leftItem.data('map')
                },
                l_map: {
                    ea_num: self.TASK_TYPE == 2 ? $ea.text() : $ea.val(),
                    com_id: $leftItem.data('com'),
                    com_key: $leftItem.data('item')
                },
                r_map: rightMap
            }
        };
    },

    getDetailList: function (list) {
        //判断返回数据结构
        if (!(list && list.content)) {
            return;
        }
        var content = list.content;
        this.renderMainItem(content);
        this.renderItems(content.compare_list, this.$content);

    },

    nextTask: function (list) {
        var content = list.content;
        if (content) {
            window.location.replace('/task/matchview?task_id=' + content.task_id + '&task_type=' + content.task_type + '&com_id=' + content.compare_list[0].com_id + '&zone_id=' + content.zone_id);
        } else {
            // 最后一个跳过到列表页
            window.location.replace('/task/list');
        }
    },

    //左侧待匹配商品
    renderMainItem: function (content) {
        this.$left.empty().append(artTpl.compile(tpls.MAINITEMTPL)({
            item: content,
            taskType: this.TASK_TYPE,
            competName: this.getCompetName(content.com_id)
        }));
        this.$top.empty().append(artTpl.compile(tpls.TOPTPL)({
            matchCount: content.match_status, //轮数
            competName: this.getCompetName(content.compare_list && content.compare_list[0].com_id) //判断有无数据
        }));
        this.renderBtns(content.match_status);
    },

    renderItems: function (content, $node) {
        //右侧多条匹配数据   由于从数据结构理解左右两侧数据不是并列关系，所以获取数据的时候需要跟进数据结构分别获取
        $node.empty().append(artTpl.compile(tpls.ITEMSTPL)({
            matchList: content, //matchList的数据结构获取点不同
            taskType: this.TASK_TYPE,
            competName: this.getCompetName(content && content[0] && content[0].com_id)
        }));

    },

    /*
     跟据审核轮数决定按钮显示
     */
    renderBtns: function (status) {
        if (status == 0) {
            this.$mod.find('.btn-approve').hide();
        } else {
            this.$mod.find('.btn-fail,.btn-success').hide();
        }
    },

    getCompetName: function (type) {
        return this.competList[type];
    }


};


module.exports = View;
