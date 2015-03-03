var docker = require('../lib/docker')(),
    Promise = require('promise');

var psTask = module.exports = function() {
    'use strict';

    var task = this.require('task');

    return docker.findPackageContainers()
        .then(function(containers) {


            containers.forEach(function(container) {
                var data = {
                    Id: container.info.Id,
                    Name: container.name,
                    Command: container.info.Command,
                    Image: container.info.Image,
                    Status: container.info.Status,
                };
                this.report('header', '%s: %s', container.manifest.name, container.name);
                this.report('header', '-----------------------------------');
                this.report('data', data);
                this.report('header', '');
            }.bind(this));
        }.bind(this));
};

psTask.description = 'Show all container processes';