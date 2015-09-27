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
    this.getCommandFromPid = exports.getCommandFromPid;
    internals.Smelt.runCommand = exports.runCommand;
    this.runSSHCommand = exports.runSSHCommand;
    this.runCommands = exports.runCommands;
    this.runShellCommand = exports.runShellCommand;
    this.getProcesses = exports.getProcesses;
    this.getCommandByPID = exports.getCommandByPID;
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

            result.error = result.error.trim();
            result.stdout = result.stdout.trim();
            result.stderr = result.stderr.trim();
            result.output = result.output.trim();
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
            return callback(err, results);
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
                // add rest of commands that didnt finish
                //console.log(options.commands);
                for (var k = 0; k < options.commands.length; k++) {
                    results.push({ command: options.commands[k] });
                }
                return callback(err, results);
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

exports.getProcesses = function (callback) {

    internals.Smelt.runCommand('ps -A -o pid,ppid,command', null, function (result) {

        var fullProcesses = [];
        var processes = result.output.trim().split('\n');
        for (var i = 0; i < processes.length; i++) {
            var processArray = processes[i].trim().replace(/\s+/, ' ').split(' ');
            var command = '';
            for (var j = 2; j < processArray.length; j++) {
                command += processArray[j] + ' ';
            }
            var process = {
                pid: processArray[0],
                ppid: processArray[1],
                command: command.trim()
            };
            if (process.pid !== 'PID') {
                fullProcesses.push(process);
            }
        }
        return callback(fullProcesses);
    });
};

exports.getCommandByPID = function (pid, callback) {

    internals.Smelt.runCommand('ps -h -p ' + pid + ' -o command', null, function (result) {

        if (result.code !== 0) {
            result.error = result.output;
        }
        return callback(result);
    });
};
