import os

def apply_flows():
    workspace = "/Users/lukhuong/Desktop/docusaurus-knowledge-base-template"
    
    # 1. Update JVMMemoryDiagram.tsx
    jvm_mem_path = os.path.join(workspace, "src/components/JVMMemoryDiagram.tsx")
    if os.path.exists(jvm_mem_path):
        with open(jvm_mem_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        content = content.replace(
            'className={styles.transitionPath}\n            />\n            {(activeSection === \'EDEN\' || activeSection === \'SURVIVOR\') && (',
            'className={`${styles.transitionPath} ${activeSection === \'EDEN\' || activeSection === \'SURVIVOR\' ? \'interactive-diagram-flowing-path\' : \'\'}`}\n            />\n            {(activeSection === \'EDEN\' || activeSection === \'SURVIVOR\') && ('
        )
        content = content.replace(
            'className={styles.transitionPath}\n            />\n            {(activeSection === \'SURVIVOR\') && (',
            'className={`${styles.transitionPath} ${activeSection === \'SURVIVOR\' ? \'interactive-diagram-flowing-path\' : \'\'}`}\n            />\n            {(activeSection === \'SURVIVOR\') && ('
        )
        content = content.replace(
            'className={styles.transitionPath}\n            />\n            {(activeSection === \'SURVIVOR\' || activeSection === \'OLD_GEN\') && (',
            'className={`${styles.transitionPath} ${activeSection === \'SURVIVOR\' || activeSection === \'OLD_GEN\' ? \'interactive-diagram-flowing-path\' : \'\'}`}\n            />\n            {(activeSection === \'SURVIVOR\' || activeSection === \'OLD_GEN\') && ('
        )
        content = content.replace(
            'className={styles.transitionPath}\n            />\n            {(activeSection === \'HUMONGOUS\' || activeSection === \'OLD_GEN\') && (',
            'className={`${styles.transitionPath} ${activeSection === \'HUMONGOUS\' || activeSection === \'OLD_GEN\' ? \'interactive-diagram-flowing-path\' : \'\'}`}\n            />\n            {(activeSection === \'HUMONGOUS\' || activeSection === \'OLD_GEN\') && ('
        )
        content = content.replace(
            'className={styles.transitionPath}\n            />\n            {(activeSection === \'METASPACE\' || activeSection === \'OLD_GEN\') && (',
            'className={`${styles.transitionPath} ${activeSection === \'METASPACE\' || activeSection === \'OLD_GEN\' ? \'interactive-diagram-flowing-path\' : \'\'}`}\n            />\n            {(activeSection === \'METASPACE\' || activeSection === \'OLD_GEN\') && ('
        )
        content = content.replace(
            'className={styles.transitionPath}\n            />\n            {(activeSection === \'VM_STACK\' || activeSection === \'NATIVE_STACK\' || activeSection === \'PC_REGISTER\' || activeSection === \'HEAP_DATA\') && (',
            'className={`${styles.transitionPath} ${activeSection === \'VM_STACK\' || activeSection === \'NATIVE_STACK\' || activeSection === \'PC_REGISTER\' || activeSection === \'HEAP_DATA\' ? \'interactive-diagram-flowing-path\' : \'\'}`}\n            />\n            {(activeSection === \'VM_STACK\' || activeSection === \'NATIVE_STACK\' || activeSection === \'PC_REGISTER\' || activeSection === \'HEAP_DATA\') && ('
        )
        
        with open(jvm_mem_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated JVMMemoryDiagram.tsx paths")

    # 2. Update JVMArchitectureDiagram.tsx
    jvm_arch_path = os.path.join(workspace, "src/components/JVMArchitectureDiagram.tsx")
    if os.path.exists(jvm_arch_path):
        with open(jvm_arch_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        content = content.replace(
            'className={styles.transitionPath}\n            />\n            {(activeEl === \'CLASS_LOADER\' || selectedData.type === \'green\' || selectedData.type === \'cyan\') && (',
            'className={`${styles.transitionPath} ${activeEl === \'CLASS_LOADER\' || selectedData.type === \'green\' || selectedData.type === \'cyan\' ? \'interactive-diagram-flowing-path\' : \'\'}`}\n            />\n            {(activeEl === \'CLASS_LOADER\' || selectedData.type === \'green\' || selectedData.type === \'cyan\') && ('
        )
        content = content.replace(
            'className={styles.transitionPath}\n            />\n            {(selectedData.type === \'green\' || selectedData.type === \'cyan\' || activeEl === \'INTERPRETER\' || activeEl === \'JIT_COMPILER\' || activeEl === \'GARBAGE_COLLECTOR\') && (',
            'className={`${styles.transitionPath} ${selectedData.type === \'green\' || selectedData.type === \'cyan\' || activeEl === \'INTERPRETER\' || activeEl === \'JIT_COMPILER\' || activeEl === \'GARBAGE_COLLECTOR\' ? \'interactive-diagram-flowing-path\' : \'\'}`}\n            />\n            {(selectedData.type === \'green\' || selectedData.type === \'cyan\' || activeEl === \'INTERPRETER\' || activeEl === \'JIT_COMPILER\' || activeEl === \'GARBAGE_COLLECTOR\') && ('
        )
        
        with open(jvm_arch_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated JVMArchitectureDiagram.tsx paths")

    # 3. Update ObjectLayoutDiagram.tsx
    obj_layout_path = os.path.join(workspace, "src/components/ObjectLayoutDiagram.tsx")
    if os.path.exists(obj_layout_path):
        with open(obj_layout_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        content = content.replace(
            'className={styles.transitionPath}\n            />\n            {(activeSegment === \'MARK_WORD\' || activeSegment === \'CLASS_POINTER\' || activeSegment === \'INSTANCE_DATA\') && (',
            'className={`${styles.transitionPath} ${activeSegment === \'MARK_WORD\' || activeSegment === \'CLASS_POINTER\' || activeSegment === \'INSTANCE_DATA\' ? \'interactive-diagram-flowing-path\' : \'\'}`}\n            />\n            {(activeSegment === \'MARK_WORD\' || activeSegment === \'CLASS_POINTER\' || activeSegment === \'INSTANCE_DATA\') && ('
        )
        content = content.replace(
            'className={styles.transitionPath}\n            />\n            {(activeSegment === \'INSTANCE_DATA\' || activeSegment === \'PADDING\') && (',
            'className={`${styles.transitionPath} ${activeSegment === \'INSTANCE_DATA\' || activeSegment === \'PADDING\' ? \'interactive-diagram-flowing-path\' : \'\'}`}\n            />\n            {(activeSegment === \'INSTANCE_DATA\' || activeSegment === \'PADDING\') && ('
        )
        
        with open(obj_layout_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated ObjectLayoutDiagram.tsx paths")

if __name__ == "__main__":
    apply_flows()
