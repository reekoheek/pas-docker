var fs = require('fs');

module.exports = function() {
    this.report('data', 'Usage: pas docker[:sub-task] [args..]\n');

    this.report('header', 'Sub Tasks:');

    var data = [];

    fs.readdirSync(__dirname).forEach(function(file) {
        if (file === 'index.js') {
            return;
        }

        var splitted = file.split('.'),
            task = require('./' + splitted[0]);

        data.push({
            _: '',
            name: splitted[0],
            description: task.description || '.'
        });
    }.bind(this));

    this.report('data', data);
};