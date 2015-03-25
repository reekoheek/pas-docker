var path = require('path'),
    fs = require('fs');

var dockerProfile = module.exports = {

};

dockerProfile.support = function(baseDir) {
    'use strict';

    return fs.existsSync(path.join(baseDir, 'Dockerfile'));
};


// FIXME should not here
// dockerProfile.postInstall = function() {
//     var task = this.require('task');

//     return task({_:['docker:up']});
// };