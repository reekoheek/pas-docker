/**
 * Copyright (c) 2015 Xinix Technology
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

var path = require('path'),
    fs = require('fs'),
    spawn = require('child_process').spawn;

// var escapeSpecialChars = function(s) {
//     return s.toString()
//         .replace(/[\s]+/g, ' ');
//         // .replace(/\\'/g, '\\'')
//         // .replace(/\\&/g, '\\&')
//         // .replace(/\\r/g, '\\r')
//         // .replace(/\\t/g, '\\t')
//         // .replace(/\\b/g, '\\b')
//         // .replace(/\\f/g, '\\f');
// };

var detectOrder = function(containers, containerKeys, pocket) {
    'use strict';

    pocket = pocket || [];

    var retval = [];

    containerKeys.forEach(function(name) {
        if (pocket.indexOf(name) >= 0) {
            return;
        }

        pocket.push(name);

        var container = containers[name];

        if (container.volumesFrom) {
            var dependencies = container.volumesFrom.slice(0);
            container.links.forEach(function(c) {
                if (dependencies.indexOf(c) === -1) {
                    dependencies.push(c);
                }
            });

            detectOrder(containers, dependencies, pocket)
                .forEach(function(result) {
                    retval.push(result);
                });
        }

        retval.push(name);
    });

    return retval;
};

var dockerProfile = module.exports = {

    support: function(pack) {
        'use strict';

        return fs.existsSync(path.join(pack.cachePath, 'Dockerfile'));
    },

    up: function(p, opts) {
        'use strict';

        return this.task('docker:up')
            .option(opts)
            .run();
    },

    install: function() {
        'use strict';

        // noop
    },

    dockerCommand: function(container, cmd, args, opts) {
        'use strict';

        var pad = this.require('util/string').pad;

        return new Promise(function(resolve, reject) {
            var i;
            var cmdArgs = [cmd];

            for(i in opts) {
                if (i === 'silent' ||
                    i === 'stdio') {
                    continue;
                }
                var key = '-' + (i.length === 1 ? i : '-' + i);
                var val = opts[i];

                switch(typeof val) {
                    case 'boolean':
                        cmdArgs.push(key + '=' + val);
                        break;
                    case 'object':
                        for(var j in val) {
                            cmdArgs.push(key);
                            cmdArgs.push(val[j]);
                        }
                        break;
                    default:
                        cmdArgs.push(key);
                        cmdArgs.push(val);
                }
            }

            (args || []).forEach(function(arg) {
                cmdArgs.push(arg);
            });

            if (this.debug) {
                this.i('d/docker', '!$ docker %s', cmdArgs.join(' '));
            }

            var docker;
            var errResult = '';
            var outResult = [];

            if (opts.stdio === 'inherit') {
                docker = spawn('docker', cmdArgs, {stdio: 'inherit'});
            } else {
                docker = spawn('docker', cmdArgs);
                docker.stdout.on('data', function(data) {
                    outResult.push(data);

                    if (!opts.silent) {
                        var s = data.toString();
                        s.split('\n').forEach(function(line) {
                            if (line.length) {
                                this.i('i/' + (container ? container.name : '-'), '| %s', line);
                            }
                        }.bind(this));
                    }
                }.bind(this));

                docker.stderr.on('data', function(data) {
                    errResult = data.toString().trim();
                }.bind(this));
            }

            docker.on('close', function(err) {
                if (err) {
                    reject(new Error('<DOCKER> ' + errResult));
                } else {
                    resolve(Buffer.concat(outResult));
                }
            });
        }.bind(this));
    },

    dockerLogs: function(pack, options) {
        'use strict';

        var containers = this.getContainers_(pack, options);

        return Promise.all(Object.keys(containers).map(function(name) {
            var container = containers[name];

            if (options.containerName && options.containerNamef !== name) {
                return;
            }

            return this.dockerCommand(container, 'logs', [container.prefixName + 0], {
                'f': true
            });
        }.bind(this)));
    },

    dockerBuild: function(pack, options) {
        'use strict';

        var pad = this.require('util/string').pad;

        var containers = this.getContainers_(pack, options);

        return Promise.all(Object.keys(containers).map(function(name) {
            var container = containers[name];

            if (options.containerName && name !== options.containerName) {
                return container;
            }

            if (container.image) {
                return container;
            }

            if (!fs.existsSync(container.baseDir)) {
                throw new Error('Container "' + name + '" base directory not found');
            }

            this.i('i/' + container.name, 'Building image %s...', container.imageName);

            return this.dockerCommand(container, 'build', [container.baseDir], {
                    'rm': true,
                    'force-rm': true,
                    't': container.imageName,
                })
                .then(function() {
                    this.i('i/' + container.name, 'Built');
                }.bind(this));
        }.bind(this)));
    },

    dockerList: function(pack, options) {
        'use strict';

        var containers = this.getContainers_(pack, options);

        return Promise.all(Object.keys(containers).map(function(name) {
            var container = containers[name];

            return this.dockerCommand(container, 'inspect', [container.prefixName + 0], {silent: true})
                .then(function(buffer) {
                    var remoteData = JSON.parse(buffer)[0];
                    container.remoteData = remoteData;
                    return container;
                }, function(err) {
                    container.err = err;
                    return container;
                });
        }.bind(this)));
    },

    dockerTop: function(pack, options) {
        'use strict';

        var pad = this.require('util/string').pad;

        var containers = this.getContainers_(pack, options);

        return Promise.all(Object.keys(containers).map(function(name) {
            var container = containers[name];

            if (options.containerName && options.containerName !== name) {
                return;
            }

            return this.dockerCommand(container, 'top', [container.prefixName + 0], {silent: true})
                .then(function(buffer) {
                    var table = buffer.toString().trim().split('\n');
                    var labels,
                        positions = [],
                        lengths = [],
                        printLengths = [];
                    var data = table.map(function(line, num) {
                        if (num === 0) {
                            labels = line.split(/\s+/g);
                            labels.forEach(function(label, i) {
                                var position = line.indexOf(label);
                                if (i > 0 && position < positions[i-1]) {
                                    position = line.indexOf(' ' + label) + 1;
                                }
                                printLengths.push(label.length);
                                positions.push(position);
                            });

                            positions.slice(1).forEach(function(pos, i) {
                                lengths.push(pos - positions[i]);
                            });
                        } else {
                            var record = {};
                            positions.forEach(function(position, i) {
                                var val;
                                if (i < lengths.length) {
                                    val = record[labels[i]] = line.substr(position, lengths[i]).trim();
                                } else {
                                    val = record[labels[i]] = line.substr(position).trim();
                                }

                                if (!printLengths[i] || printLengths[i] <= val.length) {
                                    printLengths[i] = val.length;
                                }
                            });
                            return record;
                        }
                    }).slice(1);

                    this.i('raw', 'Container %s', container.name);
                    // this.i('raw', '%s %s %s %s %s',
                    //     pad('UID', printLengths[0]),
                    //     pad('PID', printLengths[1]),
                    //     pad('PPID', printLengths[2]),
                    //     // pad('STIME', printLengths[3]),
                    //     pad('TTY', printLengths[4]),
                    //     'CMD', printLengths[5]
                    // );
                    data.forEach(function(each) {
                        this.i('raw', '%s %s %s %s %s %s',
                            pad(each.UID, printLengths[0]),
                            pad(each.PID, printLengths[1]),
                            pad(each.PPID, printLengths[2]),
                            // pad(each.STIME, printLengths[3]),
                            pad(each.TTY, printLengths[4]),
                            each.CMD, printLengths[5]
                        );
                    }.bind(this));
                    this.i('raw', '');
                }.bind(this));
        }.bind(this)));
    },

    dockerClean: function(pack, options) {
        'use strict';

        var containers = this.getContainers_(pack, options);

        var args = Object.keys(containers).map(function(name) {
            var container = containers[name];
            return container.imageName;
        });

        return this.dockerCommand(null, 'rmi', args, {
            f: true,
            // 'no-prune': true
        });
    },

    dockerStop: function(pack, options) {
        'use strict';

        var containers = this.getContainers_(pack, options);

        return Promise.all(Object.keys(containers).map(function(name) {
            var container = containers[name];


            if (options.containerName && options.containerName !== name) {
                return;
            }

            // if container persisted then skip removing container
            if (container.persist && !options.f) {
                this.i('i/' + container.name, 'Persisted container (avoid stopping)');
                return;
            }

            this.i('i/' + container.name, 'Stopping %s...', container.name);

            return this.dockerCommand(container, 'rm', [container.prefixName + 0], {
                    f: true
                })
                .then(function() {
                    this.i('i/' + container.name, 'Stopped');
                }.bind(this), function(err) {
                    this.i('i/' + container.name, 'Stop failed gracefully');
                    if (this.debug) {
                        this.e(err);
                    }
                }.bind(this)); // if there is error on stop clear the error
        }.bind(this)));

        // FIXME please implement this later
        // return Promise.resolve();
    },

    dockerCreate: function(pack, options) {
        'use strict';

        var containers = this.getContainers_(pack, options);

        var containerOrders = detectOrder(containers, Object.keys(containers));

        var promise = Promise.resolve();

        containerOrders.forEach(function(key) {
            var container = containers[key];

            if (options.containerName && options.containerName !== key) {
                return;
            }

            var create_ = function() {
                var env = [
                    'PAS_ENV=' + (process.env.PAS_ENV || 'development'),
                    'PAS_PLATFORM=' + process.platform,
                    'PAS_ARCH=' + process.arch,
                    'PAS_PLATFORM_ARCH=' + process.platform + '_' + process.arch,
                ];

                for(var i in container.env) {
                    env.push(container.env[i]);
                }

                var opts = {
                    'name': container.prefixName + 0,
                    'p': container.ports || [],
                    'restart': container.restart || 'always',
                    'e': env,
                    't': container.tty || false,
                    'i': container.interactive || false,
                };

                if (container.volumes) {
                    opts.v = [];
                    container.volumes.forEach(function(volume) {
                        var splitted = volume.split(':');

                        if (splitted[0][0] === '.') {
                            splitted[0] = path.join(this.cwd, splitted[0]);
                        }

                        opts.v.push(splitted.join(':'));
                    }.bind(this));
                }

                if (container.volumesFrom) {
                    opts['volumes-from'] = [];
                    container.volumesFrom.forEach(function(volume) {
                        opts['volumes-from'].push(containers[volume].prefixName + 0);
                    }.bind(this));
                }

                if (container.links) {
                    opts.link = [];
                    container.links.forEach(function(link) {
                        var splitted = link.split(':');
                        if (splitted.length === 1) {
                            opts.link.push(containers[link].prefixName + '0:' + link);
                        } else {
                            throw new Error('Unimplemented yet. contact developer about it');
                        }
                    });
                }


                this.i('i/' + container.name, 'Creating %s...', container.name);
                return this.dockerCommand(container, 'create', [container.imageName], opts)
                    .then(function() {
                        this.i('i/' + container.name, 'Created');
                    }.bind(this));
            }.bind(this);

            if (container.persist) {
                promise = promise.then(function() {
                    return new Promise(function(resolve, reject) {
                        var inspect = spawn('docker', ['inspect', container.prefixName + 0]);

                        inspect.on('close', function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    })
                    .then(function() {}, function() {
                        return create_();
                    });
                }.bind(this));
            } else {
                promise = promise.then(create_);
            }
        }.bind(this));

        return promise;
    },

    dockerStart: function(pack, options) {
        'use strict';

        var containers = this.getContainers_(pack, options);

        var containerOrders = detectOrder(containers, Object.keys(containers));

        var promise = this.dockerCreate(pack, options);

        containerOrders.forEach(function(key) {
            var container = containers[key];

            if (options.containerName && options.containerName !== key) {
                return;
            }

            var opts = {};

            promise = promise.then(function() {
                this.i('i/' + container.name, 'Starting %s...', container.name);

                return this.dockerCommand(container, 'start', [container.prefixName + 0], opts)
                    .then(function() {
                        this.i('i/' + container.name, 'Started');
                    }.bind(this));
            }.bind(this));

        }.bind(this));

        return promise;
    },

    getContainers_: function(pack, options) {
        'use strict';

        options = options || {};

        var containers = {};

        var vendor = options.n || options.name || pack.name.replace('/', '-');

        if (pack.docker && pack.docker.containers) {
            for(var i in pack.docker.containers) {
                var container = pack.docker.containers[i];

                container.name = i;
                if (container.image) {
                    container.imageName = container.image;
                } else {
                    container.imageName = vendor + '/' + i + ':latest';
                }
                container.prefixName = vendor + '-' + container.name + '-';
                container.baseDir = i === 'root' ? this.cwd : path.join(this.cwd, 'containers', i);
                container.scale = 1;

                containers[i] = container;
            }
        }

        return containers;
    }
};
