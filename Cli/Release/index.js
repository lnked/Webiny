const inquirer = require('inquirer');
const moment = require('moment');
const _ = require('lodash');
const Plugin = require('webiny/lib/plugin');
const Webiny = require('webiny/lib/webiny');
const Task = require('./task');

class Release extends Plugin {
    constructor(program) {
        super(program);

        this.task = 'release';
        this.title = 'Create release archive';
        this.selectApps = false;
    }

    runTask(config, onFinish) {
        const task = new Task();
        return task.run(config);
    }

    runWizard(config, onFinish, runTask) {
        return inquirer.prompt([{
            type: 'input',
            name: 'release',
            message: 'Where do you want to store the release archive (including file name)?',
            validate: function (value) {
                const writable = Webiny.validate.writable(value);
                if (writable !== true) {
                    return writable;
                }

                if (!value.endsWith('.zip')) {
                    return 'Please include a file name for your archive!';
                }
                return true;
            },
            default: function () {
                const zipName = 'release-' + moment().format('YYYYMMDD-HHmmss') + '.zip';
                return 'releases/' + zipName;
            }
        }]).then(answers => {
            config.release = answers.release;
            return this.runTask(config, onFinish, runTask).then(release => {
                return inquirer.prompt([{
                    type: 'confirm',
                    name: 'deploy',
                    message: 'Do you want to deploy this release to remote server?',
                    default: true
                }]).then(answers => {
                    if (answers.deploy) {
                        return runTask('deploy', config);
                    }
                    onFinish();
                });
            });
        });
    }
}

module.exports = Release;