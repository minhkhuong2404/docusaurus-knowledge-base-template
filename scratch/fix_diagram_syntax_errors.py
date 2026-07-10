import os
import subprocess

def fix_syntax_errors():
    workspace = "/Users/lukhuong/Desktop/docusaurus-knowledge-base-template"
    
    # 1. Restore original files using git checkout
    tsx_files = [
        "src/components/CircuitBreakerDiagram.tsx",
        "src/components/JVMMemoryDiagram.tsx",
        "src/components/JVMArchitectureDiagram.tsx",
        "src/components/ObjectLayoutDiagram.tsx",
        "src/components/G1HeapDiagram.tsx"
    ]
    
    print("Reverting files via git checkout...")
    for f in tsx_files:
        subprocess.run(["git", "checkout", os.path.join(workspace, f)])
        
    # 2. Re-apply class replacements in order of longest string first
    # This prevents 'styles.cardIndicator' from partially matching 'styles.cardIndicatorGreen'
    replacements_in_order = [
        # Base wrappers (distinct words)
        ("styles.diagramContainer", '"interactive-diagram-container"'),
        ("styles.svgWrapper", '"interactive-diagram-svg-wrapper"'),
        ("styles.svg", '"interactive-diagram-svg"'),
        ("styles.gridBg", '"interactive-diagram-grid-bg"'),
        ("styles.detailsCard", '"interactive-diagram-details-card"'),
        ("styles.cardHeader", '"interactive-diagram-card-header"'),
        ("styles.helperText", '"interactive-diagram-helper-text"'),
        
        # Specific color states (longest ones first)
        ("styles.cardIndicatorGreen", '"card-indicator-green"'),
        ("styles.cardIndicatorYellow", '"card-indicator-yellow"'),
        ("styles.cardIndicatorPurple", '"card-indicator-purple"'),
        ("styles.cardIndicatorCyan", '"card-indicator-cyan"'),
        ("styles.cardIndicatorBlue", '"card-indicator-blue"'),
        ("styles.cardIndicatorGray", '"card-indicator-gray"'),
        ("styles.cardIndicatorRed", '"card-indicator-red"'),
        
        # Node active states
        ("styles.nodeActiveGreen", '"node-active-green"'),
        ("styles.nodeActiveYellow", '"node-active-yellow"'),
        ("styles.nodeActivePurple", '"node-active-purple"'),
        ("styles.nodeActiveCyan", '"node-active-cyan"'),
        ("styles.nodeActiveBlue", '"node-active-blue"'),
        ("styles.nodeActiveGray", '"node-active-gray"'),
        ("styles.nodeActiveRed", '"node-active-red"'),
        
        # Details colors
        ("styles.detailsGreen", '"details-green"'),
        ("styles.detailsYellow", '"details-yellow"'),
        ("styles.detailsPurple", '"details-purple"'),
        ("styles.detailsCyan", '"details-cyan"'),
        ("styles.detailsBlue", '"details-blue"'),
        ("styles.detailsGray", '"details-gray"'),
        ("styles.detailsRed", '"details-red"'),
        
        # Animation classes
        ("styles.pulseDot", '"interactive-diagram-pulse-dot"'),
        ("styles.flowingDot", '"interactive-diagram-flowing-dot"'),
        
        # Base dots (short match)
        ("styles.cardIndicator", '"interactive-diagram-indicator-dot"'),
    ]
    
    for rel_path in tsx_files:
        file_path = os.path.join(workspace, rel_path)
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        original_len = len(content)
        
        # First do the span tag replacement to remove unicode dot '●' and use self-closing span
        # CircuitBreakerDiagram.tsx manual spans
        content = content.replace(
            '<span className={styles.cardIndicatorGreen}>●</span>',
            '<span className={`${"interactive-diagram-indicator-dot"} ${styles.cardIndicatorGreen}`} />'
        )
        content = content.replace(
            '<span className={styles.cardIndicatorRed}>●</span>',
            '<span className={`${"interactive-diagram-indicator-dot"} ${styles.cardIndicatorRed}`} />'
        )
        content = content.replace(
            '<span className={styles.cardIndicatorYellow}>●</span>',
            '<span className={`${"interactive-diagram-indicator-dot"} ${styles.cardIndicatorYellow}`} />'
        )
        
        # Dynamic ternary spans
        content = content.replace(
            """          <span className={
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'yellow' ? styles.cardIndicatorYellow : selectedData.type === 'red' ? styles.cardIndicatorRed : styles.cardIndicatorRed
          }>●</span>""",
            """          <span className={`${"interactive-diagram-indicator-dot"} ${
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'yellow' ? styles.cardIndicatorYellow : selectedData.type === 'red' ? styles.cardIndicatorRed : styles.cardIndicatorRed
          }`} />"""
        )
        
        content = content.replace(
            """          <span className={
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'purple' ? styles.cardIndicatorPurple : selectedData.type === 'cyan' ? styles.cardIndicatorCyan
          }>●</span>""",
            """          <span className={`${"interactive-diagram-indicator-dot"} ${
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'purple' ? styles.cardIndicatorPurple : selectedData.type === 'cyan' ? styles.cardIndicatorCyan
          }`} />"""
        )
        
        content = content.replace(
            """          <span className={
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'purple' ? styles.cardIndicatorPurple : selectedData.type === 'gray' ? styles.cardIndicatorGray : styles.cardIndicatorCyan
          }>●</span>""",
            """          <span className={`${"interactive-diagram-indicator-dot"} ${
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'purple' ? styles.cardIndicatorPurple : selectedData.type === 'gray' ? styles.cardIndicatorGray : styles.cardIndicatorCyan
          }`} />"""
        )
        
        content = content.replace(
            """          <span className={
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'blue' ? styles.cardIndicatorBlue : selectedData.type === 'purple' ? styles.cardIndicatorPurple : selectedData.type === 'yellow' ? styles.cardIndicatorYellow : selectedData.type === 'gray' ? styles.cardIndicatorGray
          }>●</span>""",
            """          <span className={`${"interactive-diagram-indicator-dot"} ${
            selectedData.type === 'green' ? styles.cardIndicatorGreen : selectedData.type === 'blue' ? styles.cardIndicatorBlue : selectedData.type === 'purple' ? styles.cardIndicatorPurple : selectedData.type === 'yellow' ? styles.cardIndicatorYellow : selectedData.type === 'gray' ? styles.cardIndicatorGray
          }`} />"""
        )
        
        # Apply standard replacements
        for target, replacement in replacements_in_order:
            content = content.replace(target, replacement)
            
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
            
        print(f"Correctly processed: {rel_path} (length: {original_len} -> {len(content)})")

if __name__ == "__main__":
    fix_syntax_errors()
