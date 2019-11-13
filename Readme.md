![Fastnote](https://github.com/backrunner/Fastnote/blob/master/assets/images/logo.png?raw=true)

# Fastnote

## 概述

Fastnote是一个高效的、基于Electron开发的桌面速记工具。

我们致力于通过“类聊天”的交互方式打造高效的便签速记体验，让你从此逃离在桌面上靠新建txt记事的日子。

未来将加入云同步、分享等功能，且计划开发其他平台的客户端。

## 获取应用

请前往官网下载

[note.pwp.app](https://note.pwp.app)

后续会考虑上架微软商店，但目前只提供官网这一个下载渠道。

## 使用方法

### 基于源码使用

使用命令提示符进入项目目录，用以下命令启动应用：

```shell
electron .
```

如需开启开发模式，请执行：

```javascript
gulp debug
```

### 使用稳定版（推荐）

前往[项目主页](https://note.pwp.app)下载安装，应用支持自动更新。

## 项目目录结构

app     ->  应用源码

> app/tools   ->  工具脚本

assets  ->  图片素材

src     ->  页面源码

> src/less    ->  页面样式
> src/pages   ->  页面文件
> src/scripts ->  页面脚本

## 可用命令

打包整个应用

```shell
npm run build
```

生成文件至public

```shell
gulp build
gulp clean-build    //清理环境后生成
```

监控文件改动实时生成（页面部分）

```shell
gulp watch
```

发布（使用七牛云对象存储，需在gulpfile.js里设置相关变量）

```shell
gulp publish
```

## 当前开发计划

- [ ] 备份带有分类
- [x] 用户登录登出完善
- [ ] 首次同步
- [ ] 用于云同步的操作日志系统

## 许可证

GPLv3 © BackRunner
