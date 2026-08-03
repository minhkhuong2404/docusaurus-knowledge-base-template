import os
import re

kafka_dir = '/Users/lukhuong/Desktop/docusaurus-knowledge-base-template/docs/technical-knowledge/kafka'
components_dir = '/Users/lukhuong/Desktop/docusaurus-knowledge-base-template/src/components'

print("=== KAFKA DOCUMENTATION FILES AUDIT ===")
md_files = []
for root, dirs, files in os.walk(kafka_dir):
    for f in files:
        if f.endswith('.md') or f.endswith('.mdx'):
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, kafka_dir)
            md_files.append((rel_path, full_path))

for rel_path, full_path in sorted(md_files):
    with open(full_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    imports = re.findall(r'import\s+([A-Za-z0-9_]+)\s+from', content)
    tags = re.findall(r'<([A-Z][A-Za-z0-9]+)[^/>]*/?>', content)
    
    # Check for remaining ASCII art boxes
    ascii_art = re.findall(r'```[^\n]*\n(.*?)```', content, re.DOTALL)
    ascii_found = [a[:40].replace('\n', ' ') for a in ascii_art if any(c in a for c in ['┌', '├', '└', '│', '──►', '───', '==>'])]
    
    print(f"\nFile: {rel_path}")
    print(f"  Imports: {imports}")
    print(f"  JSX Tags: {tags}")
    if ascii_found:
        print(f"  ⚠️ Remaining ASCII Art ({len(ascii_found)}): {ascii_found[:2]}")

print("\n=== KAFKA REACT DIAGRAM COMPONENTS AUDIT ===")
for f in sorted(os.listdir(components_dir)):
    if f.startswith('Kafka') and f.endswith('.tsx'):
        comp_path = os.path.join(components_dir, f)
        with open(comp_path, 'r', encoding='utf-8') as file:
            c_text = file.read()
        lines = len(c_text.splitlines())
        has_svg = '<svg' in c_text or '<path' in c_text
        has_interactive = 'useState' in c_text
        print(f"Component: {f} | Lines: {lines} | Interactive: {has_interactive} | Has SVG/Visuals: {has_svg}")
