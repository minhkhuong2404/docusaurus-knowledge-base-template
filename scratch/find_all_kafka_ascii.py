import os
import re

kafka_dir = '/Users/lukhuong/Desktop/docusaurus-knowledge-base-template/docs/technical-knowledge/kafka'

print("=== ALL UNLABELLED CODE BLOCKS & DIAGRAM TAGS IN KAFKA FOLDER ===")

for root, dirs, files in os.walk(kafka_dir):
    for f in files:
        if f.endswith('.md'):
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, kafka_dir)
            with open(full_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
            
            # Find diagram tags placed directly under top-level H1
            h1_line = -1
            top_level_tags = []
            for idx, line in enumerate(lines):
                if line.startswith('# ') and h1_line == -1:
                    h1_line = idx
                elif h1_line != -1 and line.startswith('<Kafka') and idx < h1_line + 5:
                    top_level_tags.append((idx + 1, line.strip()))
            
            # Find plain ``` code blocks
            plain_blocks = []
            in_code = False
            start_line = 0
            code_buf = []
            for idx, line in enumerate(lines):
                if line.strip() == '```':
                    if not in_code:
                        in_code = True
                        start_line = idx + 1
                        code_buf = []
                    else:
                        in_code = False
                        plain_blocks.append((start_line, "".join(code_buf[:5])))
            
            if top_level_tags or plain_blocks:
                print(f"\nFile: {rel_path}")
                if top_level_tags:
                    print(f"  ⚠️ Top-level H1 Diagram Placement: {top_level_tags}")
                if plain_blocks:
                    print(f"  ⚠️ Plain ``` Code Blocks count: {len(plain_blocks)}")
                    for sl, snippet in plain_blocks[:3]:
                        first_line = snippet.splitlines()[0] if snippet.splitlines() else ""
                        print(f"    Line {sl}: {first_line[:60]}")
