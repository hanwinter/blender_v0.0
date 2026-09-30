# Web 3D Model Specification

## 模型格式

- Blender 源文件：`.blend`，存放在 `assets/human/source/`。
- Web 发布：优先 `.glb`；也可使用 `.gltf` 及其配套资源，存放在 `assets/human/export/`。
- 预览图：`assets/human/preview/`。
- 当前 V0.2 使用六面 Cube 和独立交互测试模型，不读取外部模型文件。

## 命名规则

统一使用 snake_case，对象名称在同一发布模型内必须唯一且稳定。

例如：`human_male_01`、`head`、`torso`、`arm_l`、`arm_r`。
当前测试对象为 `demo_cube`。

## Cube 部件与三视图

```text
demo_cube
|-- face_front   (+Z)
|-- face_back    (-Z)
|-- face_left    (-X)
|-- face_right   (+X)
|-- face_top     (+Y)
`-- face_bottom  (-Y)
```

采用 Y 向上。主视图从 +Z 看向原点，俯视图从 +Y 看向原点、屏幕上方向为 -Z，右视图从 +X 看向原点。
三视图采用正交投影，透视模式单独提供旋转与缩放。当前采用切换方式查看，不同时分屏。

模型 ID 与部件 ID 分开管理；部件 ID 在所属模型内唯一，数据库使用 `(model_id, id)` 作为部件主键。
模型 `version` 是独立字段，如 `1.0.0`，不编码进业务模型 ID。当前数据库保存每个模型的当前版本，不提供多版本资产管理。
Cube 六面的中文名称和描述来自 `metadata/demo_cube.json` 初始化的数据库记录。

## 业务部件边界

`ModelPart` 使用稳定 `id`、部件根节点 `object` 和所有可拾取 `meshes`。一个部件可以包含多个 Mesh 或多层 Group。
`id` 不要求等于 `object.name`；对象名称用于技术定位和导入映射，元数据按业务 ID 关联。

交互测试模型包含：

```text
test_root
|-- assembly_left       -> part_a
|   |-- mesh_a1
|   `-- mesh_a2
|-- assembly_middle     -> part_b
|   `-- mesh_b1
`-- assembly_right      -> part_c
    `-- detail_outer
        `-- detail_inner
            `-- mesh_c1
```

四个 Mesh 初始共享同一基础材质来源。Viewer 初始化时按部件隔离材质，避免高亮影响其他部件。

## 人体第一版结构

```text
human_male_01
|-- head
|-- torso
|-- arm_l
|-- arm_r
|-- leg_l
`-- leg_r
```

## 原则

- Blender 负责模型结构与对象名称。
- Web 使用 Mesh 到 ModelPart 的映射进行交互识别，API 部件 `id` 对应 ModelPart.id。
- 业务描述信息由后端 API 管理。
- 不把业务内容写死在 Blender 模型中。
- 导出后检查各部件仍能独立拾取，避免合并所有 Mesh。
- 建议采用米为单位并应用对象变换；发布后确认模型朝向、尺寸和相机取景。
