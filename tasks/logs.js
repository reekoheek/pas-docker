var docker = require('../lib/docker')();

var logsTask = module.exports = function() {
    'use strict';

    var name = this.args.length ? this.args[0] : null;
    return docker.findPackageContainers(name)
        .then(function(containers) {
            return new Promise(function(resolve, reject) {
                containers.forEach(function(container) {
                    var opts = {
                        follow: true,
                        stdout: true,
                        stderr: true,
                        // timestamps: true
                    };
                    container.logs(opts, function(err, stream) {
                        if (err) {
                            return reject(err);
                        }
                        stream.on('data', function(data) {
                            var d = data.toString('utf8').trim();
                            if (d.length === 8) return;
                            this.report('message', '%s-%s | %s',
                                container.manifest.name,
                                container.name.substr(container.manifest.prefixName.length),
                                d);
                        }.bind(this));

                        stream.on('end', function() {
                            console.log('{{end of stream}}');
                        });
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }.bind(this));
};

logsTask.description = 'Show logs stream of container';