# 第二轮完成报告

当前 V0.2，执行 `prompt/第2轮.md`，继续使用 Cube。指定的 `rootproject/项目结构与启动说明.md` 与 `docs/architecture.md` 已同步更新。

## 目录与文件

完整源码树见 [README](../README.md) 和 [项目结构与启动说明](../../rootproject/项目结构与启动说明.md)。

新增文件：

```text
frontend/src/models/types.ts
frontend/src/models/modelLoader.ts
frontend/src/models/interactionTestModel.ts
frontend/src/viewer/highlight.ts
frontend/src/viewer/modelStats.ts
frontend/src/components/ViewerDebugPanel.vue
frontend/src/metadata/validate.ts
frontend/src/config.ts
frontend/src/errors.ts
frontend/tests/interaction.spec.ts
frontend/tests/metadata.spec.ts
frontend/tests/production.spec.ts
frontend/tests/fixtures/contracts.ts
backend/app/config.py
backend/app/run.py
backend/.env.example
scripts/setup.ps1
scripts/start-dev.ps1
scripts/read-config.py
metadata/interaction_test.json
.env.example
.env (本地、Git 忽略)
docs/round-2-report.md
```

修改文件：

```text
frontend/src/models/demoCube.ts
frontend/src/viewer/runtime.ts
frontend/src/viewer/interaction.ts
frontend/src/components/ModelViewer.vue
frontend/src/App.vue
frontend/src/api/client.ts
frontend/src/types/model.ts
frontend/src/style.css
frontend/vite.config.ts
frontend/package.json
frontend/.env.example
frontend/tests/parts.spec.ts
frontend/tests/lifecycle.spec.ts
frontend/tests/fixtures/Harness.vue
backend/app/models/model.py
backend/app/schemas/model.py
backend/app/services/models.py
backend/app/api/routes.py
backend/app/database/session.py
backend/app/database/initialize.py
backend/app/main.py
backend/tests/test_models.py
backend/requirements.txt
metadata/demo_cube.json
README.md
backend/README.md
docs/model-spec.md
docs/architecture.md
docs/verification.md
rootproject/项目结构与启动说明.md (工作目录下)
```

前端 package-lock.json 保留；依赖集合未变化，不进行无关锁文件更新。

## 模型关系与加载

```text
ModelSource
  -> loadModel(source, signal?)
  -> Promise<LoadedModel { root, parts: ModelPart[] }>
  -> createViewer({ model, ... })
  -> Scene / Camera / Interaction / Highlight / Lifecycle
```

ModelPart 为 `{ id, object, meshes, sourceName? }`。业务 ID 与对象名称解耦。
Runtime 不导入 demoCube，不调用模型工厂，也不访问 API。

Cube：`<ModelViewer :source="{ type: 'demo' }" />`。
测试模型：`<ModelViewer :source="{ type: 'interaction-test' }" />`。
页面下拉框可切换两者。`glb` 只保留类型与入口，包含空 URL 的 GLB 来源都明确返回加载错误，不创建 Cube。

## 拾取与材质

Mesh 显式映射到 ModelPart，支持一个部件多个 Mesh 和任意 Group 深度。
测试模型业务 ID 为 part_a / part_b / part_c，对象名为 assembly_left / assembly_middle / assembly_right。

每个原材质在每个部件内克隆一次，同一部件内部继续共享。状态变化只更新颜色，选中优先于悬停。
卸载恢复原绑定并释放克隆，然后去重释放基础材质、共享几何和纹理。

## 元数据与错误

检查重复几何/元数据 ID、缺少元数据、额外元数据、缺失名称或描述、JSON 格式、模型版本和部件数量。
有问题时继续显示模型并保留拾取，信息区采用 ID 和信息不可用提示；Debug/日志提供细节。

统一错误：NETWORK_ERROR、MODEL_NOT_FOUND、MODEL_LOAD_ERROR、METADATA_LOAD_ERROR、INVALID_METADATA、PART_ID_MISMATCH、DUPLICATE_PART_ID。
正常 UI 不显示错误代码，网络错误与健康服务上的模型 404/500 已区分。

## Debug 与配置

开发页面的 Debug 图标可开启；或根 .env 设置 VITE_VIEWER_DEBUG=true 后重启。
Debug 显示来源、部件和 Mesh 数量、Hover/Selected ID、对象名、选中部件 Mesh 数、包围盒、三角形数量及诊断。
生产默认关闭且隐藏开关，已用构建预览验证。未加入可选轴线、包围盒辅助线或线框，以保持本轮范围。

配置模板：根 .env.example、frontend/.env.example、backend/.env.example。
前端 API 与默认模型配置在 src/config.ts；后端端口、数据库与 CORS 在 app/config.py。
共享端口维护在根 .env，组件专用参数可局部覆盖，shell 环境优先。

## 启动

从项目根目录首次安装：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

前后端在两个终端分别运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1 -Service backend
```

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1 -Service frontend
```

手动后端：在 backend 执行 `.\.venv\Scripts\python.exe -m app.run`。
手动前端：在 frontend 执行 `npm run dev`。
默认页面 http://127.0.0.1:5174，API 文档 http://127.0.0.1:8000/docs。
脚本前台运行，Ctrl+C 停止，端口占用明确报错。

## 验收

- [x] Runtime 解除对 createDemoCube 的直接依赖。
- [x] 统一 LoadedModel。
- [x] 统一 ModelPart。
- [x] 业务 ID 与对象名称解耦。
- [x] 显式 ModelSource。
- [x] 空 URL 不再代表 Cube。
- [x] Demo Cube 回归正常。
- [x] 独立交互测试模型正常。
- [x] 多 Mesh 部件整体 Hover / Selected。
- [x] 跨部件共享材质不串色。
- [x] 深层子 Mesh 映射到业务部件。
- [x] Selected 优先于 Hover。
- [x] 元数据缺失不阻止模型与拾取。
- [x] 七类错误可区分。
- [x] Debug 核心信息可查看。
- [x] API、端口、数据库配置集中管理。
- [x] 三处 .env.example 完整。
- [x] Python 直接及传递依赖版本锁定。
- [x] 前端锁文件保留。
- [x] 安装、启动与端口占用说明和脚本完成。
- [x] 生命周期回归通过。
- [x] 基础资源释放与材质数量验证通过，未发现明显泄漏。

17 项常规浏览器测试、1 项生产测试和 3 项数据库测试通过；构建及 pip check 通过。
材质验证执行 1000 次状态切换，始终为三个部件克隆；释放三个克隆、一个基础材质和两份共享几何，均恰好一次。
验证了实际临时端口启动和 API 代理、占用报错、环境覆盖，以及旧 SQLite 增加 version 时保留已有描述。
截图包括桌面、320 像素手机、共享材质和异常元数据 Debug，位于 frontend/test-results。
未进行长期 GPU 或内存压力测试。Vite 仍有约 595 kB JavaScript 文件体积提示，构建成功。

## 未实现与下一阶段

按要求未实现：真实 GLBLoader、人体、上传、后台、模型 CRUD、权限、对象/云存储、动画/骨骼、LOD、编辑、VR/AR、WebGPU、Docker和 Alembic。
三视图仍采用切换，不同时分屏。模型版本仅为当前版本字段，没有多版本资产管理。

本轮后暂停架构抽象。真实 GLB 就绪时预计：

1. 新增模型加载实现，建立 Object/Mesh 到稳定 ModelPart 的映射。
2. 修改 modelLoader 的 glb 分支，沿用 AbortSignal 和 LoadedModel。
3. App 根据模型选择显式构造 GLB 来源，继续关联数据库元数据。
4. 按资产扩展 dispose 的骨骼、动画和纹理释放，并验证真实模型。

Runtime、camera、interaction 和 ModelInfoPanel 原则上继续复用。两种测试模型永久保留。
