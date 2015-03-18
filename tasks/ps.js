var docker;
var psTask = module.exports = function() {
    'use strict';

    docker = require('../lib/docker').call(this);

    var task = this.require('task');

    return docker.findPackageContainers()
        .then(function(containers) {

            containers.forEach(function(container) {
                this.report('sep', '');
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
            }.bind(this));
        }.bind(this));
};

psTask.description = 'Show all container processes';