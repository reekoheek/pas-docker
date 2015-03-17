var exec = require('child_process').exec,
    docker = require('../lib/docker')();

var cleanTask = module.exports = function() {
    'use strict';

    var task = this.require('task');
    return task({_:['docker:remove']})
        .then(function() {

            var imageNames = [];
            Object.keys(docker.manifest.containers).forEach(function(name) {
                var container = docker.manifest.containers[name];
                if (container.imageName.indexOf(docker.packageManifest.name) === 0) {
                    imageNames.push(container.imageName);
                }
            });

            var execPromise = Promise.denodeify(exec);

            var promise;

            if (imageNames.length > 0) {
                promise = execPromise('docker rmi -f --no-prune ' + imageNames.join(' ') + ' 2> /dev/null');
            } else {
                promise = Promise.resolve();
            }

            return promise
                .then(function() {}, function() {})
                .then(function() {
                    return execPromise('docker rmi -f --no-prune `docker images -a | grep "<none>" | tr -s "[:space:]" | cut -d" " -f3` 2> /dev/null');
                })
                .then(function() {
                    this.report('message', 'Abandoned images deleted successfully.');
                }.bind(this), function() {
                    this.report('message', 'Abandoned images deleted.');
                }.bind(this));
        }.bind(this));

};