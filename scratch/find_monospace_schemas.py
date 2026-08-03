import os
import re

docs_dir = '/Users/lukhuong/Desktop/docusaurus-knowledge-base-template/docs'

results = []

for root, dirs, files in os.walk(docs_dir):
    for f in files:
        if f.endswith('.md') or f.endswith('.mdx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
                
                # Check for headings or sections related to Schema, Monospace, Payload, Structure, Record Format, Packet Anatomy
                matches = re.findall(r'(#+.*(?:Schema|Monospace|Structure|Payload|Format|Inspector|Anatomy|Header).*?\n(?:.*?```.*?```)?)', content, re.IGNORECASE | re.DOTALL)
                
                # Look specifically for code blocks containing structural field definitions or ASCII table schemas
                code_blocks = re.findall(r'```[^\n]*\n(.*?)```', content, re.DOTALL)
                schema_blocks = []
                for cb in code_blocks:
                    if any(k in cb for k in ['Header', 'Body', 'Payload', 'Field', 'Offset', 'Tag', 'Magic', 'CRC', 'Bit', 'Byte', 'Length', 'Schema', 'Type']):
                        if len(cb.splitlines()) > 5:
                            schema_blocks.append(cb[:100].replace('\n', ' '))
                
                if matches or schema_blocks:
                    results.append((path.replace(docs_dir, ''), len(matches), len(schema_blocks)))

print(f"Total matching documentation files: {len(results)}")
for r in results[:35]:
    print(r)
