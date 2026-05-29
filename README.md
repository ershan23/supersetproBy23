# 二次开发改动记录

## 概述

基于 Apache Superset 项目进行二次开发，新增自定义柱状图插件 `plugin-chart-my-bar`，用于演示 Superset 图表插件开发流程。

---

## 新增文件

### 图表插件 `plugin-chart-my-bar/`

路径：`superset-frontend/plugins/plugin-chart-my-bar/`

```
plugin-chart-my-bar/
├── package.json                    # 插件元数据与依赖声明
├── tsconfig.json                   # TypeScript 编译配置
├── src/
│   ├── index.ts                    # 入口：导出 MyBarChartPlugin
│   ├── types.ts                    # TypeScript 类型定义
│   ├── MyBarChart.tsx              # ECharts 柱状图渲染组件
│   └── plugin/
│       ├── index.ts                # ChartPlugin 类（元数据、行为、注册）
│       ├── buildQuery.ts           # 查询构建（groupby + metrics）
│       ├── transformProps.ts       # 属性转换（ChartProps → 组件 Props）
│       └── controlPanel.tsx        # 控件面板配置（X轴/指标/排序/选项）
├── types/
│   └── external.d.ts               # 图片等外部模块声明
├── test/
│   └── plugin/                     # 测试目录（待补充）
└── src/images/                     # 缩略图目录（待补充）
```

### 开发文档

| 文件 | 说明 |
|------|------|
| `DEV_GUIDE.md` | 项目二次开发指南（架构、环境搭建、插件开发流程） |
| `CHANGES.md` | 本文件 — 二次开发改动记录 |

---

## 修改文件

### 1. 插件注册 — `src/visualizations/presets/MainPreset.ts`

**位置**：`superset-frontend/src/visualizations/presets/MainPreset.ts`

```diff
+ import { MyBarChartPlugin } from '@superset-ui/plugin-chart-my-bar';

  // 在 register() 方法中添加：
+ new MyBarChartPlugin().configure({ key: 'my_bar_chart' }).register();
```

### 2. Webpack 配置 — `superset-frontend/webpack.config.js`

解决 `geostyler` 等 ESM 包的模块解析问题：

```diff
  resolve: {
+   fullySpecified: false,
    alias: { ... }
  }

  module: {
    rules: [
      {
        test: /node_modules\/(geostyler|geostyler-openlayers-parser|geostyler-mapbox-parser|geostyler-sld-parser)\/.*\.js$/,
+       type: 'javascript/auto',
        resolve: {
          fullySpecified: false,
        },
      },
    ]
  }
```

### 3. 后端配置 — `superset_config.py`

**新建文件**（本地开发用）：

```python
SQLALCHEMY_DATABASE_URI = "sqlite:///E:/py_project/superset/superset.db"
SECRET_KEY = "CHANGE_ME_TO_A_COMPLEX_RANDOM_SECRET_KEY"
```

### 4. 依赖包

**新增依赖**（`superset-frontend/node_modules`）：

| 包名 | 用途 |
|------|------|
| `echarts-for-react` | React 封装的 ECharts 渲染组件 |

---

## 临时修复（Node Modules Patch）

> 注意：以下修改会在 `npm install` 后丢失，需重新应用。

### geostyler 相关包

**问题**：`geostyler@18.6.0` 和 `geostyler-mapbox-parser@6.2.0` 声明了 `"type": "module"`，Webpack 5 将其视为严格 ESM，导致 28 个模块解析错误。

**修复**：临时去掉两个包 `package.json` 中的 `"type": "module"` 字段：

```
node_modules/geostyler/package.json:               "type": "module" → "type_comment": "module"
node_modules/geostyler-mapbox-parser/package.json:  "type": "module" → "type_comment": "module"
```

---

## 插件功能说明

### 图表类型：My Bar Chart

- **标识符**：`my_bar_chart`
- **分类**：Custom
- **行为**：InteractiveChart（支持交互）
- **依赖**：ECharts 5.x（BarChart、Grid、Legend、Tooltip）

### 控件面板

| 区域 | 控件 |
|------|------|
| Query | X 轴分组（groupby）、指标（metrics）、Adhoc 筛选器、排序方向、行数限制 |
| Chart Options | X 轴标签、Y 轴标签、显示图例、显示数值 |

### 数据流

```
formData（用户输入）
  → buildQuery（构建 SQL 查询）
    → 后端执行查询
      → queriesData（查询结果）
        → transformProps（转换属性）
          → MyBarChart 组件（ECharts 渲染）
```

---

## 启动方式

```powershell
# 后端
$env:FLASK_APP="superset.app:create_app()"
$env:SUPERSET_CONFIG_PATH="E:\py_project\superset\superset_config.py"
& "E:\miniconda\envs\superset\Scripts\flask.exe" run -p 8088 --no-reload --debugger

# 前端
cd superset-frontend
npm run dev-server
```

- 后端：`http://localhost:8088`
- 前端：`http://localhost:9000`
- 登录：`admin` / `admin`
- 新图表入口：Explore → Visualization Type → Custom → **My Bar Chart**
