import type { ModelInfo } from '../types/model'

// Editable local descriptions; shared stable IDs across all four human assets.
export const humanParts: ModelInfo[] = [
  { id: 'head', name: '头部', description: '头部区域，包含面部与颅部；左右眼为独立部位。（示例说明，可后续编辑）' },
  { id: 'torso', name: '躯干', description: '躯干区域，包含胸部、腹部、背部及骨盆。（示例说明，可后续编辑）' },
  { id: 'left_arm', name: '左臂', description: '人物自身左侧的上肢，包含上臂、前臂和手。（示例说明，可后续编辑）' },
  { id: 'right_arm', name: '右臂', description: '人物自身右侧的上肢，包含上臂、前臂和手。（示例说明，可后续编辑）' },
  { id: 'left_leg', name: '左腿', description: '人物自身左侧的下肢，包含大腿、小腿和脚。（示例说明，可后续编辑）' },
  { id: 'right_leg', name: '右腿', description: '人物自身右侧的下肢，包含大腿、小腿和脚。（示例说明，可后续编辑）' },
  { id: 'left_eye', name: '左眼', description: '人物自身左侧的眼球。可放大模型后点击或在列表中选择。（示例说明，可后续编辑）' },
  { id: 'right_eye', name: '右眼', description: '人物自身右侧的眼球。可放大模型后点击或在列表中选择。（示例说明，可后续编辑）' },
]
