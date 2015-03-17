var docker = require('../lib/docker')(),
    path = require('path'),
    spawn = require('child_process').spawn;

var detectOrder = function(containers, pocket) {
    'use strict';

    pocket = pocket || [];

    var retval = [];

    containers.forEach(function(name) {
        if (pocket.indexOf(name) >= 0) {
            return;
        }

        pocket.push(name);

        var container = docker.manifest.containers[name];

        if (container.volumesFrom) {
            detectOrder(container.volumesFrom, pocket).forEach(function(result) {
                retval.push(result);
            });
        }

        retval.push(name);
    });

    return retval;
};

var createTask = module.exports = function() {
    'use strict';

    var task = this.require('task');
    var config = this.require('config')();

    return task({_:['docker:build']})
        .then(function() {
            return task({_:['docker:remove']});
        })
        .then(function() {
            var packageName = docker.packageManifest.name;
            this.report('message', '[%s] pulling required images', packageName);

            var promises = [];
            Object.keys(docker.manifest.containers).forEach(function(name) {
                var image = docker.manifest.containers[name].image;

                if (image) {
                    var img = docker.getImage(image);
                    var promise = Promise.denodeify(img.inspect).bind(img)()
                        .then(null, function(a) {
                            this.report('message', '    | %s: pulling %s', name, image);

                            return new Promise(function(resolve, reject) {
                                var pull = spawn('docker', ['pull', image]);
                                pull.stdout.on('data', function(data) {
                                    this.report('message', '    | %s: %s', name, data.toString().trim());
                                }.bind(this));

                                pull.stderr.on('data', function(data) {
                                    this.report('message', '   e| %s: %s', name, data.toString().trim());
                                }.bind(this));

                                pull.on('close', function(code) {
                                    if (code) {
                                        reject(new Error('Error on pulling with code: ' + code));
                                    } else {
                                        resolve();
                                    }
                                });
                            }.bind(this));
                        }.bind(this));
                    promises.push(promise);
                }
            }.bind(this));

            return Promise.all(promises);
        }.bind(this))
        .then(function() {
            var packageName = docker.packageManifest.name;

            var orders = detectOrder(Object.keys(docker.manifest.containers));

            this.report('message', '[%s] creating containers (%s)', packageName, orders);

            var promise = Promise.resolve();

            orders.forEach(function(name) {

                var containerConf = docker.manifest.containers[name];

                var opts = {
                    Image: containerConf.imageName,
                    Volumes: {},
                    HostConfig: {
                        VolumesFrom: [],
                        Binds: []
                    }
                };

                if (containerConf.command) {
                    opts.Cmd = containerConf.command;
                }

                if (containerConf.volumesFrom) {
                    var volumesFrom = opts.HostConfig.VolumesFrom = opts.HostConfig.VolumesFrom || [];
                    containerConf.volumesFrom.forEach(function(c) {
                        var splitted = c.split(':');
                        var containerName = splitted[0];
                        var suffix = splitted[1] ? ':' + splitted[1] : '';
                        volumesFrom.push(docker.manifest.containers[containerName].prefixName + '0' + suffix);
                    });
                }

                // console.log(opts);

                if (containerConf.volumes) {

                    var binds = opts.HostConfig.Binds = opts.HostConfig.Binds || [];

                    containerConf.volumes.forEach(function(v) {
                        var splitted = v.split(':');

                        if (splitted.length === 1) {
                            opts.Volumes[v] = {};
                        } else {
                            var origin = path.resolve(splitted[0]);
                            var destination = splitted.slice(1).join(':');

                            opts.Volumes[destination] = {};

                            binds.push(origin + ':' + destination);
                        }
                    });

                    // FIXME this is ugly hack to include pas home here
                    binds.push(config.home + ':' + config.home);
                    // console.log(binds);
                }


                promise = promise.then(function() {
                    var promises = [];

                    for(var i = 0; i < containerConf.scale; i++) {
                        opts.name = containerConf.prefixName + i;
                        this.report('message', '    | %s: creating %s', containerConf.name, opts.name);
                        promises.push(Promise.denodeify(docker.createContainer).bind(docker)(opts));
                    }

                    return Promise.all(promises);
                }.bind(this));
            }.bind(this));

            return promise;
        }.bind(this));
};

createTask.description = 'Create package containers';