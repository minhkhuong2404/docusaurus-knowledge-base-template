import os
import re

def scan_mermaid_diagrams():
    workspace_root = "/Users/lukhuong/Desktop/docusaurus-knowledge-base-template"
    docs_dir = os.path.join(workspace_root, "docs")
    
    diagrams = []
    
    # Regular expression to match mermaid codeblocks and capture their diagram type
    mermaid_re = re.compile(r"```mermaid\s*\n\s*([^\n]+)", re.IGNORECASE)
    
    for root, dirs, files in os.walk(docs_dir):
        # Exclude build or hidden directories
        if any(ignored in root for ignored in [".docusaurus", "node_modules", "build"]):
            continue
            
        for file in files:
            if file.endswith(".md") or file.endswith(".mdx"):
                file_path = os.path.join(root, file)
                
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    
                lines = content.splitlines()
                
                # Track headings to provide context
                current_heading = "Top of Document"
                
                for idx, line in enumerate(lines):
                    if line.startswith("#"):
                        current_heading = line.strip()
                        
                    if line.strip().startswith("```mermaid"):
                        # Get diagram type
                        diagram_type = "unknown"
                        if idx + 1 < len(lines):
                            diagram_type = lines[idx + 1].strip()
                        
                        relative_path = os.path.relpath(file_path, workspace_root)
                        diagrams.append({
                            "file": relative_path,
                            "line": idx + 1,
                            "heading": current_heading,
                            "type": diagram_type
                        })
                        
    # Write to a markdown artifact
    artifact_path = "/Users/lukhuong/.gemini/antigravity-ide/brain/35253077-adf8-4de0-9f14-ee1e2942d1fe/mermaid_diagrams_research.md"
    
    with open(artifact_path, "w", encoding="utf-8") as out:
        out.write("# Research - Mermaid Diagrams Inventory\n\n")
        out.write(f"Scanned all documentation under `/docs`. Found **{len(diagrams)}** total Mermaid diagrams.\n\n")
        
        out.write("## Diagrams List\n\n")
        out.write("| File | Line | Nearest Heading Context | Diagram Type |\n")
        out.write("| --- | --- | --- | --- |\n")
        
        for d in sorted(diagrams, key=lambda x: (x["file"], x["line"])):
            # Make clickable local links
            file_link = f"[{os.path.basename(d['file'])}](file://{os.path.join(workspace_root, d['file'])}#L{d['line']})"
            out.write(f"| {file_link} | {d['line']} | `{d['heading']}` | `{d['type']}` |\n")
            
    print(f"Successfully compiled inventory for {len(diagrams)} diagrams in {artifact_path}")

if __name__ == "__main__":
    scan_mermaid_diagrams()
