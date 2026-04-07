# MemPalace OpenCode Plugin 实施方案详细文档

## 1. 项目定位与目标

- **项目名称**: `opencode-plugin-mempalace`
- **目标**: 将 MemPalace 的 "终身记忆"（L0-L3 记忆栈、AAAK 压缩、自动上下文保存）无缝集成到 OpenCode 终端助手中。
- **开源计划**: 作为一个独立的 NPM 包发布，用户可以通过配置 `plugin_origins` 在 OpenCode 中加载。

## 2. 核心架构设计

采用 **Plugin + CLI Wrapper** 的轻量级桥接架构：

1. **Plugin 拦截层**: 
   - 监听 OpenCode 的生命周期 Hooks（`experimental.session.compacting`, `chat.message` 等）。
   - 在关键节点截获上下文，准备注入或保存。
2. **MemPalace 交互层**:
   - 由于直接操作 ChromaDB 存在并发风险且逻辑复杂，插件将封装对本地 `mempalace` CLI 的子进程调用。
   - 这保证了与 MemPalace 官方逻辑 100% 对齐，且不需要重写核心 Python 逻辑。

## 3. 关键 Hooks 实现逻辑

### 3.1 压缩前紧急保存与注入 (PreCompact Hook)
- **拦截**: `experimental.session.compacting`
- **逻辑**:
  1. 获取当前 session 的工作目录，推断所属的 `wing`（项目名称）。
  2. 调用 `mempalace search` 或 `mempalace wake-up` 获取该 wing 的核心记忆。
  3. 将这些记忆推入 `output.context` 数组中，确保 OpenCode 在生成压缩摘要时，不会丢失长期的关键决策信息。

### 3.2 会话初始化 / 唤醒记忆 (Wake-up Hook)
- **拦截**: `experimental.chat.system.transform` 或 `chat.message`
- **逻辑**:
  1. 在新会话的第一条消息时，调用 `mempalace wake-up --wing <current_wing>`。
  2. 将获取到的 L0（身份）和 L1（项目背景）记忆作为 System Prompt 注入，让 AI 瞬间回想起当前项目的上下文。

### 3.3 静默自动保存 (Save Hook)
- **拦截**: `chat.message` 
- **逻辑**:
  1. 在内存中维护一个 `Map<SessionID, number>` 记录人类消息数。
  2. 当消息数达到阈值（如 15 条）时。
  3. 异步触发 `mempalace mine <session_dir> --mode convos`（挖掘对话记录）或通过 MCP 调用 `mempalace_save_context`，将近期有价值的对话固化到记忆宫殿。

## 4. 目录结构与技术栈

- **技术栈**: Node.js, TypeScript, `@opencode-ai/plugin`, `execa` (用于调用 python CLI)
- **目录结构**:
  ```text
  opencode-plugin-mempalace/
  ├── package.json
  ├── tsconfig.json
  ├── README.md
  └── src/
      ├── index.ts          # 插件入口，注册 Hooks
      ├── mempalace-cli.ts  # 封装对 mempalace 命令行/MCP 的调用
      ├── state.ts          # 维护 Session 消息计数器
      └── utils.ts          # 目录路径推导 wing 的工具函数
  ```

## 5. 边界情况与错误处理

1. **环境缺失**: 如果用户的机器上没有安装 MemPalace（或 `python -m mempalace` 执行失败），插件不应崩溃，而是抛出警告日志并优雅降级（什么都不做）。
2. **上下文过载**: 注入的记忆必须有 Token 长度限制，超过截断，防止导致大模型拒绝服务。
3. **并发写入**: 避免在同一个 session 瞬间触发多次 Save 操作，需要加上 Debounce（防抖）或简单的锁机制。