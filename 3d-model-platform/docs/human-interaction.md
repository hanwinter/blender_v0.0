# 人体交互与后续编辑

八个部位：头、躯干、左右臂（含手）、左右腿（含脚）、左右眼。左右按人物自身方向定义。
左键点击选择，左键拖动旋转（透视），右键平移，滚轮缩放。眼睛建议放大后点击，也可通过列表选择。

说明编辑位置：`frontend/src/models/humanParts.ts`，当前文字明确标记为示例说明。

当前源文件：`assets/human/source/*-unclothed-interactive.blend`。已移除短袖与短裤，保留基础皮肤和眼睛细节。身体为完整可编辑网格，虹膜为独立网格。旧服装版本归档于 `C:\AllFiles\MyFolderOMEN\blender\project_blender_archive\2026-10-08-history`，后续可引入成品服装。
FACE 域整数属性 `human_part_index` 保存面分区：0=head、1=torso、2=left_arm、3=right_arm、4=left_leg、5=right_leg。
同名顶点组方便选择，但边界顶点可以属于多个组，导出以面属性为准。
眼球通过自定义属性 `part_id` 标记为 left_eye/right_eye。
初始分区边界沿现有三角面，可继续优化；重建拓扑后需要检查新面的分区。

重新导出当前无服装与眼睛版本，在项目目录执行：

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --python .\assets\human\source\export_dressed_web.py -- --source-suffix unclothed-interactive
```

上述命令末尾追加 `bodyFemale-realistic` 可只导出一个模型。不带 source-suffix 时默认导出当前 unclothed 版本。

旧服装版本的短袖和短裤有 FACE 域 `human_part_index`：短袖主体/短裤腰部对应躯干，左右袖对应左右臂，左右裤腿对应左右腿。点击服装与身体共用选中状态，并一起高亮。
虹膜含棕色虹膜、深色边缘与黑色瞳孔；眼球与虹膜共用眼睛 `part_id`，多材质子网格继承父节点的标记。
服装是静态基础款，不包含布料模拟或骨骼绑定。调整身体比例后需同时适配衣服和眼睛。
导出脚本读取指定 source-suffix 的文件，保留 UV 和完整身体的平滑法线，在内存中拆分部位，写入 `frontend/public/models/`。
不保存拆分状态至源文件，不导出预览灯光。生产部署后需重新构建前端。

历史生成脚本、阶段模型和检查报告统一归档于 `C:\AllFiles\MyFolderOMEN\blender\project_blender_archive\2026-10-08-history`。历史脚本依赖原目录结构，恢复方法见归档 README；不要直接运行归档脚本。Blender 的 `.blend1` 自动备份已删除。
