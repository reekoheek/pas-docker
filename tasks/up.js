var docker = require('../lib/docker')(),
    Promise = require('promise');

module.exports = function() {
    'use strict';

    var task = this.require('task');

    return task({_:['docker:create']})
        .then(function(containers) {
            return task({_:['docker:start']});
        });
};