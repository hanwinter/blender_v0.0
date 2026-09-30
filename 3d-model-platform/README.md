# Web 3D Model Platform

当前 V0.2，使用 Cube 和独立交互测试模型稳定 Viewer 架构。暂不接入真实 Blender 或 GLB 资产。

前端：Vue 3、TypeScript、Vite、Three.js、Lucide。后端：Python、FastAPI、SQLAlchemy、SQLite。
无大型 UI 框架、Pinia、Docker 或数据库迁移框架。

## 安装与启动

验证环境为 Node.js 22.4.1、Python 3.13.13、Windows PowerShell。
在项目根目录执行一次：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

在两个终端分别执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1 -Service backend
```

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1 -Service frontend
```

脚本以前台方式运行，Ctrl+C 停止对应服务。端口被占用会报错，不会自动换端口或停止其他进程。

也可手动安装和运行：

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m app.run
```

```powershell
cd frontend
npm ci
npm run dev
```

当前依赖已经安装。前端 lock 文件保留，后端包括直接和传递依赖均固定版本。

默认页面：<http://127.0.0.1:5174>。API 文档：<http://127.0.0.1:8000/docs>。
`app.run` 默认开启后端开发重载；`--no-reload` 可关闭。

## 配置

根 `.env.example` 是共享配置模板；实际根 `.env` 被 Git 忽略。

| 字段 | 默认值 | 用途 |
| --- | --- | --- |
| FRONTEND_PORT | 5174 | 前端开发端口。 |
| BACKEND_PORT | 8000 | 后端端口及默认 API 代理目标。 |
| VITE_API_BASE_URL | /api | 前端统一 API 来源。 |
| VITE_DEFAULT_MODEL | demo | demo 或 interaction-test。 |
| VITE_VIEWER_DEBUG | false | Debug 默认开关。 |
| DATABASE_PATH | backend/viewer.db | 相对项目根目录的数据库路径。 |

前端另提供 `frontend/.env.example`，可设置 API、默认模型、Debug 和可选 API_PROXY_TARGET。
后端另提供 `backend/.env.example`，可设置数据库路径、可选 DATABASE_URL 和 CORS_ORIGINS。
共享端口建议只在根 .env 维护；shell 环境优先于对应组件 .env，再优先于根 .env。
前端环境变更后需重启 Vite，生产需重新构建。

## 结构

```text
3d-model-platform/
|-- frontend/
|   |-- src/
|   |   |-- api/client.ts
|   |   |-- components/
|   |   |   |-- ModelViewer.vue
|   |   |   |-- ModelInfoPanel.vue
|   |   |   |-- ViewerToolbar.vue
|   |   |   `-- ViewerDebugPanel.vue
|   |   |-- models/
|   |   |   |-- types.ts
|   |   |   |-- modelLoader.ts
|   |   |   |-- demoCube.ts
|   |   |   `-- interactionTestModel.ts
|   |   |-- metadata/validate.ts
|   |   |-- viewer/
|   |   |   |-- runtime.ts
|   |   |   |-- scene.ts
|   |   |   |-- camera.ts
|   |   |   |-- interaction.ts
|   |   |   |-- highlight.ts
|   |   |   |-- modelStats.ts
|   |   |   `-- dispose.ts
|   |   |-- types/model.ts
|   |   |-- config.ts
|   |   |-- errors.ts
|   |   |-- App.vue
|   |   |-- main.ts
|   |   `-- style.css
|   |-- tests/
|   |   |-- parts.spec.ts
|   |   |-- interaction.spec.ts
|   |   |-- metadata.spec.ts
|   |   |-- lifecycle.spec.ts
|   |   |-- production.spec.ts
|   |   `-- fixtures/
|   |-- package.json
|   |-- package-lock.json
|   |-- vite.config.ts
|   |-- tsconfig.json
|   |-- playwright.config.ts
|   |-- .env.example
|   `-- index.html
|-- backend/
|   |-- app/
|   |   |-- config.py
|   |   |-- run.py
|   |   |-- main.py
|   |   |-- api/routes.py
|   |   |-- models/model.py
|   |   |-- schemas/model.py
|   |   |-- services/models.py
|   |   `-- database/
|   |       |-- session.py
|   |       `-- initialize.py
|   |-- tests/test_models.py
|   |-- .env.example
|   |-- requirements.txt
|   `-- README.md
|-- scripts/
|   |-- setup.ps1
|   |-- start-dev.ps1
|   `-- read-config.py
|-- assets/human/{source,export,preview}/
|-- metadata/{demo_cube.json,interaction_test.json}
|-- docs/
|   |-- architecture.md
|   |-- model-spec.md
|   |-- verification.md
|   `-- round-2-report.md
|-- .env.example
|-- .gitignore
`-- README.md
```

省略 Python 包初始化文件、依赖、运行日志和数据库等生成文件。

## 模型与交互

模型下拉框可切换 Cube 与交互测试模型：

- Cube：六个独立面，验证基本拾取、悬停、选中与三视图。
- 交互测试模型：三个部件、四个 Mesh，含一个双 Mesh 部件、深层 Group 和跨部件共享基础材质。
- 任意子 Mesh 映射到稳定 ModelPart ID，ID 可以与 Three.js 对象名不同。
- 同部件多个 Mesh 一起高亮，其他部件不会串色；选中优先于悬停。
- 主视、俯视、右视采用正交投影，透视模式支持旋转和缩放。
- 列表选择、画布选择与取消共享状态，模型切换清空旧选择。
- 元数据异常不阻止几何显示和拾取；UI 显示友好状态，Debug 显示具体原因。
- 一条 RAF，正确清理 Controls、事件、ResizeObserver、克隆和原始材质、几何、纹理、Renderer。

`ModelSource -> loadModel -> LoadedModel -> Runtime` 为固定边界。`glb` 类型仅预留，不实现加载。
不再使用空 modelUrl 隐式创建 Cube。

详细接口和资源所有权见 [架构说明](docs/architecture.md)。

## 元数据与 Debug

API 提供健康检查、模型摘要、模型详情和部件列表。
模型 API 含独立 version 字段，目前均为 1.0.0；数据库仅保存当前版本。

首次从 metadata JSON 初始化 SQLite，已有模型记录不覆盖。
旧 SQLite 兼容补充 version 列并保留描述；尚无 Alembic、HTTP 写入或完整迁移系统。

开发环境点击模型标题右侧的 Debug 图标查看来源、部件数、Hover/Selected ID、对象名称、Mesh 数、包围盒与三角形数。
Debug 默认关闭，生产默认隐藏开关。可在 .env 中显式设置 VITE_VIEWER_DEBUG=true 后重启开启。

错误类型：NETWORK_ERROR、MODEL_NOT_FOUND、MODEL_LOAD_ERROR、METADATA_LOAD_ERROR、INVALID_METADATA、PART_ID_MISMATCH、DUPLICATE_PART_ID。

## 验证

前后端运行后，在 frontend：

```powershell
npm run build
$env:TEST_BROWSER_CHANNEL = 'chrome'
npm run test:e2e
```

没有本机 Chrome 时执行 `npx playwright install chromium` 并移除 TEST_BROWSER_CHANNEL 设置。

生产 UI 验证需先在另一个终端运行 `npm run preview -- --port 4187 --strictPort`：

```powershell
$env:PRODUCTION_BASE_URL = 'http://127.0.0.1:4187'
npx playwright test production.spec.ts
```

常规浏览器测试有 17 项，production 测试在未设置 URL 时跳过；本次已单独验证生产预览。
截图和 trace 位于被忽略的 frontend/test-results。
后端目录执行：

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m pip check
```

验收记录见 [verification.md](docs/verification.md)，本轮新增与修改文件清单见 [round-2-report.md](docs/round-2-report.md)。

## 下一阶段

本轮架构冻结，继续保留两种回归模型。待模型设计完成后：

1. Blender 整理并导出 GLB，确认部件结构和稳定业务 ID 映射。
2. 新增 GLB Loader 实现，返回既有 LoadedModel / ModelPart。
3. 启用 modelLoader 的 glb 分支，App 显式提供来源。
4. 按真实资源补充纹理、骨骼与动画资源释放，并执行既有回归测试。

本轮未实现真实 GLB、人体、上传、CRUD、后台管理、权限、对象存储、动画、LOD、材质编辑、VR、WebGPU、Docker或三视图同时分屏。
构建有约 595 kB JavaScript 文件的体积提示，主要为 Three.js；构建成功，当前未拆包。
