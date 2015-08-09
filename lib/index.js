var Child = require('child_process');
var Fs = require('fs');
var Hoek = require('hoek');

var internals = {
    defaults: {
        pids: [],
        dirPath: process.cwd()
    }
};

module.exports = internals.Smelt = function (options) {

    this.settings = Hoek.applyToDefaults(internals.defaults, options);
    internals.Smelt.settings = this.settings;
    this.runCommand = exports.runCommand;
    internals.Smelt.runCommandSync = exports.runCommandSync;
    internals.Smelt.runCommand = exports.runCommand;
    this.runCommandSync = exports.runCommandSync;
    this.runSSHCommand = exports.runSSHCommand;
    this.runSSHCommandSync = exports.runSSHCommandSync;
};

internals.splitCommand = function (cmd) {

    var parts = cmd.split(' ');
    var mainCommand = parts[0];
    var args = [];
    for (var i = 1; i < parts.length; i++) {
        args.push(parts[i]);
    }
    return { cmd: mainCommand, args: args };
};

exports.runCommandSync = function (cmd) {

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
            result.output += cmdResult.error.toString().trim();
            result.status = 'failed';
        }
        if (cmdResult.stdout) {
            result.stdout = cmdResult.stdout.toString().trim();
            result.output += cmdResult.stdout.toString().trim();
        }
        if (cmdResult.stderr) {
            result.stderr = cmdResult.stderr.toString().trim();
            result.output += cmdResult.stderr.toString().trim();
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

exports.runCommand = function (cmd, pidsObj, callback) {

    if (Fs.existsSync(internals.Smelt.settings.dirPath)) {
        var result = {};
        result.startTime = new Date().getTime();
        var command = internals.splitCommand(cmd);
        var origDir = process.cwd();
        process.chdir(internals.Smelt.settings.dirPath);
        var cmdResult = Child.spawn(command.cmd, command.args, { cwd: internals.Smelt.settings.dirPath });
        process.chdir(origDir);
        result.command = cmd;
        result.pid = cmdResult.pid;
        pidsObj.push(result.pid);
        result.signal = cmdResult.signal;
        result.code = cmdResult.status;
        result.stdout = '';
        result.stderr = '';
        result.error = '';
        result.output = '';
        // capture stdout and stderr and full output
        cmdResult.stdout.on('data', function (data) {

            result.stdout += data.toString();
            result.output += data.toString();
        });
        cmdResult.stderr.on('data', function (data) {

            result.stderr += data.toString();
            result.output += data.toString();
        });
        cmdResult.on('error', function (err) {

            result.status = 'failed';
            result.error += err.toString();
            result.output += err.toString();
        });
        cmdResult.on('close', function (code, signal) {

            result.code = code;
            result.signal = signal;
            if (result.code === 0) {
                result.status = 'succeeded';
            } else {
                result.status = 'failed';
            }
            result.finishTime = new Date().getTime();
            return callback(result);
        });
    } else {
        return callback({ error: 'invalid path: ' + internals.Smelt.settings.dirPath });
    }
};


exports.runSSHCommandSync = function (username, host, cmd) {

    var sshCommand = 'ssh -o StrictHostKeyChecking=no -o BatchMode=yes ' + username + '@' + host + ' "' + cmd + '"';
    var result = internals.Smelt.runCommandSync(sshCommand);
    return result;
};

exports.runSSHCommand = function (username, host, cmd, pidsObj, callback) {

    var sshCommand = 'ssh -o StrictHostKeyChecking=no -o BatchMode=yes ' + username + '@' + host + ' "' + cmd + '"';
    internals.Smelt.runCommand(sshCommand, pidsObj, function (result) {

        return callback(result);
    });
};
