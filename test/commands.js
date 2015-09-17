var Code = require('code');
var Lab = require('lab');

var Smelt = require('../lib/index');

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

describe('commands', function () {

    it('runCommands', function (done) {

        var smelt = new Smelt({});
        var commands = ['uptime', 'date'];
        var options = {
            commands: commands,
            pidsObj: smelt.settings.pids
        };
        smelt.runCommands(options, function (err, results) {

            expect(results.length).to.equal(2);
            expect(err).to.not.exist();
            expect(results[0].stdout).to.exist();
            expect(results[0].command).to.equal('uptime');
            expect(results[0].status).to.equal('succeeded');
            expect(results[1].stdout).to.exist();
            expect(results[1].command).to.equal('date');
            expect(results[1].status).to.equal('succeeded');
            done();
        });
    });

    it('runCommands parallel', function (done) {

        var smelt = new Smelt({});
        var commands = [['uptime', 'date']];
        var options = {
            commands: commands,
            pidsObj: smelt.settings.pids
        };
        smelt.runCommands(options, function (err, results) {

            expect(err).to.not.exist();
            expect(results.length).to.equal(2);
            expect(results[0].stdout).to.exist();
            expect(results[0].command).to.equal('uptime');
            expect(results[0].status).to.equal('succeeded');
            expect(results[1].stdout).to.exist();
            expect(results[1].command).to.equal('date');
            expect(results[1].status).to.equal('succeeded');
            done();
        });
    });

    it('runCommands invalid', function (done) {

        var smelt = new Smelt({});
        var commands = ['invalid'];
        var options = {
            commands: commands,
            pidsObj: smelt.settings.pids
        };
        smelt.runCommands(options, function (err, results) {

            expect(err).to.exist();
            expect(results.length).to.equal(1);
            expect(results[0].stdout).to.equal('');
            expect(results[0].error).to.contain('ENOENT');
            expect(results[0].command).to.equal('invalid');
            expect(results[0].status).to.equal('failed');
            done();
        });
    });

    it('runCommands signal', function (done) {

        var smelt = new Smelt({});
        var commands = ['sleep 1'];
        var options = {
            commands: commands,
            pidsObj: smelt.settings.pids
        };
        smelt.runCommands(options, function (err, results) {

            expect(err).to.exist();
            expect(results.length).to.equal(1);
            expect(results[0].stdout).to.equal('');
            expect(results[0].signal).to.equal('SIGTERM');
            expect(results[0].command).to.equal('sleep 1');
            expect(results[0].status).to.equal('failed');
            done();
        });
        setTimeout(function () {

            process.kill(smelt.settings.pids[0]);
        }, 200);
    });
});
