var Docker = require('dockerode'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    Promise = require('promise');

var docker;

var getDocker = function() {
    'use strict';

    if (!docker) {
        var hostUrl = process.env.DOCKER_HOST;
        var tlsVerify = process.env.DOCKER_TLS_VERIFY == 1 ? true: false;
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
            var packageManifest = docker.packageManifest = require(path.join(process.cwd(), 'pas.json'));
            docker.manifest = packageManifest.docker || defaultDockerManifest;
            docker.manifest.containers = docker.manifest.containers || {};

            for(var i in docker.manifest.containers) {
                var container = docker.manifest.containers[i];
                container.name = i;
                if (container.image) {
                    container.imageName = container.image;
                } else {
                    container.imageName = packageManifest.name + '-' + i + ':latest';
                }
                container.prefixName = packageManifest.name.replace('/', '-') + '-' + container.name + '-';
                container.baseDir = i === 'root' ? '.' : path.join('containers', i);
                container.scale = 1;
            }
        } catch(e) {
            docker.manifest = defaultDockerManifest;
        }


        docker.findPackageContainers = function() {
            return Promise.denodeify(docker.listContainers).bind(docker)({all:true})
                .then(function(containerInfos) {
                    var foundContainers = [];
                    containerInfos.forEach(function(containerInfo) {
                        var container;
                        var containerConfs = Object.keys(docker.manifest.containers)
                            .map(function(containerName) {
                                return docker.manifest.containers[containerName];
                            })
                            .some(function(containerConf) {
                                if (containerInfo.Names[0].indexOf(containerConf.prefixName) >= 0) {
                                    var container = docker.getContainer(containerInfo.Id);
                                    container.name = containerInfo.Names[0].substr(1);
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