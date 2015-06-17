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

var topTask = module.exports = function(name) {
    'use strict';

    var pack = this.query();
    var options = this.option() || {};

    if (name) {
        options.containerName = name;
    }

    return pack.fetch()
        .then(function() {
            return pack.profile.dockerTop(pack, options);
        });

    // var task = this.require('task');

    // docker = require('../lib/docker').call(this);

    // return docker.findPackageContainers()
    //     .then(function(containers) {

    //         var promises = [];

    //         containers.forEach(function(container) {
    //             var promise = Promise.denodeify(container.top).bind(container)()
    //                 .then(function(top) {
    //                     top.container = container;
    //                     return top;
    //                 }, function(err) {
    //                     var top = {
    //                         Processes: [],
    //                         container: container,
    //                     };
    //                     return top;
    //                 });
    //             promises.push(promise);
    //         });

    //         return Promise.all(promises);
    //     })
    //     .then(function(tops) {
    //         tops.forEach(function(top) {
    //             this.report('separator', '');

    //             var data = [];
    //             top.Processes.forEach(function(process) {
    //                 var row = {};
    //                 top.Titles.forEach(function(title, i) {
    //                     row[title] = process[i];
    //                 });
    //                 data.push(row);
    //             });

    //             this.report('header', '%s: %s', top.container.manifest.name, top.container.name);
    //             this.report('header', '-----------------------------------');
    //             if (data.length) {
    //                 this.report('data', data);
    //             } else {
    //                 this.report('empty', '-');
    //             }
    //         }.bind(this));
    //     }.bind(this), function(err) {
    //         // noop
    //     });
};

topTask.description = 'Show all contained processes';
