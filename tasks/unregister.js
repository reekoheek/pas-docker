var path = require('path'),
    fs = require('fs');

var docker;

var unregisterTask = module.exports = function(name) {
    'use strict';

    docker = require('../lib/docker').call(this);

    var config = this.require('config')(),
        rm = this.require('fsutil').rm,
        query = this.require('query');

    if (!name) {
        throw new Error('Usage: pas docker:unregister [name]');
    }

    if (!docker.manifest) {
        throw new Error('Cannot unregister outside package context');
    }

    return query().then(function(p) {
        var container = docker.manifest.containers[name];
        if (!container) {
            throw new Error('Container "' + name + '" not found');
        }


        var manifest = p.readManifest();

        delete manifest.docker.containers[name];

        p.writeManifest(manifest);

        var containerDir = path.join(config.cwd, 'containers', name);
        if (fs.existsSync(containerDir)) {
            rm(containerDir);
        }

        this.report('message', 'Container "' + name + '" unregistered');
    }.bind(this));

};