const inquirer = require('inquirer');
const moment = require('moment');
const fs = require('fs-extra');
const _ = require('lodash');
const Plugin = require('webiny/lib/plugin');
const Webiny = require('webiny/lib/webiny');
const Task = require('./task');

class Deploy extends Plugin {
    constructor(program) {
        super(program);

        this.task = 'deploy';
        this.title = 'Deploy existing release archive';
        this.selectApps = false;
    }

    runTask(config, onFinish) {
        const task = new Task();
        return task.run(config).then(onFinish);
    }

    runWizard(config, onFinish) {
        const lastRun = Webiny.getConfig().lastRun;
        let steps = [{
            type: 'input',
            name: 'host',
            message: 'Enter SSH connection string (e.g. username@server.com:port):',
            default: lastRun.host || null,
            validate: (value) => {
                if (value.length < 1) {
                    return 'Please enter a target host';
                }
                return true;
            }
        }, {
            type: 'input',
            name: 'domain',
            message: 'Enter the domain of the website you are deploying:',
            validate: Webiny.validate.url,
            default: lastRun.domain || null
        }, {
            type: 'input',
            name: 'basicAuth',
            message: 'Enter Basic Authentication credentials to access your website (leave blank if not required):'
        }];

        if (!config.release) {
            // Prepend a new step with release archives selection
            const options = {cwd: fs.realpathSync(process.env.PWD), env: process.env, stdio: 'pipe'};
            const res = Webiny.shellExecute('ls -1 ' + Webiny.projectRoot('releases') + '/*.zip', options);

            const list = res.toString();
            const choices = [];
            _.trimEnd(list, '\n').split('\n').map(function (line) {
                choices.push('releases/' + _.trimEnd(line, '/').split('/').pop());
            });

            steps.unshift({
                type: 'list',
                choices,
                name: 'release',
                message: 'Select a release to deploy:'
            });
        }

        return inquirer.prompt(steps).then(answers => {
            _.merge(config, answers);
            lastRun.host = answers.host;
            lastRun.domain = answers.domain;

            Webiny.saveConfig(_.assign(Webiny.getConfig(), {lastRun}));
            return this.runTask(config, onFinish);
        }).catch(err => {
            console.log(err);
        });
    }
}

module.exports = Deploy;