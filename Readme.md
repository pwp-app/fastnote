<p align="center">
    <img src="https://raw.githubusercontent.com/backrunner/Fastnote/master/Readme.header.png"></img>
</p>
<p align="center">
    <a href="https://github.com/backrunner/Fastnote/releases">
        <img src="https://img.shields.io/github/v/tag/backrunner/Fastnote?label=version&style=flat-square"></img>
    </a>
    <a href="https://github.com/backrunner/Fastnote/commits/master">
        <img src="https://img.shields.io/github/last-commit/backrunner/Fastnote?style=flat-square"></img>
    </a>
    <a href="https://github.com/backrunner/Fastnote/commits/master">
        <img src="https://img.shields.io/github/commits-since/backrunner/Fastnote/0.4.1?style=flat-square"></img>
    </a>
    <a href="https://github.com/backrunner/Fastnote/blob/master/LICENSE">
        <img src="https://img.shields.io/github/license/backrunner/Fastnote?style=flat-square"></img>
    </a>
</p>

# Fastnote

## 概述

Fastnote 是一个高效的、基于 Electron 开发的便签应用。  
我们致力于通过“类聊天”的交互方式打造高效的速记体验，让你从此远离在桌面上靠新建 txt 记事的日子。  
未来将加入云同步、分享等功能，且计划开发其他平台的客户端。

## 获取应用

### 下载并安装稳定版（推荐）

请前往官网下载本应用，目前仅提供 Windows 版本  

[note.pwp.app](https://note.pwp.app)  

下载后直接运行安装包即可  
后续会考虑上架微软商店，但目前只提供官网这一个下载渠道。

### 获取源码并通过源码启动

获取源代码：

```shell
git clone -b master https://github.com/backrunner/Fastnote.git
```

进入项目目录，用以下命令启动应用：

```shell
npm run start
```

如需开启开发模式，请执行以下命令，再启动应用：

```javascript
gulp debug
```

## 分支说明

master - 主分支  
dev - 开发分支，完成某一阶段后代码会合入 master  
dev-cloud - 云同步功能的开发分支，该分支会在同步功能大体完成后废弃

## 目录说明

app     ->  应用源码  
> app/tools   ->  工具脚本

assets  ->  图片素材  
src     ->  页面源码  
> src/less    ->  页面样式  
> src/pages   ->  页面文件  
> src/scripts ->  页面脚本  

## 可用命令

生成静态文件至 public

```shell
gulp build
gulp clean-build    // 清理环境后生成
```

清理 public 目录

```shell
gulp clean
```

监控文件改动并实时生成（页面部分）

```shell
gulp watch
```

打包应用

```shell
npm run build:win32
npm run build:win64
```

发布（使用七牛云对象存储，需在gulpfile.js里设置相关变量）

```shell
gulp publish
```

## 当前开发计划

客户端：

- [x] 备份带有分类
- [x] 热更新
- [ ] 新的重置选项
- [ ] 测试用控制台

云系统：

- [x] 用户登录登出完善
- [ ] 首次同步
- [ ] 用于云同步的操作日志系统

## 项目未来

目前预计会使用SpringBoot这一套技术栈先把云同步做好，暂定会推出一个基于Vue的Lite版本，Lite会先做Web端，然后再考虑PWA化。

## 许可证

[GPLv3](https://github.com/backrunner/Fastnote/blob/master/LICENSE) © BackRunner
