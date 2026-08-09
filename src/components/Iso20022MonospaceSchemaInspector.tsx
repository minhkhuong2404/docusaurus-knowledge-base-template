import React, { useState } from 'react';

interface SchemaField {
  tag: string;
  name: string;
  cardinality: string;
  type: string;
  desc: string;
  example: string;
}

interface MessageSchema {
  id: string;
  title: string;
  direction: string;
  xmlPayload: string;
  fields: SchemaField[];
}

const SCHEMAS: Record<string, MessageSchema> = {
  'pain001': {
    id: 'pain.001',
    title: 'Customer Credit Transfer Initiation (pain.001.001.09)',
    direction: 'Customer ➔ Debtor Bank',
    xmlPayload: `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>PAIN-2026-0803-0001</MsgId>
      <CreDtTm>2026-08-03T10:15:30Z</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>1500.00</CtrlSum>
      <InitgPty><Nm>ACME Global Corp</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId">PMT-INF-001</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <Dbtr><Nm>ACME Global Corp</Nm></Dbtr>
      <DbtrAcct><Id><Othr><Id>123456789</Id></Othr></Id></DbtrAcct>
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>E2E-ACME-PAY-98765</EndToEndId>
        </PmtId>
        <Amt><InstdAmt Ccy="AUD">1500.00</InstdAmt></Amt>
        <Cdtr><Nm>Nexus Supplies Ltd</Nm></Cdtr>
        <CdtrAcct><Id><Othr><Id>987654321</Id></Othr></Id></CdtrAcct>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`,
    fields: [
      { tag: '<MsgId>', name: 'Message Identification', cardinality: '1..1', type: 'Max35Text', desc: 'Unique reference assigned by initiating party to identify file.', example: 'PAIN-2026-0803-0001' },
      { tag: '<EndToEndId>', name: 'End to End Identification', cardinality: '1..1', type: 'Max35Text', desc: 'Unique identifier passed unchanged through whole payment chain.', example: 'E2E-ACME-PAY-98765' },
      { tag: '<InstdAmt>', name: 'Instructed Amount', cardinality: '1..1', type: 'ActiveOrHistoricCurrencyAndAmount', desc: 'Amount and currency to be debited from debtor account.', example: 'AUD 1500.00' },
      { tag: '<Dbtr>', name: 'Debtor Name & Address', cardinality: '1..1', type: 'PartyIdentification135', desc: 'Payer party requesting the credit transfer initiation.', example: 'ACME Global Corp' }
    ]
  },
  'pacs008': {
    id: 'pacs.008',
    title: 'Financial Institutional Customer Credit Transfer (pacs.008.001.08)',
    direction: 'Debtor Bank ➔ Creditor Bank / Interbank Rail',
    xmlPayload: `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>PACS8-2026-99001</MsgId>
      <CreDtTm>2026-08-03T10:15:32Z</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf><SttlmMtd>CLRG</SttlmMtd></SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <UETR>c194b321-4f12-4211-9a4f-561b2a98f12d</UETR>
        <EndToEndId>E2E-ACME-PAY-98765</EndToEndId>
      </PmtId>
      <IntrBkSttlmAmt Ccy="AUD">1500.00</IntrBkSttlmAmt>
      <IntrBkSttlmDt>2026-08-03</IntrBkSttlmDt>
      <DbtrAgt><FinInstnId><BICFI>CTBAAU2SXXX</BICFI></FinInstnId></DbtrAgt>
      <CdtrAgt><FinInstnId><BICFI>ANZBAU3MXXX</BICFI></FinInstnId></CdtrAgt>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`,
    fields: [
      { tag: '<UETR>', name: 'Unique End-to-End Transaction Ref', cardinality: '1..1', type: 'UUIDv4 (36 Char)', desc: 'SWIFT gpi 128-bit UUID tracking payment globally in real time.', example: 'c194b321-4f12-4211-9a4f-561b2a98f12d' },
      { tag: '<IntrBkSttlmAmt>', name: 'Interbank Settlement Amount', cardinality: '1..1', type: 'Amount & Currency', desc: 'Net amount settled between Debtor Agent and Creditor Agent.', example: 'AUD 1500.00' },
      { tag: '<DbtrAgt>', name: 'Debtor Agent (BIC)', cardinality: '1..1', type: 'BranchAndFinancialInstitutionIdentification', desc: 'Financial institution serving the debtor.', example: 'CTBAAU2SXXX' },
      { tag: '<CdtrAgt>', name: 'Creditor Agent (BIC)', cardinality: '1..1', type: 'BranchAndFinancialInstitutionIdentification', desc: 'Financial institution serving the creditor.', example: 'ANZBAU3MXXX' }
    ]
  },
  'pacs002': {
    id: 'pacs.002',
    title: 'Payment Status Report (pacs.002.001.10)',
    direction: 'Creditor Bank / Rail ➔ Debtor Bank',
    xmlPayload: `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.002.001.10">
  <FIToFIPmtStsRpt>
    <GrpHdr>
      <MsgId>PACS2-STATUS-8812</MsgId>
      <CreDtTm>2026-08-03T10:15:33Z</CreDtTm>
    </GrpHdr>
    <TxInfAndSts>
      <OrgnlUETR>c194b321-4f12-4211-9a4f-561b2a98f12d</OrgnlUETR>
      <TxSts>ACCP</TxSts> <!-- ACCP = Accepted, RJCT = Rejected -->
      <StsRsnInf>
        <Rsn><Cd>AC01</Cd></Rsn> <!-- AC01 = Incorrect Account Number -->
      </StsRsnInf>
    </TxInfAndSts>
  </FIToFIPmtStsRpt>
</Document>`,
    fields: [
      { tag: '<TxSts>', name: 'Transaction Status Code', cardinality: '1..1', type: 'TransactionGroupStatus3Code', desc: 'ACCP (Settled), RJCT (Rejected), PDNG (Pending Compliance).', example: 'ACCP' },
      { tag: '<Cd>', name: 'Status Reason Code', cardinality: '0..1', type: 'ExternalStatusReason1Code', desc: 'ISO reason code explaining why payment was rejected (e.g. AC01, AM04).', example: 'AC01' },
      { tag: '<OrgnlUETR>', name: 'Original UETR Reference', cardinality: '1..1', type: 'UUIDv4', desc: 'Links status report directly back to the original pacs.008.', example: 'c194b321-4f12-4211-9a4f-561b2a98f12d' }
    ]
  },
  'camt054': {
    id: 'camt.054',
    title: 'Bank-to-Customer Debit/Credit Notification (camt.054.001.08)',
    direction: 'Creditor Bank ➔ Creditor Customer',
    xmlPayload: `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.054.001.08">
  <BkToCstmrDbtCdtNtfctn>
    <GrpHdr><MsgId>CAMT54-2026-112</MsgId></GrpHdr>
    <Ntfctn>
      <Acct><Id><IBAN>AU89000012345678</IBAN></Id></Acct>
      <Ntry>
        <Amt Ccy="AUD">1500.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd> <!-- CRDT = Credit, DBIT = Debit -->
        <Sts>BOOK</Sts>
        <NtryDtls>
          <TxDtls>
            <Refs><UETR>c194b321-4f12-4211-9a4f-561b2a98f12d</UETR></Refs>
          </TxDtls>
        </NtryDtls>
      </Ntry>
    </Ntfctn>
  </BkToCstmrDbtCdtNtfctn>
</Document>`,
    fields: [
      { tag: '<CdtDbtInd>', name: 'Credit / Debit Indicator', cardinality: '1..1', type: 'CreditDebitCode', desc: 'CRDT (Credit entry added to balance) vs DBIT (Debit entry subtracted).', example: 'CRDT' },
      { tag: '<Sts>', name: 'Entry Status', cardinality: '1..1', type: 'EntryStatus1Code', desc: 'BOOK (Posted to ledger) vs PDNG (Unconfirmed provision).', example: 'BOOK' },
      { tag: '<IBAN>', name: 'Account Identification', cardinality: '1..1', type: 'IBAN2007Identifier', desc: 'Account number credited or debited.', example: 'AU89000012345678' }
    ]
  }
};

export default function Iso20022MonospaceSchemaInspector({ initialMsg = 'pain001' }: { initialMsg?: string }): React.JSX.Element {
  const [activeSchemaKey, setActiveSchemaKey] = useState<string>(initialMsg);
  const [selectedTag, setSelectedTag] = useState<string>('');

  const currSchema = SCHEMAS[activeSchemaKey] || SCHEMAS['pain001'];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .schema-inspector-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          ISO 20022 Interactive Monospace Schema & XML Payload Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Message Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {Object.keys(SCHEMAS).map(k => {
            const sch = SCHEMAS[k];
            const isSel = k === activeSchemaKey;
            return (
              <button
                key={k}
                onClick={() => { setActiveSchemaKey(k); setSelectedTag(''); }}
                style={{
                  flex: 1,
                  minWidth: '110px',
                  padding: '8px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  background: isSel ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
                  color: isSel ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  boxShadow: isSel ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)'
                }}
              >
                {sch.id}
              </button>
            );
          })}
        </div>

        <div className="schema-inspector-grid" style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '16px', alignItems: 'start' }}>
          {/* Monospace Code Editor Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>{currSchema.title}</span>
              <span style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                {currSchema.direction}
              </span>
            </div>

            <pre
              style={{
                fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                fontSize: '11px',
                background: '#090b14',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#e2e8f0',
                overflowX: 'auto',
                lineHeight: 1.5,
                margin: 0,
                maxHeight: '360px'
              }}
            >
              {currSchema.xmlPayload}
            </pre>
          </div>

          {/* Field Details & Inspector */}
          <div className="interactive-diagram-details-card details-green" style={{ minHeight: '340px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '8px' }}>
              SCHEMA FIELD INSPECTOR
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currSchema.fields.map((f, idx) => {
                const isTagSel = selectedTag === f.tag;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedTag(f.tag)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: isTagSel ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isTagSel ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <code style={{ color: '#34d399', fontSize: '11px', fontWeight: 700 }}>{f.tag}</code>
                      <span style={{ fontSize: '9.5px', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                        {f.cardinality}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginTop: '2px' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                      {f.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
