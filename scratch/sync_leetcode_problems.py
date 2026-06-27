import os
import re
import json

def parse_problems():
    base_dir = "docs/technical-knowledge/coding-interview-prep"
    problems = []
    
    # We walk all markdown files in the folder (excluding intro.md)
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.md') and file.lower() != 'intro.md':
                filepath = os.path.join(root, file)
                
                # Parse frontmatter to get topic title
                topic = ""
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                fm_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
                if fm_match:
                    fm_text = fm_match.group(1)
                    title_match = re.search(r'^title\s*:\s*([^\n]+)', fm_text, re.MULTILINE)
                    if title_match:
                        topic = title_match.group(1).strip().strip('"').strip("'")
                
                if not topic:
                    # Fallback to folder/file name
                    topic = os.path.basename(os.path.dirname(filepath)).replace('-', ' ').title()

                # Find difficulty headers and the tables below them
                lines = content.split('\n')
                current_difficulty = 'easy'
                for line in lines:
                    lower_line = line.lower()
                    if 'easy' in lower_line and ('###' in line or '##' in line):
                        current_difficulty = 'easy'
                    elif 'medium' in lower_line and ('###' in line or '##' in line):
                        current_difficulty = 'medium'
                    elif 'hard' in lower_line and ('###' in line or '##' in line):
                        current_difficulty = 'hard'
                    
                    # Match row: | # | [Name](URL) | Key Idea |
                    # e.g. | 1 | [Two Sum](https://leetcode.com/problems/two-sum/) | ... |
                    row_match = re.match(r'^\s*\|\s*([0-9a-zA-Z\-]+)\s*\|\s*\[([^\]]+)\]\((https?://leetcode\.com/problems/[^\)]+)\)\s*\*?\s*\|([^\|]+)\|', line)
                    if row_match:
                        pid = row_match.group(1).strip()
                        title = row_match.group(2).strip()
                        url = row_match.group(3).strip()
                        key_idea = row_match.group(4).strip()
                        
                        problems.append({
                            "id": pid,
                            "title": title,
                            "url": url,
                            "difficulty": current_difficulty,
                            "keyIdea": key_idea,
                            "topic": topic
                        })
                        
    return problems

def main():
    problems = parse_problems()
    print(f"Parsed {len(problems)} LeetCode problems from topic files.")

    # Sort problems by topic and then by ID
    problems.sort(key=lambda p: (p['topic'], p['id']))

    output_path = "src/data/leetcode-problems.ts"
    
    # Write TS file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("export interface LeetCodeProblem {\n")
        f.write("  id: string;\n")
        f.write("  title: string;\n")
        f.write("  url: string;\n")
        f.write("  difficulty: 'easy' | 'medium' | 'hard';\n")
        f.write("  keyIdea: string;\n")
        f.write("  topic: string;\n")
        f.write("}\n\n")
        f.write("export const leetcodeProblems: LeetCodeProblem[] = ")
        f.write(json.dumps(problems, indent=2))
        f.write(";\n")
        
    print(f"Successfully generated {output_path}")

if __name__ == "__main__":
    main()
