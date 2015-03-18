var spawn = require('child_process').spawn;
var docker;

var shTask = module.exports = function(name) {
    'use strict';

    docker = require('../lib/docker').call(this);

    var containerManifest = docker.manifest.containers[name];

    if (!containerManifest) {
        throw new Error('Container "' + name + '" not found!');
    }

    return new Promise(function(resolve, reject) {
        var containerName = containerManifest.prefixName + '0';
        var imageName = containerManifest.imageName;
        var cmd;

        if (this.opts.s || this.opts.single) {
            cmd = spawn('docker', ['run', '-ti', imageName, 'bash'], {stdio:'inherit'});
            cmd.on('exit', function(code) {
                if (code === 0 || code === '0') {
                    this.report('message', 'Exit successfully');
                    resolve();
                } else {
                    reject(new Error('Exit with error code: ' + code));
                }
            }.bind(this));
        } else {
            cmd = spawn('docker', ['exec', '-ti', containerName, 'bash'], {stdio:'inherit'});
            cmd.on('exit', function(code) {
                if (code === 0 || code === '0') {
                    this.report('message', 'Exit successfully');
                    resolve();
                } else {
                    reject(new Error('Exit with error code: ' + code));
                }
            }.bind(this));
        }

    }.bind(this));
};