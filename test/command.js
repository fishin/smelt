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
/*
    it('runBashCommand', function (done) {

        var smelt = new Smelt({});
        var command = 'ls /tmp/*';
        smelt.runBashCommand(command, smelt.settings.pids, function (result) {

            console.log(result);
            //expect(result.status).to.equal('failed');
            expect(result.command).to.equal('bash -c "ls /tmp/*"');
            done();
        });
    });
*/
    it('runCommandSync valid', function (done) {

        var smelt = new Smelt({});
        var command = 'uptime';
        var result = smelt.runCommandSync(command);
        //console.log(result);
        expect(result.status).to.equal('succeeded');
        expect(result.command).to.equal('uptime');
        expect(result.stdout).to.exist();
        done();
    });

    it('runCommandSync invalid command', function (done) {

        var smelt = new Smelt({});
        var command = 'invalid';
        var result = smelt.runCommandSync(command);
        //console.log(result);
        expect(result.status).to.equal('failed');
        expect(result.command).to.equal('invalid');
        expect(result.error).to.exist();
        done();
    });

    it('runCommandSync invalid path', function (done) {

        var smelt = new Smelt({ dirPath: 'invalid' });
        var command = 'invalid';
        var result = smelt.runCommandSync(command);
        //console.log(result);
        expect(result.error).to.equal('invalid path: invalid');
        done();
    });

    it('runCommandSync failed', function (done) {

        var smelt = new Smelt({});
        var command = 'ls lloyd';
        var result = smelt.runCommandSync(command);
        //console.log(result);
        expect(result.status).to.equal('failed');
        expect(result.command).to.equal('ls lloyd');
        expect(result.stderr).to.exist();
        done();
    });

    it('runSSHCommand', function (done) {

        var smelt = new Smelt({});
        var username = 'lloyd';
        var host = 'localhost';
        var command = 'date';
        smelt.runSSHCommand(username, host, command, smelt.settings.pids, function (result) {

            expect(result.status).to.equal('failed');
            expect(result.stderr).to.exist();
            done();
        });
    });

    it('runSSHCommandSync', function (done) {

        var smelt = new Smelt({});
        var username = 'lloyd';
        var host = 'localhost';
        var command = 'date';
        var result = smelt.runSSHCommandSync(username, host, command);
        expect(result.status).to.equal('failed');
        expect(result.stderr).to.exist();
        done();
    });
});
