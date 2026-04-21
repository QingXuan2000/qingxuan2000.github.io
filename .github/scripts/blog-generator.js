import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { JSDOM } from 'jsdom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItToc from 'markdown-it-toc-done-right';
import markdownItHighlightjs from 'markdown-it-highlightjs';
import markdownItTaskLists from 'markdown-it-task-lists';
import markdownItMark from 'markdown-it-mark';
import markdownItSub from 'markdown-it-sub';
import markdownItSup from 'markdown-it-sup';
import markdownItMathjax from 'markdown-it-mathjax3';
import markdownItContainer from 'markdown-it-container';
import { tab } from '@mdit/plugin-tab';
import hljs from 'highlight.js';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItAbbr from 'markdown-it-abbr';
import markdownItDeflist from 'markdown-it-deflist';
import markdownItProgressBar from 'markdown-it-progress';
import markdownItKbd from 'markdown-it-kbd';

// ===================== 常量与初始化 =====================
dayjs.extend(utc);
dayjs.extend(timezone);

// 全局常量配置
const CONST = {
  DEFAULT_UTC_OFFSET: 8,
  DEFAULT_ARTICLES_PER_PAGE: 20,
  FORMULA_PATTERNS: {
    block: /\[[\s\S]*?\]/g,
    inline: /\([\s\S]*?\)/g
  },
  MATHJAX_CONFIG: {
    tex: { inlineMath: [['$','$'], ['\\(','\\)']], displayMath: [['$$','$$'], ['\\[','\\]']] },
    chtml: { fontCache: 'global' }
  },
  HTML_TEMPLATES: {
    listPage: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="light dark"><title></title>
  <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>
</head>
<body>
  <div id="card-list-wrapper"><ul id="card-list"></ul></div>
  <link rel="stylesheet" href="/css/QBLOG.css"/><script src="/js/QBLOG.js"></script>
  <link rel="stylesheet" href="/css/font-awesome.min.css"/>
  <style>#card-list-wrapper{border-top:none}</style>
</body>
</html>`,
    tagPage: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title></title>
</head>
<body>
  <div id="title"><h1>{{tagName}}</h1></div>
  <div id="card-list-wrapper"><ul id="card-list"></ul></div>
  <link rel="stylesheet" href="/css/QBLOG.css"/><script src="/js/QBLOG.js"></script>
  <link rel="stylesheet" href="/css/font-awesome.min.css"/>
  <style>#card-list-wrapper{border-top:none}</style>
</body>
</html>`,
    articlePage: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title></title>
</head>
<body>
  <div class="card-wrapper">
    <div class="card">
      <div class="card-header">
        <h1>{{title}}</h1>
        <p>作者：{{author}}</p><p>发布日期：{{date}}</p>
      </div>
      <div class="divider" style="height:1px;width:100%;margin:1rem 0"></div>
      <div class="card-content article-content">{{content}}</div>
      <div class="article-footer">
        <div class="article-tag"><span>文章标签：</span>{{tags}}</div>
      </div>
    </div>
  </div>
  <link rel="stylesheet" href="/css/blogArticle.css"><link rel="stylesheet" href="/css/QBLOG.css"/>
  <script src="/js/QBLOG.js"></script><link rel="stylesheet" href="/css/font-awesome.min.css"/>
  <script>
window.MathJax = {
  tex: { inlineMath: [['$','$'],['\\(','\\)']], displayMath: [['$$','$$'],['\\[','\\]']] },
  chtml: { fontCache: 'global' }
};
</script>
<script id="MathJax-script" src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</body>
</html>`
  }
};

// ===================== 通用工具函数 =====================
/**
 * 检查文件是否存在
 */
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * 日期格式化
 */
const formatDate = (isoDate, offset = CONST.DEFAULT_UTC_OFFSET) => {
  return dayjs(isoDate).utcOffset(offset).format('YYYY年MM月DD日 HH:mm');
};

/**
 * 文本截断
 */
const truncate = (text, maxLen = 150) =>
  text.length > maxLen ? `${text.slice(0, maxLen)}...` : text;

/**
 * 生成文章链接
 */
const getLink = (targetId) => `/article/${targetId}.html`;

/**
 * 加载JSON文件
 */
const loadJson = async (filePath) => {
  try {
    if (!await fileExists(filePath)) return {};
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.warn(`[警告] 配置加载失败: ${filePath}, 错误: ${err.message}`);
    return {};
  }
};

/**
 * 预处理数学公式
 */
const preprocessFormulas = (md) => {
  let result = md;
  result = result.replace(CONST.FORMULA_PATTERNS.block, (match) => {
    const content = match.slice(1, -1);
    return `$$${content}$$`;
  });
  result = result.replace(CONST.FORMULA_PATTERNS.inline, (match) => {
    const content = match.slice(1, -1);
    return `$${content}$`;
  });
  return result;
};

/**
 * 预处理进度条
 */
const preprocessProgress = (md) => {
  return md.replace(/\[=([^\]]+)\]/g, (_, progress) => {
    return `<progressBar>${progress}</progressBar>`;
  });
};

/**
 * 预处理 Admonition
 */
const preprocessAdmonition = (md) => {
  return md.replace(/!!!\s+(\w+)\s+"([^"]+)"\s*\n([\s\S]*?)(?=\n\n|\n\S|$)/g, (_, type, title, content) => {
    return `<admonition type="${type}" title="${title}">\n${content.trim()}\n</admonition>`;
  });
};

/**
 * 预处理 Tabbed
 */
const preprocessTabbed = (md) => {
  return md.replace(/===\s*"([^"]+)"\s*\n([\s\S]*?)(?=\n===\s*"[^"]+"|\n\n\S|$)/g, (_, tabName, content) => {
    return `<tab name="${tabName}">\n${content.trim()}\n</tab>`;
  });
};

/**
 * Markdown转HTML核心方法
 */
const mdToHtml = (md) => {
  const mdParser = new MarkdownIt({
    html: true,
    xhtmlOut: true,
    breaks: false,
    linkify: true,
    typographer: true,
    highlight: (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="codehilite"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
        } catch (__) {}
      }
      return `<pre class="codehilite"><code>${mdParser.utils.escapeHtml(str)}</code></pre>`;
    }
  })
    .use(markdownItAnchor, {
      permalink: markdownItAnchor.permalink.ariaHidden({
        placement: 'after',
        symbol: '&nbsp;&para;'
      })
    })
    .use(markdownItToc, { level: [1, 2, 3], placeholder: '[TOC]' })
    .use(markdownItHighlightjs, { auto: true, code: true })
    .use(markdownItTaskLists, { enabled: true, label: true })
    .use(markdownItMark)
    .use(markdownItSub)
    .use(markdownItSup)
    .use(markdownItMathjax, CONST.MATHJAX_CONFIG)
    .use(markdownItContainer, 'admonition', {
      render: (tokens, idx) => {
        if (tokens[idx].type !== 'container_admonition_open') return '';
        const m = tokens[idx].info.trim().match(/^admonition(?:\s+(\w+))?(?:\s+"([^"]+)")?/);
        const type = m[1] || 'note';
        const title = m[2] || '';
        return `<div class="admonition ${type}"><p class="admonition-title">${title}</p>\n`;
      },
      validator: () => true
    })
    .use(markdownItContainer, 'details', {
      render: (tokens, idx) => {
        if (tokens[idx].type === 'container_details_open') {
          return '<details><summary>';
        }
        if (tokens[idx].type === 'container_details_close') {
          return '</summary></details>\n';
        }
        return '';
      },
      validator: () => true
    })
    .use(tab, { name: 'tabs' })
    .use(markdownItFootnote)
    .use(markdownItAbbr)
    .use(markdownItDeflist)
    .use(markdownItProgressBar)
    .use(markdownItKbd);

  let processedMd = preprocessFormulas(md);
  processedMd = preprocessProgress(processedMd);
  processedMd = preprocessAdmonition(processedMd);
  processedMd = preprocessTabbed(processedMd);

  const html = mdParser.render(processedMd);
  const dom = new JSDOM(html);
  const document = dom.window.document;

  document.querySelectorAll('pre.codehilite').forEach(pre => {
    const copyBtn = document.createElement('span');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '<i class="fa fa-copy" aria-hidden="true"></i>&nbsp;Copy';
    pre.insertBefore(copyBtn, pre.firstChild);
  });

  return document.body.innerHTML;
};

/**
 * 生成标签HTML
 */
const genTagsHtml = (labels) =>
  labels.slice(0, 3).map(l => `<div class="tag"><span>${l}</span></div>`).join('');

// ===================== 配置管理类 =====================
class Config {
  constructor() {
    this.WORKSPACE = path.join(process.env.GITHUB_WORKSPACE || '', '/');
    this.BLOG_CONFIG_PATH = process.env.BLOG_CONFIG_PATH || 'blogData/blogConfig.json';
    this.PAGES_CONFIG_PATH = process.env.PAGES_CONFIG_PATH || 'blogData/pagesConfig.json';
  }

  async load() {
    const blogConfig = await loadJson(path.join(this.WORKSPACE, this.BLOG_CONFIG_PATH));
    this.pagesConfig = await loadJson(path.join(this.WORKSPACE, this.PAGES_CONFIG_PATH));

    const buildCfg = blogConfig.buildConfig || {};
    this.UTC_OFFSET = buildCfg.utcOffset || CONST.DEFAULT_UTC_OFFSET;
    this.ARTICLES_PER_PAGE = buildCfg.articlesPerPage || CONST.DEFAULT_ARTICLES_PER_PAGE;

    const authorCfg = blogConfig.author || {};
    this.TARGET_AUTHOR = authorCfg.targetAuthor || '';

    const robotsCfg = blogConfig.robotsConfig || {};
    this.SITE_URL = robotsCfg.siteUrl || '';
    this.ALLOW_PATHS = robotsCfg.allowPaths || ['/'];
    this.DISALLOW_PATHS = robotsCfg.disallowPaths || ['/.github/', '/.git/', '/blogData/'];
    this.SITEMAP_URL = robotsCfg.sitemapUrl || '';

    this.ISSUE = {
      title: process.env.ISSUE_TITLE || '',
      body: process.env.ISSUE_BODY || '(无内容)',
      date: process.env.ISSUE_DATE || '',
      author: process.env.ISSUE_AUTHOR || '',
      labels: JSON.parse(process.env.ISSUE_LABELS || '[]'),
      id: process.env.ISSUE_ID || '',
      action: process.env.ISSUE_ACTION || 'opened'
    };
  }

  async savePagesConfig() {
    const fullPath = path.join(this.WORKSPACE, this.PAGES_CONFIG_PATH);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, JSON.stringify(this.pagesConfig, null, 4), 'utf-8');
    console.log(`[成功] pagesConfig.json 已更新`);
  }
}

// ===================== HTML页面处理器 =====================
class HTMLProcessor {
  constructor(filePath) {
    this.path = filePath;
    this.document = null;
  }

  async load() {
    const html = await fs.readFile(this.path, 'utf-8');
    const dom = new JSDOM(html);
    this.document = dom.window.document;
  }

  async save() {
    await fs.writeFile(this.path, this.document.documentElement.outerHTML, 'utf-8');
  }

  findCard(issueId) {
    const aTag = this.document.querySelector(`a[href="${getLink(issueId)}"]`);
    return aTag ? aTag.closest('li') : null;
  }

  countCards() {
    return this.document.querySelectorAll('li > a[href^="/article/"]').length;
  }

  genCardHtml(title, date, content, issueId, labels) {
    return `
<li>
  <a href="${getLink(issueId)}">
    <div class="card">
      <div class="card-header"><h2>${title}</h2></div>
      <div class="divider" style="height:1px;width:100%;margin:1rem 0"></div>
      <p>${content}</p>
      <div class="divider" style="height:1px;width:100%;margin:1rem 0"></div>
      <div class="card-footer">
        <div class="article-tag">${genTagsHtml(labels)}</div>
        <p>发布日期：${date}</p>
      </div>
    </div>
  </a>
</li>`;
  }

  addOrUpdateCard(title, date, content, issueId, labels, maxCards = null) {
    const existLi = this.findCard(issueId);
    const cardHtml = this.genCardHtml(title, date, content, issueId, labels);

    if (existLi) {
      const tempDom = new JSDOM(cardHtml);
      existLi.replaceWith(tempDom.window.document.querySelector('li'));
      console.log(`[成功] 卡片已更新：${title}`);
      return false;
    }

    if (maxCards && this.countCards() >= maxCards) {
      console.log(`[提示] 当前页面卡片已达上限(${maxCards})，需创建新页面`);
      return true;
    }

    const ul = this.document.querySelector('ul#card-list, ul');
    if (!ul) {
      console.error(`[错误] 未找到卡片容器: ${this.path}`);
      return false;
    }

    ul.insertAdjacentHTML('afterbegin', cardHtml);
    console.log(`[成功] 卡片已添加：${title}`);
    return false;
  }

  removeCard(issueId) {
    const li = this.findCard(issueId);
    if (!li) {
      console.log(`[错误] 卡片不存在：${issueId}`);
      return false;
    }
    li.remove();
    console.log(`[成功] 卡片已删除：${issueId}`);
    return true;
  }
}

// ===================== 页面/标签/文章管理器 =====================
class BlogManager {
  constructor(cfg) {
    this.cfg = cfg;
    this.workspace = cfg.WORKSPACE;
  }

  getArticlePath(issueId) {
    return path.join(this.workspace, 'article', `${issueId}.html`);
  }

  getListPagePath(pageNum) {
    return pageNum === 1
      ? path.join(this.workspace, 'index.html')
      : path.join(this.workspace, 'pages', `${pageNum}.html`);
  }

  getTagPagePath(tagName, pageNum = 1) {
    return pageNum === 1
      ? path.join(this.workspace, 'tags', tagName, 'index.html')
      : path.join(this.workspace, 'tags', tagName, `${pageNum}.html`);
  }

  async articleExists(issueId) {
    return fileExists(this.getArticlePath(issueId));
  }

  async generateArticle(issueId, title, author, date, content, labels) {
    const isUpdate = await this.articleExists(issueId);
    const html = CONST.HTML_TEMPLATES.articlePage
      .replace('{{title}}', title)
      .replace('{{author}}', author)
      .replace('{{date}}', date)
      .replace('{{content}}', mdToHtml(content))
      .replace('{{tags}}', genTagsHtml(labels));

    await fs.mkdir(path.dirname(this.getArticlePath(issueId)), { recursive: true });
    await fs.writeFile(this.getArticlePath(issueId), html, 'utf-8');
    console.log(`[成功] 文章已${isUpdate ? '更新' : '生成'}：${issueId}`);
  }

  async deleteArticle(issueId) {
    const filePath = this.getArticlePath(issueId);
    if (!await fileExists(filePath)) {
      console.log(`[错误] 文章不存在：${filePath}`);
      return false;
    }
    await fs.unlink(filePath);
    console.log(`[成功] 文章已删除：${issueId}`);
    return true;
  }

  async extractArticleLabels(issueId) {
    const filePath = this.getArticlePath(issueId);
    if (!await fileExists(filePath)) return [];
    const content = await fs.readFile(filePath, 'utf-8');
    const tagMatch = content.match(/<div class="tag"><span>([^<]+)<\/span><\/div>/g);
    return tagMatch
      ? [...new Set(tagMatch.map(m => m.replace(/<div class="tag"><span>([^<]+)<\/span><\/div>/, '$1')))]
      : [];
  }

  async getTotalListPages() {
    let pageNum = 1;
    while (await fileExists(this.getListPagePath(pageNum))) pageNum++;
    return pageNum - 1;
  }

  async createListPage(pageNum) {
    const pagePath = this.getListPagePath(pageNum);
    await fs.mkdir(path.dirname(pagePath), { recursive: true });
    await fs.writeFile(pagePath, CONST.HTML_TEMPLATES.listPage, 'utf-8');
    console.log(`[成功] 列表页已创建：第${pageNum}页`);
    return pagePath;
  }

  async findLastNonFullListPage() {
    const totalPages = await this.getTotalListPages();
    for (let pageNum = totalPages; pageNum >= 1; pageNum--) {
      const pagePath = this.getListPagePath(pageNum);
      const p = new HTMLProcessor(pagePath);
      await p.load();
      if (p.countCards() < this.cfg.ARTICLES_PER_PAGE) return pageNum;
    }
    return 0;
  }

  async createTagPage(tagName, pageNum = 1) {
    const pagePath = this.getTagPagePath(tagName, pageNum);
    if (await fileExists(pagePath)) return;
    await fs.mkdir(path.dirname(pagePath), { recursive: true });
    const html = CONST.HTML_TEMPLATES.tagPage.replace('{{tagName}}', tagName);
    await fs.writeFile(pagePath, html, 'utf-8');
    console.log(`[成功] 标签页已创建：${tagName} 第${pageNum}页`);
  }

  async getTagTotalPages(tagName) {
    let pageNum = 1;
    while (await fileExists(this.getTagPagePath(tagName, pageNum))) pageNum++;
    return pageNum - 1;
  }

  async syncTagCard(issueId, title, date, content, targetTags, allLabels, op = 'add') {
    const tagPageNums = {};
    const maxCards = this.cfg.ARTICLES_PER_PAGE;

    for (const tag of targetTags) {
      if (op === 'add') {
        await this.createTagPage(tag);
        let pageNum = 1;
        let added = false;

        while (await fileExists(this.getTagPagePath(tag, pageNum))) {
          const p = new HTMLProcessor(this.getTagPagePath(tag, pageNum));
          await p.load();
          if (p.findCard(issueId)) {
            p.addOrUpdateCard(title, date, content, issueId, allLabels);
            await p.save();
            added = true;
            break;
          }
          pageNum++;
        }
        if (added) {
          tagPageNums[tag] = await this.getTagTotalPages(tag);
          continue;
        }

        pageNum = 1;
        while (true) {
          const pagePath = this.getTagPagePath(tag, pageNum);
          if (!await fileExists(pagePath)) await this.createTagPage(tag, pageNum);

          const p = new HTMLProcessor(pagePath);
          await p.load();
          if (p.countCards() < maxCards) {
            p.addOrUpdateCard(title, date, content, issueId, allLabels);
            await p.save();
            break;
          }
          pageNum++;
        }
      } else if (op === 'remove') {
        let pageNum = 1;
        while (await fileExists(this.getTagPagePath(tag, pageNum))) {
          const p = new HTMLProcessor(this.getTagPagePath(tag, pageNum));
          await p.load();
          p.removeCard(issueId);
          await p.save();
          pageNum++;
        }
      }
      tagPageNums[tag] = await this.getTagTotalPages(tag);
    }
    return tagPageNums;
  }

  updateTagTotal(tag, delta) {
    const cfg = this.cfg.pagesConfig;
    if (!cfg.tagsArticleTotal) cfg.tagsArticleTotal = {};
    const current = cfg.tagsArticleTotal[tag] || 0;
    const newTotal = Math.max(0, current + delta);

    newTotal > 0 ? (cfg.tagsArticleTotal[tag] = newTotal) : delete cfg.tagsArticleTotal[tag];
    console.log(`[成功] 标签${tag}文章数更新：${current} → ${newTotal}`);
  }

  updateTagPageNums(tagPageNums) {
    const cfg = this.cfg.pagesConfig;
    if (!cfg.maxPageNum) cfg.maxPageNum = {};
    if (!cfg.maxPageNum.maxTagPageNums) cfg.maxPageNum.maxTagPageNums = {};
    Object.assign(cfg.maxPageNum.maxTagPageNums, tagPageNums);
    console.log(`[成功] 标签页数更新：${JSON.stringify(tagPageNums)}`);
  }

  updateMaxArticlePageNum(totalPages) {
    const cfg = this.cfg.pagesConfig;
    if (!cfg.maxPageNum) cfg.maxPageNum = {};
    cfg.maxPageNum.maxArticlePageNum = totalPages;
    console.log(`[成功] 文章总页数更新：${totalPages}`);
  }
}

// ===================== SEO生成器 =====================
class SEOGenerator {
  constructor(cfg) {
    this.cfg = cfg;
    this.workspace = cfg.WORKSPACE;
  }

  async scanHtmlFiles(directory, excludeDirs = []) {
    const htmlFiles = [];
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          const subFiles = await this.scanHtmlFiles(fullPath, excludeDirs);
          htmlFiles.push(...subFiles);
        }
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const relPath = path.relative(this.workspace, fullPath).replace(/\\/g, '/');
        htmlFiles.push(`/${relPath}`);
      }
    }
    return htmlFiles.sort();
  }

  async getFileModTime(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return dayjs(stats.mtime).format('YYYY-MM-DDTHH:mm:ss+08:00');
    } catch {
      return dayjs().format('YYYY-MM-DDTHH:mm:ss+08:00');
    }
  }

  async generateSitemap() {
    console.log('\n[信息] 开始生成 sitemap.xml...');
    const urls = [];
    const cfg = this.cfg;
    const pagesCfg = cfg.pagesConfig;

    const staticPages = ['/', '/article/', '/tags/', '/data/', '/about/'];
    for (const page of staticPages) {
      const fullPath = page === '/'
        ? path.join(this.workspace, 'index.html')
        : path.join(this.workspace, page.replace(/^\//, ''), 'index.html');
      if (await fileExists(fullPath)) {
        urls.push({
          loc: `${cfg.SITE_URL}${page}`,
          lastmod: await this.getFileModTime(fullPath),
          changefreq: 'daily',
          priority: page === '/' ? '1.0' : '0.8'
        });
      }
    }

    const maxArticlePage = pagesCfg.maxPageNum?.maxArticlePageNum || 1;
    for (let i = 2; i <= maxArticlePage; i++) {
      const pagePath = `/pages/${i}.html`;
      const fullPath = path.join(this.workspace, 'pages', `${i}.html`);
      if (await fileExists(fullPath)) {
        urls.push({
          loc: `${cfg.SITE_URL}${pagePath}`,
          lastmod: await this.getFileModTime(fullPath),
          changefreq: 'weekly',
          priority: '0.7'
        });
      }
    }

    const maxTagPageNums = pagesCfg.maxPageNum?.maxTagPageNums || {};
    for (const [tag, pageCount] of Object.entries(maxTagPageNums)) {
      for (let i = 1; i <= Number(pageCount); i++) {
        const tagPath = i === 1 ? `/tags/${tag}/` : `/tags/${tag}/${i}.html`;
        const fullPath = i === 1
          ? path.join(this.workspace, 'tags', tag, 'index.html')
          : path.join(this.workspace, 'tags', tag, `${i}.html`);
        if (await fileExists(fullPath)) {
          urls.push({
            loc: `${cfg.SITE_URL}${tagPath}`,
            lastmod: await this.getFileModTime(fullPath),
            changefreq: 'weekly',
            priority: '0.6'
          });
        }
      }
    }

    const articleDir = path.join(this.workspace, 'article');
    if (await fileExists(articleDir)) {
      const articleFiles = await fs.readdir(articleDir);
      for (const file of articleFiles) {
        if (file.endsWith('.html')) {
          const fullPath = path.join(articleDir, file);
          const articleId = file.replace('.html', '');
          urls.push({
            loc: `${cfg.SITE_URL}/article/${articleId}.html`,
            lastmod: await this.getFileModTime(fullPath),
            changefreq: 'monthly',
            priority: '0.9'
          });
        }
      }
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    urls.forEach(url => {
      xml += `  <url>\n    <loc>${url.loc}</loc>\n    <lastmod>${url.lastmod}</lastmod>\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>\n  </url>\n`;
    });
    xml += '</urlset>\n';

    await fs.writeFile(path.join(this.workspace, 'sitemap.xml'), xml, 'utf-8');
    console.log(`[成功] sitemap.xml 已生成，共 ${urls.length} 个URL`);
  }

  async generateRobots() {
    console.log('\n[信息] 开始生成 robots.txt...');
    const cfg = this.cfg;
    let content = `# robots.txt for ${cfg.SITE_URL}\n# Generated automatically\n\nUser-agent: *\n`;

    cfg.ALLOW_PATHS.forEach(p => content += `Allow: ${p}\n`);
    content += '\n';
    cfg.DISALLOW_PATHS.forEach(p => content += `Disallow: ${p}\n`);
    content += `\n# Sitemap\nSitemap: ${cfg.SITEMAP_URL}\n`;

    await fs.writeFile(path.join(this.workspace, 'robots.txt'), content, 'utf-8');
    console.log(`[成功] robots.txt 已生成`);
  }
}

// ===================== 主流程控制器 =====================
class BlogGenerator {
  constructor() {
    this.cfg = new Config();
    this.blogMgr = null;
    this.seoGen = null;
  }

  async init() {
    await this.cfg.load();
    this.blogMgr = new BlogManager(this.cfg);
    this.seoGen = new SEOGenerator(this.cfg);
  }

  logOperation() {
    const issue = this.cfg.ISSUE;
    const date = formatDate(issue.date, this.cfg.UTC_OFFSET);
    console.log(`\n${'='.repeat(50)}\n[操作] Issue动作：${issue.action}\n${'='.repeat(50)}`);
    console.log(`[信息] 标题：${issue.title}\n[信息] 发布日期：${date}\n[信息] 发布者：${issue.author}`);
    console.log(`[信息] 标签：${issue.labels.length ? issue.labels.join(', ') : '无'}`);
    console.log('='.repeat(50));
  }

  async updateListCards(title, date, content, issueId, labels) {
    const maxCards = this.cfg.ARTICLES_PER_PAGE;
    const idxPath = this.blogMgr.getListPagePath(1);
    const p = new HTMLProcessor(idxPath);
    await p.load();
    let isUpdate = !!p.findCard(issueId);

    if (isUpdate) {
      p.addOrUpdateCard(title, date, content, issueId, labels, maxCards);
      await p.save();
    } else {
      const totalPages = await this.blogMgr.getTotalListPages();
      for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
        const pagePath = this.blogMgr.getListPagePath(pageNum);
        const pPage = new HTMLProcessor(pagePath);
        await pPage.load();
        if (pPage.findCard(issueId)) {
          isUpdate = true;
          pPage.addOrUpdateCard(title, date, content, issueId, labels, maxCards);
          await pPage.save();
          break;
        }
      }
    }

    if (!isUpdate) {
      const lastNonFullPage = await this.blogMgr.findLastNonFullListPage();
      if (lastNonFullPage === 0) {
        const nextPageNum = (await this.blogMgr.getTotalListPages()) + 1;
        const newPagePath = await this.blogMgr.createListPage(nextPageNum);
        const pNew = new HTMLProcessor(newPagePath);
        await pNew.load();
        pNew.addOrUpdateCard(title, date, content, issueId, labels, maxCards);
        await pNew.save();
        this.blogMgr.updateMaxArticlePageNum(await this.blogMgr.getTotalListPages());
      } else {
        const pagePath = this.blogMgr.getListPagePath(lastNonFullPage);
        const pTarget = new HTMLProcessor(pagePath);
        await pTarget.load();
        pTarget.addOrUpdateCard(title, date, content, issueId, labels, maxCards);
        await pTarget.save();
      }
    }

    const articleIdxPath = path.join(this.cfg.WORKSPACE, 'article/index.html');
    if (await fileExists(articleIdxPath)) {
      const pArticle = new HTMLProcessor(articleIdxPath);
      await pArticle.load();
      pArticle.addOrUpdateCard(title, date, content, issueId, labels, maxCards);
      await pArticle.save();
    }
  }

  async handleDelete() {
    const issueId = this.cfg.ISSUE.id;
    console.log(`\n[操作] 删除文章：ID ${issueId}`);

    const oldLabels = await this.blogMgr.extractArticleLabels(issueId);
    console.log(`[信息] 旧标签：${oldLabels.length ? oldLabels.join(', ') : '无'}`);

    await this.blogMgr.deleteArticle(issueId);

    const totalPages = await this.blogMgr.getTotalListPages();
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pagePath = this.blogMgr.getListPagePath(pageNum);
      const p = new HTMLProcessor(pagePath);
      await p.load();
      p.removeCard(issueId);
      await p.save();
    }

    const articleIdxPath = path.join(this.cfg.WORKSPACE, 'article/index.html');
    if (await fileExists(articleIdxPath)) {
      const pArticle = new HTMLProcessor(articleIdxPath);
      await pArticle.load();
      pArticle.removeCard(issueId);
      await pArticle.save();
    }

    if (oldLabels.length) {
      const tagPageNums = await this.blogMgr.syncTagCard(issueId, '', '', '', oldLabels, [], 'remove');
      oldLabels.forEach(tag => this.blogMgr.updateTagTotal(tag, -1));
      this.blogMgr.updateTagPageNums(tagPageNums);
    }

    this.blogMgr.updateMaxArticlePageNum(await this.blogMgr.getTotalListPages());
    console.log('='.repeat(50) + '\n[成功] 删除操作完成');
  }

  async handleCreateUpdate() {
    const issue = this.cfg.ISSUE;
    const date = formatDate(issue.date, this.cfg.UTC_OFFSET);
    this.logOperation();

    const isNew = !await this.blogMgr.articleExists(issue.id);
    const oldLabels = isNew ? [] : await this.blogMgr.extractArticleLabels(issue.id);

    await this.blogMgr.generateArticle(issue.id, issue.title, issue.author, date, issue.body, issue.labels);
    await this.updateListCards(issue.title, date, truncate(issue.body), issue.id, issue.labels);

    let tagPageNums = {};
    if (isNew) {
      if (issue.labels.length) {
        tagPageNums = await this.blogMgr.syncTagCard(
          issue.id, issue.title, date, truncate(issue.body),
          issue.labels, issue.labels, 'add'
        );
        issue.labels.forEach(tag => this.blogMgr.updateTagTotal(tag, 1));
      }
    } else {
      const toAdd = issue.labels.filter(l => !oldLabels.includes(l));
      const toRemove = oldLabels.filter(l => !issue.labels.includes(l));
      const toKeep = issue.labels.filter(l => oldLabels.includes(l));

      if (toRemove.length) {
        const removeNums = await this.blogMgr.syncTagCard(issue.id, '', '', '', toRemove, [], 'remove');
        toRemove.forEach(tag => this.blogMgr.updateTagTotal(tag, -1));
        Object.assign(tagPageNums, removeNums);
      }

      if (toAdd.length) {
        const addNums = await this.blogMgr.syncTagCard(
          issue.id, issue.title, date, truncate(issue.body),
          toAdd, issue.labels, 'add'
        );
        toAdd.forEach(tag => this.blogMgr.updateTagTotal(tag, 1));
        Object.assign(tagPageNums, addNums);
      }

      if (toKeep.length) {
        const keepNums = await this.blogMgr.syncTagCard(
          issue.id, issue.title, date, truncate(issue.body),
          toKeep, issue.labels, 'add'
        );
        Object.assign(tagPageNums, keepNums);
      }
    }

    this.blogMgr.updateMaxArticlePageNum(await this.blogMgr.getTotalListPages());
    if (Object.keys(tagPageNums).length) this.blogMgr.updateTagPageNums(tagPageNums);
    await this.cfg.savePagesConfig();
  }

  async run() {
    await this.init();

    if (this.cfg.ISSUE.author !== this.cfg.TARGET_AUTHOR) {
      console.log(`[跳过] 作者不匹配 (${this.cfg.ISSUE.author} != ${this.cfg.TARGET_AUTHOR})`);
      return;
    }

    this.cfg.ISSUE.action === 'deleted'
      ? await this.handleDelete()
      : await this.handleCreateUpdate();

    await this.seoGen.generateSitemap();
    await this.seoGen.generateRobots();
  }
}

// ===================== 程序入口 =====================
await (async () => {
  try {
    await new BlogGenerator().run();
    process.exit(0);
  } catch (err) {
    console.error(`[致命错误] 程序执行失败: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
})();
