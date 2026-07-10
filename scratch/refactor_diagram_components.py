import os
import re

def refactor():
    workspace = "/Users/lukhuong/Desktop/docusaurus-knowledge-base-template"
    
    files_map = {
        "src/components/CircuitBreakerDiagram.tsx": "src/components/CircuitBreakerDiagram.module.css",
        "src/components/JVMMemoryDiagram.tsx": "src/components/JVMMemoryDiagram.module.css",
        "src/components/JVMArchitectureDiagram.tsx": "src/components/JVMArchitectureDiagram.module.css",
        "src/components/ObjectLayoutDiagram.tsx": "src/components/ObjectLayoutDiagram.module.css",
        "src/components/G1HeapDiagram.tsx": "src/components/G1HeapDiagram.module.css"
    }

    # 1. Update the TSX files to use global CSS class names for shared elements
    for tsx_rel, css_rel in files_map.items():
        tsx_path = os.path.join(workspace, tsx_rel)
        if not os.path.exists(tsx_path):
            continue
            
        with open(tsx_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Replace base wrapper classes
        content = content.replace("styles.diagramContainer", '"interactive-diagram-container"')
        content = content.replace("styles.svgWrapper", '"interactive-diagram-svg-wrapper"')
        content = content.replace("styles.svg", '"interactive-diagram-svg"')
        content = content.replace("styles.gridBg", '"interactive-diagram-grid-bg"')
        content = content.replace("styles.detailsCard", '"interactive-diagram-details-card"')
        content = content.replace("styles.cardHeader", '"interactive-diagram-card-header"')
        content = content.replace("styles.helperText", '"interactive-diagram-helper-text"')
        content = content.replace("styles.cardIndicator", '"interactive-diagram-indicator-dot"')
        content = content.replace("styles.pulseDot", '"interactive-diagram-pulse-dot"')
        content = content.replace("styles.flowingDot", '"interactive-diagram-flowing-dot"')
        
        # Replace color states
        content = content.replace("styles.detailsGreen", '"details-green"')
        content = content.replace("styles.detailsYellow", '"details-yellow"')
        content = content.replace("styles.detailsRed", '"details-red"')
        content = content.replace("styles.detailsPurple", '"details-purple"')
        content = content.replace("styles.detailsCyan", '"details-cyan"')
        content = content.replace("styles.detailsBlue", '"details-blue"')
        content = content.replace("styles.detailsGray", '"details-gray"')
        
        content = content.replace("styles.cardIndicatorGreen", '"card-indicator-green"')
        content = content.replace("styles.cardIndicatorYellow", '"card-indicator-yellow"')
        content = content.replace("styles.cardIndicatorRed", '"card-indicator-red"')
        content = content.replace("styles.cardIndicatorPurple", '"card-indicator-purple"')
        content = content.replace("styles.cardIndicatorCyan", '"card-indicator-cyan"')
        content = content.replace("styles.cardIndicatorBlue", '"card-indicator-blue"')
        content = content.replace("styles.cardIndicatorGray", '"card-indicator-gray"')
        
        content = content.replace("styles.nodeActiveGreen", '"node-active-green"')
        content = content.replace("styles.nodeActiveYellow", '"node-active-yellow"')
        content = content.replace("styles.nodeActiveRed", '"node-active-red"')
        content = content.replace("styles.nodeActivePurple", '"node-active-purple"')
        content = content.replace("styles.nodeActiveCyan", '"node-active-cyan"')
        content = content.replace("styles.nodeActiveBlue", '"node-active-blue"')
        content = content.replace("styles.nodeActiveGray", '"node-active-gray"')
        
        with open(tsx_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Refactored TSX component: {tsx_rel}")

    # 2. Update CSS modules to delete the duplicate visual declarations
    for tsx_rel, css_rel in files_map.items():
        css_path = os.path.join(workspace, css_rel)
        if not os.path.exists(css_path):
            continue
            
        with open(css_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # We can clean up standard duplicated sections using regex or direct search
        patterns_to_remove = [
            # Base layouts
            r"\.diagramContainer\s*\{[^}]*\}",
            r"\.svgWrapper\s*\{[^}]*\}",
            r"\.svg\s*\{[^}]*\}",
            r"\.gridBg\s*\{[^}]*\}",
            r"\.detailsCard\s*\{[^}]*\}",
            r"\.cardHeader\s*\{[^}]*\}",
            r"\.cardHeader\s+h3\s*\{[^}]*\}",
            r"\.helperText\s*\{[^}]*\}",
            r"\.cardIndicator\s*\{[^}]*\}",
            
            # Nodes active states
            r"\.nodeActiveGreen\s*\{[^}]*\}",
            r"\.nodeActiveRed\s*\{[^}]*\}",
            r"\.nodeActiveYellow\s*\{[^}]*\}",
            r"\.nodeActivePurple\s*\{[^}]*\}",
            r"\.nodeActiveCyan\s*\{[^}]*\}",
            r"\.nodeActiveBlue\s*\{[^}]*\}",
            r"\.nodeActiveGray\s*\{[^}]*\}",
            
            # Animations
            r"\.pulseDot\s*\{[^}]*\}",
            r"\.flowingDot\s*\{[^}]*\}",
            r"@keyframes\s+pulse\s*\{[^}]*\}",
            r"@keyframes\s+blink\s*\{[^}]*\}",
            r"@keyframes\s+glowParticle\s*\{[^}]*\}",
            
            # Sub-elements
            r"\.detailsGreen\s+h3\s*\{[^}]*\}",
            r"\.detailsRed\s+h3\s*\{[^}]*\}",
            r"\.detailsYellow\s+h3\s*\{[^}]*\}",
            r"\.detailsPurple\s+h3\s*\{[^}]*\}",
            r"\.detailsCyan\s+h3\s*\{[^}]*\}",
            r"\.detailsBlue\s+h3\s*\{[^}]*\}",
            r"\.detailsGray\s+h3\s*\{[^}]*\}",
            
            r"\.cardIndicatorGreen\s*\{[^}]*\}",
            r"\.cardIndicatorRed\s*\{[^}]*\}",
            r"\.cardIndicatorYellow\s*\{[^}]*\}",
            r"\.cardIndicatorPurple\s*\{[^}]*\}",
            r"\.cardIndicatorCyan\s*\{[^}]*\}",
            r"\.cardIndicatorBlue\s*\{[^}]*\}",
            r"\.cardIndicatorGray\s*\{[^}]*\}",
            
            # Light mode overrides if any
            r"\[data-theme=\"light\"\]\s+\.svgWrapper\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.diagramContainer\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.detailsCard\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.cardHeader\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.helperText\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.detailsCard\s+p\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.detailsCard\s+li\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.detailsCard\s+li\s+strong\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.detailsGreen\s+h3\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.cardIndicatorGreen\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.detailsRed\s+h3\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.cardIndicatorRed\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.detailsYellow\s+h3\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.cardIndicatorYellow\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.detailsPurple\s+h3\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.cardIndicatorPurple\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.detailsCyan\s+h3\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.cardIndicatorCyan\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.detailsBlue\s+h3\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.cardIndicatorBlue\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.detailsGray\s+h3\s*\{[^}]*\}",
            r"\[data-theme=\"light\"\]\s+\.cardIndicatorGray\s*\{[^}]*\}",
        ]
        
        for pattern in patterns_to_remove:
            content = re.sub(pattern, "", content)
            
        # Clean up double newlines
        content = re.sub(r"\n\s*\n\s*\n", "\n\n", content)
        
        with open(css_path, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\n")
        print(f"Cleaned up CSS module: {css_rel}")

if __name__ == "__main__":
    refactor()
