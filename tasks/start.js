var docker;
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

        if (container.links) {
            detectOrder(container.links, pocket).forEach(function(result) {
                retval.push(result);
            });
        }

        retval.push(name);
    });

    return retval;
};

var startTask = module.exports = function(nameToStart) {
    'use strict';

    docker = require('../lib/docker').call(this);

    var packageName = docker.packageManifest.name;

    var orders = detectOrder(Object.keys(docker.manifest.containers));

    this.report('message', '[%s] starting containers (%s)', packageName, orders);

    return docker.findPackageContainers()
        .then(function(containers) {
            var promise = Promise.resolve();

            orders.forEach(function(name) {
                if (nameToStart && nameToStart !== name) {
                    return;
                }
                var containerConf = docker.manifest.containers[name];

                promise = promise.then(function() {
                    var promises = [];

                    var opts = {
                        HostConfig: {
                            Links: [],
                            PortBindings: {},
                            RestartPolicy: {
                                Name: 'always'
                            }
                        }
                    };

                    if (containerConf.links) {
                        var links = opts.HostConfig.Links = opts.HostConfig.Links || [];

                        containerConf.links.forEach(function(link) {
                            var splitted = link.split(':');
                            var origin = splitted[0];
                            var destination = (splitted[1] || origin) + '-0';

                            links.push(docker.manifest.containers[origin].prefixName + '0:' + destination);
                        });
                    }

                    if (containerConf.ports) {
                        if (containerConf.ports === true) {
                            opts.HostConfig.PublishAllPorts = true;
                        } else if (containerConf.ports) {
                            containerConf.ports.forEach(function(p) {
                                var matches = p.match(/^(?:(\w+(?:\.\w+)+):)?(?:(\d+):)?(\d+)(?:\/(tcp|udp)?)?$/);
                                if (!matches) {
                                    throw new Error('Error on ports config: ' + p);
                                }

                                var pd = {
                                    listen: matches[1] || '',
                                    host: matches[2],
                                    port: matches[3],
                                    proto: matches[4] || 'tcp'
                                };

                                if (!pd.host) {
                                    pd.host = pd.port;
                                }

                                var key = pd.port + '/' + pd.proto;
                                opts.HostConfig.PortBindings[key] = opts.HostConfig.PortBindings[key] || [];
                                opts.HostConfig.PortBindings[key].push({
                                    HostPort: pd.host
                                });
                            });
                        }
                    }

                    containers.forEach(function(container) {
                        if (name === container.manifest.name) {
                            this.report('message', '    | %s: starting %s', container.manifest.name, container.name);

                            promises.push(Promise.denodeify(container.start).bind(container)(opts));
                        }
                    }.bind(this));

                    return Promise.all(promises);

                }.bind(this));
            }.bind(this));

            return promise;
        }.bind(this));

    // return docker.findPackageContainers()
    //     .then(function(containers) {

    //         this.report('message', '[%s] starting containers', docker.packageManifest.name);

    //         var promises = [];

    //         containers.forEach(function(container) {

    //             this.report('message', '    | %s: starting %s', container.manifest.name, container.name);

    //             var promise = Promise.denodeify(container.start).bind(container)();
    //             promises.push(promise);

    //         }.bind(this));

    //         return Promise.all(promises);
    //     }.bind(this));
};

startTask.description = 'Start all package containers';