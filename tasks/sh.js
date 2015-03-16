var spawn = require('child_process').spawn,
    docker = require('../lib/docker')();

var shTask = module.exports = function(name) {
    'use strict';

    var containerManifest = docker.manifest.containers[name];

    if (!containerManifest) {
        throw new Error('Container "' + name + '" not found!');
    }

    return new Promise(function(resolve, reject) {
        var containerName = containerManifest.prefixName + '0';
        var imageName = containerManifest.imageName;

        console.log(this.opts);

        var cmd = spawn('docker', ['run', '-ti', imageName, 'bash'], {stdio:'inherit'});
        cmd.on('exit', function(code) {
            if (code === 0 || code === '0') {
                this.report('message', 'Exit successfully');
                resolve();
            } else {
                reject(new Error('Exit with error code: ' + code));
            }
        }.bind(this));
    }.bind(this));
};