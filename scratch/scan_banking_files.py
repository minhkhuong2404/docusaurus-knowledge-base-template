import os
import re

banking_dir = '/Users/lukhuong/Desktop/docusaurus-knowledge-base-template/docs/technical-knowledge/banking'

files_with_ascii = []
files_without_diagram = []

for filename in os.listdir(banking_dir):
    if filename.endswith('.md'):
        filepath = os.path.join(banking_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        has_diagram_import = 'import ' in content and 'Diagram' in content
        
        # Check for ASCII diagrams or code blocks containing tree / flow arrows
        has_ascii = False
        code_blocks = re.findall(r'```(.*?)```', content, re.DOTALL)
        for cb in code_blocks:
            if any(char in cb for char in ['┌', '┬', '┐', '├', '─', '┼', '└', '┴', '┘', '│', '►', '◄', '──', '-->', '==>']):
                has_ascii = True
                break

        if has_ascii:
            files_with_ascii.append((filename, has_diagram_import))
        elif not has_diagram_import:
            files_without_diagram.append(filename)

print("--- FILES WITH REMAINING ASCII DIAGRAMS/FLOWS ---")
for f, imported in files_with_ascii:
    print(f"File: {f} | Diagram Imported: {imported}")

print("\nTotal files with ASCII:", len(files_with_ascii))
