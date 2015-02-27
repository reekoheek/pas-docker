var Promise = require('promise'),
    tar = require('tar-fs'),
    docker = require('../lib/docker')();

var buildTask = {
    exec: function() {
        'use strict';

        var images = [];

        var packageName = docker.packageManifest.name;

        Object.keys(docker.manifest.containers).forEach(function(name) {
            var container = docker.manifest.containers[name];

            images.push(new Promise(function(resolve, reject) {

                if (container.image) {
                    this.report('message', '[%s] doesn\'t need to build "%s"', packageName, container.name);
                    return resolve(container);
                }

                this.report('message', '[%s] building "%s" %s', packageName, container.name, container.imageName);

                var tarStream = tar.pack(container.baseDir);

                docker.buildImage(tarStream, {
                    t: container.imageName
                }, function(error, output) {
                    if (error) {
                        return reject(error);
                    }

                    output.on('data', function(data) {
                        data = JSON.parse(data);
                        this.report('message', '    | %s: %s', container.name, data.stream.trim());
                    }.bind(this));

                    output.on('end', function() {
                        resolve(container);
                    });

                    output.on('error', function(err) {
                        reject(err);
                    });
                }.bind(this));
            }.bind(this)));
        }.bind(this));

        return Promise.all(images);
    }
};

module.exports = buildTask;