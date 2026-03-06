---
title: OpenClaw 安装教程：图文极速版
description: 记录在 Ubuntu 24.04 上使用 OpenClaw 官方一键脚本快速完成安装、首次引导和 Web UI 打开的流程。
date: 2026-03-07
tags:
  - OpenClaw
  - Ubuntu
  - 教程
slug: openclaw-install-ubuntu-quickstart
badge: 教程
---

:::warning[先看一眼]
建议在普通用户下安装，不要直接在 `root` 用户下操作，否则比较容易遇到权限或配置异常。
这篇先解决“快速装起来”，配置文件相关内容我后面再单独整理。
:::

如果你只是想尽快把 OpenClaw 跑起来，这篇可以直接照着做。本文环境是 `VMware + Ubuntu 24.04.4`。

<!-- more -->

## 准备工作

### 1. 安装 SSH，方便远程操作

Ubuntu 24.04.4 默认没有安装 SSH，所以我先把它装上，后面就能直接远程连接这台机器。

```bash
sudo apt install ssh
```

![在 Ubuntu 上安装 SSH](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120382.png)

### 2. 安装 `curl`

OpenClaw 官方提供了一键安装脚本，所以还需要提前装好 `curl`。

```bash
sudo apt install curl
```

![在 Ubuntu 上安装 curl](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120381.png)

## 运行一键安装脚本

### 3. 执行 OpenClaw 官方脚本

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

![执行 OpenClaw 官方安装脚本](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120383.png)

### 4. 输入命令后等待安装继续即可

![等待安装脚本运行](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120384.png)

### 5. 如果卡在 `Installing OpenClaw`，先别急

这一段有时会停得比较久，通常继续等待就行。

![Installing OpenClaw 过程截图](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120385.png)

## 首次引导怎么选

### 1. 先选 `Yes`

![引导界面选择 Yes](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033649884.png)

### 2. 选择 `QuickStart`

第一次安装建议直接选 `QuickStart`，先把服务跑起来。后续这些设置基本都可以在配置文件里继续修改。

![选择 QuickStart](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120368.png)

### 3. 遇到可跳过的步骤就先跳过

![跳过可选步骤](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120369.png)

### 4. 这个步骤没有跳过项，照着图里选即可

![按示例完成设置](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120370.png)

### 5. 下一步也可以直接照着图里选

![继续按示例完成设置](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120371.png)

### 6. 这里能跳过，就继续跳过

![继续跳过可选步骤](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120372.png)

### 7. 提示现在配置技能时，先选 `No`

![暂不配置技能](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120374.png)

### 8. 这个界面可以全选

按 `Space` 选择，选完以后在跳过处按回车。

![选择需要的组件](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120375.png)

### 9. 选择 `Open the Web UI`

![选择 Open the Web UI](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120376.png)

## 打开 Web UI

### 10. 安装完成后，往上翻会看到一条 SSH 转发命令

![安装完成后的 SSH 转发信息](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120377.png)

把那行 SSH 命令复制到你的 Windows 终端里执行，输入密码后，再在浏览器打开下面这个地址：

```text
http://localhost:18789/#token=（这里替换成你自己的 token）
```

![在浏览器中打开带 token 的地址](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120378.png)

### 11. 打开后就能看到 OpenClaw 的 Web UI

![OpenClaw Web UI 界面](https://raw.githubusercontent.com/huanmot/image_save/main/image_save1/20260303033120380.png)

## 可能会用到的命令

### 当前会话启用代理

```bash
export {http,https,all}_proxy=http://127.0.0.1:7890
```
