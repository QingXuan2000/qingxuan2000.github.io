"""
GitHub Issues 博客生成器

功能：监听 GitHub Issues 事件，自动生成静态博客页面
支持操作：创建、更新、删除文章，标签管理
"""

import os
import json
import re
from datetime import datetime
from typing import List, Optional, Tuple
import markdown


# ==================== 配置常量 ====================

class Config:
    """环境配置类"""
    ISSUE_TITLE = os.getenv("ISSUE_TITLE", "")
    ISSUE_BODY = os.getenv("ISSUE_BODY") or "(无内容)"
    ISSUE_DATE = os.getenv("ISSUE_DATE", "")
    ISSUE_AUTHOR = os.getenv("ISSUE_AUTHOR", "")
    ISSUE_LABELS = os.getenv("ISSUE_LABELS", "[]")
    TARGET_AUTHOR = os.getenv("TARGET_AUTHOR", "")
    ISSUE_ID = os.getenv("ISSUE_ID", "")
    ISSUE_ACTION = os.getenv("ISSUE_ACTION", "opened")
    WORKSPACE = os.getenv("GITHUB_WORKSPACE", "") + "/"
    UTC_OFFSET = int(os.getenv("UTC_OFFSET", "8"))


# ==================== 工具函数 ====================

def format_github_date(iso_date: str, utc_offset: int = 8) -> str:
    """将 ISO 格式日期转换为指定 UTC 偏移量的中文友好格式"""
    from datetime import timezone, timedelta
    dt = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
    dt_local = dt.astimezone(timezone(timedelta(hours=utc_offset)))
    return dt_local.strftime("%Y年%m月%d日 %H:%M")


def truncate_content(content: str, max_length: int = 150) -> str:
    """截断内容，添加省略号"""
    return content[:max_length] + "..." if len(content) > max_length else content


def get_relative_link(file_path: str, target_id: str) -> str:
    """
    根据当前文件路径计算目标文件的相对链接
    
    Args:
        file_path: 当前文件路径
        target_id: 目标文章ID
    
    Returns:
        相对路径字符串
    """
    normalized_path = file_path.replace('\\', '/')
    
    if 'tags/' in normalized_path:
        return f"../pages/{target_id}.html"
    elif 'pages/' in normalized_path and 'index.html' in normalized_path:
        return f"./{target_id}.html"
    else:
        return f"./pages/{target_id}.html"


def get_possible_link_patterns(base_link: str, target_id: str) -> List[str]:
    """获取可能的链接匹配模式列表"""
    return [
        base_link,
        f"../pages/{target_id}.html",
        f"./pages/{target_id}.html",
        f"./{target_id}.html"
    ]


# ==================== HTML 处理类 ====================

class HTMLProcessor:
    """HTML 文件处理器"""
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.html_content = self._read_file()
    
    def _read_file(self) -> str:
        """读取文件内容"""
        with open(self.file_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    def save(self) -> None:
        """保存修改后的内容"""
        with open(self.file_path, 'w', encoding='utf-8') as f:
            f.write(self.html_content)
    
    def find_card_position(self, issue_id: str) -> Optional[Tuple[int, int, str]]:
        """
        查找卡片在HTML中的位置
        
        Returns:
            (开始位置, 结束位置, 使用的链接模式) 或 None
        """
        base_link = get_relative_link(self.file_path, issue_id)
        patterns = get_possible_link_patterns(base_link, issue_id)
        
        for pattern in patterns:
            card_start = self.html_content.find(f'<a href="{pattern}">')
            if card_start != -1:
                # 找到 <li> 标签的开始
                li_start = self.html_content.rfind('<li>', 0, card_start)
                li_end = self.html_content.find('</li>', card_start)
                
                if li_end != -1:
                    return (li_start, li_end + 5, pattern)  # +5 是为了包含 </li>
        
        return None
    
    def remove_card(self, issue_id: str) -> bool:
        """删除指定ID的文章卡片"""
        position = self.find_card_position(issue_id)
        
        if position is None:
            print(f"ℹ️  卡片不存在：ID {issue_id}")
            return False
        
        li_start, li_end, _ = position
        self.html_content = self.html_content[:li_start] + self.html_content[li_end:]
        print(f"✅ 卡片已删除：ID {issue_id}")
        return True
    
    def generate_card_html(self, title: str, date: str, content: str, 
                          issue_id: str, labels: List[str]) -> str:
        """生成卡片HTML"""
        link = get_relative_link(self.file_path, issue_id)
        tags_html = self._generate_tags_html(labels[:3])
        
        return f"""
<li>
    <a href="{link}">
        <div class="card">
            <div class="card-header">
                <h2>{title}</h2>
            </div>
            <div class="divider" style="height: 1px; width: 100%; margin: 1rem 0 1rem 0;"></div>
            <p>{content}</p>
            <div class="divider" style="height: 1px; width: 100%; margin: 1rem 0 1rem 0;"></div>
            <div class="card-footer">
                <div class="article-tag">
                    {tags_html}
                </div>
                <p>发布日期：{date}</p>
            </div>
        </div>
    </a>
</li>
"""
    
    def _generate_tags_html(self, labels: List[str]) -> str:
        """生成标签HTML"""
        return ''.join(f'<div class="tag"><span>{label}</span></div>' for label in labels)
    
    def add_or_update_card(self, title: str, date: str, content: str,
                          issue_id: str, labels: List[str]) -> None:
        """添加或更新卡片"""
        position = self.find_card_position(issue_id)
        card_html = self.generate_card_html(title, date, content, issue_id, labels)
        
        if position:
            # 更新现有卡片
            li_start, li_end, _ = position
            self.html_content = self.html_content[:li_start] + card_html + self.html_content[li_end:]
            print(f"✅ 卡片已更新：{title}")
        else:
            # 添加新卡片到列表
            self._append_card_to_list(card_html)
            print(f"✅ 卡片已添加：{title}")
    
    def _append_card_to_list(self, card_html: str) -> None:
        """将卡片添加到列表末尾"""
        card_list_start = self.html_content.find('class="card-list"')
        ul_start = self.html_content.rfind('<ul', 0, card_list_start)
        ul_end = self.html_content.find('</ul>', ul_start)
        
        self.html_content = self.html_content[:ul_end] + card_html + self.html_content[ul_end:]


# ==================== 标签管理类 ====================

class TagManager:
    """标签管理器"""
    
    def __init__(self, workspace: str):
        self.workspace = workspace
        self.tags_dir = os.path.join(workspace, "tags")
    
    def create_tag_page(self, tag_name: str) -> None:
        """创建标签页面（如果不存在）"""
        tag_file_path = os.path.join(self.tags_dir, f"{tag_name}.html")
        
        if os.path.exists(tag_file_path):
            print(f"ℹ️  标签页面已存在：{tag_name}")
            return
        
        os.makedirs(self.tags_dir, exist_ok=True)
        
        template = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title></title>
</head>
<body>
    <div id="title"><h1>{tag_name}</h1></div>
    <div id="card-list-box"><ul id="card-list"></ul></div>
    <footer>
        <p>© 2025-2026 QingXuanJun & QingXuan2000. All rights reserved.</p>
    </footer>
    <link rel="stylesheet" href="../css/QBLOG.css">
    <script src="../js/QBLOG.js"></script>
    <link rel="stylesheet" href="../css/font-awesome.min.css">
    <style>#card-list-box {{ border-top: none; }}</style>
</body>
</html>"""
        
        with open(tag_file_path, 'w', encoding='utf-8') as f:
            f.write(template)
        print(f"✅ 标签页面已创建：{tag_name}")
    
    def update_tag_cloud(self, tags: List[str], increment: bool = True) -> None:
        """更新标签云计数"""
        tag_index_path = os.path.join(self.tags_dir, "index.html")
        
        if not os.path.exists(tag_index_path):
            print(f"⚠️ 标签云文件不存在：{tag_index_path}")
            return
        
        with open(tag_index_path, 'r', encoding='utf-8') as f:
            html = f.read()
        
        for tag in tags:
            html = self._process_single_tag(html, tag, increment)
        
        with open(tag_index_path, 'w', encoding='utf-8') as f:
            f.write(html)
    
    def _process_single_tag(self, html: str, tag: str, increment: bool) -> str:
        """处理单个标签的更新"""
        tag_pattern = f'<a href="./{tag}.html" class="tag-item">'
        
        if tag_pattern not in html:
            if increment:
                return self._add_new_tag_to_cloud(html, tag)
            return html
        
        # 更新现有标签计数
        tag_start = html.find(tag_pattern)
        tag_end = html.find('</a>', tag_start)
        tag_html = html[tag_start:tag_end]
        
        count_match = re.search(r'<span class="tag-count">(\d+)</span>', tag_html)
        if not count_match:
            return html
        
        current_count = int(count_match.group(1))
        new_count = current_count + 1 if increment else current_count - 1
        
        if new_count <= 0:
            # 删除标签 - 找到包含此标签的 <li> 标签并删除
            li_start = html.rfind('<li>', 0, tag_start)
            li_end = html.find('</li>', tag_end)
            if li_start != -1 and li_end != -1:
                html = html[:li_start] + html[li_end + 5:]  # +5 是为了包含 </li>
                print(f"✅ 标签已移除：{tag}")
        else:
            # 更新计数
            new_tag_html = tag_html.replace(
                f'<span class="tag-count">{current_count}</span>',
                f'<span class="tag-count">{new_count}</span>'
            )
            html = html[:tag_start] + new_tag_html + html[tag_end:]
            print(f"✅ 标签计数已更新：{tag} ({current_count} → {new_count})")
        
        return html
    
    def _add_new_tag_to_cloud(self, html: str, tag: str) -> str:
        """向标签云添加新标签"""
        tag_cloud_start = html.find('<ul class="tag-cloud">')
        tag_cloud_end = html.find('</ul>', tag_cloud_start)
        
        new_tag_html = f"""
            <li>
                <a href="./{tag}.html" class="tag-item">
                    <span class="tag-name">{tag}</span>
                    <span class="tag-count">1</span>
                </a>
            </li>
"""
        
        print(f"✅ 标签已添加：{tag}")
        return html[:tag_cloud_end] + new_tag_html + html[tag_cloud_end:]
    
    def sync_card_to_tags(self, issue_id: str, title: str, date: str, 
                         content: str, target_labels: List[str], 
                         all_labels: List[str], operation: str = "add") -> None:
        """同步卡片到指定标签页面
        
        Args:
            target_labels: 要同步到的目标标签页面列表
            all_labels: 文章的所有标签（用于卡片显示）
        """
        for label in target_labels:
            tag_file_path = os.path.join(self.tags_dir, f"{label}.html")
            
            if operation == "add":
                self.create_tag_page(label)
                processor = HTMLProcessor(tag_file_path)
                processor.add_or_update_card(title, date, content, issue_id, all_labels)
                processor.save()
                print(f"✅ 卡片已添加到标签页：{label}")
            elif operation == "remove":
                if os.path.exists(tag_file_path):
                    processor = HTMLProcessor(tag_file_path)
                    processor.remove_card(issue_id)
                    processor.save()
                    print(f"✅ 卡片已从标签页删除：{label}")


# ==================== Markdown 处理 ====================

def convert_markdown_to_html(md_text: str) -> str:
    """将 Markdown 转换为 HTML，添加代码复制按钮"""
    # 所有官方支持的扩展
    # extra 已包含: abbr, attr_list, def_list, fenced_code, footnotes, md_in_html, tables
    extensions = [
        "extra",           # 包含: abbr, attr_list, def_list, fenced_code, footnotes, md_in_html, tables, 删除线 ~~text~~
        "toc",             # 目录生成
        "sane_lists",      # 更合理的列表处理
        "codehilite",      # 代码高亮
        "nl2br",           # 换行转 <br>
        "smarty",          # 智能标点转换
        "admonition",      # 警告/提示框
        "meta",            # 元数据处理
        "wikilinks",       # Wiki 链接 [[Page]]
        "legacy_attrs",    # 旧版属性语法
        "legacy_em",       # 旧版强调语法
    ]
    
    extension_configs = {
        "codehilite": {
            "linenums": True,
            "css_class": "codehilite",
            "use_pygments": True
        },
        "toc": {
            "permalink": True  # 为标题添加锚点链接
        }
    }
    
    html_text = markdown.markdown(
        md_text,
        extensions=extensions,
        extension_configs=extension_configs,
        output_format="html5"
    )
    
    return add_copy_buttons_to_code(html_text)


def add_copy_buttons_to_code(html: str) -> str:
    """为代码块添加复制按钮（只在不带行号的 pre 代码块中添加）"""
    
    def insert_button_to_pre(match):
        pre_content = match.group(0)
        copy_btn = '<span class="copy-btn"><i class="fa fa-copy" aria-hidden="true"></i>&nbsp;Copy</span>'
        pre_tag_end = pre_content.find('>') + 1
        return pre_content[:pre_tag_end] + '\n                ' + copy_btn + pre_content[pre_tag_end:]
    
    # 先移除 codehilitetable 中的所有复制按钮（如果之前添加过）
    html = re.sub(r'<span class="copy-btn">.*?</span>', '', html, flags=re.DOTALL)
    
    # 只为不在 codehilitetable 中的 pre 标签添加复制按钮
    # 使用 BeautifulSoup 更精确地处理
    from bs4 import BeautifulSoup
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # 找到所有不在 codehilitetable 中的 pre 标签
    for pre in soup.find_all('pre'):
        # 检查是否在 codehilitetable 中
        parent_table = pre.find_parent('table', class_='codehilitetable')
        if parent_table is None:
            # 不在 codehilitetable 中，添加复制按钮
            copy_btn = soup.new_tag('span', **{'class': 'copy-btn'})
            copy_btn.string = 'Copy'
            pre.insert(0, copy_btn)
    
    return str(soup)


# ==================== 文章管理类 ====================

class ArticleManager:
    """文章管理器"""
    
    def __init__(self, workspace: str):
        self.workspace = workspace
        self.pages_dir = os.path.join(workspace, "pages")
        os.makedirs(self.pages_dir, exist_ok=True)
    
    def get_article_path(self, issue_id: str) -> str:
        """获取文章文件路径"""
        return os.path.join(self.pages_dir, f"{issue_id}.html")
    
    def article_exists(self, issue_id: str) -> bool:
        """检查文章是否存在"""
        return os.path.exists(self.get_article_path(issue_id))
    
    def delete_article(self, issue_id: str) -> bool:
        """删除文章文件"""
        file_path = self.get_article_path(issue_id)
        
        if not os.path.exists(file_path):
            print(f"ℹ️  文章文件不存在：{file_path}")
            return False
        
        os.remove(file_path)
        print(f"✅ 文章已删除：{file_path}")
        return True
    
    def extract_labels_from_article(self, issue_id: str) -> List[str]:
        """从现有文章中提取标签"""
        file_path = self.get_article_path(issue_id)
        
        if not os.path.exists(file_path):
            return []
        
        with open(file_path, 'r', encoding='utf-8') as f:
            html = f.read()
        
        tags = re.findall(r'<div class="tag"><span>(.*?)</span></div>', html)
        return list(set(tags))
    
    def generate_article(self, issue_id: str, title: str, author: str,
                        publish_time: str, content: str, labels: List[str]) -> None:
        """生成文章页面"""
        try:
            date = datetime.strptime(publish_time, '%Y年%m月%d日 %H:%M:%S').strftime('%Y年%m月%d日 %H:%M')
        except ValueError:
            date = publish_time
        
        content_html = convert_markdown_to_html(content)
        tags_html = ''.join(f'<div class="tag"><span>{label}</span></div>' for label in labels[:3])
        
        is_update = self.article_exists(issue_id)
        
        template = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title></title>
</head>
<body>
    <div class="card-box">
        <div class="card">
            <div class="card-header">
                <h1>{title}</h1>
                <p>作者：{author}</p>
                <p>发布日期：{date}</p>
            </div>
            <div class="divider" style="height: 1px; width: 100%; margin: 1rem 0 1rem 0;"></div>
            <div class="card-content article-content">
                {content_html}
            </div>
            <div class="article-footer">
                <div class="article-tag">
                    <span>文章标签：</span>
                    {tags_html}
                </div>
            </div>
        </div>
    </div>
    <footer>
        <p>© 2025-2026 QingXuanJun & QingXuan2000. All rights reserved.</p>
    </footer>
    <link rel="stylesheet" href="../css/blogArticle.css">
    <link rel="stylesheet" href="../css/QBLOG.css" />
    <script src="../js/QBLOG.js"></script>
    <link rel="stylesheet" href="../css/font-awesome.min.css" />
</body>
</html>"""
        
        file_path = self.get_article_path(issue_id)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(template)
        
        action = "更新" if is_update else "生成"
        print(f"✅ 文章已{action}：{file_path}")


# ==================== 主流程类 ====================

class BlogGenerator:
    """博客生成器主类"""
    
    def __init__(self):
        self.config = Config()
        self.labels = json.loads(self.config.ISSUE_LABELS)
        self.article_manager = ArticleManager(self.config.WORKSPACE)
        self.tag_manager = TagManager(self.config.WORKSPACE)
    
    def should_process(self) -> bool:
        """检查是否应该处理当前 Issue"""
        is_target = self.config.ISSUE_AUTHOR == self.config.TARGET_AUTHOR
        
        print(f"作者: {self.config.ISSUE_AUTHOR}")
        print(f"目标作者: {self.config.TARGET_AUTHOR}")
        print(f"作者匹配: {is_target}")
        print(f"操作类型: {self.config.ISSUE_ACTION}")
        
        if not is_target:
            print("❌ 跳过：作者不匹配")
            return False
        return True
    
    def log_issue_info(self) -> None:
        """打印 Issue 基本信息"""
        formatted_date = format_github_date(self.config.ISSUE_DATE, self.config.UTC_OFFSET)
        
        print(f"\n📌 标题：{self.config.ISSUE_TITLE}")
        print(f"\n📝 内容：\n{self.config.ISSUE_BODY}")
        print(f"\n📅 发布日期：{formatted_date}")
        print(f"👤 发布者：{self.config.ISSUE_AUTHOR}")
        print(f"🏷️  标签：{', '.join(self.labels) if self.labels else '无'}")
        print("=" * 50)
    
    def handle_deletion(self) -> None:
        """处理文章删除"""
        issue_id = self.config.ISSUE_ID
        
        print(f"\n🗑️ 删除文章：ID {issue_id}")
        
        # 获取旧标签
        old_labels = self.article_manager.extract_labels_from_article(issue_id)
        print(f"📌 旧标签：{', '.join(old_labels) if old_labels else '无'}")
        
        # 删除文章文件
        self.article_manager.delete_article(issue_id)
        
        # 从索引页面删除卡片
        for index_file in [self.config.WORKSPACE + 'index.html', 
                          self.config.WORKSPACE + 'pages/index.html']:
            processor = HTMLProcessor(index_file)
            processor.remove_card(issue_id)
            processor.save()
        
        # 从标签页面删除并更新标签云
        if old_labels:
            self.tag_manager.sync_card_to_tags(issue_id, "", "", "", old_labels, [], "remove")
            self.tag_manager.update_tag_cloud(old_labels, increment=False)
        
        print("=" * 50)
        print("✅ 删除操作完成")
    
    def calculate_label_changes(self, old_labels: List[str], new_labels: List[str]) -> Tuple[List[str], List[str], List[str]]:
        """
        计算标签变更
        
        Returns:
            (新增标签, 删除标签, 保留标签)
        """
        to_add = [l for l in new_labels if l not in old_labels]
        to_remove = [l for l in old_labels if l not in new_labels]
        to_keep = [l for l in new_labels if l in old_labels]
        return to_add, to_remove, to_keep
    
    def handle_creation_or_update(self) -> None:
        """处理文章创建或更新"""
        issue_id = self.config.ISSUE_ID
        formatted_date = format_github_date(self.config.ISSUE_DATE, self.config.UTC_OFFSET)
        truncated_body = truncate_content(self.config.ISSUE_BODY)
        
        self.log_issue_info()
        
        # 检查是否为新文章
        is_new = not self.article_manager.article_exists(issue_id)
        
        # 获取旧标签（如果是更新）
        old_labels = [] if is_new else self.article_manager.extract_labels_from_article(issue_id)
        if not is_new:
            print(f"📌 旧标签：{', '.join(old_labels) if old_labels else '无'}")
        
        # 生成文章页面
        self.article_manager.generate_article(
            issue_id=issue_id,
            title=self.config.ISSUE_TITLE,
            author=self.config.ISSUE_AUTHOR,
            publish_time=formatted_date,
            content=self.config.ISSUE_BODY,
            labels=self.labels
        )
        
        # 更新索引页面
        for index_file in [self.config.WORKSPACE + 'index.html',
                          self.config.WORKSPACE + 'pages/index.html']:
            processor = HTMLProcessor(index_file)
            processor.add_or_update_card(
                self.config.ISSUE_TITLE,
                formatted_date,
                truncated_body,
                issue_id,
                self.labels
            )
            processor.save()
        
        # 处理标签同步
        if is_new:
            # 新文章：直接添加所有标签
            if self.labels:
                self.tag_manager.sync_card_to_tags(
                    issue_id, self.config.ISSUE_TITLE, formatted_date,
                    truncated_body, self.labels, self.labels, "add"
                )
                self.tag_manager.update_tag_cloud(self.labels, increment=True)
        else:
            # 更新文章：计算标签差异
            to_add, to_remove, to_keep = self.calculate_label_changes(old_labels, self.labels)
            
            # 删除不需要的标签
            if to_remove:
                self.tag_manager.sync_card_to_tags(issue_id, "", "", "", to_remove, [], "remove")
                self.tag_manager.update_tag_cloud(to_remove, increment=False)
            
            # 添加新标签
            if to_add:
                self.tag_manager.sync_card_to_tags(
                    issue_id, self.config.ISSUE_TITLE, formatted_date,
                    truncated_body, to_add, self.labels, "add"
                )
                self.tag_manager.update_tag_cloud(to_add, increment=True)
            
            # 更新保留的标签（刷新内容）
            if to_keep:
                self.tag_manager.sync_card_to_tags(
                    issue_id, self.config.ISSUE_TITLE, formatted_date,
                    truncated_body, to_keep, self.labels, "add"
                )
    
    def run(self) -> None:
        """运行主流程"""
        if not self.should_process():
            return
        
        print("\n" + "=" * 50)
        print(f"✅ Issue操作：{self.config.ISSUE_ACTION}")
        print("=" * 50)
        
        if self.config.ISSUE_ACTION == "deleted":
            self.handle_deletion()
        else:
            self.handle_creation_or_update()


def main():
    """程序入口"""
    generator = BlogGenerator()
    generator.run()


if __name__ == "__main__":
    main()