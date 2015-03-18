var docker = require('../lib/docker')(),
    path = require('path'),
    fs = require('fs');

var unregisterTask = module.exports = function(name) {
    'use strict';

    var config = this.require('config')(),
        rm = this.require('fsutil').rm;

    if (!name) {
        throw new Error('Usage: pas docker:unregister [name]');
    }

    if (!docker.manifest) {
        throw new Error('Cannot unregister outside package context');
    }

    var container = docker.manifest.containers[name];
    if (!container) {
        throw new Error('Container "' + name + '" not found');
    }

    var manifestFile = path.join(config.cwd, 'pas.json');
    var manifest = require(manifestFile);

    delete manifest.docker.containers[name];

    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

    var containerDir = path.join(config.cwd, 'containers', name);
    if (fs.existsSync(containerDir)) {
        rm(containerDir);
    }

    this.report('message', 'Container "' + name + '" unregistered');
};