# 验证记录

## V0.2：第二轮边界、材质与诊断

日期：2026-09-30。环境沿用 Node.js 22.4.1、Python 3.13.13、Windows、本机 Chrome 和 Playwright。

- 类型检查与生产构建通过。
- 17 项常规浏览器测试通过；另 1 项生产构建预览测试通过。
- 3 项数据库测试通过：两种模型读取、幂等种子保留描述、旧 SQLite 增加 version 列保留旧数据。
- 多 Mesh 部件和深层 Mesh 正确映射稳定业务 ID；测试对象名与 Part ID 不同。
- 共享基础材质按部件隔离，同部件两个 Mesh 一起反馈，其他部件不串色。
- 1000 次状态切换保持固定克隆引用和数量；三个克隆、一个基础材质、两份共享几何均释放一次。
- metadata 缺失、额外记录、重复 ID、缺少名称和描述不阻止模型显示与拾取。
- 404、500、无效 JSON、网络失败和 GLB 未支持状态均有对应错误类型；空 GLB URL 不回退到 Cube。
- 生命周期测试继续通过，一条 RAF，卸载为零，来源切换取消和清理生效。
- Debug 显示来源、部件、对象、Mesh、包围盒、三角形和详细诊断；生产默认不展示 Debug 控件。
- 检查桌面 Debug 与 320 像素手机 Debug 截图，模型可见、无横向溢出或文本重叠。
- Python 固定依赖安装完成，pip check 通过；前端 package-lock 保留。
- PowerShell 安装/启动脚本语法通过；实际以 5187 临时端口启动前端并访问 API，随后停止。
- 端口占用有清晰错误，环境端口覆盖读取正确。

本轮没有下载或处理真实模型，没有 GLB 请求，也没有新增架构层超出提示范围。
旧库兼容操作只补充 version 列，不是通用迁移框架。Vite 仍有单文件约 595 kB 的体积提示，构建成功。
资源测试不是长期 GPU/内存压力测试；真实 GLB 的骨骼、动画及加载取消仍需下一阶段用真实资产验证。

完整文件清单、22 项验收及冻结原则见 round-2-report.md。

## V0.1：六面 Cube 与三视图

验证日期：2026-09-30。环境：Windows、Node.js 22.4.1、Python 3.13.13、本机 Chrome 和 Playwright。

- 类型检查与 Vite 生产构建通过。
- 9 个浏览器测试通过：API 合约、三视图拾取与正方形投影、独立面材质、悬停/选择/取消、旋转/缩放/重置、六面列表、响应式、离线回退、触屏点击以及资源生命周期。
- 2 个数据库测试通过：模型/部件读取、初始化幂等且保留已保存描述。
- `model_assets` 与 `model_parts` 实际创建在项目 SQLite，API 从数据库返回六面元数据。
- 桌面 1440 x 900、1920 x 1080、1100 x 700，以及手机 390 x 844、320 x 700 已验证。
- 像素检查确认非空画布、模型完整取景、主视/俯视/右视均为正方形投影。
- 透视模式同时显示前、顶、右面，选中与悬停分别改变对应面，其他面颜色不变。
- 反复挂载、卸载及资源切换检查：挂载一条动画循环，卸载为零。
- 人工检查透视、主视和窄手机截图，无模型裁切、文本重叠或横向溢出。

本轮修复：

- 重启原先仍运行旧代码的项目后端，恢复新增 API。
- 更换模型 URL 时替换 canvas，并在 DOM 更新后创建新 Renderer，修复旧 WebGL 上下文已释放后无法重新初始化的问题。

截图输出在 `frontend/test-results/`。三视图截图位于 `parts-orthographic-views-p-ebe18-d-render-square-projections/`；独立材质截图位于 `parts-visible-faces-have-i-82b0f-ver-and-selection-materials/`；手机截图位于 `parts-resize-remains-frame-6e956-le-controls-do-not-overflow/`。
构建仍有单个 JavaScript 文件超过 500 kB 的提示，主要包含 Three.js；构建成功，尚未拆包。

本轮未接入人体或 GLB，没有元数据编辑 API、资产上传、数据库迁移或部署。三视图采用切换显示，未同时分屏。
生命周期测试没有代替长期 GPU/内存压力测试。

## V0 历史记录

验证日期：2026-09-30。
环境：Windows、Node.js 22.4.1、Python 3.13.13、本机 Chrome、Playwright。

## 结果

- `npm run build`：Vue/TypeScript 类型检查与 Vite 生产构建通过。
- `TEST_BROWSER_CHANNEL=chrome` 下执行 `npm run test:e2e`：3 个测试全部通过。
- `/api/health` 返回 `{"status":"ok"}`。
- `/api/models` 的完整 JSON 合约（包括中文元数据）通过 Playwright 校验。
- SQLite engine 首次连接及 `SELECT 1` 通过，数据库路径为 `backend/viewer.db`。
- 桌面 1440 x 900、调整窗口 1100 x 700、手机布局 390 x 844 均通过验证。
- 实际 canvas 像素检测确认 Cube 非空白、初始取景完整。
- 悬停变色、移开恢复、点击选中、信息联动、选中优先于悬停、点击空白取消均通过。
- 拖动旋转未误选中；旋转和滚轮缩放均产生画布像素变化。
- API 离线时保留 Cube 交互并显示演示信息。
- 浏览器测试未发现未处理 JavaScript 错误。
- 人工检查桌面与手机选中截图：模型显示正常，文本无重叠或横向溢出。
- 资源清理经过代码核对：动画、ResizeObserver、指针监听、OrbitControls、Cube 几何和材质、Renderer 均有对应释放逻辑。未进行长期内存压力测试。

截图位于 `frontend/test-results/viewer-render-hover-select-57fb0--zoom-and-responsive-layout/`：
`desktop-default.png`、`desktop-selected.png`、`mobile-selected.png`。重新运行测试会重建此目录。

## 环境问题与处理

- 5173 已被其他程序占用，本项目使用 5174。
- 创建虚拟环境、安装 Python 依赖与 SQLite 首次写入受执行环境权限限制，经自动审批重试后完成。
- Playwright Chromium 下载连接中断，改用本机 Chrome 完成验证。
- 原图标包提示弃用，已替换为维护中的 `@lucide/vue`，重新构建与测试通过。
- Vite 有单个 JavaScript 文件超过 500 kB 的提示（约 570 kB，gzip 153 kB，主要为 Three.js）。构建成功；V0 暂未拆包，后续真实模型接入时再评估加载策略。

## 范围

本轮只验证 Cube 与基础 API。未加载 GLB、未处理人体模型，未实现持久化业务、上传或部署。
