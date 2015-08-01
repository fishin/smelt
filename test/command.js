var Code = require('code');
var Lab = require('lab');

var Smelt = require('../lib/index');

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

var internals = {
    defaults: {
        dirPath: process.cwd()
    }
};

describe('command', function () {

    it('runCommand valid', function (done) {

        var smelt = new Smelt(internals.defaults);
        var command = 'uptime';
        var result = smelt.runCommand(command);
        //console.log(result);
        expect(result.status).to.equal('succeeded');
        expect(result.command).to.equal('uptime');
        expect(result.stdout).to.exist();
        done();
    });

    it('runCommand invalid command', function (done) {

        var smelt = new Smelt(internals.defaults);
        var command = 'invalid';
        var result = smelt.runCommand(command);
        //console.log(result);
        expect(result.status).to.equal('failed');
        expect(result.command).to.equal('invalid');
        expect(result.error).to.exist();
        done();
    });

    it('runCommand invalid path', function (done) {

        var smelt = new Smelt({ dirPath: 'invalid' });
        var command = 'invalid';
        var result = smelt.runCommand(command);
        //console.log(result);
        expect(result.error).to.equal('invalid path: invalid');
        done();
    });

    it('runCommand failed', function (done) {

        var smelt = new Smelt(internals.defaults);
        var command = 'ls lloyd';
        var result = smelt.runCommand(command);
        //console.log(result);
        expect(result.status).to.equal('failed');
        expect(result.command).to.equal('ls lloyd');
        expect(result.stderr).to.exist();
        done();
    });

    it('runSSHCommand', function (done) {

        var smelt = new Smelt(internals.defaults);
        var username = 'lloyd';
        var host = 'localhost';
        var command = 'date';
        var result = smelt.runSSHCommand(username, host, command);
        expect(result.status).to.equal('failed');
        expect(result.stderr).to.exist();
        done();
    });
});
