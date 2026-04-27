# openapi2cli

一个将 OpenAPI 规范（JSON/YAML）转换为可执行 CLI 工具的命令行工具。

[![npm version](https://img.shields.io/npm/v/openapi2cli.svg)](https://www.npmjs.com/package/openapi2cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | 简体中文

## 特性 (Features)

- **多数据源支持**：支持本地 JSON/YAML 文件及远程 URL 链接。
- **OpenAPI V2/V3 支持**：全面兼容 Swagger 2.0 及 OpenAPI 3.0/3.1 规范。
- **TypeScript 输出**：生成清晰、类型安全的 TypeScript 代码。
- **自动认证识别**：自动检测并配置 Security Schemes（Bearer, API Key, Basic, OAuth2）。
- **命令自动生成**：根据 OpenAPI paths 和 operations 自动生成对应的 CLI 命令。
- **基于标签的分层**：支持根据 OpenAPI tags 组织二级子命令。
- **灵活的接口过滤**：支持通过标签或 Operation ID 包含 (`--include`) 或 排除 (`--exclude`) 特定接口。
- **环境变量支持**：通过环境变量注入身份验证凭据。
- **二进制流支持**：针对文件上传和下载接口进行优化。
- **Agent 友好**：优化的 LLM 工具调用导出（简化 Schema）及语义搜索支持。
- **开发者控制**：支持声明式权限（允许/禁止）、只读模式及高风险操作确认。
- **转换日志**：支持通过 `--logs` 参数查看 CLI 转换和生成过程中的关键日志。

## CLI 命令详解 (Usage)

```bash
用法: openapi2cli [选项] <输入>

将 OpenAPI 规范转换为可执行的 CLI 工具

参数:
  input                  OpenAPI 规范文件 (JSON/YAML) 或 URL

选项:
  -V, --version          输出版本号
  -o, --output <dir>     生成 CLI 的输出目录
  --base-url <url>       覆盖 API 请求的基地址
  --name <name>          生成的 CLI 工具名称 (默认取自 API 标题)
  --env-prefix <prefix>  环境变量前缀
  --auth-env-name <name> 完整认证环境变量名
  --include-tags <tags>  要包含的标签列表 (逗号分隔)
  --include-ops <ids>    要包含的 Operation ID 列表 (逗号分隔)
  --exclude-tags <tags>  要排除的标签列表 (逗号分隔)
  --exclude-ops <ids>    要排除的 Operation ID 列表 (逗号分隔)
  --group-by-tag         启用基于标签的二级子命令结构
  --logs                 显示转换过程中的关键日志
  -c, --config <path>    配置文件路径
  -h, --help             显示帮助信息
```

## 配置 (Configuration)

你可以使用 `.openapi2cli.yaml` 文件来自定义生成的 CLI。使用 `-c, --config <path>` 参数指定你的配置文件。

```yaml
# 示例 .openapi2cli.yaml
cliName: my-service-cli
authEnvName: MY_SERVICE_API_KEY
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
# 设置认证信息（默认格式为 <PREFIX>_API_KEY）
export API_API_KEY="your-api-key"

# 或在生成时完整指定认证变量名：
# openapi2cli ./api.json -o ./my-cli --auth-env-name MY_SERVICE_API_KEY

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
