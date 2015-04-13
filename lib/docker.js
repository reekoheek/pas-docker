var Docker = require('dockerode'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');

var docker;

var getDocker = function() {
    'use strict';

    var cwd = this.require('config')().cwd,
        manifest = this.require('manifest');

    if (!docker) {
        var hostUrl = process.env.DOCKER_HOST;
        var tlsVerify = [1,'1',true,'true','yes'].indexOf(process.env.DOCKER_TLS_VERIFY) >= 0 ? true: false;
        var certPath = process.env.DOCKER_CERT_PATH;

        var options = {};

        if (hostUrl) {
            var parsed = url.parse(hostUrl);
            var hostname = parsed.hostname;
            var port = parsed.port;

            options.host = hostname;
            options.port = port;

            if (tlsVerify) {
                options.ca = fs.readFileSync(path.join(certPath, 'ca.pem'));
                options.cert = fs.readFileSync(path.join(certPath, 'cert.pem'));
                options.key = fs.readFileSync(path.join(certPath, 'key.pem'));
            }
        } else {
            options.socketPath = '/var/run/docker.sock';
            var stats  = fs.statSync(options.socketPath);

            if (!stats.isSocket()) {
                throw new Error('Are you sure the docker is running?');
            }
        }

        docker = new Docker(options);

        var defaultDockerManifest = {
            containers: {}
        };
        try {
            var packageManifest = docker.packageManifest = manifest(cwd);

            var vendor = this.opts.n || this.opts.name || packageManifest.name.replace('/', '-');

            docker.manifest = packageManifest.docker || defaultDockerManifest;
            docker.manifest.containers = docker.manifest.containers || {};

            for(var i in docker.manifest.containers) {
                var container = docker.manifest.containers[i];
                container.name = i;
                if (container.image) {
                    container.imageName = container.image;
                } else {
                    container.imageName = vendor + '/' + i + ':latest';
                }
                container.prefixName = vendor + '-' + container.name + '-';
                container.baseDir = i === 'root' ? path.join(cwd) : path.join(cwd, 'containers', i);
                container.scale = 1;
            }
        } catch(e) {
            docker.manifest = defaultDockerManifest;
        }


        docker.findPackageContainers = function(queryName) {
            var containerConfs = Object.keys(docker.manifest.containers)
                .filter(function(containerName) {
                    if (queryName && containerName !== queryName) {
                        return false;
                    }
                    return true;
                })
                .map(function(containerName) {
                    return docker.manifest.containers[containerName];
                });

            return Promise.denodeify(docker.listContainers).bind(docker)({all:true})
                .then(function(containerInfos) {
                    var foundContainers = [];
                    containerInfos.forEach(function(containerInfo) {
                        var nm;
                        containerInfo.Names.some(function(name) {
                            if (name.split('/').length === 2) {
                                nm = name;
                                return true;
                            }
                        });

                        containerConfs.some(function(containerConf) {

                                if (nm.indexOf(containerConf.prefixName) >= 0) {
                                    var container = docker.getContainer(containerInfo.Id);
                                    container.name = nm.substr(1);
                                    container.manifest = containerConf;
                                    container.info = containerInfo;
                                    foundContainers.push(container);
                                    return true;
                                }
                            }.bind(this));
                    }.bind(this));

                    return foundContainers;
                }.bind(this));
        };
    }

    return docker;
};

module.exports = getDocker;