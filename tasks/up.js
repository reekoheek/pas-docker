var docker;

var upTask = module.exports = function() {
    'use strict';

    docker = require('../lib/docker').call(this);

    var task = this.require('task');

    return task.run('docker:stop', this.opts)
        .then(function(containers) {
            return task.run('docker:create', this.opts);
        }.bind(this))
        .then(function(containers) {
            return task.run('docker:start', this.opts);
        }.bind(this))
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
