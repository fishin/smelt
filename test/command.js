'use strict';

const Code = require('code');
const Lab = require('lab');

const Smelt = require('../lib/index');

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;

describe('command', () => {

    it('runCommand valid', (done) => {

        const smelt = new Smelt({});
        const command = 'uptime';
        smelt.runCommand(command, null, (result) => {

            expect(result.status).to.equal('succeeded');
            expect(result.command).to.equal('uptime');
            expect(result.stdout).to.exist();
            done();
        });
    });

    it('runCommand valid', (done) => {

        const smelt = new Smelt({});
        const command = 'uptime';
        smelt.runCommand(command, smelt.settings.pids, (result) => {

            expect(result.status).to.equal('succeeded');
            expect(result.command).to.equal('uptime');
            expect(result.stdout).to.exist();
            done();
        });
    });

    it('runCommand invalid command', (done) => {

        const smelt = new Smelt({});
        const command = 'invalid';
        smelt.runCommand(command, smelt.settings.pids, (result) => {

            expect(result.status).to.equal('failed');
            expect(result.command).to.equal('invalid');
            expect(result.error).to.exist();
            done();
        });
    });

    it('runCommand invalid path', (done) => {

        const smelt = new Smelt({ dirPath: 'invalid' });
        const command = 'invalid';
        smelt.runCommand(command, smelt.settings.pids, (result) => {

            //console.log(result);
            expect(result.error).to.equal('invalid path: invalid');
            done();
        });
    });

    it('runCommand failed', (done) => {

        const smelt = new Smelt({});
        const command = 'ls lloyd';
        smelt.runCommand(command, smelt.settings.pids, (result) => {

            //console.log(result);
            expect(result.status).to.equal('failed');
            expect(result.command).to.equal('ls lloyd');
            expect(result.stderr).to.exist();
            done();
        });
    });

    it('runShellCommand valid', (done) => {

        const smelt = new Smelt({});
        const command = 'ls lib/*';
        const options = {
            command: command,
            pidObj: smelt.settings.pids
        };
        smelt.runShellCommand(options, (result) => {

            //console.log(result);
            expect(result.stdout).to.equal('lib/index.js');
            expect(result.status).to.equal('succeeded');
            done();
        });
    });

    it('runShellCommand invalid', (done) => {

        const smelt = new Smelt({});
        const command = 'invalid';
        const options = {
            command: command,
            pidObj: smelt.settings.pids
        };
        smelt.runShellCommand(options, (result) => {

            //console.log(result);
            expect(result.error).to.contain('invalid');
            expect(result.status).to.equal('failed');
            done();
        });
    });

    it('runSSHCommand', (done) => {

        const smelt = new Smelt({});
        const options = {
            username: 'lloyd',
            host: 'localhost',
            command: 'date',
            pidsObj: smelt.settings.pids
        };
        smelt.runSSHCommand(options, (result) => {

            expect(result.status).to.equal('failed');
            expect(result.stderr).to.exist();
            done();
        });
    });

    it('getProcesses', (done) => {

        const smelt = new Smelt({});
        smelt.getProcesses((processes) => {

            //console.log(processes);
            expect(processes.length).to.be.above(0);
            done();
        });
    });

    it('getCommandByPID 1', (done) => {

        const smelt = new Smelt({});
        smelt.getCommandByPID(1, (result) => {

            expect(result.command).to.equal('ps -h -p 1 -o command');
            //console.log(result.output);
            expect(result.output).to.exist();
            expect(result.error).to.equal('');
            done();
        });
    });

    it('getCommandByPID 0', (done) => {

        const smelt = new Smelt({});
        smelt.getCommandByPID(0, (result) => {

            expect(result.command).to.equal('ps -h -p 0 -o command');
            expect(result.error).to.not.equal('');
            done();
        });
    });
});
