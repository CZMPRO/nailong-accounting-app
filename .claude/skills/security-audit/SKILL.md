---
name: security-audit
description: >
  奶龙记账专属安全审计：检查密码/密钥等敏感信息泄露、注入类风险、配置文件明文机密、
  以及 Electron/前端常见安全隐患，并输出大白话中文报告。
  用户输入 /security-audit，或说「安全审计」「安全检查」「有没有泄露密码」「检查漏洞」
  「敏感信息」「SQL 注入」「安全隐患」时务必使用本技能。
---

# 安全审计（security-audit）

本技能对**本仓库源码与配置**做防御性安全检查，输出**零基础可读的中文报告**。  
默认**只审计、不改代码**；用户明确要求「按报告修复」时再改，且重大修复需说明影响。

**定位：** 授权范围内的本地项目自查（开源仓库卫生 + Electron 桌面端常见风险）。  
**不做：** 对外部系统的攻击、编写 exploit、绕过他人防护、恶意用途指导。

---

## 审计范围（四条主线 + 扩展）

### 1. 密码与敏感信息是否泄露（代码与仓库）

在源码、脚本、注释、示例、提交暂存区中查找是否**硬编码**或误提交：

| 类型 | 示例关键词 / 形态（不限于） |
|------|---------------------------|
| 密码口令 | `password`、`passwd`、`pwd`、`口令` |
| 密钥令牌 | `api_key`、`apiKey`、`secret`、`token`、`private_key`、`BEGIN RSA PRIVATE KEY` |
| 云厂商 | `AKIA`（AWS 形态）、`Azure` connection string、各类 `accessKey` |
| 数据库连接串 | `mongodb://`、`postgres://`、`mysql://` 含账号密码 |
| 其它 | Webhook URL 带密钥、OAuth client secret、JWT 签名密钥 |

**方法：**

- `Grep` / 内容搜索（可大小写不敏感）扫 `electron/`、`src/`、根目录配置、`.claude/`（注意别把技能文档里的「示例词」误报成泄露）  
- 查看 `.gitignore` 是否忽略 `.env`、`*.pem`、本地密钥  
- **不要**在报告里完整回显疑似真实密钥；只写文件路径、行号附近、类型与「建议轮换/删除」

**误报注意：**

- 表单字段名 `password`、类型定义、翻译文案  
- 测试里的假数据（应确认是假的）  
- 文档中的占位符 `YOUR_TOKEN_HERE`

### 2. SQL / 注入类风险

本项目主存储是 **JSON 文件账本**，可能**没有**传统 SQL；仍须检查：

| 检查项 | 说明 |
|--------|------|
| 字符串拼接 SQL | `SELECT ... ${userInput}`、`query("..." + input)` |
| 其它查询注入 | 若未来引入 SQLite/ORM，动态拼接是否参数化 |
| 命令注入 | `exec` / `spawn` / `execSync` 拼接用户输入或未校验路径 |
| 路径穿越 | `path.join` 与用户可控片段组合成文件路径时，是否限制在允许目录内 |
| CSV / 导入数据 | 导入内容是否盲目 `eval`、是否写到预期外路径 |
| XSS（渲染层） | `dangerouslySetInnerHTML`、未转义 HTML 拼进 DOM |
| IPC 入参 | `ipcMain.handle` 是否信任渲染进程任意数据；关键写操作是否校验类型/范围 |

无 SQL 时：在报告中写明「未发现 SQL 使用 / 不适用」，并给出注入类**其它**发现或「未发现」。

### 3. 配置文件中的明文敏感信息

重点文件（存在才查）：

- `.env`、`.env.*`、`*.local`  
- `config.json` / `secrets.*` / 自定义配置  
- `package.json` 非必要字段、CI 配置（`.github/workflows`）  
- `electron-builder` / 签名证书路径与密码  
- `.claude/settings.json`、`.claude/settings.local.json`（是否含 token；**local 通常不应提交**）  
- 任何把 `Authorization: Bearer ...` 写死进仓库的文件  

检查：

- 是否明文密码/Token  
- 是否应被 `.gitignore` 却被跟踪（`git check-ignore` / `git ls-files`）  
- 示例配置是否与真实机密区分（应用 `.env.example` 占位，而非真值）

### 4. 其它你应主动覆盖的隐患（结合奶龙记账 / Electron）

**Electron 加固（高优先级）：**

- `nodeIntegration` 是否为 `true`（应尽量 `false`）  
- `contextIsolation` 是否为 `false`（应尽量 `true`）  
- 是否在渲染进程直接 `require('fs')` 等 Node 能力  
- `preload` 是否只暴露最小 `contextBridge` API 白名单  
- `openExternal` / 打开任意 URL 是否校验  
- 是否加载远程任意网页进 BrowserWindow  
- `webSecurity` 是否被关闭  

**数据与隐私：**

- 账本路径是否落到可预期 `userData`  
- 日志是否打印完整流水/隐私  
- 导出 CSV 是否被写到危险位置或覆盖系统文件  

**依赖与供应链（轻量）：**

- 是否出现明显危险的 `postinstall` 下载执行  
- 不要把 `npm audit` 的每一条高危都当成必须立刻炸锅，但**有**则摘要告知用户  

**Git 卫生：**

- 历史中是否曾提交密钥（若当前树没有但 `git log -S` 能扫到，提示风险，不主动改写历史除非用户要求）  

**权限与破坏性操作：**

- `clearAllRecords` / `factoryReset` 是否仅经 IPC、是否有二次确认（前端有确认但主进程无校验可降为建议项）  
- 任意文件读写 API 是否暴露给渲染进程  

---

## 执行步骤

### 1. 定范围

1. 用户点名路径  
2. 否则：`electron/`、`src/`、根配置、`.gitignore`、工作流文件  
3. 排除：`node_modules/`、`dist/`、`dist-electron/`、`release/`、大型锁文件正文（除非查依赖脚本）  

一句话告知用户检查范围。

### 2. 自动扫描 + 人工阅读

- 用 Grep 扫敏感词与危险 API：  
  `password|secret|token|api[_-]?key|private[_-]?key|eval\(|exec\(|spawn\(|dangerouslySetInnerHTML|nodeIntegration|contextIsolation|openExternal`  
- 阅读 `electron/main.ts`、`preload.ts`、`database.ts` 的安全相关片段  
- 核对 `.gitignore` 与是否误跟踪敏感文件  

### 3. 分级

| 级别 | 含义（给小白） |
|------|----------------|
| **严重** | 已泄露或极易被利用，应立刻处理（如真实密钥进仓库、nodeIntegration 乱开且加载不可信内容） |
| **高** | 明确坏实践，在威胁模型下风险高 |
| **中** | 需要改进，当前场景未必可利用 |
| **低 / 信息** | 加固建议、最佳实践、误报待确认 |

### 4. 输出中文报告（必须）

```markdown
## 安全审计结论
- 总体：通过 / 有风险需处理 / 有严重问题（一句话）

## 检查范围
- 目录与重点文件

## 1. 敏感信息与密码泄露
- 发现列表或「未发现硬编码机密」
- 每条：级别、位置、类型、为何危险、建议（勿贴出完整密钥）

## 2. 注入类风险（SQL / 命令 / 路径 / XSS / IPC）
- 发现列表或「未发现明显注入点」
- 说明本项目是否使用 SQL

## 3. 配置文件明文机密
- 发现列表或「配置中未见明文机密」
- .gitignore / 是否误提交

## 4. 其它安全隐患（Electron / 数据 / 依赖等）
- 发现列表或简要「当前主要加固点已满足 / 建议项」

## 优先整改清单
1. （最急）...
2. ...

## 说明
- 审计局限（静态检查不能证明绝对安全）
- 是否已按用户要求改代码（默认否）
- 若发现疑似真实密钥：建议立刻在平台轮换，并考虑从 Git 历史清除（需单独授权）
```

### 5. 修复策略

- **默认不修改**  
- 用户要求修复时：优先去密钥、收紧 Electron、校验 IPC 入参、补 `.gitignore`  
- 不引入来历不明的「安全库」刷存在感  
- 新增依赖仍须用户同意  

---

## 与其它技能边界

| 技能 | 关系 |
|------|------|
| `/unit-test` | 功能对错；本技能是安全风险 |
| `/comments-check` | 注释质量；本技能不评注释占比 |
| `/git-save` | 审计通过与否不自动提交；若发现密钥，**阻止建议**把密钥提交上去 |
| `/security-review`（若环境内置） | 可互补；本技能偏奶龙项目清单化自查 |

---

## 沟通与红线

- 全程简体中文；工具 `description` 用中文  
- 结论 → 证据（路径/行号）→ 建议  
- **报告中脱敏**：密钥只显示前后少量字符或完全不显示  
- 不提供攻击利用步骤；只写如何防御与修复  
- 不删除用户账本数据；不做 `push --force` 清历史除非用户明确要求并理解风险  

## 成功标准

- 四条主线均有明确结论  
- 重要 Electron 配置被实际阅读而非假设  
- 问题带级别与可执行建议  
- 未把完整密钥写进聊天记录  
