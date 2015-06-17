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

var spawn = require('child_process').spawn;

var upTask = module.exports = function() {
    'use strict';

    var pack = this.query();

    return pack.fetch()
        .then(function() {
            this.i('t/docker', 'Upping %s', pack.name);

            if (pack.profile.name !== 'docker') {
                throw new Error('Cannot build non docker pack');
            }

            return pack.profile.dockerStop(pack, this.option());
        }.bind(this))
        .then(function() {
            return pack.profile.dockerBuild(pack, this.option());
        }.bind(this))
        .then(function() {
            return pack.profile.dockerStart(pack, this.option());
        }.bind(this))
        .then(function() {
            this.i('raw', '');
            return this.task('docker:ps').run();
        }.bind(this));
};

upTask.description = 'Stop all package containers';
