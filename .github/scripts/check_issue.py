import os
import json
from datetime import datetime
import markdown
import re

title = os.getenv("ISSUE_TITLE", "")
body = os.getenv("ISSUE_BODY", "") or "(无内容)"
date_str = os.getenv("ISSUE_DATE", "")
author = os.getenv("ISSUE_AUTHOR", "")
labels_json = os.getenv("ISSUE_LABELS", "[]")
target_author = os.getenv("TARGET_AUTHOR", "")
issue_id = os.getenv("ISSUE_ID", "")
issue_action = os.getenv("ISSUE_ACTION", "opened")
workspace = os.getenv("GITHUB_WORKSPACE") + "/"


def remove_card(file_path, issue_id):
    """删除指定ID的文章卡片"""
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()

    file_path_norm = file_path.replace('\\', '/')
    if 'tags/' in file_path_norm:
        correct_link = f"../pages/{issue_id}.html"
    elif 'pages/' in file_path_norm and 'index.html' in file_path_norm:
        correct_link = f"./{issue_id}.html"
    else:
        correct_link = f"./pages/{issue_id}.html"
    
    card_link_patterns = [
        correct_link,
        f"../pages/{issue_id}.html",
        f"./pages/{issue_id}.html",
        f"./{issue_id}.html"
    ]
    
    card_link = None
    card_start = -1
    
    for pattern in card_link_patterns:
        card_start = html.find(f'<a href="{pattern}">')
        if card_start != -1:
            card_link = pattern
            break
    
    if card_start != -1:
        li_start = html.rfind('<li>', 0, card_start)
        li_end = html.find('</li>', card_start)
        if li_end != -1:
            li_end += 5
            html = html[:li_start] + html[li_end:]
            print(f"✅ 卡片已删除：ID {issue_id}")
        else:
            print(f"⚠️ 未找到卡片结束标签：ID {issue_id}")
    else:
        print(f"ℹ️ 卡片不存在：ID {issue_id}")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(html)


def delete_article(issue_id):
    """删除文章文件"""
    file_path = os.path.join(workspace, "pages", f"{issue_id}.html")
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"✅ 文章已删除：{file_path}")
        return True
    else:
        print(f"ℹ️ 文章文件不存在：{file_path}")
        return False


def add_card(file_path, title, time, content, id, labels):
    """添加文章卡片"""
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()

    date = time
    
    tags_html = ""
    if labels:
        for label in labels[:3]:
            tags_html += f'<div class="tag"><span>{label}</span></div>'

    file_path_norm = file_path.replace('\\', '/')
    if 'tags/' in file_path_norm:
        card_link = f"../pages/{id}.html"
    elif 'pages/' in file_path_norm and 'index.html' in file_path_norm:
        card_link = f"./{id}.html"
    else:
        card_link = f"./pages/{id}.html"
    
    card_link_patterns = [
        card_link,
        f"../pages/{id}.html",
        f"./pages/{id}.html",
        f"./{id}.html"
    ]
    
    found = False
    for pattern in card_link_patterns:
        if pattern in html:
            card_start = html.find(f'<a href="{pattern}">')
            card_end = html.find('</li>', card_start)
            card_end += 5
            new_card = f'''
<li>
    <a href="{card_link}">
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
'''
            html = html[:card_start] + new_card + html[card_end:]
            print(f"✅ 卡片已更新：{title}")
            found = True
            break
    
    if not found:
        card_list_start = html.find('class="card-list"')
        ul_start = html.rfind('<ul', 0, card_list_start)
        ul_end = html.find('</ul>', ul_start)
        card = f'''
<li>
    <a href="{card_link}">
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
'''
        new_html = html[:ul_end] + card + html[ul_end:]
        html = new_html
        print(f"✅ 卡片已添加：{title}")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(html)


def create_tag_page(tag_name):
    """创建标签页面"""
    tag_file_path = os.path.join(workspace, "tags", f"{tag_name}.html")
    
    if os.path.exists(tag_file_path):
        print(f"ℹ️ 标签页面已存在：{tag_name}")
        return
    
    tags_dir = os.path.join(workspace, "tags")
    os.makedirs(tags_dir, exist_ok=True)
    
    tag_template = f'''<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title></title>
</head>

<body>
    <div id="title">
        <h1>{tag_name}</h1>
    </div>

    <div id="card-list-box">
        <ul id="card-list">
        </ul>
    </div>

    <footer>
        <p>© 2025-2026 QingXuanJun & QingXuan2000. All
            rights reserved.</p>
    </footer>

    <!-- ------------------------------------------------------------ -->

    <link rel="stylesheet" href="../css/QBLOG.css">
    <script src="../js/QBLOG.js"></script>

    <link rel="stylesheet" href="../css/font-awesome.min.css">

    <!-- ------------------------------------------------------------ -->

    <style>
        #card-list-box {
            border-top: none;
        }
    </style>

    <!-- ------------------------------------------------------------ -->
</body>

</html>
'''
    
    with open(tag_file_path, 'w', encoding='utf-8') as f:
        f.write(tag_template)
    
    print(f"✅ 标签页面已创建：{tag_name}")


def update_tag_cloud(tags, increment=True):

    tag_index_path = os.path.join(workspace, "tags", "index.html")
    
    if not os.path.exists(tag_index_path):
        print(f"⚠️ 标签云文件不存在：{tag_index_path}")
        return
    
    with open(tag_index_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    for tag in tags:
        tag_pattern = f'<a href="./{tag}.html" class="tag-item">'
        
        if tag_pattern in html:
            tag_start = html.find(tag_pattern)
            tag_end = html.find('</a>', tag_start)
            tag_html = html[tag_start:tag_end]
            
            count_match = re.search(r'<span class="tag-count">(\d+)</span>', tag_html)
            if count_match:
                current_count = int(count_match.group(1))
                if increment:
                    new_count = current_count + 1
                else:
                    new_count = current_count - 1
                
                if new_count <= 0:
                    tag_full_start = html.rfind('            ', 0, tag_start)
                    tag_full_end = tag_end + 4
                    html = html[:tag_full_start] + html[tag_full_end:]
                    print(f"✅ 标签已移除：{tag}")
                else:
                    new_tag_html = tag_html.replace(
                        f'<span class="tag-count">{current_count}</span>',
                        f'<span class="tag-count">{new_count}</span>'
                    )
                    html = html[:tag_start] + new_tag_html + html[tag_end:]
                    print(f"✅ 标签计数已更新：{tag} ({current_count} → {new_count})")
        else:
            if increment:
                tag_cloud_start = html.find('<div class="tag-cloud">')
                tag_cloud_end = html.find('</div>', tag_cloud_start)
                
                new_tag_html = f'''
            <a href="./{tag}.html" class="tag-item">
                <span class="tag-name">{tag}</span>
                <span class="tag-count">1</span>
            </a>'''
                
                html = html[:tag_cloud_end] + new_tag_html + html[tag_cloud_end:]
                print(f"✅ 标签已添加：{tag}")
    
    with open(tag_index_path, 'w', encoding='utf-8') as f:
        f.write(html)


def add_card_to_tag_pages(issue_id, title, time, content, labels):
    """向标签页面添加卡片"""
    for label in labels:
        tag_file_path = os.path.join(workspace, "tags", f"{label}.html")
        
        if not os.path.exists(tag_file_path):
            create_tag_page(label)
        
        add_card(tag_file_path, title, time, content, issue_id, labels)
        print(f"✅ 卡片已添加到标签页：{label}")


def remove_card_from_tag_pages(issue_id, labels):
    """从标签页面删除卡片"""
    for label in labels:
        tag_file_path = os.path.join(workspace, "tags", f"{label}.html")
        
        if os.path.exists(tag_file_path):
            remove_card(tag_file_path, issue_id)
            print(f"✅ 卡片已从标签页删除：{label}")


def get_article_labels(issue_id):
    """获取文章的标签"""
    article_path = os.path.join(workspace, "pages", f"{issue_id}.html")
    
    if not os.path.exists(article_path):
        return []
    
    with open(article_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    labels = []
    tag_matches = re.findall(r'<div class="tag"><span>(.*?)</span></div>', html)
    labels = list(set(tag_matches))
    
    return labels


def md_to_html(md_text: str) -> str:
    extensions = [
        "extra", "toc", "sane_lists", "codehilite",
        "nl2br", "footnotes", "fenced_code"
    ]

    extension_configs = {
        "codehilite": {
            "linenums": False,
            "css_class": "codehilite",
            "use_pygments": False
        }
    }

    html_text = markdown.markdown(
        md_text,
        extensions=extensions,
        extension_configs=extension_configs,
        output_format="html5"
    )

    def add_copy_button(match):
        pre_content = match.group(0)
        copy_btn = '<span class="copy-btn"><i class="fa fa-copy" aria-hidden="true"></i>&nbsp;Copy</span>'
        pre_tag_end = pre_content.find('>') + 1
        return pre_content[:pre_tag_end] + '\n                ' + copy_btn + pre_content[pre_tag_end:]

    html_text = re.sub(r'<pre[^>]*>.*?</pre>', add_copy_button, html_text, flags=re.DOTALL)

    return html_text


def generate_article_page(issue_id, title, author, publish_time, content, labels):
    try:
        date = datetime.strptime(publish_time, '%Y年%m月%d日 %H:%M:%S').strftime('%Y年%m月%d日 %H:%M')
    except:
        date = publish_time

    content_html = md_to_html(content)
    
    tags_html = ""
    if labels:
        for label in labels[:3]:
            tags_html += f'<div class="tag"><span>{label}</span></div>'

    article_template = f'''
<!DOCTYPE html>
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

    <!-- ------------------------------------------------------------ -->

    <link rel="stylesheet" href="../css/blogArticle.css">

    <link rel="stylesheet" href="../css/QBLOG.css" />
    <script src="../js/QBLOG.js"></script>

    <link rel="stylesheet" href="../css/font-awesome.min.css" />

    <!-- ------------------------------------------------------------ -->

</body>

</html>
'''

    pages_dir = os.path.join(workspace, "pages")
    os.makedirs(pages_dir, exist_ok=True)

    file_path = os.path.join(pages_dir, f"{issue_id}.html")
    
    if os.path.exists(file_path):
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(article_template)
        print(f"✅ 文章已更新：{file_path}")
    else:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(article_template)
        print(f"✅ 文章已生成：{file_path}")


def format_github_date_compact(iso_date: str) -> str:
    dt = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
    return dt.strftime("%Y年%m月%d日 %H:%M")


def main():
    labels = json.loads(labels_json)
    is_target_author = author == target_author

    print(f"作者: {author}")
    print(f"目标作者: {target_author}")
    print(f"作者匹配: {is_target_author}")
    print(f"操作类型: {issue_action}")

    if not is_target_author:
        print("❌ 跳过：作者不匹配")
        return

    print("\n" + "=" * 50)
    print(f"✅ Issue操作：{issue_action}")
    print("=" * 50)

    if issue_action == "deleted":
        print(f"\n🗑️ 删除文章：ID {issue_id}")
        
        old_labels = get_article_labels(issue_id)
        print(f"📌 旧标签：{', '.join(old_labels) if old_labels else '无'}")
        
        delete_article(issue_id)
        
        remove_card(workspace + 'index.html', issue_id)
        remove_card(workspace + 'pages/index.html', issue_id)
        
        if old_labels:
            remove_card_from_tag_pages(issue_id, old_labels)
            update_tag_cloud(old_labels, increment=False)
        
        print("=" * 50)
        print("✅ 删除操作完成")
        
    else:
        formatted_date = format_github_date_compact(date_str)

        print(f"\n📌 标题：{title}")
        print(f"\n📝 内容：\n{body}")
        print(f"\n📅 发布日期：{formatted_date}")
        print(f"👤 发布者：{author}")
        print(f"🏷️  标签：{', '.join(labels) if labels else '无'}")
        print("=" * 50)

        article_path = os.path.join(workspace, "pages", f"{issue_id}.html")
        is_new_article = not os.path.exists(article_path)
        
        old_labels = []
        if not is_new_article:
            old_labels = get_article_labels(issue_id)
            print(f"📌 旧标签：{', '.join(old_labels) if old_labels else '无'}")

        generate_article_page(
            issue_id=issue_id,
            title=title,
            author=author,
            publish_time=formatted_date,
            content=body,
            labels=labels
        )

        add_card(
            workspace + 'index.html',
            title,
            formatted_date,
            body[:150] + "..." if len(body) > 150 else body,
            issue_id,
            labels=labels
        )

        add_card(
            workspace + 'pages/index.html',
            title,
            formatted_date,
            body[:150] + "..." if len(body) > 150 else body,
            issue_id,
            labels=labels
        )

        if is_new_article:
            if labels:
                add_card_to_tag_pages(issue_id, title, formatted_date, body[:150] + "..." if len(body) > 150 else body, labels)
                update_tag_cloud(labels, increment=True)
        else:
            labels_to_add = [l for l in labels if l not in old_labels]
            labels_to_remove = [l for l in old_labels if l not in labels]
            labels_common = [l for l in labels if l in old_labels]
            
            if labels_to_remove:
                remove_card_from_tag_pages(issue_id, labels_to_remove)
                update_tag_cloud(labels_to_remove, increment=False)
            
            if labels_to_add:
                add_card_to_tag_pages(issue_id, title, formatted_date, body[:150] + "..." if len(body) > 150 else body, labels_to_add)
                update_tag_cloud(labels_to_add, increment=True)
            
            if labels_common:
                add_card_to_tag_pages(issue_id, title, formatted_date, body[:150] + "..." if len(body) > 150 else body, labels_common)


if __name__ == "__main__":
    main()
