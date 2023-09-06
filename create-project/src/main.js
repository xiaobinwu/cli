import chalk from 'chalk' // 使终端输出彩色信息文案
import fs from 'fs'
import ncp from 'ncp' // 递归拷贝文件
import path from 'path'
import { promisify } from 'util'
import execa from 'execa' // 允许开发中使用类似Git外部命令
import  Listr from 'listr' // 声明执行的任务队列，给出当前进度
import { projectInstall } from 'pkg-install' // 使用yarn install或npm install安装依赖

const access = promisify(fs.access)
const copy = promisify(ncp)

// 递归拷贝文件
async function copyTemplateFiles(options) {
    return copy(options.templateDirectory, options.targetDirectory, {
        clobber: false
    })
}

async function initGit(options) {
    // 执行git init命令
    const result = await execa('git', ['init'], {
        cwd: options.targetDirectory
    })
    if (result.failed) {
        return Promise.reject(new Error('git 初始化项目失败'))
    }
    return
}

// 创建项目
export async function createProject(options) {
    options = {
        ...options,
        targetDirectory: options.targetDirectory || process.cwd(),
    }
    // const currentFileUrl = import.meta.url // 获取当前模块的URL
    // console.log(currentFileUrl, 'currentFileUrl')
    // console.log(new URL(currentFileUrl).pathname, 'new URL(currentFileUrl).pathname,')
    // 非window
    // const templateDir = path.resolve(
    //     new URL(currentFileUrl).pathname,
    //     '../templates',
    //     options.template.toLowerCase()
    // )


    // window
    const currentScriptUrl = new URL(import.meta.url);
    let relativePath = currentScriptUrl.pathname;
    console.log(relativePath)
    // Remove the leading slash (/) in the pathname
    relativePath = relativePath.slice(1);

    // Replace any backslashes (\) with forward slashes (/)
    relativePath = relativePath.replace(/\\/g, '/');

    const templateDir = path.resolve(
        relativePath,
        '../../templates',
        options.template.toLowerCase()
    )

    console.log(templateDir, 'templateDir')
    options.templateDirectory = templateDir
    console.log(options, 'options')
    try {
        // 判断模板是否存在
        await access(templateDir, fs.constants.R_OK)
    } catch (error) {
        // 模板不存在
        console.error('%s 项目模板不存在', chalk.red.bold('错误'))
        process.exit(1)
    }
    const tasks = new Listr([
        {
            title: '拷贝项目模板',
            task: () => copyTemplateFiles(options)
        },
        {
            title: 'git初始化',
            task: () => initGit(options),
            enabled: () => options.git
        },
        {
            title: '安装依赖',
            task: () => {
                projectInstall({ cwd: options.targetDirectory })
            },
            skip: () => {
                return !options.runInstall ? '通过 --install 去自动安装依赖' : undefined
            }
        }
    ])
    await tasks.run()
    console.log('%s 项目准备好了...', chalk.green.bold('成功'))
    return true
}