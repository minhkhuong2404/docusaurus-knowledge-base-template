import React, { useState } from 'react';

interface ContextModel {
  id: string;
  name: string;
  entity: string;
  attributes: string[];
  eventEmitted: string;
  color: string;
  focus: string;
}

const CONTEXTS: ContextModel[] = [
  {
    id: 'ordering',
    name: 'Ordering Context',
    entity: 'Order Aggregate',
    attributes: ['orderId', 'buyerId', 'lineItems', 'totalAmount', 'status'],
    eventEmitted: 'OrderPaidEvent',
    color: '#38bdf8',
    focus: 'Cart checkout, pricing calculation, payment authorization status.',
  },
  {
    id: 'shipping',
    name: 'Shipping Context',
    entity: 'Shipment Aggregate',
    attributes: ['shipmentId', 'trackingNumber', 'packageWeight', 'destinationAddress'],
    eventEmitted: 'ShipmentDispatchedEvent',
    color: '#34d399',
    focus: 'Logistics, courier dispatch, package dimensions, delivery routing.',
  },
  {
    id: 'inventory',
    name: 'Inventory Context',
    entity: 'StockReservation Aggregate',
    attributes: ['skuCode', 'warehouseId', 'binLocation', 'reservedQty'],
    eventEmitted: 'StockReservedEvent',
    color: '#fbbf24',
    focus: 'Warehouse stock levels, bin allocations, supplier reorders.',
  },
  {
    id: 'support',
    name: 'Customer Support Context',
    entity: 'TicketHistory Aggregate',
    attributes: ['ticketId', 'customerDisputeReason', 'refundStatus', 'slaTime'],
    eventEmitted: 'RefundProcessedEvent',
    color: '#a78bfa',
    focus: 'Post-purchase disputes, return labels, customer service history.',
  },
];

export default function BoundedContextsDiagram() {
  const [selectedContext, setSelectedContext] = useState<ContextModel>(CONTEXTS[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>Domain-Driven Design (DDD) Bounded Context Explorer</span>
      </div>

      {/* Domain Bounded Context Grid */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
          E-Commerce Core Domain (Isolated Models per Bounded Context)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
          {CONTEXTS.map(c => {
            const isSelected = selectedContext.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedContext(c)}
                style={{
                  background: isSelected ? `${c.color}20` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isSelected ? c.color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '10px',
                  padding: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 0 12px ${c.color}30` : 'none',
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 700, color: c.color, textTransform: 'uppercase' }}>Bounded Context</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ifm-color-content)', marginTop: '2px' }}>{c.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Context Detail Panel */}
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: `1.5px solid ${selectedContext.color}50` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, color: selectedContext.color }}>{selectedContext.name}</span>
          <span style={{ fontSize: '10.5px', fontFamily: 'monospace', padding: '3px 8px', borderRadius: '4px', background: `${selectedContext.color}20`, color: selectedContext.color }}>
            Emits: {selectedContext.eventEmitted}
          </span>
        </div>

        <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', marginBottom: '12px', lineHeight: '1.5' }}>
          <strong style={{ color: selectedContext.color }}>Domain Focus: </strong>{selectedContext.focus}
        </div>

        <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Context Domain Attributes ({selectedContext.entity})
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {selectedContext.attributes.map(attr => (
              <span key={attr} style={{ fontSize: '11px', fontFamily: 'monospace', padding: '3px 8px', borderRadius: '4px', background: `${selectedContext.color}15`, color: selectedContext.color, border: `1px solid ${selectedContext.color}30` }}>
                {attr}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
