var docker = require('../lib/docker')();

var stopTask = module.exports = function() {
    'use strict';

    var task = this.require('task');

    return docker.findPackageContainers()
        .then(function(containers) {

            this.report('message', '[%s] stopping containers', docker.packageManifest.name);

            var promises = [];

            containers.forEach(function(container) {

                this.report('message', '    | stopping %s <-> %s', container.manifest.name, container.name);

                var promise = Promise.denodeify(container.stop).bind(container)();
                promises.push(promise);

            }.bind(this));

            return Promise.all(promises);
        }.bind(this));
};

stopTask.description = 'Stop all package containers';
