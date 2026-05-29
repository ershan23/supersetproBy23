# Apache Superset 二次开发指南

## 目录

1. [项目架构概览](#1-项目架构概览)
2. [开发环境搭建](#2-开发环境搭建)
3. [推荐开发方向：新增图表可视化插件](#3-推荐开发方向新增图表可视化插件)
4. [后端开发指南](#4-后端开发指南)
5. [前端开发指南](#5-前端开发指南)
6. [常用命令速查](#6-常用命令速查)

---

## 1. 项目架构概览

```
superset/
├── superset/                          # Python 后端 (Flask + SQLAlchemy)
│   ├── app.py                         # Flask 应用工厂 create_app()
│   ├── config.py                      # 默认配置 (2638行)
│   ├── views/                         # HTTP 视图和 API 端点
│   │   ├── base_api.py               # BaseSupersetModelRestApi 基类
│   │   └── api.py                     # 旧版 API
│   ├── models/                        # SQLAlchemy ORM 模型
│   │   ├── core.py                    # Database, SqlaTable, TableColumn, SqlMetric
│   │   ├── slice.py                   # Slice(图表) 模型
│   │   ├── dashboard.py              # Dashboard 模型
│   │   └── helpers.py                # AuditMixin, ImportExportMixin, UUIDMixin
│   ├── commands/                      # 命令模式业务逻辑
│   │   ├── chart/                    # 图表 CRUD 命令
│   │   ├── dashboard/               # 仪表板 CRUD 命令
│   │   └── database/                # 数据库命令
│   ├── charts/                        # 图表 REST API + Schema
│   ├── dashboards/                    # 仪表板 REST API + Schema
│   ├── datasets/                      # 数据集 API + Schema
│   ├── databases/                     # 数据库 API + Schema
│   ├── daos/                          # 数据访问对象
│   ├── security/                      # RBAC 安全管理器
│   ├── migrations/                    # Alembic 数据库迁移
│   ├── connectors/                    # 数据源连接器
│   └── db_engine_specs/              # 各数据库引擎方言
│
├── superset-frontend/                 # React/TypeScript 前端 (Monorepo)
│   ├── src/
│   │   ├── explore/                  # 图表构建器 (控件面板, 状态, 组件)
│   │   ├── dashboard/               # 仪表板 (布局, 筛选器, 组件)
│   │   ├── SqlLab/                  # SQL 编辑器
│   │   ├── components/              # 共享 UI 组件
│   │   ├── visualizations/          # 可视化注册 (MainPreset)
│   │   ├── setup/                   # 应用初始化 (setupPlugins, setupApp)
│   │   ├── types/                   # TypeScript 类型定义
│   │   └── hooks/                   # 自定义 React Hooks
│   ├── plugins/                      # 图表可视化插件 (19个)
│   │   ├── plugin-chart-echarts/    # ECharts 图表集 (~25种类型)
│   │   ├── plugin-chart-table/      # 表格
│   │   ├── plugin-chart-pivot-table/ # 透视表
│   │   ├── preset-chart-deckgl/     # Deck.gl 地理可视化
│   │   └── legacy-plugin-chart-*/   # 旧版图表
│   └── packages/                     # 共享库
│       ├── superset-ui-core/        # 核心库 (查询、模型、颜色、格式)
│       └── superset-ui-chart-controls/ # 图表控件定义
│
├── superset-core/                     # Python 共享核心 (扩展开发者用)
├── superset-extensions-cli/           # 扩展脚手架 CLI
├── superset_config.py                 # 本地配置覆盖 (SQLite 开发)
└── tests/                             # Python 测试
```

### 核心设计模式

**API 三层分离**（以 Dashboard 为例）：
```
superset/dashboards/
  ├── api.py        # HTTP 端点 → REST API 类 (继承 BaseSupersetModelRestApi)
  ├── schemas.py    # 验证/序列化 → Marshmallow Schemas
  └── (commands/)   # 业务逻辑 → 在 superset/commands/dashboard/ 中
```

**前端插件注册流程**：
```
src/setup/setupPlugins.ts
  → MainPreset().register()
    → 遍历 plugin-chart-* 插件
      → ChartPlugin { buildQuery(), transformProps(), controlPanel }
        → 注册到 ChartComponentRegistry + ChartControlPanelRegistry
```

---

## 2. 开发环境搭建

### 环境要求

| 组件 | 版本 |
|------|------|
| Python | 3.11.15 (conda: `E:\miniconda\envs\superset`) |
| Node.js | v24.14.1 |
| npm | 11.12.1 |
| 数据库 | SQLite (开发) / PostgreSQL (生产) |

### 启动开发服务

```powershell
# 1. 激活 Python 环境
# (已在 E:\miniconda\envs\superset)

# 2. 启动 Flask 后端 (端口 8088)
$env:FLASK_APP="superset.app:create_app()"
$env:SUPERSET_CONFIG_PATH="E:\py_project\superset\superset_config.py"
& "E:\miniconda\envs\superset\Scripts\flask.exe" run -p 8088 --no-reload --debugger

# 3. 启动前端开发服务器 (端口 9000)
cd superset-frontend
npm run dev-server
```

### 关键配置

**superset_config.py** (本地开发)：
```python
SECRET_KEY = "your-secret-key"
SQLALCHEMY_DATABASE_URI = "sqlite:///E:/py_project/superset/superset.db"
FEATURE_FLAGS = {
    "ALERT_REPORTS": True,
    "EMBEDDED_SUPERSET": True,
}
```

### 访问地址

- **后端直接访问**：`http://localhost:8088`
- **前端开发模式**：`http://localhost:9000` (代理到后端)
- **登录凭据**：`admin` / `admin`

### 已知问题

- **python-ldap** 未安装 (Windows 缺少 C++ 编译工具) — 仅 LDAP 认证需要
- **Webpack ESM 错误** — 已通过 patch `node_modules/geostyler*/package.json` 去掉 `"type": "module"` 解决
- npm 镜像问题 — 已切换为官方 registry `https://registry.npmjs.org/`

---

## 3. 推荐开发方向：新增图表可视化插件

### 3.1 为什么选择图表插件开发

- **完整插件体系**：Superset 有成熟的插件注册/加载机制
- **前后端解耦**：插件以独立包形式存在，通过 Webpack Module Federation 动态加载
- **快速可见**：新增图表类型可立即在探索界面使用
- **可复用**：插件可独立发布，供其他 Superset 实例使用

### 3.2 图表插件核心接口

每个图表插件必须实现 `ChartPlugin`，提供三个核心方法：

```typescript
// superset-frontend/plugins/plugin-chart-echarts/src/types.ts
interface ChartPlugin {
  metadata: ChartMetadata;           // 图表名称、缩略图、分类
  loadChart: () => Promise<ChartComponent>;  // 异步加载渲染组件
  loadTransformProps: () => TransformProps;  // 属性转换
  loadBuildQuery?: () => BuildQuery;         // 查询构建
  loadControlPanel?: () => ControlPanel;     // 控件面板配置
}
```

### 3.3 示例：创建简单的柱状图插件

**目录结构**：
```
plugin-chart-my-bar/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # 入口：导出 ChartPlugin
│   ├── plugin.ts             # 插件定义
│   ├── buildQuery.ts         # 查询构建
│   ├── transformProps.ts     # 属性转换
│   ├── controlPanel.tsx      # 控件面板
│   ├── types.ts              # 类型定义
│   ├── defaults.ts           # 默认值
│   └── MyBarChart.tsx        # 渲染组件
├── types/
│   └── external.d.ts
└── images/
    └── thumbnail.png
```

**步骤 1 - 创建 package.json**：
```json
{
  "name": "@superset-viz-plugins/plugin-chart-my-bar",
  "version": "0.0.1",
  "main": "src/index.ts",
  "dependencies": {
    "@superset-ui/core": "*",
    "@superset-ui/chart-controls": "*",
    "echarts": "^5.0.0"
  }
}
```

**步骤 2 - 定义插件 (plugin.ts)**：
```typescript
import { ChartMetadata, ChartPlugin } from '@superset-ui/core';
import buildQuery from './buildQuery';
import transformProps from './transformProps';
import controlPanel from './controlPanel';
import thumbnail from '../images/thumbnail.png';

const metadata = new ChartMetadata({
  name: 'My Bar Chart',
  description: 'A custom bar chart',
  thumbnail,
  useLegacyApi: false,
});

export default class MyBarChartPlugin extends ChartPlugin {
  constructor() {
    super({
      loadChart: () => import('./MyBarChart'),
      metadata,
      transformProps,
      buildQuery,
      controlPanel,
    });
  }
}
```

**步骤 3 - 构建查询 (buildQuery.ts)**：
```typescript
import { buildQueryContext, QueryFormData } from '@superset-ui/core';

export default function buildQuery(formData: QueryFormData) {
  const { metric, groupby } = formData;
  return buildQueryContext(formData, baseQueryObject => [{
    ...baseQueryObject,
    metrics: [metric],
    groupby,
  }]);
}
```

**步骤 4 - 渲染组件 (MyBarChart.tsx)**：
```tsx
import React from 'react';
import { ChartProps } from '@superset-ui/core';
import ReactECharts from 'echarts-for-react';

export default function MyBarChart({ formData, queriesData, width, height }: ChartProps) {
  const data = queriesData?.[0]?.data || [];
  const option = {
    xAxis: { type: 'category', data: data.map(d => d.key) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: data.map(d => d.value) }],
  };

  return <ReactECharts option={option} style={{ width, height }} />;
}
```

**步骤 5 - 注册到 MainPreset**：
```
superset-frontend/src/visualizations/presets/MainPreset.ts
```
```typescript
import MyBarChartPlugin from '@superset-viz-plugins/plugin-chart-my-bar';
// 在 register() 方法中添加：
new MyBarChartPlugin().configure({ key: 'my_bar_chart' }).register();
```

### 3.4 调试技巧

- 前端 HMR (热模块替换) 自动响应插件代码变更
- 在 `http://localhost:9000/superset/explore/` 中创建新图表测试
- 使用浏览器 DevTools → Redux DevTools 查看 explore 状态
- 控件面板在 `explore/controlPanels/` 中统一管理

---

## 4. 后端开发指南

### 4.1 新增 REST API 端点

以"标签(Tag)"资源为例，完整的 API 开发流程：

**步骤 1 - 创建 Schema (schemas.py)**：
```python
from marshmallow import Schema, fields

class TagSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()
```

**步骤 2 - 创建 API (api.py)**：
```python
from superset.views.base_api import BaseSupersetModelRestApi
from superset import app

class TagRestApi(BaseSupersetModelRestApi):
    datamodel = SQLAInterface(Tag)
    resource_name = "tag"
    allow_browser_login = True

    list_columns = ["id", "name", "description"]
    add_columns = ["name", "description"]
    edit_columns = add_columns

app.add_url_rule(
    "/api/v1/tag/",
    view_func=TagRestApi.as_view("tag_list"),
)
```

**步骤 3 - 创建命令 (commands/tag/create.py)**：
```python
from superset.commands.base import BaseCommand
from superset.daos.tag import TagDAO
from superset.models.tag import Tag

class CreateTagCommand(BaseCommand):
    def __init__(self, data: dict):
        self._properties = data

    def run(self) -> Tag:
        return TagDAO.create(self._properties)

    def validate(self) -> None:
        # 验证名称唯一性等
        pass
```

### 4.2 数据库模型

模型继承链：
```
AuditMixinNullable  (created_on, changed_on, created_by_fk, changed_by_fk)
  └── ImportExportMixin  (uuid 字段，支持导入导出)
      └── YourModel
```

### 4.3 迁移

```powershell
# 创建新迁移
superset db migrate -m "add my_new_table"

# 应用到数据库
superset db upgrade
```

迁移文件位置：`superset/migrations/versions/`

---

## 5. 前端开发指南

### 5.1 目录结构

| 目录 | 用途 | 关键文件 |
|------|------|----------|
| `src/explore/` | 图表构建器 | `exploreReducer.ts`, `controls.tsx`, `controlPanels/` |
| `src/dashboard/` | 仪表板 | `DashboardPage.tsx`, `reducers/`, `components/` |
| `src/SqlLab/` | SQL 编辑器 | `actions/`, `reducers/`, `components/` |
| `src/components/` | 共享组件 | 各种通用 UI 组件 |
| `src/visualizations/` | 可视化注册 | `MainPreset.ts`, `presets/` |
| `plugins/` | 图表插件 | 每个 `plugin-chart-*` 是一个独立图表 |

### 5.2 状态管理模式

```typescript
// 使用 Redux Toolkit + react-redux
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

const selectExploreData = createSelector(
  state => state.explore.form_data,
  state => state.explore.chart,
  (formData, chart) => ({ formData, chart }),
);

function MyComponent() {
  const { formData, chart } = useSelector(selectExploreData);
  const dispatch = useDispatch();
  // ...
}
```

### 5.3 组件开发规范

- 使用 `@superset-ui/core/components` 而非直接 import antd
- 优先使用 antd theming tokens
- 避免自定义 CSS 和 styles
- 使用 functional components + hooks
- TypeScript strict mode，禁止 `any`

### 5.4 测试

```powershell
# 运行所有前端测试
cd superset-frontend
npm run test

# 运行单个测试文件
npm run test -- plugin-chart-echarts/test/index.test.ts

# 运行 Playwright E2E 测试
npm run playwright:test
```

---

## 6. 常用命令速查

### 后端

```powershell
# 激活环境并启动
$env:FLASK_APP="superset.app:create_app()"
$env:SUPERSET_CONFIG_PATH="E:\py_project\superset\superset_config.py"

# 启动 Flask
& "E:\miniconda\envs\superset\Scripts\flask.exe" run -p 8088 --no-reload --debugger

# 数据库迁移
& "E:\miniconda\envs\superset\Scripts\superset.exe" db upgrade
& "E:\miniconda\envs\superset\Scripts\superset.exe" db migrate -m "description"

# 创建管理员
& "E:\miniconda\envs\superset\Scripts\superset.exe" fab create-admin

# 初始化权限
& "E:\miniconda\envs\superset\Scripts\superset.exe" init

# 运行测试
pytest tests/unit_tests/
pytest tests/unit_tests/specific_test.py
```

### 前端

```powershell
cd superset-frontend

# 启动开发服务器
npm run dev-server

# 运行测试
npm run test

# 代码检查
npm run lint

# 构建生产版本
npm run build
```

### Git 提交前检查

```powershell
# Stage 文件
git add .

# 运行 pre-commit 检查
pre-commit run --all-files

# 修复后重新 stage
git add .
git commit
```

---

## 开发建议

1. **从小处着手**：先熟悉一个图表插件的完整代码（如 `plugin-chart-echarts/src/Timeseries/`）
2. **参考现有实现**：新增功能时复制现有资源的完整文件结构，保持一致性
3. **关注命名规范**：前端用 `Slice/Chart`，后端文件中 `slice` = 图表
4. **使用命令模式**：后端业务逻辑放在 `commands/` 中，避免在 API 中直接写逻辑
5. **测试驱动**：先写测试，后写实现；优先单元测试，然后集成测试
