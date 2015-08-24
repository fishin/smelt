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
//    this.runBashCommand = exports.runBashCommand;
};

internals.splitCommand = function (cmd) {

    var parts = cmd.split(' ');
    var mainCommand = parts[0];
    var args = [];
//    var doubleQuote = '';
//    var quoteCnt = 0;
    for (var i = 1; i < parts.length; i++) {
//        if (parts[i].match('"')) {
//            quoteCnt++;
//            doubleQuote += parts[i] + ' ';
            //console.log(doubleQuote);
//            if (quoteCnt === 2) {
//                args.push(doubleQuote.trim());
//                quoteCnt = 0;
//            }
//        } else {
//            if (quoteCnt === 0) {
        args.push(parts[i]);
//            }
//        }
    }
    //console.log(args);
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
        var command = internals.splitCommand(cmd);
        var origDir = process.cwd();
        process.chdir(internals.Smelt.settings.dirPath);
        var cmdResult = Child.spawn(command.cmd, command.args, { cwd: internals.Smelt.settings.dirPath, stdin: 'inherit' });
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
            pidsObj.pop(result.pid);
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

exports.runCommands = function (commands, pidsObj, callback) {

    var results = [];

    var iterate = function iterate (i) {

        var err = null;
        var nextCommand = commands.shift();
        if (!nextCommand) {
            return callback(results);
        }
        if (typeof nextCommand === 'object') {

            console.log('parallel time: ' + nextCommand);
            // need to support parallel later
            for (var j = nextCommand.length - 1; j >= 0; j--) {
                // put commands back at the beginning
                //console.log('adding command: ' + nextCommand[j]);
                commands.unshift(nextCommand[j]);
            }
            return iterate(i);
        }
        internals.Smelt.runCommand(nextCommand, pidsObj, function (result) {

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

/*
exports.runBashCommand = function (command, pidsObj, callback) {

    internals.Smelt.runCommand('bash -c "' + command + '"', pidsObj, function (result) {

        return callback(result);
    });
};
*/
