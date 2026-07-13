# 奶龙记账 — 项目文档

## 项目概述

- **项目名称**: 奶龙记账
- **项目目标**: 一款桌面端个人记账应用，帮助用户记录每一笔人民币消费，按分类查看和统计收支情况，并支持本地数据备份与内置娱乐功能
- **支持平台**: Windows、macOS
- **货币单位**: 人民币（¥）
- **项目启动日期**: 2026-07-08

---

## 协作规范（必须遵守）

> **核心原则：用户是编程零基础，所有技术决策必须由 Claude 主导设计。**

1. **方案先行**：任何技术决策，Claude 必须先列出 2-3 个可选方案，每个方案附带优劣势 of 通俗解释
2. **用户决定**：Claude 不得自行做出重大技术决策，必须等待用户选择后再执行
3. **通俗表达**：所有技术概念必须用日常语言解释，避免使用未经解释的专业术语
4. **全程中文**：所有沟通、注释、文档均使用简体中文
5. **变更确认**：涉及架构调整、新增依赖、删除功能等重大变更，必须先告知用户并获得确认
6. **进度透明**：每完成一个阶段，向用户汇报进展和下一步计划
7. **文档随行**：每次向 GitHub 推送代码或合并分支时，必须同步更新 `CLAUDE.md` 文档以记录重大变更与架构调整

---

## 技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| Electron | 桌面应用框架 | 用网页技术构建桌面APP，一套代码同时生成 Windows 和 Mac 版本 |
| React | 界面构建 | 用于构建用户界面的前端框架 |
| TypeScript | 编程语言 | JavaScript 的增强版，能在编码时发现错误 |
| Ant Design | UI 组件库 | 提供现成的按钮、表格、表单等界面组件，界面美观统一 |
| Recharts | 图表统计 | 在页面中渲染优雅的月度收支环形图与每日对比柱状柱子 |
| Vite | 构建工具 | 快速的开发和打包工具，开发时改代码能实时看到效果 |
| JSON-file DB | 本地数据库 | 轻量级本地存储方案，数据保存在用户本地电脑 bookkeeping_data.json 中，无需联网 |
| electron-builder | 打包工具 | 将应用打包成 .exe（Windows）和 .dmg（Mac）安装文件 |

---

## 记账分类体系

采用两级分类结构：一级大类 → 二级小类

| 一级大类 | 二级小类 |
|---------|---------|
| 🍔 餐饮美食 | 早餐、午餐、晚餐、零食饮料、外卖 |
| 🛒 日用百货 | 生活用品、个人护理、清洁用品 |
| 🚌 交通出行 | 公共交通、打车、加油、停车费 |
| 🏠 居住生活 | 房租/房贷、水电燃气、物业费、维修 |
| 👗 服饰鞋包 | 衣服、鞋子、包、配饰 |
| 📱 通讯网络 | 话费、宽带、会员订阅 |
| 🏥 医疗健康 | 门诊、药品、体检、保健品 |
| 📚 学习教育 | 书籍、课程、培训、文具 |
| 🎮 休闲娱乐 | 电影/演出、游戏、运动健身、旅行 |
| 👶 亲子宠物 | 母婴用品、玩具、宠物用品、宠物医疗 |
| 🎁 人情往来 | 红包、礼物、请客、份子钱 |
| 💰 金融保险 | 保险费、手续费、利息、投资亏损 |
| 🔧 其他支出 | 其他/未分类 |

---

## MVP 功能范围（第一版）

### 核心功能

1. **记一笔**
   - 输入金额（人民币）
   - 选择分类（先选大类，再选小类）
   - 填写备注（可选）
   - 选择日期（默认当天）
   - 保存到本地数据库

2. **账单列表**
   - 按日期倒序展示消费记录
   - 显示金额、分类、备注、日期
   - 支持编辑已有记录
   - 支持删除记录（需二次确认，操作列宽度调整为 `160px` 保证按钮显示完整）

3. **月度统计**
   - 本月总支出与总收入金额
   - 环形图（Donut Chart）展示各大类收支占比，配以马卡龙奶油配色
   - 柱状图展示每日收支对比趋势
   - 排行榜加配 Ant Design `Progress` 进度条展示百分比与精美前三名徽章

4. **分类管理**
   - 折叠面板重构为卡片胶囊徽章网格系统，查看所有预设分类并支持微缩放动画效果

5. **系统设置**
   - 账单数据以兼容 Excel 的 CSV 格式（含 UTF-8 BOM）导出备份与平滑导入恢复
   - 数据库清空（只删流水 records）与恢复出厂设置（重置大类与子分类）防误删保护

6. **内置娱乐 (平行游戏分支)**
   - “奶龙大战恐龙大亨”坦克小游戏，支持键盘操作与严格的四方向行走操作
   - 简单、普通、困难三档难度设置（简单模式具有 5格 HP，敌人移速和生成周期放缓）
   - 龙蛋回血与星星暴走散射子弹道具拾取机制
   - 屏幕受创抖动位移、击毁爆炸粒子物理特效与三档难度最高分独立存取

---

## 项目目录结构

```
bookkeeping/
├── CLAUDE.md                # 本文档 — 项目规范和约定
├── package.json             # 项目依赖配置
├── electron/                # Electron 主进程（桌面窗口管理）
│   ├── main.ts              # 主进程入口 (配置 IPC 通信与 DevTools 调起关闭)
│   ├── preload.ts           # 预加载脚本
│   └── database.ts          # 数据库操作 (JSON-file DB, bookkeeping_data.json)
├── src/                     # 前端源码（界面）
│   ├── main.tsx             # 前端入口
│   ├── App.tsx              # 根组件 (Ant Design 主题色 token 与组件全局重载定义)
│   ├── components/          # 通用组件
│   │   └── AppLayout.tsx    # 侧边栏布局 (含顶部时间段动态温暖问候语与页面标题)
│   ├── pages/               # 页面
│   │   ├── AddRecord/       # 记一笔 (数码大显示屏与快捷金额追加 picker)
│   │   ├── RecordList/      # 账单列表 (表格与彩色轻黏土指标卡片)
│   │   ├── Statistics/      # 月度统计 (环形占比图与收支每日对比)
│   │   ├── Categories/      # 分类管理 (分类网格胶囊面板)
│   │   ├── Settings/        # 系统设置 (数据导入/导出/清空/恢复出厂)
│   │   └── TankGame/        # 奶龙大战 (坦克小游戏，60fps Canvas)
│   ├── types/               # TypeScript 接口类型声明
│   └── styles/              # 样式文件
│       └── global.css       # 全局可爱奶橘样式 (含晃动、浮动、淡入动效)
├── resources/               # 应用图标等资源
└── dist/                    # 构建输出目录
```

---

## 开发规范

- **代码注释**：关键逻辑处必须添加中文注释
- **命名规范**：组件使用大驼峰（如 AddRecord），变量使用小驼峰（如 totalAmount）
- **提交信息**：使用中文描述本次改动内容
- **分支策略**：main 为主分支，功能开发在 feature/ 分支进行

---

## Git 提交门禁

### Claude Code 官方钩子位置（项目级）

按 Claude Code 文档，项目钩子配置在 **`.claude/settings.json`** 的 **`hooks`** 字段；可执行脚本放在 **`.claude/hooks/`**。

| 路径 | 作用 |
|------|------|
| [`.claude/settings.json`](.claude/settings.json) | 注册 `PreToolUse` / `PostToolUse`（matcher: `Bash`） |
| [`.claude/hooks/check-pass-gate.js`](.claude/hooks/check-pass-gate.js) | 校验双通行证 |
| [`.claude/hooks/clear-pass-gate.js`](.claude/hooks/clear-pass-gate.js) | push 后删除通行证 |
| [`.claude/hooks/claude-pre-bash-commit-gate.js`](.claude/hooks/claude-pre-bash-commit-gate.js) | Claude 执行 `git commit` 前拦截 |
| [`.claude/hooks/claude-post-bash-push-clear.js`](.claude/hooks/claude-post-bash-push-clear.js) | Claude 执行 `git push` 后清章 |

说明：用户级配置还可写在 `~/.claude/settings.json`；本仓库只用**项目级**，便于进 Git 共享。

**本仓库不使用 Git 原生 hooks（无 `.githooks/`）：** 仅拦截 **Claude Code** 通过 Bash 发起的 `git commit` / `git push`。在系统终端或其它 GUI 里直接 `git commit` **不会**走此门禁。

### 通行证规则

1. 必须存在且有效（`status: passed`，`at` 在 5 分钟内）：
   - `.claude/states/tester-pass.json` — 由 **`tester`** 在单元测试全绿后写入
   - `.claude/states/quality-pass.json` — 由 **`quality-engineer`** 在质检通过后写入（安全无严重/高即可；注释黄灯可过）
2. Claude 内提交缺少或过期通行证 → **拒绝**；禁止使用 `--no-verify` 绕过。
3. **Claude 内 `git push` 成功后**删除两张通行证（PostToolUse + `gitcommit-agent`）。
4. 一键入口：子代理 **`gitcommit-agent`**。
5. **`/git-save` 仍是纯存档**；`.claude/states/` 已被 gitignore。

---

## 后续扩展方向（非 MVP，记录备用）

- 自定义分类（用户可增删改分类）
- 数据导出（导出为 Excel/CSV）
- 预算设置（设置月度预算，超支提醒）
- 多账本（家庭账本、个人账本）
- 收入记录（目前仅支出）
- 数据备份与恢复
