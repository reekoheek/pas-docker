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

var shTask = module.exports = function(name, command) {
    'use strict';

    command = command || 'bash';

    if (!name) {
        throw new Error('Usage: pas docker:sh <CONTAINER_NAME> [<COMMAND>]');
    }

    var pack = this.query();

    return pack.fetch()
        .then(function() {
            var container = pack.profile.getContainers_(pack)[name];

            if (!container) {
                throw new Error('Container ' + name + ' not found');
            }

            return pack.profile.dockerCommand(container, 'exec', [container.prefixName + 0, command], {
                stdio: 'inherit',
                t: true,
                i: true
            });
        }.bind(this));

    // var containerManifest = docker.manifest.containers[name];

    // if (!containerManifest) {
    //     throw new Error('Container "' + name + '" not found!');
    // }

    // var commandArr = ['bash'];
    // if (arguments.length > 1) {
    //     commandArr = Array.prototype.slice.call(arguments, 1);
    // }

    // return new Promise(function(resolve, reject) {
    //     var containerName = containerManifest.prefixName + '0';
    //     var imageName = containerManifest.imageName;
    //     var cmd;

    //     if (this.opts.s || this.opts.single) {
    //         cmd = spawn('docker', ['run', '-ti', imageName].concat(commandArr), {stdio:'inherit'});
    //         cmd.on('close', function(code) {
    //             if (code === 0 || code === '0') {
    //                 this.report('message', 'Exit successfully');
    //                 resolve();
    //             } else {
    //                 reject(new Error('Exit with error code: ' + code));
    //             }
    //         }.bind(this));
    //     } else {
    //         cmd = spawn('docker', ['exec', '-ti', containerName].concat(commandArr), {stdio:'inherit'});
    //         cmd.on('close', function(code) {
    //             if (code === 0 || code === '0') {
    //                 this.report('message', 'Exit successfully');
    //                 resolve();
    //             } else {
    //                 reject(new Error('Exit with error code: ' + code));
    //             }
    //         }.bind(this));
    //     }

    // }.bind(this));
};

shTask.description = 'Run shell of container';