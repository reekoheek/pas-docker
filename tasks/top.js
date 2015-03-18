var docker;

var topTask = module.exports = function() {
    'use strict';

    var task = this.require('task');

    docker = require('../lib/docker').call(this);

    return docker.findPackageContainers()
        .then(function(containers) {

            var promises = [];

            containers.forEach(function(container) {
                var promise = Promise.denodeify(container.top).bind(container)()
                    .then(function(top) {
                        top.container = container;
                        return top;
                    }, function(err) {
                        var top = {
                            Processes: [],
                            container: container,
                        };
                        return top;
                    });
                promises.push(promise);
            });

            return Promise.all(promises);
        })
        .then(function(tops) {
            tops.forEach(function(top) {
                this.report('separator', '');

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
                if (data.length) {
                    this.report('data', data);
                } else {
                    this.report('empty', '-');
                }
            }.bind(this));
        }.bind(this), function(err) {
            // noop
        });
};

topTask.description = 'Show all contained processes';
