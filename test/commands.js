'use strict';

const Code = require('code');
const Lab = require('lab');

const Smelt = require('../lib/index');

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;

describe('commands', () => {

    it('runCommands', (done) => {

        const smelt = new Smelt({});
        const commands = ['uptime', 'date'];
        const options = {
            commands: commands,
            pidsObj: smelt.settings.pids
        };
        smelt.runCommands(options, (err, results) => {

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

    it('runCommands parallel', (done) => {

        const smelt = new Smelt({});
        const commands = [['uptime', 'date']];
        const options = {
            commands: commands,
            pidsObj: smelt.settings.pids
        };
        smelt.runCommands(options, (err, results) => {

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

    it('runCommands invalid', (done) => {

        const smelt = new Smelt({});
        const commands = ['invalid'];
        const options = {
            commands: commands,
            pidsObj: smelt.settings.pids
        };
        smelt.runCommands(options, (err, results) => {

            expect(err).to.exist();
            expect(results.length).to.equal(1);
            expect(results[0].stdout).to.equal('');
            expect(results[0].error).to.contain('ENOENT');
            expect(results[0].command).to.equal('invalid');
            expect(results[0].status).to.equal('failed');
            done();
        });
    });

    it('runCommands signal', (done) => {

        const smelt = new Smelt({});
        const commands = ['sleep 1'];
        const options = {
            commands: commands,
            pidsObj: smelt.settings.pids
        };
        smelt.runCommands(options, (err, results) => {

            expect(err).to.exist();
            expect(results.length).to.equal(1);
            expect(results[0].stdout).to.equal('');
            expect(results[0].signal).to.equal('SIGTERM');
            expect(results[0].command).to.equal('sleep 1');
            expect(results[0].status).to.equal('failed');
            done();
        });
        setTimeout(() => {

            process.kill(smelt.settings.pids[0]);
        }, 200);
    });

    it('runCommands return all commands', (done) => {

        const smelt = new Smelt({});
        const commands = ['invalid', 'uptime'];
        const options = {
            commands: commands,
            pidsObj: smelt.settings.pids
        };
        smelt.runCommands(options, (err, results) => {

            expect(err).to.exist();
            expect(results.length).to.equal(2);
            expect(results[0].stdout).to.equal('');
            expect(results[0].error).to.contain('ENOENT');
            expect(results[0].command).to.equal('invalid');
            expect(results[0].status).to.equal('failed');
            expect(results[1].command).to.equal('uptime');
            done();
        });
    });
});
