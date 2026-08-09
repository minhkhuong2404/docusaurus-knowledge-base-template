import os
import re

devops_dir = '/Users/lukhuong/Desktop/docusaurus-knowledge-base-template/docs/technical-knowledge/devops'
components_dir = '/Users/lukhuong/Desktop/docusaurus-knowledge-base-template/src/components'

print("=== DEVOPS DOCUMENTATION FILES AUDIT ===")
md_files = []
for root, dirs, files in os.walk(devops_dir):
    for f in files:
        if f.endswith('.md') or f.endswith('.mdx'):
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, devops_dir)
            md_files.append((rel_path, full_path))

for rel_path, full_path in sorted(md_files):
    with open(full_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    imports = re.findall(r'import\s+([A-Za-z0-9_]+)\s+from', content)
    tags = re.findall(r'<([A-Z][A-Za-z0-9]+)[^/>]*/?>', content)
    
    # Find diagram tags placed directly under top-level H1
    lines = content.splitlines()
    h1_line = -1
    top_level_tags = []
    for idx, line in enumerate(lines):
        if line.startswith('# ') and h1_line == -1:
            h1_line = idx
        elif h1_line != -1 and (line.startswith('<Vm') or line.startswith('<Docker') or line.startswith('<Kubernetes') or line.startswith('<GitOps') or line.startswith('<DevOps')) and idx < h1_line + 6:
            top_level_tags.append((idx + 1, line.strip()))

    print(f"\nFile: {rel_path}")
    print(f"  Imports: {imports}")
    print(f"  JSX Tags: {tags}")
    if top_level_tags:
        print(f"  ⚠️ Top-level H1 Diagram Placement: {top_level_tags}")

print("\n=== DEVOPS REACT DIAGRAM COMPONENTS AUDIT ===")
for f in sorted(os.listdir(components_dir)):
    if any(f.startswith(prefix) for prefix in ['Vm', 'Docker', 'Kubernetes', 'GitOps', 'DevOps']) and f.endswith('.tsx'):
        comp_path = os.path.join(components_dir, f)
        with open(comp_path, 'r', encoding='utf-8') as file:
            c_text = file.read()
        lines = len(c_text.splitlines())
        has_svg = '<svg' in c_text or '<path' in c_text
        has_interactive = 'useState' in c_text
        print(f"Component: {f} | Lines: {lines} | Interactive: {has_interactive} | Has SVG/Visuals: {has_svg}")
