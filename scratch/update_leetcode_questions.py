import os
import re
import csv
import glob
import subprocess

def capitalize_company_name(name):
    # e.g., 'two-sigma' -> 'Two Sigma'
    # '1kosmos' -> '1Kosmos'
    # '6sense' -> '6Sense'
    # 'at-t' -> 'At T'
    parts = re.split(r'[- ]', name)
    new_parts = []
    for part in parts:
        if not part:
            continue
        match = re.match(r'^(\d+)([a-zA-Z])(.*)$', part)
        if match:
            part = match.group(1) + match.group(2).upper() + match.group(3)
        else:
            if part.lower() in ('ai', 'ui', 'io', 'db', 'it', 'tcs', 'lti', 'adp', 'aon', 'kpmg', 'kpit', 'ukg', 'ust', 'vk', 'wix', 'zoox', 'zs'):
                part = part.upper()
            else:
                part = part.capitalize()
        new_parts.append(part)
    return ' '.join(new_parts)

def main():
    repo_dir = "/Users/lukhuong/Desktop/leetcode-companywise-interview-questions"
    workspace_dir = "/Users/lukhuong/Desktop/docusaurus-knowledge-base-template"
    leetcode_dir = os.path.join(workspace_dir, "docs/technical-knowledge/dsa/leetcode-companywise")

    # 1. Pull latest changes from cloned repo
    if os.path.exists(repo_dir):
        print(f"--- Pulling latest changes in {repo_dir} ---")
        try:
            branch = subprocess.check_output(["git", "-C", repo_dir, "rev-parse", "--abbrev-ref", "HEAD"]).decode().strip()
            print(f"Detected branch: {branch}")
            subprocess.check_call(["git", "-C", repo_dir, "pull", "origin", branch])
            print("Successfully pulled repository changes.")
        except Exception as e:
            print(f"Warning: Failed to pull git repo: {e}")
    else:
        print(f"Error: Cloned repository not found at {repo_dir}")
        return

    # 2. Extract existing titles to preserve capitalization
    print("--- Extracting existing company titles ---")
    company_titles = {}
    md_files = glob.glob(os.path.join(leetcode_dir, "**/*.md"), recursive=True)
    for filepath in md_files:
        filename = os.path.basename(filepath)
        company_id = filename[:-3]  # Strip '.md'
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                first_line = f.readline().strip()
                match = re.match(r'^#\s+(.+?)\s+LeetCode\s+Questions$', first_line, re.IGNORECASE)
                if match:
                    company_titles[company_id] = match.group(1)
        except Exception as e:
            print(f"Could not read {filepath}: {e}")

    print(f"Found {len(company_titles)} existing companies in markdown files.")

    # 3. Generate updated markdown files
    print("--- Generating updated markdown files from CSVs ---")
    generated_files = set()
    
    # Iterate through cloned repo to find directories with all.csv
    for company_id in sorted(os.listdir(repo_dir)):
        company_path = os.path.join(repo_dir, company_id)
        if not os.path.isdir(company_path):
            continue
        csv_file = os.path.join(company_path, "all.csv")
        if not os.path.exists(csv_file):
            continue

        # Get title
        title = company_titles.get(company_id)
        if not title:
            title = capitalize_company_name(company_id)

        # Determine subfolder
        first_char = company_id[0]
        subfolder = "0-9" if first_char.isdigit() else first_char.upper()
        
        # Ensure subfolder exists
        subfolder_path = os.path.join(leetcode_dir, subfolder)
        os.makedirs(subfolder_path, exist_ok=True)

        # Ensure _category_.json exists for the subfolder with generated-index link
        category_json_path = os.path.join(subfolder_path, "_category_.json")
        category_content = f"""{{
  "label": "{subfolder}",
  "link": {{
    "type": "generated-index",
    "description": "LeetCode company-wise questions starting with {subfolder}"
  }}
}}
"""
        with open(category_json_path, 'w', encoding='utf-8') as cf:
            cf.write(category_content)

        # Read CSV and build markdown table
        rows = []
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                header = next(reader, None)  # Skip header
                for row in reader:
                    if len(row) >= 6:
                        # id, url, title, difficulty, acceptance, frequency
                        rows.append(row[:6])
        except Exception as e:
            print(f"Error reading CSV for {company_id}: {e}")
            continue

        # Format markdown content
        md_content = f"# {title} LeetCode Questions\n\n"
        md_content += "| ID | URL | Title | Difficulty | Acceptance % | Frequency % |\n"
        md_content += "|---|---|---|---|---|---|\n"
        for r in rows:
            md_content += f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} |\n"
        md_content += "\n"

        target_file = os.path.join(subfolder_path, f"{company_id}.md")
        try:
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write(md_content)
            # Store relative path for cleanup tracking
            rel_path = os.path.join(subfolder, f"{company_id}.md")
            generated_files.add(rel_path)
        except Exception as e:
            print(f"Error writing markdown for {company_id}: {e}")

    # 4. Clean up any company markdown files not present in the new set
    print("--- Cleaning up obsolete markdown files ---")
    current_md_files = glob.glob(os.path.join(leetcode_dir, "**/*.md"), recursive=True)
    deleted_count = 0
    for filepath in current_md_files:
        # Determine relative path from leetcode_dir
        rel_path = os.path.relpath(filepath, leetcode_dir)
        if rel_path == "overview.md":
            continue
        if rel_path not in generated_files:
            try:
                os.remove(filepath)
                print(f"Deleted obsolete file: {rel_path}")
                deleted_count += 1
            except Exception as e:
                print(f"Error deleting file {filepath}: {e}")

    print(f"Done! Generated {len(generated_files)} files. Deleted {deleted_count} obsolete files.")

if __name__ == "__main__":
    main()
