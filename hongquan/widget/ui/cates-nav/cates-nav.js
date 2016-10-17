var $ = require('home:widget/ui/zepto/zepto.js');
var T = require('home:widget/ui/tpl/tpl.js');

var tpl = [
    '{{if cates && cates.length}}',
    '<div class="cates-nav-mask"></div>',
    '<div class="cates-nav">',
        '<div class="trigger"><span>{{cates[0].name}}（{{cates[0].num}}）</span><i class="iconf i-triangle-b"></i></div>',
        '<ul class="cates">',
            '{{each cates as cate}}',
            '<li data-cat-id="{{cate.catid}}"{{if cates[0].catid == cate.catid}} class="current"{{/if}}>{{cate.name}}（{{cate.num}}）</li>',
            '{{/each}}',
        '</ul>',
    '</div>',
    '{{/if}}',
].join('');

/**
 * 分类导航组件
 * 场景:
 *     历史页
 *     收藏页
 * @param  opts   object
 * @param  opts.$el    jquery object      mod模块
 * @param  opts.className   string        渲染容器(类名)
 * @param  opts.cateList    object        分类数据
 */

var CatesNav = function (opts) {
    this.$el = opts.$el;
    this.container = $(opts.className);
    console.log(this.container);
    this.init(opts);
};

CatesNav.prototype = {
    init: function (opts) {
        this.catesList = opts.catesList? opts.catesList : null;
        this.render();
        this.bindEvent();
    },
    render: function () {
        this.container.html(T.compile(tpl)({cates:this.catesList}));
    },
    bindEvent: function () {
        var self = this;
        self.$trigger = self.$el.find('.trigger');
        self.$triggerSpan = self.$trigger.children('span');
        self.$triggerI = self.$trigger.children('i');
        self.$cates = self.$el.find('.cates');
        self.$catesLi = self.$cates.children('li');

        self.unbindEvent();
        self.$el.on('click.cateNav', '.trigger' ,function () {
            self.$cates.toggle();
            self.toggleIcon().changeMask('toggle');
        }).on('click.cateNav', '.cates li' , function () {
            var $this = $(this);
            var catId  = $this.data('cat-id');
            self.changeMask('hide').toggleCates({target:$this}).toggleIcon();
            self.$el.trigger('e-cates-nav-change',{cat_id:catId});
        }).on('click.cateNav', '.cates-nav-mask', function () {
            self.changeMask('hide').toggleIcon();
            self.$cates.toggle();
        });
    },
    unbindEvent: function () {
      this.$el.off('.cateNav');
    },
    /**
     * 切换分类项改变样式
     * @param opts
     * @param opts.target     (jquery)object   当前点击的分类项
     */
    toggleCates: function (opts) {
        this.$cates.toggle();
        this.$catesLi.removeClass('current');
        opts.target.addClass('current');
        this.$triggerSpan.text(opts.target.text());
        return this;
    },
    /**
     * 改变展开\收起时右侧icon的状态
     */
    toggleIcon: function () {
        this.$triggerI.toggleClass('i-triangle-b i-triangle-t');
        return this;
    },

    /**
     *
     * @param action         string      show or hide or toogle 变化的值
     * @returns {CatesNav}
     */
    changeMask: function ( action ) {
        if ( !action ) return;
        var $mask =  this.$el.find('.cates-nav-mask');
        this.$el.find('.cates-nav-mask')[action]();
        $mask.css('display') == 'none' ? this.backScroll(true) : this.backScroll(false);
        return this;
    },

    /**
     * 底部滑动
     * @param isScroll       boolean    是否滑动
     */
    backScroll: function (isScroll) {
        var $doc  = $('html,body');
        isScroll ?
            $doc.css({'overflow':'auto','height':'auto'}) :
            $doc.css({'overflow':'hidden','height':'100%'});
    },
    constructor: CatesNav
};

module.exports = CatesNav;
