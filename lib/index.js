var Child = require('child_process');
var Hoek = require('hoek');

var internals = {};

module.exports = internals.Smelt = function (options) {

    //internals.Smelt.settings = Hoek.applyToDefaults(internals.defaults, options);
    this.runCommand = exports.runCommand;
};

internals.splitCommand = function(cmd) {
  
    var parts = cmd.split(" ");
    var mainCommand = parts[0];
    var args = [];
    for (var i = 1; i < parts.length; i++) {
         args.push(parts[i]);
    }
    return { cmd: mainCommand, args: args };
};

exports.runCommand = function(cmd, callback) {

    var result = {};
    result.startTime = new Date().getTime();
    var command = internals.splitCommand(cmd);
    var subProcess = Child.spawn.apply(Child.spawn, [ command.cmd, command.args ]);
    result.pid = subProcess.pid;
    console.log('running command "' + cmd + '" with pid ' + result.pid);
    // capture stdout and stderr
    result.stdout='';
    result.stderr='';
    subProcess.stdout.on('data', function (data) {

        result.stdout += data.toString();
    });

    subProcess.stderr.on('data', function (data) {

        result.stderr += data.toString();
    });

    subProcess.on('error', function (err) {

        result.finishTime = new Date().getTime();
        result.status = 'failed';
        result.error = err.toString();
        return callback(result);
    });

    subProcess.on('exit', function (code, signal) {

        if (result.stderr) {
            result.status = 'failed';
        } else {
            result.status = 'succeeded';
        }
        result.finishTime = new Date().getTime();
        result.code = code;
        result.signal = signal;
        return callback(result);
    });
};
