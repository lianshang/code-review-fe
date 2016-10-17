var commonHeader = require('home:widget/ui/header/header.js');
var tpls = {
    activityDetailCanvas: [
        commonHeader('{{activityInfo.name}}'),

        '<section class="activity-info">',
            '<img class="img" src="{{activityInfo.img[imgScale]}}" alt="img" />',
            '<div class="brief-info-wrap">',
                '<div class="clearfix brief-info">',
                    '<p class="name">活动规则:</p>',
                    '<p class="value">',
                    '{{activityInfo.description}}',
                    // '{{if activityInfo.promo_type == 2}}',
                    // '<br /><em>满{{activityInfo.promo_detail.upto}}减{{activityInfo.promo_detail.cut}}</em>',
                    // '{{/if}}',
                    '</p>',
                '</div>',
                '<div class="clearfix brief-info">',
                    '<p class="name">活动时间:</p>',
                    '<p class="value">{{activityInfo.begin_at | stampFormat:"yyyy.MM.dd hh:mm"}} - {{activityInfo.end_at | stampFormat:"yyyy.MM.dd  hh:mm"}}</p>',
                '</div>',
            '</div>',
        '</section>',

        '<section class="items">',
            '<ul></ul>',
        '</section>'

        //'{{if activityList && activityList.length > 0}}',
        //'<section class="relative-activity">',
        //    '<h2>其他促销</h2>',
        //    '<ul class="clearfix">',
        //        '{{each activityList as activity}}',
        //        '<li>',
        //            '<a href="/home/activity?activity_id={{activity.id}}">',
        //                '<img src="{{activity.img.large}}" />',
        //            '</a>',
        //        '</li>',
        //        '{{/each}}',
        //    '</ul>',
        //'</section>',
        //'{{/if}}'
    ].join('')
};

module.exports = tpls;
