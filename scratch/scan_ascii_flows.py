import os
import re

def scan_text_flows():
    workspace_root = "/Users/lukhuong/Desktop/docusaurus-knowledge-base-template"
    docs_dir = os.path.join(workspace_root, "docs")
    
    # Matches text code blocks: ```text or ``` with no language specified
    codeblock_re = re.compile(r"```(text)?\n([\s\S]*?)\n```", re.IGNORECASE)
    
    results = []
    
    for root, dirs, files in os.walk(docs_dir):
        if any(ignored in root for ignored in [".docusaurus", "node_modules", "build"]):
            continue
            
        for file in files:
            if file.endswith(".md") or file.endswith(".mdx"):
                file_path = os.path.join(root, file)
                
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Search all codeblocks in this file
                matches = list(codeblock_re.finditer(content))
                for match in matches:
                    lang = match.group(1) or "text/empty"
                    code_body = match.group(2)
                    
                    # Detect if it simulates a flow/diagram (contains arrows like ->, -->, =>, or curves like |)
                    # We look for arrows: -> or --> or => or <- or <-- or <=
                    if any(arrow in code_body for arrow in ["->", "-->", "=>", "<-", "<--", "<="]):
                        # Get some lines around it or line number
                        line_offset = content[:match.start()].count("\n") + 1
                        
                        relative_path = os.path.relpath(file_path, workspace_root)
                        results.append({
                            "file": relative_path,
                            "line": line_offset,
                            "content": code_body.strip(),
                            "lang": lang
                        })
                        
    print(f"Found {len(results)} candidate text flow diagrams.")
    
    # Save the scan list to artifact
    artifact_path = "/Users/lukhuong/.gemini/antigravity-ide/brain/35253077-adf8-4de0-9f14-ee1e2942d1fe/ascii_flows_scan.md"
    with open(artifact_path, "w", encoding="utf-8") as out:
        out.write("# Research - ASCII Flow Diagrams in Text Codeblocks\n\n")
        out.write(f"Found **{len(results)}** code blocks simulating flow using text/ASCII arrows.\n\n")
        out.write("| File | Line | Content Snippet |\n")
        out.write("| --- | --- | --- |\n")
        for r in sorted(results, key=lambda x: (x["file"], x["line"])):
            file_link = f"[{os.path.basename(r['file'])}](file://{os.path.join(workspace_root, r['file'])}#L{r['line']})"
            snippet = r["content"].replace("\n", " / ")[:80]
            out.write(f"| {file_link} | {r['line']} | `{snippet}` |\n")
            
    print(f"Report saved to {artifact_path}")

if __name__ == "__main__":
    scan_text_flows()
