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
    // Docker = require('dockerode'),
    url = require('url');

// var getDocker = function() {
//     'use strict';

//     var hostUrl = process.env.DOCKER_HOST;
//     var tlsVerify = [1,'1',true,'true','yes'].indexOf(process.env.DOCKER_TLS_VERIFY) >= 0 ? true: false;
//     var certPath = process.env.DOCKER_CERT_PATH;

//     var options = {};
//     if (hostUrl) {
//         var parsed = url.parse(hostUrl);
//         var hostname = parsed.hostname;
//         var port = parsed.port;

//         options.host = hostname;
//         options.port = port;

//         if (tlsVerify) {
//             options.ca = fs.readFileSync(path.join(certPath, 'ca.pem'));
//             options.cert = fs.readFileSync(path.join(certPath, 'cert.pem'));
//             options.key = fs.readFileSync(path.join(certPath, 'key.pem'));
//         }
//     } else {
//         options.socketPath = '/var/run/docker.sock';
//         var stats  = fs.statSync(options.socketPath);

//         if (!stats.isSocket()) {
//             throw new Error('Are you sure the docker is running?');
//         }
//     }

//     return new Docker(options);
// };

module.exports = {

    initialize: function() {
        'use strict';

        var docker_;

        Object.defineProperty(this, 'docker', {
            get: function() {
                if (!docker_) {
                    docker_ = getDocker();
                }

                return docker_;
            }
        });
    },

    profiles: [
        path.join(__dirname, 'profiles', 'docker.js')
    ],
};