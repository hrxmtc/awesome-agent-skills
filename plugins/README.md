# Plugins

这个目录包含了 Awesome Agent Skills Marketplace 中的所有 Claude Code plugins。

## Agent Skills Toolkit

**Agent Skills Toolkit** 是一个完整的工具集，帮助你创建、改进和测试高质量的 Agent Skills。

包含内容：
- 🎯 **skill-creator-pro**：增强版的 skill creator，基于官方版本改进
- ⚡ **4 个快捷命令**：快速启动特定功能
- 📝 **中文优化文档**：针对中文用户的使用说明

### 功能特性

- ✨ **创建新 Skills**：从零开始创建专业的 skills
- 🔧 **改进现有 Skills**：优化和更新你的 skills
- 📊 **性能测试**：运行评估测试和性能基准测试
- 🎯 **描述优化**：优化 skill 描述以提高触发准确性

### 使用方法

安装后，可以使用以下命令：

**主命令：**
```bash
/agent-skills-toolkit:skill-creator-pro
```
完整的 skill 创建和改进工作流程（增强版）

**快捷命令：**
```bash
/agent-skills-toolkit:create-skill          # 创建新 skill
/agent-skills-toolkit:improve-skill         # 改进现有 skill
/agent-skills-toolkit:test-skill            # 测试和评估 skill
/agent-skills-toolkit:optimize-description  # 优化 skill 描述
```

### 适用场景

- 从零开始创建 skill
- 更新或优化现有 skill
- 运行 evals 测试 skill 功能
- 进行性能基准测试和方差分析
- 优化 skill 描述以提高触发准确性

### 许可证

本 plugin 基于官方 skill-creator 修改，遵循 Apache 2.0 许可证。

---

## tldraw Helper

**tldraw Helper** 通过 tldraw Desktop 的 Local Canvas API 进行编程式绘图，轻松创建流程图、架构图、思维导图等各种可视化内容。

### 功能特性

- 📚 **完整的 API 文档**：详细的 tldraw Canvas API 使用指南
- ⚡ **4 个快捷命令**：快速创建图表、截图、列表、清空
- 🤖 **自动化绘图 Agent**：支持创建复杂图表
- 🎨 **14+ 种图形类型**：矩形、圆形、箭头、文本等
- 🎯 **7+ 种图表类型**：流程图、架构图、思维导图等

### 使用方法

**前提条件：**
- 安装并运行 tldraw Desktop
- 创建一个新文档 (Cmd+N / Ctrl+N)

**快捷命令：**
```bash
/tldraw:draw flowchart user authentication    # 创建流程图
/tldraw:draw architecture microservices      # 创建架构图
/tldraw:screenshot large                     # 截图保存
/tldraw:list                                 # 列出所有图形
/tldraw:clear                                # 清空画布
```

**或者直接描述：**
```
帮我画一个用户登录流程的流程图
创建一个微服务架构图
```

### 支持的图表类型

- **流程图** (Flowchart) - 业务流程、算法流程
- **架构图** (Architecture) - 系统架构、微服务架构
- **思维导图** (Mind Map) - 头脑风暴、概念整理
- **时序图** (Sequence) - 交互流程、API 调用
- **ER 图** (Entity-Relationship) - 数据库设计
- **网络拓扑** (Network Topology) - 网络架构
- **时间线** (Timeline) - 项目规划、历史事件

### 详细文档

查看 [tldraw-helper README](./tldraw-helper/README.md) 了解更多信息。

