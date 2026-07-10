import os

def fix_dots():
    workspace = "/Users/lukhuong/Desktop/docusaurus-knowledge-base-template"
    
    # 1. Update the CSS files to style the dot indicator properly
    css_files = [
        "src/components/CircuitBreakerDiagram.module.css",
        "src/components/JVMMemoryDiagram.module.css",
        "src/components/JVMArchitectureDiagram.module.css",
        "src/components/ObjectLayoutDiagram.module.css",
        "src/components/G1HeapDiagram.module.css"
    ]
    
    for rel_path in css_files:
        file_path = os.path.join(workspace, rel_path)
        if not os.path.exists(file_path):
            print(f"Skipping CSS {rel_path} - not found")
            continue
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Add the .cardIndicator base styles
        base_styles = """
.cardIndicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
  background-color: currentColor;
}
"""
        # Append base styles if not present
        if ".cardIndicator {" not in content:
            content += base_styles
            
        # Remove the font-size limit from specific indicator classes since it's now a CSS dot
        content = content.replace("font-size: 1.2rem;", "")
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated CSS: {rel_path}")

    # 2. Update TSX files to use <span className={`${styles.cardIndicator} ${styles.cardIndicatorColor}`} /> instead of <span>●</span>
    tsx_files = [
        "src/components/CircuitBreakerDiagram.tsx",
        "src/components/JVMMemoryDiagram.tsx",
        "src/components/JVMArchitectureDiagram.tsx",
        "src/components/ObjectLayoutDiagram.tsx",
        "src/components/G1HeapDiagram.tsx"
    ]
    
    for rel_path in tsx_files:
        file_path = os.path.join(workspace, rel_path)
        if not os.path.exists(file_path):
            print(f"Skipping TSX {rel_path} - not found")
            continue
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Replace the indicator tags in JSX
        # Look for the pattern: <span className={...}>●</span>
        # We replace it with: <span className={`${styles.cardIndicator} ${...}`} />
        
        # Replace in CircuitBreakerDiagram.tsx
        content = content.replace(
            """          <span className={
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'yellow' ? styles.cardIndicatorYellow : styles.cardIndicatorRed
          }>●</span>""",
            """          <span className={`${styles.cardIndicator} ${
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'yellow' ? styles.cardIndicatorYellow : styles.cardIndicatorRed
          }`} />"""
        )
        
        # Replace in JVMMemoryDiagram.tsx
        content = content.replace(
            """          <span className={
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'purple' ? styles.cardIndicatorPurple : styles.cardIndicatorCyan
          }>●</span>""",
            """          <span className={`${styles.cardIndicator} ${
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'purple' ? styles.cardIndicatorPurple : styles.cardIndicatorCyan
          }`} />"""
        )
        
        # Replace in JVMArchitectureDiagram.tsx
        content = content.replace(
            """          <span className={
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'purple' ? styles.cardIndicatorPurple : styles.cardIndicatorCyan
          }>●</span>""",
            """          <span className={`${styles.cardIndicator} ${
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'purple' ? styles.cardIndicatorPurple : styles.cardIndicatorCyan
          }`} />"""
        )
        
        # Replace in ObjectLayoutDiagram.tsx
        content = content.replace(
            """          <span className={
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'purple' ? styles.cardIndicatorPurple : selectedData.type === 'gray' ? styles.cardIndicatorGray : styles.cardIndicatorCyan
          }>●</span>""",
            """          <span className={`${styles.cardIndicator} ${
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'purple' ? styles.cardIndicatorPurple : selectedData.type === 'gray' ? styles.cardIndicatorGray : styles.cardIndicatorCyan
          }`} />"""
        )
        # Also handle variants where gray is present or not
        content = content.replace(
            """          <span className={
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'purple' ? styles.cardIndicatorPurple : selectedData.type === 'gray' ? styles.cardIndicatorGray : styles.cardIndicatorGray
          }>●</span>""",
            """          <span className={`${styles.cardIndicator} ${
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'purple' ? styles.cardIndicatorPurple : selectedData.type === 'gray' ? styles.cardIndicatorGray : styles.cardIndicatorGray
          }`} />"""
        )
        
        # Replace in G1HeapDiagram.tsx
        content = content.replace(
            """          <span className={
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'blue' ? styles.cardIndicatorBlue : selectedData.type === 'purple' ? styles.cardIndicatorPurple : selectedData.type === 'yellow' ? styles.cardIndicatorYellow : selectedData.type === 'gray' ? styles.cardIndicatorGray
          }>●</span>""",
            """          <span className={`${styles.cardIndicator} ${
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'blue' ? styles.cardIndicatorBlue : selectedData.type === 'purple' ? styles.cardIndicatorPurple : selectedData.type === 'yellow' ? styles.cardIndicatorYellow : selectedData.type === 'gray' ? styles.cardIndicatorGray
          }`} />"""
        )
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated TSX: {rel_path}")

if __name__ == "__main__":
    fix_dots()
