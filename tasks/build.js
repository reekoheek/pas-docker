var Promise = require('promise'),
    tar = require('tar-fs'),
    docker = require('../lib/docker')();

var escapeSpecialChars = function(s) {
    return JSON.stringify(s.toString())
        .replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");
};

var buildTask = function() {
    'use strict';

    var images = [];

    var packageName = docker.packageManifest.name;

    this.report('message', '[%s] building images', packageName);

    Object.keys(docker.manifest.containers).forEach(function(name) {
        var container = docker.manifest.containers[name];

        images.push(new Promise(function(resolve, reject) {

            if (container.image) {
                // this.report('message', '[%s] doesn\'t need to build "%s"', packageName, container.name);
                return resolve(container);
            }

            this.report('message', '    | %s: building %s', container.name, container.imageName);

            var tarStream = tar.pack(container.baseDir);

            docker.buildImage(tarStream, {
                t: container.imageName
            }, function(error, output) {
                if (error) {
                    return reject(error);
                }

                output.on('data', function(data) {
                    data = JSON.parse(escapeSpecialChars(data));
                    if (data.stream) {
                        this.report('message', '    | %s: %s', container.name, data.stream.trim());
                    } else if (data.status) {
                        this.report('message', '    | %s: %s', container.name, data.status.trim());
                    }
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
};

buildTask.description = 'Build package images';

module.exports = buildTask;