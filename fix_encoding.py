import os
import chardet

def detect_file_encoding(file_path):
    """检测文件编码"""
    with open(file_path, 'rb') as f:
        raw_data = f.read()
        result = chardet.detect(raw_data)
        return result['encoding'], result['confidence']

def fix_encoding(file_path):
    """尝试修复文件编码"""
    print(f"正在处理: {file_path}")
    
    # 尝试读取文件
    encodings_to_try = ['utf-8', 'gbk', 'gb2312', 'big5', 'gb18030']
    
    content = None
    used_encoding = None
    
    # 先尝试检测编码
    detected_encoding, confidence = detect_file_encoding(file_path)
    if detected_encoding:
        encodings_to_try.insert(0, detected_encoding)
        print(f"  检测到编码: {detected_encoding} (置信度: {confidence:.2f})")
    
    # 尝试各种编码读取
    for enc in encodings_to_try:
        try:
            with open(file_path, 'r', encoding=enc) as f:
                content = f.read()
                used_encoding = enc
                print(f"  成功用 {enc} 读取")
                break
        except (UnicodeDecodeError, LookupError):
            continue
    
    if content is None:
        print(f"  无法读取文件，跳过")
        return False
    
    # 检查是否包含乱码特征（通过尝试查找中文）
    has_chinese = any('\u4e00' <= char <= '\u9fff' for char in content)
    
    if has_chinese:
        # 看起来是正常的，用UTF-8重新保存确保编码正确
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✓ 已用UTF-8保存")
            return True
        except Exception as e:
            print(f"  ✗ 保存失败: {e}")
            return False
    else:
        # 尝试修复：用GBK读取，UTF-8保存
        print(f"  未检测到中文，尝试编码转换...")
        try:
            with open(file_path, 'rb') as f:
                raw_data = f.read()
            
            # 尝试GBK -> UTF-8转换
            content = raw_data.decode('gbk', errors='replace')
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✓ 已转换为UTF-8")
            return True
        except Exception as e:
            print(f"  ✗ 转换失败: {e}")
            return False

def main():
    # 定义需要处理的文件扩展名
    extensions = ['.html', '.css', '.js', '.md', '.py', '.json']
    
    # 遍历目录
    for root, dirs, files in os.walk('.'):
        # 跳过一些不需要处理的目录
        if '.git' in root or 'node_modules' in root or '__pycache__' in root:
            continue
            
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                fix_encoding(file_path)
    
    print("\n编码修复完成！")

if __name__ == "__main__":
    main()
