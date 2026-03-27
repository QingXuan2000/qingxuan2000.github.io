# QingBlog

![License](https://img.shields.io/github/license/QingXuan2000/QingBlog?style=for-the-badge)
![GitHub stars](https://img.shields.io/github/stars/QingXuan2000/QingBlog?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/QingXuan2000/QingBlog?style=for-the-badge)
![GitHub Workflow](https://img.shields.io/github/actions/workflow/status/QingXuan2000/QingBlog/qingblog-build.yml?style=for-the-badge)

DEMO: `https://qingxuan2000.github.io/`

## 📖 项目简介

QingBlog 是一个基于 GitHub Issues 和 GitHub Workflow 的博客框架。通过创建 GitHub Issue，GitHub Workflow 会将其转换为博客文章并生成对应的 HTML 页面，无需手动部署。

## ✨ 特性

- 🚀 **自动化流程**：通过 GitHub Issues + GitHub Workflow 自动发布博客文章
- 🎨 **现代化设计**：采用渐变背景和卡片式布局、毛玻璃效果
- 📱 **响应式设计**：适配不同设备屏幕
- 📝 **Markdown 支持**：使用 Markdown 格式编写文章

## 🛠️ 技术栈

### 前端技术
- **HTML5** - 页面结构
- **CSS3** - 样式设计
- **JavaScript** - 交互功能
- **Font Awesome** - 图标库

### 自动化
- **Python 3.11+** - 脚本处理
- **GitHub Workflow** - CI/CD 工作流
- **Markdown** - 文章编写格式

## 📁 项目结构

```
QingBlog/
├── css/
│   ├── QBLOG.css          # 博客主题样式
│   ├── blogArticle.css    # 文章页面样式
│   ├── font-awesome.css   # Font Awesome 图标库
│   └── animation.css      # 动画效果样式
│
├── js/
│   └── QBLOG.js           # Blog JavaScript 脚本
│
├── pages/                 # 文章页面目录
│   │
│   └── blogArticle.html   # 文章页面模板
│
├── .github/
│   ├── workflows/
│   │   └── qingblog-build.yml  # GitHub Workflow 工作流
│   └── scripts/
│       ├── check_issue.py  # GitHub Workflow
│       └── requirements.txt # Python 依赖
│
├── fonts/                 # 字体文件
│   ├── AnimeHug.ttf       # 自定义字体
│   └── FontAwesome.*      # Font Awesome 字体
│
├── img/                   # 图片资源
│   └── logo.png           # Logo
│
├── index.html             # 首页
├── pages.html             # 文章页
├── favicon.ico            # 图标
└── LICENSE                # GNU GPL v3 许可证
```

## 🚀 使用方法

### 发布文章

1. 在 GitHub 上打开部署仓库的 Issues
2. 创建一个新的 Issue
3. 填写标题和内容（支持 Markdown 格式）
4. （可选）添加标签（至多显示前3个标签）
5. 提交 Issue 后，GitHub Workflow 会自动处理并生成文章

### 编辑文章

1. 找到已发布的 Issue
2. 编辑 Issue 的标题或内容
3. 保存更改后，GitHub Workflow 会自动更新对应的文章页面

### 本地开发

1. 克隆项目：
```bash
git clone https://github.com/QingXuan2000/QingBlog.git
cd QingBlog
```

2. 直接在浏览器中打开 `index.html` 即可预览

## 🔧 工作原理

### 自动化流程

1. 用户在 GitHub Issues 中创建或编辑 Issue
2. GitHub Workflow 监听 Issue 事件（创建或编辑）
3. `check_issue.py` 脚本处理 Issue：
   - 验证作者
   - 将 Markdown 内容转换为 HTML
   - 生成文章页面（`pages/{issue_id}.html`）
   - 在首页和文章列表页添加/更新文章卡片
   - 提取并显示前3个标签
4. 自动提交更改到仓库
5. GitHub Pages 服务自动部署更新

## 🎨 主题配置

### CSS 变量

在 `QBLOG.css` 中定义了主题变量：

```css
:root {
    --bg-color: linear-gradient(180deg, #122126, #0f2027, #17272e, #0c1518);
    --text-color: #FFFFFF;
    --nav-height: 0px;
    --primary-color: #388bff;
    --border-color: #ffffff30;
    --background-light: rgba(255, 255, 255, 0.1);
    --box-shadow: #00000020 inset 0 0 10px 0px;
}
```

## 📝 许可证

本项目采用 [GNU General Public License v3.0](LICENSE) 许可证。

## 👨‍💻 作者

- **QingXuanJun** - [GitHub](https://github.com/QingXuan2000)

## 🌟 致谢

- [Font Awesome](https://fontawesome.com/) - 图标库
- [GitHub](https://github.com/) - 托管和 CI/CD 服务
- [Python Markdown](https://python-markdown.github.io/) - Markdown 转换库

## 📣 更新日志

### v1.0.0 (2025-2026)
- 初始版本发布

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！如果您有任何建议或问题，请随时联系我。

## 📞 联系方式

- GitHub: [QingXuan2000](https://github.com/QingXuan2000)
- 项目地址: [https://github.com/QingXuan2000/QingBlog](https://github.com/QingXuan2000/QingBlog)