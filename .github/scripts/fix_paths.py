import os
import re

workspace = r"c:\Users\QingXuanJun\Documents\Project\WebProject\qingxuan2000.github.io"

def fix_index_html():
    """修复根目录 index.html 的路径"""
    file_path = os.path.join(workspace, "index.html")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    html = html.replace('../pages/', './pages/')
    html = html.replace('./4.html', './pages/4.html')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print("✅ 已修复：index.html")

def fix_all():
    print("开始修复路径...")
    fix_index_html()
    print("路径修复完成！")

if __name__ == "__main__":
    fix_all()
