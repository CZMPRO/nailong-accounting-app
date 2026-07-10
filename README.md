# 🦕 奶龙记账 (Nailong Bookkeeping)

一款专为个人设计的桌面端记账应用，帮助您清晰地记录每一笔人民币消费，并按分类进行支出统计与管理。

## 🌟 项目特点

* 🖥️ **桌面端应用**：基于 Electron 构建，支持 Windows 和 macOS 平台。
* 🔒 **数据本地化**：使用本地 SQLite 数据库，所有记账数据均保存在您的电脑上，无需联网，安全隐私。
* 🎨 **可爱活力风格**：主题色采用温暖活力的橙色，契合“奶龙”的可爱风格。
* 📊 **多维统计图表**：支持饼图展示各大类支出占比、柱状图展示每日支出趋势，账单情况一目了然。
* 📂 **两级分类体系**：内置餐饮美食、日用百货、交通出行等丰富的一级大类及细分二级小类。

---

## 🛠️ 技术栈

* **核心框架**：[Electron](https://www.electronjs.org/) (桌面应用框架) + [React](https://react.dev/) (界面构建)
* **编程语言**：[TypeScript](https://www.typescriptlang.org/)
* **UI 组件库**：[Ant Design](https://ant.design/) (中文本地化配置)
* **图表库**：[Recharts](https://recharts.org/)
* **构建与打包工具**：[Vite](https://vitejs.dev/) + [electron-builder](https://www.electron.build/)

---

## 📂 项目结构

```text
bookkeeping/
├── electron/                # Electron 主进程代码（窗口管理、数据库操作）
│   ├── main.ts              # 主进程入口
│   ├── preload.ts           # 预加载脚本
│   └── database.ts          # SQLite 数据库底层逻辑
├── src/                     # 前端源码（React 页面及组件）
│   ├── App.tsx              # 根组件（路由配置与全局主题）
│   ├── main.tsx             # 前端入口文件
│   ├── components/          # 通用组件（如侧边栏、布局等）
│   └── pages/               # 业务页面
│       ├── AddRecord/       # 记一笔（收支录入）
│       ├── RecordList/      # 账单列表（查看、编辑、删除）
│       ├── Statistics/      # 月度统计（饼图、柱状图）
│       └── Categories/      # 分类管理
├── CLAUDE.md                # 项目开发规范及协作指引
└── package.json             # 项目依赖与构建脚本
```

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <项目仓库地址>
cd bookkeeping
```

### 2. 安装依赖

推荐使用 npm 或 yarn 进行依赖安装：

```bash
npm install
```

### 3. 本地开发调试

启动本地开发环境：

```bash
npm run dev
```

如果在开发过程中需要单独构建前端并启动 Electron 容器：

```bash
npm run electron:dev
```

### 4. 编译与打包

打包生成对应系统的桌面端安装包（如 Windows 的 `.exe` 或 macOS 的 `.dmg`）：

```bash
npm run build
```

打包后的安装包将输出在 `release/` 目录中。

---

## 📝 贡献指南

1. 所有开发规范和技术方案选择请参考 [CLAUDE.md](CLAUDE.md)。
2. 本项目专为零基础用户打造，所有重大技术决策需在 Claude 指导下由用户确认后再执行。
3. 提交信息请统一使用**中文描述**，且遵循用户个人署名偏好。

---

## 📄 开源协议

本项目基于 [MIT](LICENSE) 协议开源。
