var Child = require('child_process');
var Fs = require('fs');
var Hoek = require('hoek');

var internals = {
    defaults: {
        dirPath: process.cwd()
    }
};

module.exports = internals.Smelt = function (options) {

    internals.Smelt.settings = Hoek.applyToDefaults(internals.defaults, options);
    this.runCommand = exports.runCommand;
};

internals.splitCommand = function(cmd) {

    var parts = cmd.split(' ');
    var mainCommand = parts[0];
    var args = [];
    for (var i = 1; i < parts.length; i++) {
         args.push(parts[i]);
    }
    return { cmd: mainCommand, args: args };
};

exports.runCommand = function(cmd, callback) {

    if (Fs.existsSync(internals.Smelt.settings.dirPath)) {
        var result = {};
        result.startTime = new Date().getTime();
        var command = internals.splitCommand(cmd);
        var origDir = process.cwd();
        process.chdir(internals.Smelt.settings.dirPath);
        var cmdResult = Child.spawnSync(command.cmd, command.args, { cwd: internals.Smelt.settings.dirPath });
        process.chdir(origDir);
        result.command = cmd;
        result.pid = cmdResult.pid;
        result.signal = cmdResult.signal;
        result.code = cmdResult.status;
        if (cmdResult.error) {
            result.error = cmdResult.error.toString().trim();
            result.status = 'failed';
        }
        if (cmdResult.stdout) {
            result.stdout = cmdResult.stdout.toString().trim();
        }
        if (cmdResult.stderr) {
            result.stderr = cmdResult.stderr.toString().trim();
        }
        if (result.code === 0) {
            result.status = 'succeeded';
        } else {
            result.status = 'failed';
        }
        result.finishTime = new Date().getTime();
        return result;
    }
    return {
        error: 'invalid path: ' + internals.Smelt.settings.dirPath
    };
};
