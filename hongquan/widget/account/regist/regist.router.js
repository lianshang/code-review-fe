var Backbone = require('home:widget/ui/backbone/backbone.js');
var View = require('home:widget/account/regist/regist.view.js');
var Model = require('home:widget/account/regist/regist.model.js');

var Regist = Backbone.Router.extend({
    routes: {
        '': 'main',
        'agreement': 'agreement'
    },

    main: function () {
        Model.set({status: "editing"});
    },
    agreement: function () {
        Model.set({status: "agreeing"});
    }
});

// view
new View({model: Model});

$(window).load(function () {
    Backbone.history.start();
});

module.exports = new Regist;
