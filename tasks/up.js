var docker = require('../lib/docker')();

var upTask = module.exports = function() {
    'use strict';

    var task = this.require('task');

    return task({_:['docker:stop']})
        .then(function(containers) {
            return task({_:['docker:create']});
        })
        .then(function(containers) {
            return task({_:['docker:start']});
        })
        .then(function() {
            return docker.findPackageContainers()
                .then(function(containers) {
                    var result = {};
                    containers.forEach(function(container) {
                        result[container.manifest.name] = (result[container.manifest.name] || 0) + 1;
                    });

                    this.report('sep', '');
                    this.report('header', 'Running containers:');
                    this.report('data', result);
                }.bind(this));
        }.bind(this));
};

upTask.description = 'Stop all package containers';
