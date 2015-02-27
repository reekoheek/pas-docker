var docker = require('../lib/docker')(),
    Promise = require('promise');

module.exports = {

    exec: function() {
        'use strict';

        var task = this.require('task');

        return task({_:['docker:build']})
            .then(function() {
                return task({_:['docker:remove']});
            })
            .then(function() {
                var packageName = docker.packageManifest.name;

                var promises = [];

                this.report('message', '[%s] creating containers', packageName);

                Object.keys(docker.manifest.containers).forEach(function(name) {
                    var containerConf = docker.manifest.containers[name];


                    for(var i = 0; i < containerConf.scale; i++) {
                        var opts = {
                            name: containerConf.prefixName + i,
                            Image: containerConf.imageName
                        };

                        if (containerConf.command) {
                            opts.Cmd = containerConf.command;
                        }

                        this.report('message', '    | creating %s <-> %s', containerConf.name, opts.name);
                        var promise = Promise.denodeify(docker.createContainer).bind(docker)(opts);
                        promises.push(promise);
                    }
                }.bind(this));

                return Promise.all(promises);
            }.bind(this));
    }
};