---
name: run-app
description: >
  启动「奶龙记账」桌面应用（Electron + Vite 开发模式）。
  用户输入 /run-app，或说「启动应用」「打开奶龙记账」「运行项目」「启动开发环境」「跑起来」时务必使用本技能。
---

# 启动奶龙记账应用

本技能只负责**在本仓库**把奶龙记账以开发模式跑起来，让用户能看到桌面窗口。

## 默认启动方式（日常首选）

在项目根目录 `bookkeeping/` 执行：

```bash
npm run dev
```

说明（给小白）：

- 这相当于同时打开「网页热更新服务」和「桌面窗口壳」。
- 改界面代码后，窗口里一般会自动刷新，不必每次重新打包。
- 必须在**项目根目录**执行（有 `package.json` 的那一层）。

## 执行步骤（按顺序）

1. **确认工作目录**  
   当前目录应是奶龙记账仓库根目录。若不确定，先确认存在 `package.json` 且其中 `"name"` 为 `nailong-bookkeeping`。

2. **检查依赖是否已安装**  
   - 若没有 `node_modules` 目录，先执行：`npm install`  
   - 安装失败时：贴出终端原文，用大白话解释，并停止后续启动，不要假装已启动成功。

3. **启动开发模式**  
   - **Windows / Claude Code 终端常见坑**：若环境里存在 `ELECTRON_RUN_AS_NODE=1`，Electron 会被当成普通 Node 跑，出现  
     `TypeError: Cannot read properties of undefined (reading 'whenReady')`，**窗口打不开**。  
   - 启动时务必清掉该变量，优先用：  
     `env -u ELECTRON_RUN_AS_NODE npm run dev`  
     （若当前 shell 不支持 `env -u`，可用：`ELECTRON_RUN_AS_NODE= npm run dev` 或先 `unset ELECTRON_RUN_AS_NODE` 再 `npm run dev`。）  
   - 不要只执行裸的 `npm run dev`（在被污染的环境里会失败）。  
   - 该命令会持续运行，应使用**后台/不阻塞会话**的方式启动，避免卡死对话。  
   - 启动后向用户说明：正在拉起 Vite 与 Electron，桌面窗口可能稍等几秒才出现。  
   - 可用进程列表确认是否有 `electron.exe`（Windows）在运行。

4. **汇报结果**  
   - 成功：说明已执行 `npm run dev`，请用户看任务栏/桌面是否出现标题为「奶龙记账」的窗口。  
   - 失败：贴出关键报错原文 + 通俗解释 + 可尝试的下一步（如缺依赖、端口占用、未安装 Node）。

## 备选启动方式（仅当用户明确要求或默认方式不可用）

| 命令 | 什么时候用 | 注意 |
|------|------------|------|
| `npm run electron:dev` | 用户明确要「先完整构建前端再开窗口」 | 无热更新，改代码后不会像 `dev` 那样即时刷新 |
| `npm run build` | 用户要打安装包，不是日常调试 | 产物在 `release/`，**不要**在「只是想打开软件看看」时默认执行 |
| `npm run preview` | 仅预览前端网页构建结果 | **不会**完整当作日常 Electron 记账窗体入口，除非用户只要前端预览 |

用户只说「启动 / 打开应用」时，**一律优先 `npm run dev`**，不要擅自打包。

## 沟通要求

- 全程简体中文，结论先说，再解释。  
- 工具调用的 `description` 使用中文。  
- 不要把启动过程说成「已经装到系统里像正式版一样」——开发模式是临时跑起来调试用的。  
- 不要修改业务代码；本技能只做安装依赖（必要时）与启动。

## 安全与边界

- 不执行 `git push --force`、不删除用户数据文件。  
- 不清理 `app.getPath('userData')` 下的账本 JSON。  
- 若用户同时要求「改功能再启动」，先完成或确认改动范围，再启动；启动本身不替代方案确认流程。
