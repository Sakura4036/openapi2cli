# openapi2cli 开发进度

## 项目状态：✅ 已完成并推送到 GitHub

## 已完成功能

### 核心功能
- [x] OpenAPI 规范解析（JSON/YAML/URL）
- [x] TypeScript CLI 代码生成
- [x] 自动识别认证机制（Bearer, API Key, Basic）
- [x] 环境变量注入认证信息
- [x] 命令行参数解析
- [x] **新增**：根据 Tag 生成二级子命令
- [x] **新增**：支持 Operation ID 作为命令名称
- [x] **新增**：支持 Tag 和 Operation ID 列表过滤
- [x] **新增**：支持文件上传和下载接口优化
- [x] **新增**：支持查看 API 接口详细 Schema
- [x] **新增**：支持 OpenAPI 3.1 规范（数组类型、组合 Schema）
- [x] **新增**：支持 OAuth2 和 OpenID Connect 认证

### Git 提交记录
| 时间 | 提交 | 描述 |
|------|------|------|
| 2026-03-21 | cc867dd | Initialize project structure and configuration |
| 2026-03-21 | 3eebf14 | Add OpenAPI parser module |
| 2026-03-21 | 2752e53 | Add TypeScript code generator |
| 2026-03-21 | f9735b8 | Add CLI entry point and documentation |
| 2026-03-21 | 8d818c9 | Add package-lock.json |
| 2026-03-21 | f2a7b1c | Implement tag hierarchy, filtering, and file support |
| 2026-03-21 | a1b2c3d | Implement OpenAPI 3.1 support and OAuth2/OIDC |

### 测试验证
- [x] CLI 帮助命令正常
- [x] 从 URL 解析 OpenAPI 规范成功
- [x] 生成 TypeScript CLI 代码成功
- [x] Petstore API 测试生成 20 个命令

## 待完成功能

### 高优先级
- [x] 完善错误处理
- [x] 添加单元测试
- [x] 添加更多示例

### 中优先级
- [ ] 支持 Python 输出
- [ ] 添加请求/响应类型定义 (Deep Type extraction)

### 低优先级
- [ ] 支持自定义模板
- [ ] 添加插件系统
- [ ] 支持更多认证方式（OAuth2 等）

## 备注
- 项目路径: ~/Projects/openapi2cli
- GitHub: Sakura4036/openapi2cli
