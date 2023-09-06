import arg from 'arg' // 解析cli命令参数
import inquirer from 'inquirer' // 命令行交互输入
import { createProject } from './main'

// 解析命令行参数的options
function parseArgumentsIntoOptions(rawArgs) {
    // 使用args进行解析
    const args = arg(
        {
            '--git': Boolean,
            '--yes': Boolean,
            '--install': Boolean,
            '--g': '--git',
            '--y': '--yes',
            '--i': '--install',
        },
        {
            argv: rawArgs.slice(2)
        }
    )
    return {
        skipPrompts: args['--yes'] || false,
        git: args['--git'] || false,
        template: args._[0],
        runInstall: args['--install'] || false,
    }
}

async function promptForMissingOptions(options) {
    // 默认使用名为Javascript模板
    const defaultTemplate = 'Javascript'
    // 使用默认模板到直接返回
    if (options.skipPrompts) {
        return {
            ...options,
            template: options.template || defaultTemplate
        }
    }
    // 准备交互式问题
    const questions = [];
    if (!options.template) {
        questions.push({
            type: 'list',
            name: 'template',
            message: '请选择您的项目需要使用哪个模板',
            choices: ['Javascript', 'Typescript'],
            default: defaultTemplate
        })
    }
    if (!options.git) {
        questions.push({
            type: 'confirm',
            name: 'git',
            message: '是否初始化一个git仓库？',
            default: false
        })
    }
    // 使用inquirer进行交互式查询，获取用户的答案选项
    const answers = await inquirer.prompt(questions)
    return {
        ...options,
        template: options.template || answers.template,
        git: options.git || answers.git
    }
}


export async function cli(args) {
    // 获取命令行配置
    let options= parseArgumentsIntoOptions(args)
    options = await promptForMissingOptions(options)
    console.log(options)
    await createProject(options)
}