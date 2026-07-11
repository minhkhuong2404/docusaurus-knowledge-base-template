import re

def scan_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Matches ``` followed by optional spaces, then newline, then content, then ```
    pattern = re.compile(r'```(?:text|plaintext|)?\n(.*?)\n```', re.DOTALL)
    matches = pattern.finditer(content)
    
    diagrams = []
    for match in matches:
        code = match.group(1)
        line_no = content[:match.start()].count('\n') + 1
        # Skip blocks that start with "java" or "xml" etc. (though the regex matches standard untagged code blocks)
        # Let's check the first word
        first_line = code.split('\n')[0] if code else ''
        diagrams.append((line_no, first_line, code))
    
    return diagrams

def main():
    path = 'docs/technical-knowledge/java/java-locks.md'
    diags = scan_file(path)
    for line, first_line, code in diags:
        # Check if the block has arrow or box characters or looks like a diagram
        box_chars = re.compile(r'[┌┐└┘├┤┬┴┼─│─→─◄]')
        if box_chars.search(code) or '→' in code or '│' in code or '─' in code:
            print(f"Line {line}:")
            print(code)
            print("-" * 50)

if __name__ == '__main__':
    main()
