# openapi2cli

一个将 OpenAPI 规范（JSON/YAML）转换为可执行 CLI 工具的命令行工具。

[![npm version](https://img.shields.io/npm/v/openapi2cli.svg)](https://www.npmjs.com/package/openapi2cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | 简体中文

## 特性 (Features)

- **多数据源支持**：支持本地 JSON/YAML 文件及远程 URL 链接。
- **TypeScript 输出**：生成清晰、类型安全的 TypeScript 代码。
- **自动认证识别**：自动检测并配置 Security Schemes（Bearer, API Key, Basic, OAuth2）。
- **命令自动生成**：根据 OpenAPI paths 和 operations 自动生成对应的 CLI 命令。
- **基于标签的分层**：支持根据 OpenAPI tags 组织二级子命令。
- **环境变量支持**：通过环境变量注入身份验证凭据。
- **二进制流支持**：针对文件上传和下载接口进行优化。
- **Agent 友好**：内置对 LLM 工具调用导出和语义搜索的支持。
- **开发者控制**：支持声明式权限（允许/禁止）、只读模式及高风险操作确认。

## 配置 (Configuration)

你可以使用 `.openapi2cli.yaml` 文件来自定义生成的 CLI。使用 `-c, --config <path>` 参数指定你的配置文件。

```yaml
# 示例 .openapi2cli.yaml
cliName: my-service-cli
permissions:
  readonly: false
  allow:
    tags: ["users", "pets"]
  block:
    operationIds: ["deleteSensitiveData"]
safety:
  highRiskOperations: ["delete-user"]
  confirmationFlag: force
agent:
  includeExamples: true
```

## 系统命令 (System Commands)

每个生成的 CLI 都包含内置的系统命令：

- `search-api <keyword>`：通过关键字搜索 API 端点。
- `export-tools-json`：导出 API 定义为 JSON 格式，便于 LLM 工具调用（兼容 OpenAI/Claude）。

## 安装 (Installation)

```bash
# 全局安装
npm install -g openapi2cli

# 或通过 npx 直接运行
npx openapi2cli --help
```

## 快速上手 (Quick Start)

### 1. 从本地文件生成 CLI

```bash
openapi2cli ./api.json -o ./my-cli
```

### 2. 初始化生成的项目

```bash
cd ./my-cli
npm install
npm run build
npm link
```

### 3. 使用

```bash
# 设置认证信息
export API_TOKEN="your-token"

# 执行 API 调用
my-cli get-users --limit 10
```

## 文档菜单 (Document Menu)

- [技术架构与原理](docs/architecture.md)
- [开发指南](docs/development.md)
- [产品需求文档 (PRD)](PRD.md)

## 贡献指南 (Contribution Guide)

1. Fork 本仓库。
2. 为你的新特性或 Bug 修复创建新分支。
3. 提交 Pull Request，并详细描述你的修改。
4. 确保所有测试均已通过。

更多关于本地开发的详细信息，请参阅[开发指南](docs/development.md)。

## 开源协议 (License)

MIT
