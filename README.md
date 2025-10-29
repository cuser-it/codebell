# GitHub到Gitee同步模板

这是一个模板仓库，用于快速设置GitHub仓库自动同步到Gitee的功能。通过使用此模板，您可以轻松地为新仓库配置自动同步，无需重复编写工作流配置。

## 🚀 功能特点

- 自动将GitHub仓库内容同步到Gitee
- 支持定时同步和推送触发同步
- 简化新仓库设置流程，提高工作效率
- 适用于个人开发者和团队协作

## 🔧 使用方法

### 1. 从此模板创建新仓库

- 点击GitHub界面中的"Use this template"按钮
- 输入新仓库名称
- 选择公开或私有
- 点击"Create repository from template"

### 2. 配置必要的密钥

在新创建的仓库中，您需要添加以下密钥：

1. 进入仓库的"Settings" > "Secrets and variables" > "Actions"
2. 添加以下三个仓库密钥：
   - `GITEE_PRIVATE_KEY`: SSH私钥内容
   - `GITEE_TOKEN`: Gitee个人访问令牌
   - `GITEE_USER`: Gitee用户名
   - `GITEE_LIBNAME`:Gitee仓库名

### 3. 确保Gitee端就绪

- 确保您的Gitee账号中已存在同名仓库，或令牌有足够权限自动创建仓库
- 公钥已添加到Gitee的SSH公钥设置中

## 🔑 如何获取所需密钥

### SSH密钥对

```bash
ssh-keygen -t rsa -C "your_email@example.com"
```

- 公钥(id_rsa.pub)：添加到Gitee的"设置" > "安全设置" > "SSH公钥"
- 私钥(id_rsa)：添加到GitHub仓库的GITEE_PRIVATE_KEY密钥中

### Gitee访问令牌

1. 登录Gitee
2. 进入"设置" > "私人令牌"
3. 生成新令牌并复制
4. 添加到GitHub仓库的GITEE_TOKEN密钥中

## ⏰ 同步频率

- 每次推送到main或master分支时自动同步
- 每天凌晨1点自动同步一次

## ⚠️ 常见问题

1. **同步失败**：检查密钥是否正确配置，以及Gitee令牌是否有效

2. **分支删除错误**：如果遇到"refusing to delete the current branch"错误，可能需要在Gitee上修改默认分支或在工作流中添加`push_args: "--all"`参数

3. **仓库未初始化**：确保Gitee仓库已经初始化

4. **权限问题**：确保您的Gitee令牌有足够的权限来操作仓库

## 🛠️ 高级配置

工作流配置文件位于`.github/workflows/sync2gitee.yml`，您可以根据需要修改以下参数：

- `static_list`: 指定要同步的仓库
- `force_update`: 是否强制更新
- `push_args`: 推送参数，如添加"--all"避免删除分支问题

## 📝 许可证

MIT License

---

*如果您发现任何问题或有任何建议，欢迎提交Issue或Pull Request。*
