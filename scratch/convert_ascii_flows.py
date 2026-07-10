import os

def convert_files():
    workspace = "/Users/lukhuong/Desktop/docusaurus-knowledge-base-template"
    
    replacements = {
        "docs/technical-knowledge/system-design/database-per-service.md": [
            (
                "```text\nAPI Gateway / Composor\n  ├──► Fetch User Profile (User Service)\n  └──► Fetch Recent Orders (Order Service)\n  * Merge profiles and orders in code -> return aggregated JSON\n```",
                "```mermaid\nflowchart LR\n    GW[API Gateway / Composor] -->|Fetch User Profile| US[User Service]\n    GW -->|Fetch Recent Orders| OS[Order Service]\n    GW -.->|Merge & Return| JSON[Aggregated JSON]\n```"
            ),
            (
                "```text\nEvent Emitted ──► [ Message Broker ] ──► Read Projection Builder ──► [ Read-Optimized DB ]\n                                                                     (e.g., Elasticsearch)\n                                                                               ▲\n                                                                  Queries ─────┘\n```",
                "```mermaid\nflowchart LR\n    EE[Event Emitted] --> Sync[Message Broker]\n    Sync --> PB[Read Projection Builder]\n    PB --> RDB[(Read-Optimized DB<br/>Elasticsearch)]\n    Queries[Queries] --> RDB\n```"
            )
        ],
        "docs/technical-knowledge/banking/onus.md": [
            (
                "```text\nCustomer Channel\n  -> Payment API / Gateway\n  -> Validation (auth, limits, sanctions, fraud)\n  -> Internal Routing (on-us detected)\n  -> Debit Posting (payer)\n  -> Credit Posting (payee)\n  -> Confirmation / Notification\n```",
                "```mermaid\nflowchart TD\n    CC[Customer Channel] --> API[Payment API / Gateway]\n    API --> VAL[Validation<br/>auth, limits, sanctions, fraud]\n    VAL --> RT[Internal Routing<br/>on-us detected]\n    RT --> DP[Debit Posting<br/>payer]\n    DP --> CP[Credit Posting<br/>payee]\n    CP --> CONF[Confirmation / Notification]\n```"
            )
        ],
        "docs/technical-knowledge/banking/offus.md": [
            (
                "```text\nPayer Channel\n  -> Debtor Bank (validation, debit, route)\n  -> Clearing Network / Correspondent Chain\n  -> Creditor Bank (validation, credit)\n  -> Confirmation / status messages\n```",
                "```mermaid\nflowchart TD\n    PC[Payer Channel] --> DB[Debtor Bank<br/>validation, debit, route]\n    DB --> CN[Clearing Network / Correspondent Chain]\n    CN --> CB[Creditor Bank<br/>validation, credit]\n    CB --> CONF[Confirmation / status messages]\n```"
            )
        ],
        "docs/technical-knowledge/spring/spring-data-jpa.md": [
            (
                "```text\nRepository\n  -> CrudRepository\n  -> PagingAndSortingRepository\n  -> JpaRepository\n```",
                "```mermaid\nclassDiagram\n    direction BT\n    CrudRepository --|> Repository\n    PagingAndSortingRepository --|> CrudRepository\n    JpaRepository --|> PagingAndSortingRepository\n```"
            )
        ],
        "docs/technical-knowledge/system-design/kubernetes-networking.md": [
            (
                "```text\nRequest to Service IP (10.96.0.10:80)\n                │\n                ▼\n      Kernel Space (iptables rules programmed by kube-proxy)\n                │\n                ├─ (Rule matches VIP -> DNAT to Pod 1) ────► 10.244.1.5:8080 (Pod IP)\n                └─ (Rule matches VIP -> DNAT to Pod 2) ────► 10.244.2.8:8080 (Pod IP)\n```",
                "```mermaid\nflowchart TD\n    Req[Request to Service IP<br/>10.96.0.10:80] --> Kernel[Kernel Space<br/>iptables rules programmed by kube-proxy]\n    Kernel -->|DNAT to Pod 1| Pod1[Pod 1 IP<br/>10.244.1.5:8080]\n    Kernel -->|DNAT to Pod 2| Pod2[Pod 2 IP<br/>10.244.2.8:8080]\n```"
            )
        ],
        "docs/technical-knowledge/banking/pacs002.md": [
            (
                "```text\nSender bank sends pacs.008\n  -> Receiver validates message\n  -> Receiver returns pacs.002 status:\n       ACTC (accepted technical)\n       ACCP (accepted customer profile/process)\n       ACSP (accepted settlement in process)\n       ACSC (accepted settlement completed, where used)\n       RJCT (rejected)\n       PDNG (pending/manual review)\n```",
                "```mermaid\nflowchart TD\n    Snd[Sender bank sends pacs.008] --> Val[Receiver validates message]\n    Val --> Ret[Receiver returns pacs.002 status]\n    Ret --> ACTC[ACTC<br/>accepted technical]\n    Ret --> ACCP[ACCP<br/>accepted customer profile/process]\n    Ret --> ACSP[ACSP<br/>accepted settlement in process]\n    Ret --> ACSC[ACSC<br/>accepted settlement completed]\n    Ret --> RJCT[RJCT<br/>rejected]\n    Ret --> PDNG[PDNG<br/>pending/manual review]\n```"
            )
        ],
        "docs/technical-knowledge/banking/pacs008.md": [
            (
                "```text\nCustomer initiation (pain.001 / channel API)\n  -> Debtor bank validates and debits\n  -> Debtor bank sends pacs.008 off-us\n  -> Creditor bank receives and credits\n  -> Status/notifications follow (pacs.002, camt.054)\n```",
                "```mermaid\nflowchart TD\n    Init[Customer initiation<br/>pain.001 / channel API] --> Deb[Debtor bank validates and debits]\n    Deb --> Snd[Debtor bank sends pacs.008 off-us]\n    Snd --> Rcv[Creditor bank receives and credits]\n    Rcv --> Stat[Status/notifications follow<br/>pacs.002, camt.054]\n```"
            )
        ],
        "docs/technical-knowledge/banking/payment_return.md": [
            (
                "```text\nOriginal payment accepted\n  -> Creditor bank cannot apply/retain funds\n  -> Creditor bank creates pacs.004 return\n  -> Debtor bank receives and matches to original payment\n  -> Debtor bank credits customer or suspense\n  -> Case closed / customer informed\n```",
                "```mermaid\nflowchart TD\n    Acc[Original payment accepted] --> Err[Creditor bank cannot apply/retain funds]\n    Err --> Ret[Creditor bank creates pacs.004 return]\n    Ret --> Match[Debtor bank receives and matches to original payment]\n    Match --> Cred[Debtor bank credits customer or suspense]\n    Cred --> Close[Case closed / customer informed]\n```"
            )
        ]
    }
    
    for rel_path, file_reps in replacements.items():
        file_path = os.path.join(workspace, rel_path)
        if not os.path.exists(file_path):
            print(f"Skipping {rel_path} - not found")
            continue
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        original_content = content
        for target, replacement in file_reps:
            # We also handle variation in whitespace/newlines
            target_norm = target.replace("\r\n", "\n")
            if target_norm in content:
                content = content.replace(target_norm, replacement)
            else:
                # Try finding with normalized carriage returns
                content_norm = content.replace("\r\n", "\n")
                if target_norm in content_norm:
                    content = content_norm.replace(target_norm, replacement)
                else:
                    print(f"Warning: Target block not found in {rel_path}")
                    
        if content != original_content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Successfully converted diagrams in {rel_path}")
        else:
            print(f"No changes made to {rel_path}")

if __name__ == "__main__":
    convert_files()
