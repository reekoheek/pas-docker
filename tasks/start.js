var docker = require('../lib/docker')(),
    Promise = require('promise');

module.exports = function() {
    'use strict';

    var task = this.require('task');

    return docker.findPackageContainers()
        .then(function(containers) {

            this.report('message', '[%s] starting containers', docker.packageManifest.name);

            var promises = [];

            containers.forEach(function(container) {

                this.report('message', '    | starting %s <-> %s', container.manifest.name, container.name);

                var promise = Promise.denodeify(container.start).bind(container)();
                promises.push(promise);

            }.bind(this));

            return Promise.all(promises);
        }.bind(this));
};