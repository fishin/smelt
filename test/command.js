var Code = require('code');
var Lab = require('lab');

var Smelt = require('../lib/index');

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

describe('command', function () {

    it('runCommand valid', function (done) {

        var smelt = new Smelt({});
        var command = 'uptime';
        smelt.runCommand(command, null, function (result) {

            expect(result.status).to.equal('succeeded');
            expect(result.command).to.equal('uptime');
            expect(result.stdout).to.exist();
            done();
        });
    });

    it('runCommand valid', function (done) {

        var smelt = new Smelt({});
        var command = 'uptime';
        smelt.runCommand(command, smelt.settings.pids, function (result) {

            expect(result.status).to.equal('succeeded');
            expect(result.command).to.equal('uptime');
            expect(result.stdout).to.exist();
            done();
        });
    });

    it('runCommand invalid command', function (done) {

        var smelt = new Smelt({});
        var command = 'invalid';
        smelt.runCommand(command, smelt.settings.pids, function (result) {

            expect(result.status).to.equal('failed');
            expect(result.command).to.equal('invalid');
            expect(result.error).to.exist();
            done();
        });
    });

    it('runCommand invalid path', function (done) {

        var smelt = new Smelt({ dirPath: 'invalid' });
        var command = 'invalid';
        smelt.runCommand(command, smelt.settings.pids, function (result) {

            //console.log(result);
            expect(result.error).to.equal('invalid path: invalid');
            done();
        });
    });

    it('runCommand failed', function (done) {

        var smelt = new Smelt({});
        var command = 'ls lloyd';
        smelt.runCommand(command, smelt.settings.pids, function (result) {

            //console.log(result);
            expect(result.status).to.equal('failed');
            expect(result.command).to.equal('ls lloyd');
            expect(result.stderr).to.exist();
            done();
        });
    });

    it('runShellCommand valid', function (done) {

        var smelt = new Smelt({});
        var command = 'ls lib/*';
        var options = {
            command: command,
            pidObj: smelt.settings.pids
        };
        smelt.runShellCommand(options, function (result) {

            //console.log(result);
            expect(result.stdout).to.equal('lib/index.js\n');
            expect(result.status).to.equal('succeeded');
            done();
        });
    });

    it('runShellCommand invalid', function (done) {

        var smelt = new Smelt({});
        var command = 'invalid';
        var options = {
            command: command,
            pidObj: smelt.settings.pids
        };
        smelt.runShellCommand(options, function (result) {

            //console.log(result);
            expect(result.error).to.contain('invalid');
            expect(result.status).to.equal('failed');
            done();
        });
    });

    it('runCommandSync valid', function (done) {

        var smelt = new Smelt({});
        var command = 'uptime';
        var options = {
            command: command
        };
        var result = smelt.runCommandSync(options);
        //console.log(result);
        expect(result.status).to.equal('succeeded');
        expect(result.command).to.equal('uptime');
        expect(result.stdout).to.exist();
        done();
    });

    it('runCommandSync invalid command', function (done) {

        var smelt = new Smelt({});
        var command = 'invalid';
        var options = {
            command: command
        };
        var result = smelt.runCommandSync(options);
        //console.log(result);
        expect(result.status).to.equal('failed');
        expect(result.command).to.equal('invalid');
        expect(result.error).to.exist();
        done();
    });

    it('runCommandSync invalid path', function (done) {

        var smelt = new Smelt({ dirPath: 'invalid' });
        var command = 'invalid';
        var options = {
            command: command
        };
        var result = smelt.runCommandSync(options);
        //console.log(result);
        expect(result.error).to.equal('invalid path: invalid');
        done();
    });

    it('runCommandSync failed', function (done) {

        var smelt = new Smelt({});
        var command = 'ls lloyd';
        var options = {
            command: command
        };
        var result = smelt.runCommandSync(options);
        //console.log(result);
        expect(result.status).to.equal('failed');
        expect(result.command).to.equal('ls lloyd');
        expect(result.stderr).to.exist();
        done();
    });

    it('runSSHCommand', function (done) {

        var smelt = new Smelt({});
        var options = {
            username: 'lloyd',
            host: 'localhost',
            command: 'date',
            pidsObj: smelt.settings.pids
        };
        smelt.runSSHCommand(options, function (result) {

            expect(result.status).to.equal('failed');
            expect(result.stderr).to.exist();
            done();
        });
    });

    it('runSSHCommandSync', function (done) {

        var smelt = new Smelt({});
        var options = {
            username: 'lloyd',
            host: 'localhost',
            command: 'date'
        };
        var result = smelt.runSSHCommandSync(options);
        expect(result.status).to.equal('failed');
        expect(result.stderr).to.exist();
        done();
    });
});
