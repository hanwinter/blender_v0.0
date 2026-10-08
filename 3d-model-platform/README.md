# Web 3D Model Platform

当前保留 Cube 和交互测试模型，并支持四个本地人体 GLB 展示模型。默认仍为 Cube。

前端：Vue 3、TypeScript、Vite、Three.js、Lucide。后端：Python、FastAPI、SQLAlchemy、SQLite。
无大型 UI 框架、Pinia、Docker 或数据库迁移框架。

## 安装与启动

便捷启动：双击工作目录 `project_blender/start.bat`，自动打开前后端两个终端。
也可在工作目录的 PowerShell 中执行 `./start.bat`。页面地址为 <http://127.0.0.1:5174>（默认配置）。
在各服务窗口按 Ctrl+C 停止；请勿重复启动。首次安装依赖仍使用下方 setup 脚本。

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

当前本地 `.env` 使用前端端口 `15174`、后端端口 `18000`，以减少与其他项目冲突。
本地页面：<http://127.0.0.1:15174>；API 文档：<http://127.0.0.1:18000/docs>。下方配置表为默认值。

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

模型下拉框可切换 Cube、交互测试模型，以及女性·写实、女性·风格化、男性·写实、男性·风格化：

人体文件位于 `frontend/public/models/`，构建时复制到 dist。四个人体支持八个部位的点击、整块高亮和示例说明；无需后端记录即可加载，支持旋转、缩放、右键平移及视图切换。默认仍为 Cube。

- Cube：六个独立面，验证基本拾取、悬停、选中与三视图。
- 交互测试模型：三个部件、四个 Mesh，含一个双 Mesh 部件、深层 Group 和跨部件共享基础材质。
- 任意子 Mesh 映射到稳定 ModelPart ID，ID 可以与 Three.js 对象名不同。
- 同部件多个 Mesh 一起高亮，其他部件不会串色；选中优先于悬停。
- 主视、俯视、右视采用正交投影，透视模式支持旋转和缩放。
- 列表选择、画布选择与取消共享状态，模型切换清空旧选择。
- 元数据异常不阻止几何显示和拾取；UI 显示友好状态，Debug 显示具体原因。
- 一条 RAF，正确清理 Controls、事件、ResizeObserver、克隆和原始材质、几何、纹理、Renderer。

`ModelSource -> loadModel -> LoadedModel -> Runtime` 为固定边界。`glb` 类型通过 GLTFLoader 加载本地资源，支持请求取消及过期解析结果清理。
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

四个人体 GLB 当前为无服装版本，保留基础皮肤、棕色虹膜与黑色瞳孔，以及八部位交互。最新可编辑源文件为 `assets/human/source/*-unclothed-interactive.blend`，旧服装源文件与生成脚本归档在 `C:\AllFiles\MyFolderOMEN\blender\project_blender_archive\2026-10-08-history`，后续可适配成品服装。说明文字仍为示例。编辑与重新导出方法见 [人体交互说明](docs/human-interaction.md)。
