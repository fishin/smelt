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
        expect(result.stdout).to.exist();
        done();
    });

    it('runCommand invalid', function (done) {

        var smelt = new Smelt(internals.defaults);
        var command = 'invalid';
        var result = smelt.runCommand(command);
        //console.log(result);
        expect(result.status).to.equal('failed');
        expect(result.error).to.exist();
        done();
    });

    it('runCommand failed', function (done) {

        var smelt = new Smelt(internals.defaults);
        var command = 'ls lloyd';
        var result = smelt.runCommand(command);
        //console.log(result);
        expect(result.status).to.equal('failed');
        expect(result.stderr).to.exist();
        done();
    });
});
