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

    card_link = f"../pages/{issue_id}.html"
    if card_link in html:
        # 找到卡片所在的<li>标签
        card_start = html.find(f'<a href="{card_link}">')
        if card_start == -1:
            card_link = f"./pages/{issue_id}.html"
            card_start = html.find(f'<a href="{card_link}">')
        
        if card_start != -1:
            # 找到<li>的开始位置
            li_start = html.rfind('<li>', 0, card_start)
            # 找到</li>的结束位置
            li_end = html.find('</li>', card_start)
            if li_end != -1:
                li_end += 5
                # 删除整个<li>
                html = html[:li_start] + html[li_end:]
                print(f"✅ 卡片已删除：ID {issue_id}")
            else:
                print(f"⚠️ 未找到卡片结束标签：ID {issue_id}")
        else:
            print(f"⚠️ 未找到卡片链接：ID {issue_id}")
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
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()

    date = time
    
    tags_html = ""
    if labels:
        for label in labels[:3]:
            tags_html += f'<div class="tag"><span>{label}</span></div>'

    card_link = f"../pages/{id}.html"
    if card_link in html:
        card_start = html.find(f'<a href="{card_link}">')
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
    else:
        card_list_start = html.find('class="card-list"')
        ul_start = html.rfind('<ul', 0, card_list_start)
        ul_end = html.find('</ul>', ul_start)
        card = f'''
<li>
    <a href="../pages/{id}.html">
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

    # 为代码块添加复制按钮
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
        # 删除操作
        print(f"\n🗑️ 删除文章：ID {issue_id}")
        
        # 删除文章文件
        delete_article(issue_id)
        
        # 从index.html中删除卡片
        remove_card(workspace + 'index.html', issue_id)
        
        # 从pages.html中删除卡片
        remove_card(workspace + 'pages.html', issue_id)
        
        print("=" * 50)
        print("✅ 删除操作完成")
        
    else:
        # 创建或编辑操作
        formatted_date = format_github_date_compact(date_str)

        print(f"\n📌 标题：{title}")
        print(f"\n📝 内容：\n{body}")
        print(f"\n📅 发布日期：{formatted_date}")
        print(f"👤 发布者：{author}")
        print(f"🏷️  标签：{', '.join(labels) if labels else '无'}")
        print("=" * 50)

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
            workspace + 'pages.html',
            title,
            formatted_date,
            body[:150] + "..." if len(body) > 150 else body,
            issue_id,
            labels=labels
        )

if __name__ == "__main__":
    main()
