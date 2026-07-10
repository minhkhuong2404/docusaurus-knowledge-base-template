---
name: design-diagrams
description: Design and implement custom interactive React SVG components and flowing arrow animations for diagrams in Docusaurus
---

# Skill: Design Diagrams (Interactive SVG & Flowing Arrows)

This skill provides the instructions for designing, implementing, and integrating interactive React SVG diagram components and global flowing connection effects in the repository.

## Triggering the Skill
Use this skill when:
- Creating new state machine or architecture diagrams in the documentation.
- Updating existing static Mermaid diagrams to custom interactive SVG components.
- Modifying connection lines or arrowhead styles.

## Execution Steps

### 1. Designing a Custom Interactive SVG Component
When a static diagram needs custom particle-flow animations or state-specific detail overlays:
1. Create a React component file in `src/components/` (e.g. `src/components/MyCustomDiagram.tsx`).
2. Style container wrappers using central CSS indicators (e.g., `.interactive-diagram-svg-wrapper.interactive-diagram-grid-bg` for dark radial canvas).
3. Define the SVG viewBox (e.g., `0 0 680 230`) to scale seamlessly across devices.
4. Add interactive state tracking in React:
   ```typescript
   const [activeState, setActiveState] = useState<string>('DEFAULT');
   ```
5. Implement flowing dashed paths using `.interactive-diagram-flowing-path` class (from `src/css/diagrams.css`).
6. Append `<circle>` elements containing `<animateMotion>` linked to path IDs (`<mpath href="#path-id" />`) to render physical moving particle dots:
   ```xml
   {activeState === 'ACTIVE' && (
     <circle r="3" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
       <animateMotion dur="1s" repeatCount="indefinite">
         <mpath href="#path-id" />
       </animateMotion>
     </circle>
   )}
   ```
7. **Ternary Operator Code Safety**: Always resolve all paths in nested ternaries cleanly (e.g. `x ? a : y ? b : c` rather than compiling with duplicate color bounds) to guarantee Rspack compatibility.

### 2. Global Mermaid Flowing Arrows
All standard flowchart Mermaid diagrams automatically inherit the background solid conduit and flowing dashed overlay. If you need to adjust or extend this globally:
1. Open [index.tsx](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/src/theme/Mermaid/index.tsx) and inspect the `useMemo` block replicating `<path>` elements into `.path-bg` and `.path`.
2. Update the custom classes and keyframe definitions in [custom.css](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/src/css/custom.css).
3. Ensure arrowheads use SVG 2 `context-fill` / `context-stroke` properties to inherit parent hover styling changes dynamically:
   ```css
   [class*="mermaidSvg"] svg marker path {
     fill: context-fill !important;
     stroke: context-stroke !important;
   }
   ```

### 3. Integrating the Component into Markdown
Import and render the React component inside MD/MDX files:
```markdown
import MyCustomDiagram from '@site/src/components/MyCustomDiagram';

<MyCustomDiagram />
```

### 4. Scanning the Repository for Diagrams
To locate, analyze, or audit diagrams in the workspace:
1. Run the scanning script `scratch/scan_diagrams.py` inside the workspace:
   - Command: `python scratch/scan_diagrams.py`
   - This script automatically crawls the `docs/` directory, compiles a count of both static Mermaid blocks and interactive React diagram components, and generates a structured report at `scratch/diagrams_inventory.md`.
2. Review the resulting `scratch/diagrams_inventory.md` file to see which files contain static diagrams that can be upgraded.
