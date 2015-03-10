var docker = require('../lib/docker')();

var topTask = module.exports = function() {
    'use strict';

    var task = this.require('task');

    return docker.findPackageContainers()
        .then(function(containers) {

            var promises = [];

            containers.forEach(function(container) {
                var promise = Promise.denodeify(container.top).bind(container)()
                    .then(function(top) {
                        top.container = container;
                        return top;
                    });
                promises.push(promise);
            });

            return Promise.all(promises);
        })
        .then(function(tops) {

            tops.forEach(function(top) {

                var data = [];
                top.Processes.forEach(function(process) {
                    var row = {};
                    top.Titles.forEach(function(title, i) {
                        row[title] = process[i];
                    });
                    data.push(row);
                });

                this.report('header', '%s: %s', top.container.manifest.name, top.container.name);
                this.report('header', '-----------------------------------');
                this.report('data', data);
                this.report('header', '');
            }.bind(this));
        }.bind(this), function(err) {
            // noop
        });
};

topTask.description = 'Show all contained processes';
