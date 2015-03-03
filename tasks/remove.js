var Promise = require('promise'),
    docker = require('../lib/docker')();

var removeTask = module.exports = function() {
    'use strict';

    var packageName = docker.packageManifest.name;

    this.report('message', '[%s] removing containers', packageName);

    return docker.findPackageContainers()
        .then(function(containers) {

            var promises = [];

            containers.forEach(function(container) {

                this.report('message', '    | %s: removing %s', container.manifest.name, container.name);

                var promise = Promise.denodeify(container.inspect).bind(container)()
                    .then(function(data) {
                        if (data.State.Running) {
                            return Promise.denodeify(container.stop).bind(container)();
                        }
                    })
                    .then(function() {
                        return Promise.denodeify(container.remove).bind(container)();
                    });

                promises.push(promise);

            }.bind(this));

            return Promise.all(promises);

        }.bind(this));
};

removeTask.description = 'Remove all package containers';