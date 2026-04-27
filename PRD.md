# openapi2cli PRD - 产品需求文档

## 1. 项目概述

**项目名称：** openapi2cli

**项目类型：** CLI 工具 / 代码生成器

**核心功能：** 将 OpenAPI 规范文件（JSON/YAML）转换为可执行的 CLI 工具，方便大模型直接调用 API。

**目标用户：** 
- 大模型 / AI Agent 开发者
- 需要快速封装 API 为 CLI 的开发者
- 需要为 AI Agent 提供工具能力的开发者

---

## 2. 背景与动机

### 问题痛点

1. **API 调用复杂**：大模型需要理解 HTTP 请求、Headers、认证机制等，写代码成本高
2. **重复开发**：每个 API 项目都需要手动编写调用代码
3. **认证难处理**：Bearer Token、API Key、Basic Auth 等需要手动管理

### 解决方案

通过 openapi2cli，将 OpenAPI 规范一键转换为可执行的 CLI，大模型只需调用命令行即可完成 API 请求。

---

## 3. 功能需求

### 3.1 输入支持

| 功能 | 描述 | 优先级 |
|------|------|--------|
| JSON 文件解析 | 支持本地 .json 文件 | P0 |
| YAML 文件解析 | 支持本地 .yaml / .yml 文件 | P0 |
| URL 解析 | 支持从 URL 加载 OpenAPI 规范 | P1 |

### 3.2 代码生成

| 功能 | 描述 | 优先级 |
|------|------|--------|
| TypeScript CLI 生成 | 生成基于 Commander.js 的 CLI 工具 | P0 |
| 命令自动生成 | 根据 OpenAPI paths 自动生成命令 | P0 |
| 参数自动映射 | path/query/header 参数自动映射为 CLI 参数 | P0 |
| 子命令分层 | 支持根据 Tag 将命令组织为二级子命令 | P1 |

### 3.3 认证支持

| 功能 | 描述 | 优先级 |
|------|------|--------|
| Bearer Token | 自动识别并支持 Bearer 认证 | P0 |
| API Key (Header) | 自动识别 Header 方式的 API Key | P0 |
| API Key (Query) | 自动识别 Query 参数方式的 API Key | P0 |
| Basic Auth | 自动识别 HTTP Basic 认证 | P1 |
| 环境变量注入 | 通过环境变量传递认证信息 | P0 |

### 3.4 配置选项

| 功能 | 描述 | 优先级 |
|------|------|--------|
| Base URL 覆盖 | 支持通过参数覆盖 base URL | P1 |
| 自定义 CLI 名称 | 指定生成的 CLI 工具名称 | P1 |
| 环境变量前缀 | 自定义环境变量前缀 | P2 |
| 接口过滤 | 支持通过 Tag 或 Operation ID 列表过滤生成的接口 | P1 |
| 输出路径指定 | 支持自定义代码生成路径 | P1 |

### 3.5 特殊功能支持

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 文件上传 | 支持 multipart/form-data 类型的接口，允许通过文件路径上传 | P1 |
| 文件下载 | 支持二进制流下载接口，允许指定保存路径 | P1 |
| Schema 查看 | 支持在生成的 CLI 中查看特定接口的详细 Schema 信息 | P1 |

---

## 4. 非功能需求

### 4.1 性能

- 解析 OpenAPI 规范 < 2 秒（普通规模）
- 代码生成 < 5 秒

### 4.2 兼容性

- Node.js >= 18.0.0
- 支持 OpenAPI 2.0 (Swagger) 和 3.0 规范

### 4.3 易用性

- CLI 用法简洁，学习成本低
- 生成的 CLI 有完善的帮助信息

---

## 5. 使用流程

### 5.1 生成 CLI

```bash
# 从本地文件生成
openapi2cli ./api.json -o ./my-cli

# 从 URL 生成
openapi2cli https://api.example.com/openapi.json -o ./my-cli
```

### 5.2 使用生成的 CLI

```bash
cd ./my-cli
npm install
npm run build
npm link

# 设置认证
export API_BEARER_AUTH_API_KEY="your-api-key"

# 调用 API
my-cli get-users --limit 10
my-cli create-user --name "John" --email "john@example.com"
```

---

## 6. 技术架构

### 6.1 技术栈

| 组件 | 技术选型 |
|------|----------|
| 开发语言 | TypeScript |
| CLI 框架 | Commander.js |
| OpenAPI 解析 | @apidevtools/swagger-parser |
| HTTP 客户端 | Native Fetch (Node.js 18+) |

### 6.2 项目结构

```
openapi2cli/
├── src/
│   ├── index.ts          # 入口
│   ├── cli.ts            # CLI 命令处理
│   ├── parser.ts         # OpenAPI 解析
│   ├── types.ts          # 类型定义
│   └── generator/
│       └── typescript.ts # TypeScript 代码生成
├── bin/
│   └── openapi2cli.js    # CLI 入口
├── package.json
└── tsconfig.json
```

---

## 7. 竞品分析

| 工具 | 优势 | 劣势 |
|------|------|------|
| OpenAPI Generator | 支持 80+ 语言 | 生成的代码过于笨重，不适合 AI 调用 |
| httpie | CLI 友好 | 不是代码生成，需要手动调用 |
| **openapi2cli** | **专为 AI/大模型设计** | **初期只支持 TypeScript** |

---

## 8. 里程碑规划

### Phase 1 - MVP (Done ✅)
- [x] OpenAPI 解析（JSON/YAML/URL）
- [x] TypeScript CLI 代码生成
- [x] 基础认证支持（Bearer/API Key/Basic）
- [x] 环境变量注入

### Phase 2 - 功能增强 (Done ✅)
- [x] 根据 Tag 生成二级子命令
- [x] 支持 Operation ID 作为命令名称
- [x] 支持 Tag 和 Operation ID 列表过滤
- [x] 支持文件上传和下载接口优化
- [x] 支持查看 API 接口详细 Schema

### Phase 3 - 扩展 (Done ✅)
- [x] 支持 OpenAPI 3.1
- [x] OAuth2 支持

### Phase 4 - 完善 (Done ✅)
- [x] 单元测试
- [x] 更多示例
- [x] npm 发布

### Phase 5 - Agent & Developer Enhancements (Done ✅)
- [x] 配置文件支持 (.openapi2cli.yaml)
- [x] Agent 友好功能 (语义搜索 search-api, LLM 工具导出 export-tools-json)
- [x] 开发者控制 (权限 allow/block, 只读模式)
- [x] 安全确认 (--force 标志)
- [x] 示例自动提取与通过 help 展示

---


*最后更新：2026-03-22*
