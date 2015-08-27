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
    this.runCommands = exports.runCommands;
    this.runShellCommand = exports.runShellCommand;
};

internals.splitCommand = function (options) {

    var parts = options.command.split(' ');
    var mainCommand = parts[0];
    var args = [];
    if (mainCommand === '/bin/sh' && parts[1] === '-c') {
        args.push(parts[1]);
        var command = '';
        for (var i = 2; i < parts.length; i++) {
            command += parts[i] + ' ';
        }
        args.push(command.trim());
    } else {
        for (var j = 1; j < parts.length; j++) {
            args.push(parts[j]);
        }
    }
    //console.log(args);
    return { command: mainCommand, args: args };
};

exports.runCommandSync = function (options) {

    console.log(options.command);
    if (Fs.existsSync(internals.Smelt.settings.dirPath)) {
        var result = {};
        result.startTime = new Date().getTime();
        var splitOptions = {
            command: options.command
        };
        var command = internals.splitCommand(splitOptions);
        var origDir = process.cwd();
        process.chdir(internals.Smelt.settings.dirPath);
        var cmdResult = Child.spawnSync(command.command, command.args, { cwd: internals.Smelt.settings.dirPath });
        process.chdir(origDir);
        result.command = options.command;
        result.pid = cmdResult.pid;
        result.signal = cmdResult.signal;
        result.code = cmdResult.status;
        result.output = '';
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
        var options = {
            command: cmd
        };
        var command = internals.splitCommand(options);
        var origDir = process.cwd();
        process.chdir(internals.Smelt.settings.dirPath);
        var cmdResult = Child.spawn(command.command, command.args, { cwd: internals.Smelt.settings.dirPath, stdin: 'inherit' });
        //console.log(cmdResult.pid);
        process.chdir(origDir);
        result.command = cmd;
        result.pid = cmdResult.pid;
        if (pidsObj) {
            pidsObj.push(result.pid);
        }
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
                //result.error = result.output;
                result.status = 'failed';
            }
            result.finishTime = new Date().getTime();
            if (pidsObj) {
                pidsObj.pop(result.pid);
            }
            return callback(result);
        });
    } else {
        return callback({ error: 'invalid path: ' + internals.Smelt.settings.dirPath });
    }
};


exports.runSSHCommandSync = function (options) {

    var sshCommand = 'ssh -o StrictHostKeyChecking=no -o BatchMode=yes ' + options.username + '@' + options.host + ' "' + options.command + '"';
    var result = internals.Smelt.runCommandSync({ command: sshCommand });
    return result;
};

exports.runSSHCommand = function (options, callback) {

    var sshCommand = 'ssh -o StrictHostKeyChecking=no -o BatchMode=yes ' + options.username + '@' + options.host + ' "' + options.command + '"';
    internals.Smelt.runCommand(sshCommand, options.pidsObj, function (result) {

        return callback(result);
    });
};

exports.runCommands = function (options, callback) {

    var results = [];
    var iterate = function iterate (i) {

        var err = null;
        var nextCommand = options.commands.shift();
        if (!nextCommand) {
            return callback(results);
        }
        if (typeof nextCommand === 'object') {

            console.log('parallel time: ' + nextCommand);
            // need to support parallel later
            for (var j = nextCommand.length - 1; j >= 0; j--) {
                // put commands back at the beginning
                //console.log('adding command: ' + nextCommand[j]);
                options.commands.unshift(nextCommand[j]);
            }
            return iterate(i);
        }
        internals.Smelt.runCommand(nextCommand, options.pidsObj, function (result) {

            results.push(result);
            if (result.code !== 0) {

                //console.log('code: ' + result.code);
                err = result.code + ': ' + result.stderr;
                //err = result.stderr;
            }
            if (result.signal) {

                //console.log(signal);
                //console.log('i received a signal ' + result.signal);
                err = result.signal + ' signal sent.';
            }
            if (result.error) {
                err = result.error;
            }
            if (err) {
                //console.log('all done due to err');
                //process.chdir(origDir);
                return callback(results);
            }
            return iterate(i + 1);
        });
    };
    iterate(0);
};

exports.runShellCommand = function (options, callback) {

    internals.Smelt.runCommand('/bin/sh -c ' + options.command, options.pidsObj, function (result) {

        if (result.code !== 0) {
            result.error = result.output;
        }
        return callback(result);
    });
};
