var docker = require('../lib/docker')();

var listTask = module.exports = function() {
    'use strict';

    Object.keys(docker.manifest.containers).forEach(function(name) {
        var container = docker.manifest.containers[name];

        var data = container;
        this.report('sep', '');
        this.report('header', name);
        this.report('data', data);
    }.bind(this));
};