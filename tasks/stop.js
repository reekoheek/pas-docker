var docker;

var stopTask = module.exports = function(nameToStop) {
    'use strict';

    var task = this.require('task');

    docker = require('../lib/docker').call(this);

    return docker.findPackageContainers()
        .then(function(containers) {

            this.report('message', '[%s] stopping containers', docker.packageManifest.name);

            var promises = [];

            containers.forEach(function(container) {

                if (nameToStop && container.manifest.name !== nameToStop) {
                    return;
                }

                this.report('message', '    | stopping %s <-> %s', container.manifest.name, container.name);

                var promise = Promise.denodeify(container.stop).bind(container)()
                    .then(function() {}, function() {
                        this.report('warning', '    | %s already stopped', container.name);
                    }.bind(this));
                promises.push(promise);

            }.bind(this));

            return Promise.all(promises);
        }.bind(this));
};

stopTask.description = 'Stop all package containers';
