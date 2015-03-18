var docker;

var listTask = module.exports = function() {
    'use strict';

    docker = require('../lib/docker').call(this);

    Object.keys(docker.manifest.containers).forEach(function(name) {
        var container = docker.manifest.containers[name];

        var data = container;
        this.report('sep', '');
        this.report('header', name);
        this.report('data', data);
    }.bind(this));
};