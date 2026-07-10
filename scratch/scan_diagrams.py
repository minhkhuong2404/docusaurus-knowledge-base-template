import os
import re

def scan_diagrams():
    docs_dir = "/Users/lukhuong/Desktop/docusaurus-knowledge-base-template/docs"
    output_file = "/Users/lukhuong/Desktop/docusaurus-knowledge-base-template/scratch/diagrams_inventory.md"
    
    mermaid_pattern = re.compile(r"```mermaid\s*\n(.*?)\n```", re.DOTALL)
    react_component_pattern = re.compile(r"<([A-Za-z0-9_]*Diagram)\s*/>")
    
    inventory = []
    
    for root, dirs, files in os.walk(docs_dir):
        for file in files:
            if file.endswith(".md") or file.endswith(".mdx"):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, docs_dir)
                
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    
                mermaids = mermaid_pattern.findall(content)
                react_components = react_component_pattern.findall(content)
                
                if mermaids or react_components:
                    inventory.append({
                        "file": rel_path,
                        "mermaid_count": len(mermaids),
                        "react_components": react_components,
                        "mermaid_details": [m.strip().split("\n")[0] for m in mermaids]
                    })
                    
    # Write report
    with open(output_file, "w", encoding="utf-8") as out:
        out.write("# Diagrams Inventory\n\n")
        out.write("This report lists all diagrams found in the documentation repository, categorized by file.\n\n")
        
        out.write("## Summary Metrics\n")
        total_files = len(inventory)
        total_mermaid = sum(item["mermaid_count"] for item in inventory)
        total_react = sum(len(item["react_components"]) for item in inventory)
        out.write(f"- **Total Files with Diagrams**: {total_files}\n")
        out.write(f"- **Total Static Mermaid Diagrams**: {total_mermaid}\n")
        out.write(f"- **Total Interactive React Diagrams**: {total_react}\n\n")
        
        out.write("## Detailed Inventory\n\n")
        for item in inventory:
            out.write(f"### 📄 [{item['file']}](file://{os.path.join(docs_dir, item['file'])})\n")
            if item["react_components"]:
                out.write("#### ⚡ Interactive React Components\n")
                for rc in item["react_components"]:
                    out.write(f"- `{rc}`\n")
            if item["mermaid_count"] > 0:
                out.write("#### 📊 Static Mermaid Diagrams\n")
                for detail in item["mermaid_details"]:
                    out.write(f"- type: `{detail}`\n")
            out.write("\n---\n\n")
            
    print(f"Diagram scanning complete. Inventory written to: {output_file}")

if __name__ == "__main__":
    scan_diagrams()
