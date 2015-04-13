var path = require('path'),
    fs = require('fs');

var dockerProfile = module.exports = {

};

dockerProfile.support = function(baseDir) {
    'use strict';

    return fs.existsSync(path.join(baseDir, 'Dockerfile'));
};

dockerProfile.up = function(p, opts) {
    'use strict';

    return this.require('task').run('docker:up', opts);
};