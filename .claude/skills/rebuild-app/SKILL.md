---
name: rebuild-app
description: >
  重新打包「奶龙记账」桌面安装包（TypeScript 检查 + Vite 构建 + electron-builder）。
  用户输入 /rebuild-app，或说「重新打包」「打安装包」「build 应用」「生成 exe」「打包发布」时务必使用本技能。
---

# 重新打包奶龙记账应用

本技能只负责在本仓库执行**正式打包流程**，生成可安装的桌面安装包（不是日常开发热更新）。

## 默认打包命令

在项目根目录 `bookkeeping/` 执行：

```bash
npm run build
```

对应脚本（见 `package.json`）：

```text
tsc && vite build && electron-builder
```

含义（给小白）：

1. **`tsc`**：先做 TypeScript 类型检查，有明显类型错误会在这里拦住。  
2. **`vite build`**：把前端界面和 Electron 主进程相关代码编译成可发布文件。  
3. **electron-builder**：打成系统安装包。  
4. **产物目录**：`release/`  
   - Windows：NSIS 安装程序（`.exe`）  
   - macOS：`.dmg`（在 Mac 上打包时）

## 执行步骤（按顺序）

1. **确认工作目录**  
   必须在奶龙记账仓库根目录。确认存在 `package.json`，且 `"name"` 为 `nailong-bookkeeping`。

2. **检查依赖**  
   - 若没有 `node_modules`，先执行：`npm install`  
   - 安装失败：贴出终端原文，大白话解释，**停止打包**，不要声称打包成功。

3. **关于 Electron 环境变量**  
   - 打包链路主要走 Node/Vite/electron-builder；若构建阶段拉起 Electron 相关步骤异常，可先清掉污染变量：  
     `env -u ELECTRON_RUN_AS_NODE npm run build`  
   - 默认优先尝试：`env -u ELECTRON_RUN_AS_NODE npm run build`  
   - 若环境不支持 `env -u`：用 `ELECTRON_RUN_AS_NODE= npm run build` 或先 `unset ELECTRON_RUN_AS_NODE`。

4. **执行打包**  
   - 打包可能耗时数分钟，**不要**用会误杀长时间任务的方式中断。  
   - 超时时间应足够长（建议工具超时不少于 10 分钟；若环境允许可更长）。  
   - 一般**前台执行**以便完整看到失败日志；若必须后台，结束后务必读完整日志再汇报。

5. **汇报结果**  
   - **成功**：说明已执行 `npm run build`，并列出 `release/` 下新生成的安装包文件名（用 `ls release` 或同等命令确认）。  
   - **失败**：贴出关键报错原文 + 通俗解释 + 可能原因（类型错误、依赖缺失、磁盘空间、权限、图标资源等）。  
   - 明确告诉用户：这是**安装包产物**，不是 `npm run dev` 的开发窗口。

## 不要做的事

- 用户只说「打开 / 启动应用」时，**不要**用本技能；应使用 `/run-app`。  
- 不要默认执行 `git commit` / `git push`。  
- 不要删除用户账本数据（`userData` 下的 `bookkeeping_data.json`）。  
- 不要用 `--no-verify` 等绕过门禁（本技能本身也不做提交）。  
- 不要擅自改业务代码来“凑合打包通过”；若类型/构建失败，先报告，重大修复需用户确认方案。

## 与 `/run-app` 的区别

| 技能 | 目的 | 命令 | 结果 |
|------|------|------|------|
| `/run-app` | 日常调试打开窗口 | `env -u ELECTRON_RUN_AS_NODE npm run dev` | 临时开发窗口 |
| `/rebuild-app` | 重新打安装包 | `env -u ELECTRON_RUN_AS_NODE npm run build` | `release/` 里的安装文件 |

## 沟通要求

- 全程简体中文；工具 `description` 用中文。  
- 结构：结论 → 原因/过程 → 产物路径或下一步。  
- 打包时间较长时，先告知用户「正在打包，请稍等」。
