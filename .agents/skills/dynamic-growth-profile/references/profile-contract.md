# Dynamic Profile Data Contract

This reference describes the first implementation boundary for the HarmonyOS active learning companion. It is an engineering contract, not a claim that a learning or emotional conclusion has been validated.

## Existing inputs

| Input | Existing module | Use in the profile |
| --- | --- | --- |
| Authorized, complete learning session | `learning/LearningTypes.ets`, `learning/EventCollector.ets` | Gate every derived observation. |
| In-app learning event | `LearningEvent` | Keep the `eventId` as evidence; do not duplicate facts. |
| Current behavior fact | `knowledge/BehaviorInterpreter.ets` | Select support wording and temporary context. It does not prove emotion. |
| Historical behavior-emotion reference | `knowledge/BehaviorEmotionRdb.ets` | Explain possible historical associations only. Source candidates are unverified. |
| Question and knowledge reference | `knowledge/MathKnowledgeRdb.ets` | Attach the current task or reviewed knowledge claim without upgrading it to mastery evidence. |

## RDB boundary

Create a local profile RDB separate from the two immutable graph RDBs. Use a schema version and a seed/migration guard. The minimum tables are:

| Table | Required fields | Purpose |
| --- | --- | --- |
| `profile_observation` | `observation_id`, `dimension`, `subject_key`, `value_code`, `status`, `source`, `created_at`, `expires_at`, `profile_version` | Current or historical profile observation. |
| `profile_evidence` | `evidence_id`, `observation_id`, `evidence_type`, `evidence_ref`, `source`, `created_at` | Links an observation to events, graph references, or feedback. Prevent duplicate evidence links. |
| `intervention_feedback` | `feedback_id`, `session_id`, `task_id`, `request_id`, `action`, `accepted`, `helpful`, `outcome`, `created_at` | Captures explicit response or an explicit `UNKNOWN` outcome. |
| `profile_correction` | `correction_id`, `observation_id`, `action`, `replacement_value`, `created_at` | Records user confirmation, correction, or clearing. |
| `profile_snapshot` | `snapshot_id`, `profile_version`, `created_at`, `payload_json` | Optional derived read model; regenerate only from retained records. |

Use parameterized statements, native RDB transactions, cursor closure, and a single initialization promise, as in the existing graph RDB modules. Initialize all related rows atomically. A profile data clear must remove every table's personal rows in one transaction.

## 三维画像（替代原有四类顶层维度）

三个维度均应输出；下面是各维度子项及证据条件。具体观察窗、晋升门槛和复查周期为版本化工程策略，未配置时保持观察或未知，不自行选取次数来判断性格。

| dimension / facet | 内容 | 证据与解释边界 |
| --- | --- | --- |
| `knowledge / knowledge_point` | 知识点表现、错误类型、独立与提示后完成、迁移复习 | 关联真实题目/知识节点和审核状态。多知识点题的一次错误不能说明所有知识点薄弱；正确一次不能视为掌握。 |
| `emotion_personality / current_emotion` | 当前自报或待确认情绪，疲惫状态 | 明确自报优先，行为推断保留候选；当前状态按恢复、结束或有效期失效。 |
| `emotion_personality / recurring_emotion` | 常有情绪及相关情境 | 聚合独立自报或已确认记录，保留时间窗、次数、有效报告总数、日期/会话覆盖。说“5 次自报中 3 次提到紧张”，不能据此推断所有学习时间。 |
| `emotion_personality / personality_tendency` | 性格自述、学习情境中的倾向候选 | 如“自述喜欢先独立思考”。保留自述/推断、支持证据、反例和确认状态；未经确认的推断不成为确定性格属性。 |
| `learning_attitude_habits / attention` | 走神自报、注意力恢复、可观测中断 | 停顿可能是思考，切出可能查资料；中断仅证明中断。走神需自报或确认，没有相关数据则未知。 |
| `learning_attitude_habits / resilience` | 遇挫后重试、改方法、求助、休息后回归 | 结合困难事件与后续有效尝试跨任务观察。次数不等于韧性分数，休息和求助可以是积极应对。 |
| `learning_attitude_habits / strategy_flexibility` | 方法切换，对应是否容易钻牛角尖 | 需步骤/策略轨迹或用户确认；重复提交不证明使用同一方法。描述“本次重复无效策略，尚未切换”，不直接评价人格固执。 |
| `learning_attitude_habits / help_seeking` | 求助时机与采用提示后的尝试 | 结合任务难度与先前尝试，不把求助等同依赖。 |
| `learning_attitude_habits / guidance_preference` | 分步提示、先独立尝试等偏好 | 单次请求为当次需求；跨会话重复选择支持长期候选。 |
| `learning_attitude_habits / routine` | 复习、任务投入、启动完成和节奏 | 需跨日期且覆盖清楚的记录；应用没记录不等于没学习，不据此给态度好坏评分。 |

## 扩充子项

以下子项补充上述维度。它们是可逐步启用的观察范围，不要求一次采集齐全，也不意味着当前模型已能识别。仅有结果、缺少过程或自报时，相应子项保持未知。

| dimension / facet | 观察什么 | 所需证据与边界 |
| --- | --- | --- |
| `knowledge / conceptual_understanding` | 是否理解概念、条件和适用范围 | 解释理由、辨别反例、概念辨析题及可靠评价；只记住答案不能视为理解。 |
| `knowledge / prerequisite_readiness` | 当前学习所需的先修基础 | 已审核的先修关系与对应基础题表现；现有图谱没有的先修边不能自行当成事实。 |
| `knowledge / reasoning_process` | 推理步骤、运算与表达中具体卡点 | 可核对的步骤、错误定位及判分来源；无过程时不能区分概念错误、计算错误或偶然失误。 |
| `knowledge / transfer` | 换题型、换情境后能否应用 | 同知识点不同题目中的独立表现，保留提示条件；重复同题答对不算迁移证据。 |
| `knowledge / retention` | 隔一段时间后能否回忆与应用 | 有时间间隔的复习表现，区分独立回忆和重新提示；没有复测不推断遗忘。 |
| `emotion_personality / emotional_recovery` | 情绪在困难、帮助、休息前后如何变化 | 前后自报及相关情境；恢复作答不等于情绪已改善，也不能单凭前后变化断言干预导致改善。 |
| `emotion_personality / learning_confidence` | 对某类任务的信心及其变化 | 作答前后明确的信心自报，按知识点/任务限定；答错或求助不能直接证明自卑或信心低。 |
| `emotion_personality / feedback_response` | 面对纠错、评价和鼓励时的感受与偏好 | 用户表达与多次确认，如偏好先解释错误原因；拒绝一次建议不等于敏感或抗拒批评。 |
| `emotion_personality / interaction_tendency` | 学习交流中偏好主动讨论还是先独立思考 | 用户自述和跨情境选择，可供用户确认；不外推为日常社交性格或内外向人格。 |
| `learning_attitude_habits / planning` | 是否设定目标、拆分任务、调整计划 | 用户明确制定的计划及实际进度；系统代拟但未采纳的计划不计作用户习惯。 |
| `learning_attitude_habits / task_initiation` | 从计划到开始任务的节奏 | 明确计划时间、实际开始与用户说明；延迟可能有外部原因，不能直接贴拖延标签。 |
| `learning_attitude_habits / self_monitoring` | 是否检查答案、察觉不懂、纠错复盘 | 检查动作、修订理由、复盘记录或确认；反复改答案不自动等于认真检查。 |
| `learning_attitude_habits / time_regulation` | 是否合理分配时间、休息并恢复任务 | 授权范围内的时段、暂停恢复与用户计划；时长不是有效学习量，不鼓励无限坚持。 |
| `learning_attitude_habits / curiosity` | 是否主动追问原因、尝试拓展或比较解法 | 自主提问与可核对的探索行为；完成必做题或不发言不能说明好奇心强弱。 |

维度间有关联但不互相代替：知识上的暂时困难不能直接写成态度差；自报紧张不能变成能力弱；积极探索不同解法与反复使用同一无效方法应分别记录。避免把相同事实在多个子项累计成多个独立样本。

Allowed statuses are `UNKNOWN`, `OBSERVING`, `SUPPORTED`, `USER_CONFIRMED`, `EXPIRED`, `CORRECTED`, and `CLEARED`. `SUPPORTED` means repeated project-defined evidence supports a scoped observation; it does not mean a psychological or educational diagnosis. `USER_CONFIRMED` 表示用户确认该描述，不表示客观测量已验证。

## 新增字段、现有缺口与生命周期

在 observation 中补充 `facet`、`description`、`temporal_scope`（current/longitudinal）、`confirmation_status`、`window_start/window_end`、`session_count/day_count`、`evidence_count/counter_evidence_count`、`eligible_observation_count`、`updated_at`、`review_after`、`expiry_trigger`、`rule_version/model_version`。证据关联标明支持或反例；同一事件在同一观察内只能计数一次，模型和规则对该事件的解释不是新增独立证据。

现有 LearningTypes 提供提交、提示、拆分、休息及任务状态等事件；多数自由回答未自动判分。新增 ProfileInput 独立接收情绪、信心、走神、策略切换、交流倾向、计划与自检的结构化自报，以及引导接受/效果反馈，不改变训练使用的事件与特征定义。`coverageComplete` 不表示所有心理相关信号已经采集。自动策略轨迹、概念理解评价与迁移复测仍缺输入，对应项目保持未知。图谱沿用现有内容，历史候选不计入个人自报情绪统计。

当前情绪过期后可作为授权范围内的历史统计依据，但不能继续显示为当下情绪。反例应使已有倾向重新评估或降级。纠正后阻止原证据重建被否定结论；清除全部个人数据时同时清除纠正关联与派生缓存，并使在途写入失效。

当前实现由单一 RDB 写队列在事务内读取最新版本、重算并提交；授权/纠正/清除使用 epoch 拒绝旧任务，效果等同于避免覆盖新纠正。ProfileInput 使用固定种类和枚举，不执行输入中的 SQL/代码。持久化表使用主键和 JSON payload 保存实际 ArkTS 类型，完整字段以 `ProfileTypes.ets` 为准；上表是可扩展目标契约，未实现全部细分字段。画像快照保存版本、时间、策略版本与证据引用，最多保留最近 31 个版本。

合成示例（非真实用户）：知识“判别式相关题提示后答对，独立应用待观察”；情绪“当次自报紧张，近期 5 次自报中 3 次提及紧张，性格未知”；态度习惯“遇错后主动求助并重试，长期韧性待观察；缺少走神确认与策略轨迹，走神及钻牛角尖未知”。

## Summary given to the decision layer

Expose only active items needed for the current task:

```text
ProfileSummary = {
  profileVersion,
  dimensions: { knowledge: [], emotion_personality: [], learning_attitude_habits: [] },
  activeObservations: [{ dimension, facet, subjectKey, valueCode, status, source, evidenceCount, expiresAt }],
  interventionFeedback: [{ action, outcome, createdAt }]
}
```

The summary must omit cleared, corrected, expired, incomplete, and unauthorized records. Its use is bounded: it may choose an offered support format, suppress a recently rejected proactive card, or stay quiet. It cannot override consent, user controls, or an explicit request for help.
