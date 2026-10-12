import React, { useState } from 'react';

type MainView = 'emv_pipeline' | 'rfid_spectrum';
type TapPhase = 'physical' | 'handshake' | 'crypto' | 'online';

interface PhaseDetail {
  id: TapPhase;
  stepNum: string;
  name: string;
  badge: string;
  color: string;
  timeBudget: string;
  physics: string;
  communicationProtocol: string;
  cryptography: string;
  sequenceSteps: {
    actor: 'Terminal (PCD)' | 'Card/Phone (PICC)' | 'Acquirer / Host HSM';
    action: string;
    detail: string;
  }[];
  hardwareTeardown: string;
  vulnerabilityAndDefense: string;
}

const PHASES: Record<TapPhase, PhaseDetail> = {
  physical: {
    id: 'physical',
    stepNum: 'Phase 1',
    name: '1. Electromagnetic Coupling & Power Harvest',
    badge: '13.56 MHz Inductive Field',
    color: '#38bdf8',
    timeBudget: '0ms - 30ms',
    physics: 'Ampère & Faraday Induction: Terminal AC current through a planar loop antenna produces a 13.56 MHz oscillating magnetic field (B-field). When the passive card enters the near field (<4 cm), magnetic flux passes through the card wire coil, inducing an alternating voltage (EMF = -N dΦ/dt).',
    communicationProtocol: 'ISO/IEC 14443 Type A/B Physical Layer. Resonant tuning with onboard capacitor (f = 1 / (2π√(LC)) ≈ 13.56 MHz).',
    cryptography: 'None at this stage; silicon power rail stabilization and hardware reset (Power-On Reset, POR).',
    sequenceSteps: [
      {
        actor: 'Terminal (PCD)',
        action: 'Emits continuous 13.56 MHz carrier wave',
        detail: 'POS terminal drives 1.5A - 3A peak through PCB loop antenna, radiating alternating magnetic field.'
      },
      {
        actor: 'Card/Phone (PICC)',
        action: 'Inductive EMF Voltage Harvest',
        detail: 'Card antenna coil (3 to 5 perimeter copper turns) harvests ~3V - 5V RMS from the magnetic field.'
      },
      {
        actor: 'Card/Phone (PICC)',
        action: 'Rectification & Silicon Boot',
        detail: 'Internal Schottky diode bridge rectifies AC to DC; onboard capacitor filters ripple; Secure Element CPU boots.'
      }
    ],
    hardwareTeardown: 'Credit Card: 0.76mm PVC/Polycarbonate casing embedding an ultra-thin secure silicon die (<0.3mm) connected to a copper wire perimeter coil. No battery, no galvanic wire to terminal.',
    vulnerabilityAndDefense: 'Rogue high-power reader harvesting: RFID-blocking wallets use a thin aluminum Faraday cage or mu-metal mesh to shield external magnetic flux and attenuate 13.56 MHz fields to zero.'
  },
  handshake: {
    id: 'handshake',
    stepNum: 'Phase 2',
    name: '2. NFC Protocol Handshake & Load Modulation',
    badge: 'ASK & Subcarrier Load Modulation',
    color: '#fbbf24',
    timeBudget: '30ms - 90ms',
    physics: 'Bidirectional Modulation: Downlink (Terminal -> Card) uses 10% or 100% Amplitude Shift Keying (ASK). Uplink (Card -> Terminal) uses Load Modulation: the card toggles an internal resistor/transistor switch, altering mutual inductance and causing tiny current fluctuations in the terminal coil.',
    communicationProtocol: 'ISO/IEC 14443-3 Anticollision (UID resolution) + ISO/IEC 14443-4 T=CL Half-Duplex Block Transmission (APDU commands).',
    cryptography: 'Card selects Payment Application (AID: Visa A0000000031010, Mastercard A0000000041010) via SELECT APDU.',
    sequenceSteps: [
      {
        actor: 'Terminal (PCD)',
        action: 'REQA / WUPA (Request Command)',
        detail: 'Terminal polls the field asking: "Are any proximity cards in range?"'
      },
      {
        actor: 'Card/Phone (PICC)',
        action: 'ATQA & UID Anticollision Loop',
        detail: 'Card responds with Answer to Request (ATQA) and unique 4-byte or 7-byte UID. Anticollision resolves single card if multiple cards are near.'
      },
      {
        actor: 'Terminal (PCD)',
        action: 'SELECT Payment AID (PPSE)',
        detail: 'Terminal sends APDU: SELECT "2PAY.SYS.DDF01" (Proximity Payment System Environment) to discover available debit/credit apps.'
      },
      {
        actor: 'Card/Phone (PICC)',
        action: 'Returns Application Directory',
        detail: 'Card returns supported Application Identifier (e.g., Visa Credit AID) and priority.'
      }
    ],
    hardwareTeardown: 'Terminal Analog Frontend: Directional couplers and envelope detectors filter out the strong 13.56 MHz carrier wave to isolate the faint subcarrier load modulation signal (848 kHz offset) from the card.',
    vulnerabilityAndDefense: 'Collision & Card Clashing: If two cards tap simultaneously, ISO 14443 bit-frame anticollision loops isolate one card or terminal aborts with "Please present one card only".'
  },
  crypto: {
    id: 'crypto',
    name: '3. Offline Card Authentication (DDA / CDA)',
    stepNum: 'Phase 3',
    badge: 'Asymmetric RSA Cryptography',
    color: '#34d399',
    timeBudget: '90ms - 220ms',
    physics: 'Full digital APDU transmission over 848 kbps RF link. Silicon hardware RSA cryptographic co-processor draws temporary pulse current to compute modular exponentiation in ~30ms.',
    communicationProtocol: 'EMV Contactless Book 2 / Book 3. Terminal initiates Processing (GPO: Get Processing Options) and reads records (AFL).',
    cryptography: 'Public Key Infrastructure (PKI) Chain: Payment Scheme Root CA -> Issuer Public Key Certificate -> ICC (Card) Public Key Certificate. Terminal validates certificate chain using scheme Root CA key.',
    sequenceSteps: [
      {
        actor: 'Terminal (PCD)',
        action: 'GET PROCESSING OPTIONS (GPO)',
        detail: 'Terminal provides Terminal Transaction Qualifiers (TTQ), Amount ($42.50), and Currency code.'
      },
      {
        actor: 'Card/Phone (PICC)',
        action: 'Returns AIP & AFL File Pointers',
        detail: 'Card indicates it supports Dynamic Data Authentication (DDA) and points terminal to certificate records.'
      },
      {
        actor: 'Terminal (PCD)',
        action: 'INTERNAL AUTHENTICATE (Random Challenge)',
        detail: 'Terminal generates a 32-bit cryptographically secure Unpredictable Number (UN) and sends to card.'
      },
      {
        actor: 'Card/Phone (PICC)',
        action: 'Hardware RSA Digital Signature',
        detail: 'Card co-processor signs (UN + Amount + Terminal Data) using private RSA key stored in tamper-proof silicon.'
      }
    ],
    hardwareTeardown: 'Card Cryptographic Engine: Dedicated hardware RSA coprocessor capable of 1024-bit to 2048-bit modular exponentiation. Silicon layout contains active shield mesh; drilling or microprobing shorts the circuit and wipes RAM.',
    vulnerabilityAndDefense: 'Skimming & Cloned Magstripes: Dynamic Data Authentication (DDA) completely prevents card cloning. Even if a skimmer records all RF transmissions, the card private key never leaves silicon.'
  },
  online: {
    id: 'online',
    name: '4. Symmetric Cryptogram & POS Beep (ARQC)',
    stepNum: 'Phase 4',
    badge: 'Symmetric AES / 3DES ARQC',
    color: '#a78bfa',
    timeBudget: '220ms - 500ms',
    physics: 'Session cryptogram generated. POS terminal receives ARQC and triggers audio transducer (85dB beep) and green LEDs indicating tap complete. Card can be removed while POS completes ISO 8583 WAN clearing.',
    communicationProtocol: 'EMV Book 2 GENERATE AC command + ISO 8583 Field 55 / AS 2805 packet packing for online clearing.',
    cryptography: 'Symmetric Cryptography: Card uses internal Master Key (MK) + Application Transaction Counter (ATC) to derive Session Key (SK). Generates ARQC via CMAC.',
    sequenceSteps: [
      {
        actor: 'Terminal (PCD)',
        action: 'GENERATE AC (Cryptogram Request)',
        detail: 'Terminal asks card to generate ARQC (Authorization Request Cryptogram) for online bank verification.'
      },
      {
        actor: 'Card/Phone (PICC)',
        action: 'Derives Session Key & Calculates ARQC',
        detail: 'Card increments ATC counter, derives SK = AES(MK, ATC), calculates ARQC = MAC(SK, Transaction Data).'
      },
      {
        actor: 'Terminal (PCD)',
        action: 'Audio BEEP & LED Green Flash',
        detail: 'Terminal signals user transaction captured. Terminal packages ARQC into ISO 8583 Field 55 and sends to Acquirer.'
      },
      {
        actor: 'Acquirer / Host HSM',
        action: 'Issuer HSM Verifies ARQC & Issues ARPC',
        detail: 'Bank HSM regenerates Session Key using card MK from database. If MAC matches and account has balance, returns 00 (Approved) + ARPC.'
      }
    ],
    hardwareTeardown: 'POS Terminal & Host Security Module (HSM): POS tamper-detection triggers zeroization of internal cryptographic keys if drilled or opened. Bank HSM executes 10,000+ cryptogram validations per second inside FIPS 140-2 Level 4 physical chassis.',
    vulnerabilityAndDefense: 'Replay Attack Prevention: Monotonically increasing Application Transaction Counter (ATC). If an attacker captures an ARQC and attempts to reuse it, the issuer HSM detects duplicate ATC <= LastATC and rejects immediately.'
  }
};

type DeviceKey = 'hotel_card' | 'id_badge' | 'toll_tag' | 'qi_charging' | 'induction_stove' | 'faraday_wallet';

interface DeviceDetail {
  id: DeviceKey;
  name: string;
  frequencyBand: string;
  category: 'HF / NFC' | 'LF RFID' | 'UHF RFID' | 'Inductive Power' | 'Eddy Current Thermal' | 'Faraday Shielding';
  color: string;
  range: string;
  couplingType: string;
  powerLevel: string;
  dataRate: string;
  standard: string;
  securityProfile: string;
  physicsMechanism: string;
  cloningRiskAndDefense: string;
  emitterNode: string;
  targetNode: string;
  waveVisualType: 'magnetic_near' | 'rf_far' | 'swirl_eddy' | 'blocked_flux';
}

const RFID_DEVICES: Record<DeviceKey, DeviceDetail> = {
  hotel_card: {
    id: 'hotel_card',
    name: 'Hotel Key Cards',
    frequencyBand: '13.56 MHz (HF / NFC)',
    category: 'HF / NFC',
    color: '#38bdf8',
    range: '< 4 cm (Near-field touch)',
    couplingType: 'Near-Field Resonant Magnetic Induction',
    powerLevel: '~20 mW (Harvested from lock antenna)',
    dataRate: '106 kbps (Load Modulation)',
    standard: 'ISO/IEC 14443 Type A (MIFARE / Ultralight)',
    securityProfile: 'Legacy: Proprietary Crypto-1 (Weak). Modern: AES-128 (DESFire).',
    physicsMechanism: 'The door lock contains a continuous 13.56 MHz polling loop. The card antenna coil harvests ~3V via Faraday induction, waking the microcontroller to transmit the encrypted room grant sector via load modulation.',
    cloningRiskAndDefense: 'Legacy MIFARE Classic cards use the 48-bit Crypto-1 cipher with weak PRNGs; easily cloned with Flipper Zero or proxmark3 via DarkSide attacks. Modern hotels utilize MIFARE DESFire EV2/EV3 with 3DES/AES hardware crypto or mobile NFC Bluetooth LE tokens.',
    emitterNode: 'DOOR LOCK READER (13.56 MHz)',
    targetNode: 'HOTEL KEYCARD (MIFARE IC)',
    waveVisualType: 'magnetic_near'
  },
  id_badge: {
    id: 'id_badge',
    name: 'Corporate ID Badges',
    frequencyBand: '125 kHz (LF) vs 13.56 MHz (HF)',
    category: 'LF RFID',
    color: '#fbbf24',
    range: '5 – 10 cm (Proximity)',
    couplingType: 'Near-Field Magnetic Inductive Coupling',
    powerLevel: '~15 mW (Harvested from reader)',
    dataRate: '1 – 4 kbps (FSK / ASK Modulation)',
    standard: 'HID Prox (Proprietary 26-bit Wiegand) / ISO 15693 / Seos',
    securityProfile: 'LF 125 kHz: ZERO Cryptography (Static Plaintext ID). HF: AES-128.',
    physicsMechanism: 'LF 125 kHz magnetic fields penetrate clothing, wallets, and human saline tissue with minimal absorption. The reader coil induces alternating voltage in a high-turn copper bobbin coil inside the badge.',
    cloningRiskAndDefense: '125 kHz HID Prox cards broadcast their unencrypted Facility Code and Card Number in plaintext upon power-up. An attacker with a long-range reader in a backpack can sniff badges from 1 meter away and clone to a $2 T5577 rewritable chip. Defense: Migrate to HID Seos or MIFARE DESFire with mutual challenge-response AES authentication.',
    emitterNode: 'WALL ACCESS READER (125 kHz)',
    targetNode: 'EMPLOYEE ID BADGE (Wiegand IC)',
    waveVisualType: 'magnetic_near'
  },
  toll_tag: {
    id: 'toll_tag',
    name: 'Highway Toll Tags (E-ZPass / FasTrak)',
    frequencyBand: '902 – 928 MHz (UHF / RAIN RFID)',
    category: 'UHF RFID',
    color: '#34d399',
    range: '5 – 15+ meters at > 120 km/h',
    couplingType: 'Far-Field Radiative Electromagnetic Wave Backscatter',
    powerLevel: '~10 µW (Electric Field Rectification)',
    dataRate: '40 – 640 kbps',
    standard: 'ISO/IEC 18000-6C / EPC Gen2 / ATA Spec',
    securityProfile: 'Encrypted Transponder ID + Tamper Windshield Destruct Mesh',
    physicsMechanism: 'Unlike near-field inductive coupling (<1 meter), UHF operates in the radiative far field (λ ≈ 33 cm). The overhead gantry transmits focused electromagnetic waves. The windshield sticker antenna (dipole) harvests energy from the electric field (E-field) and modulates reflected RF energy by changing its antenna input impedance (RF Backscatter).',
    cloningRiskAndDefense: 'Toll systems employ high-speed anticollision algorithms reading up to 1,000 tags/second with Doppler shift compensation. Tags contain anti-peel frangible aluminum layers: attempting to peel the sticker tears the dipole antenna, rendering it permanently non-functional.',
    emitterNode: 'HIGHWAY GANTRY RADAR (915 MHz)',
    targetNode: 'WINDSHIELD TOLL TAG (Dipole RF)',
    waveVisualType: 'rf_far'
  },
  qi_charging: {
    id: 'qi_charging',
    name: 'Wireless Qi Charging Pads',
    frequencyBand: '110 kHz – 205 kHz (Inductive Power)',
    category: 'Inductive Power',
    color: '#a78bfa',
    range: '3 – 7 mm (Direct Pad Contact)',
    couplingType: 'Resonant Magnetic Inductive Power Coupling',
    powerLevel: '5 Watts – 15 Watts (High Electrical Flux)',
    dataRate: '~2 kbps (Power Negotiation FSK Packets Only)',
    standard: 'WPC Qi Specification v1.3 / v2.0 (Qi2)',
    securityProfile: 'Zero Data Cryptography; Foreign Object Detection (FOD)',
    physicsMechanism: 'High-current AC power inverter drives a planar transmitter coil with 15W+ of magnetic flux. A matching planar receiver coil in the smartphone couples magnetically, rectifying high-current AC to charge the lithium battery.',
    cloningRiskAndDefense: 'No payment or biometric data is ever exchanged. The primary engineering danger is thermal runaway: if a coin or key sits on the pad, eddy currents will heat the metal to >100°C. Qi pads continuously measure coil resonance quality factor (Q-factor) to detect foreign metal objects and cut power instantly.',
    emitterNode: 'CHARGING BASE PAD (15W Inverter)',
    targetNode: 'PHONE RECEIVER COIL (Qi Chip)',
    waveVisualType: 'magnetic_near'
  },
  induction_stove: {
    id: 'induction_stove',
    name: 'Induction Cooktops',
    frequencyBand: '20 kHz – 40 kHz (High-Power Magnetics)',
    category: 'Eddy Current Thermal',
    color: '#f87171',
    range: '0 – 5 mm (Ceramic Glass Surface)',
    couplingType: 'High-Flux Magnetic Eddy Current & Hysteresis Coupling',
    powerLevel: '1,000 Watts – 3,700 Watts (Extreme Power)',
    dataRate: '0 bps (NO DATA TRANSMISSION WHATSOEVER)',
    standard: 'Industrial Power Electronics (IGBT Inverter)',
    securityProfile: 'Hardware Pan-Detection Sensors (Thermal & Permeability)',
    physicsMechanism: 'A heavy copper Litz-wire coil under the ceramic glass generates an alternating magnetic field of immense power. This oscillating magnetic flux penetrates the ferrous iron base of the pan, driving violent swirling electrical eddy currents. The natural resistance of the iron dissipates this current as heat (P = I²R); magnetic hysteresis losses add supplemental heat.',
    cloningRiskAndDefense: 'Not a communication channel. The glass cooktop itself does not generate heat; it only becomes warm from reverse thermal conduction from the hot iron pan. Non-ferromagnetic pans (aluminum, pure copper) cannot generate sufficient heat without specialized ultra-high frequency switching circuits.',
    emitterNode: 'LITZ-WIRE STOVE COIL (3.5 kW)',
    targetNode: 'FERROUS IRON PAN BASE (Eddy Heat)',
    waveVisualType: 'swirl_eddy'
  },
  faraday_wallet: {
    id: 'faraday_wallet',
    name: 'RFID-Blocking Wallets & Sleeves',
    frequencyBand: 'All Bands (125 kHz, 13.56 MHz, 915 MHz)',
    category: 'Faraday Shielding',
    color: '#2dd4bf',
    range: '0 mm (Continuous Enclosure)',
    couplingType: 'Faraday Cage & Lenz’s Law Eddy Shielding',
    powerLevel: '0 mW Received (Field Attenuated > 99.9%)',
    dataRate: '0 bps (All RF signals blocked)',
    standard: 'MIL-STD-285 / ASTM D4935 RF Shielding',
    securityProfile: 'Physical Layer Electromagnetic Isolation',
    physicsMechanism: 'Engineered with a micro-thin continuous layer of conductive aluminum or nickel-copper mesh. When an external magnetic field tries to penetrate, it induces surface eddy currents in the conductor. By Lenz’s Law, these currents create an opposing magnetic field that cancels the incident field, dropping internal flux to zero.',
    cloningRiskAndDefense: 'Rogue skimmers with high-gain amplifier antennas cannot power up the cards inside the sleeve because the card antenna experiences zero induced EMF (dΦ/dt = 0). Physical wear or tears in the conductive lining can break the continuous loop, creating RF leak apertures.',
    emitterNode: 'ROGUE SKIMMER / ANTENNA',
    targetNode: 'FARADAY CONDUCTIVE SHIELD (Flux=0)',
    waveVisualType: 'blocked_flux'
  }
};

export default function TapToPayArchitectureDiagram(): React.JSX.Element {
  const [mainView, setMainView] = useState<MainView>('emv_pipeline');
  const [selectedPhase, setSelectedPhase] = useState<TapPhase>('physical');
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [selectedDevice, setSelectedDevice] = useState<DeviceKey>('hotel_card');

  const phase = PHASES[selectedPhase];
  const device = RFID_DEVICES[selectedDevice];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 820px) {
          .tap-split-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <path d="M6 15h.01" />
          <path d="M10 15h2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Under-the-Hood Tap to Pay: Electromagnetic Physics, ISO 14443 & EMV Cryptography
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
          Physical Induction &bull; EMV Crypto &bull; RFID Ecosystem
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Main View Mode Selector */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <button
            onClick={() => setMainView('emv_pipeline')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: mainView === 'emv_pipeline' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: mainView === 'emv_pipeline' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17',
              color: mainView === 'emv_pipeline' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>💳</span>
            <span>EMV Tap to Pay Execution (&lt;500ms Pipeline)</span>
          </button>

          <button
            onClick={() => setMainView('rfid_spectrum')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: mainView === 'rfid_spectrum' ? '1.5px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: mainView === 'rfid_spectrum' ? 'rgba(167, 139, 250, 0.15)' : '#0c0e17',
              color: mainView === 'rfid_spectrum' ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📡</span>
            <span>RFID Spectrum, Devices & Physical Cousins (LF / HF / UHF)</span>
          </button>
        </div>

        {mainView === 'emv_pipeline' ? (
          <div>
            {/* Phase Selector Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {(Object.keys(PHASES) as TapPhase[]).map((key) => {
                const item = PHASES[key];
                const isSelected = selectedPhase === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedPhase(key);
                      setStepIdx(0);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: isSelected ? `1.5px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: isSelected ? `${item.color}18` : '#0c0e17',
                      color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '12px',
                      transition: 'all 0.18s ease',
                      boxShadow: isSelected ? `0 0 12px ${item.color}33` : 'none'
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                    {item.name}
                  </button>
                );
              })}
            </div>

            {/* Phase Overview Banner */}
            <div style={{
              backgroundColor: '#0c0e17',
              padding: '14px 18px',
              borderRadius: '10px',
              borderLeft: `4px solid ${phase.color}`,
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{phase.name}</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${phase.color}22`, color: phase.color, fontWeight: 700 }}>
                    {phase.badge}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  {phase.physics}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Time Budget Allocation</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: phase.color }}>{phase.timeBudget}</div>
              </div>
            </div>

            {/* Step Stepper Navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>Execution Steps:</span>
              {phase.sequenceSteps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setStepIdx(idx)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: stepIdx === idx ? 700 : 500,
                    backgroundColor: stepIdx === idx ? phase.color : '#0c0e17',
                    color: stepIdx === idx ? '#090b14' : 'var(--ifm-color-content-secondary)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer'
                  }}
                >
                  Step {idx + 1}: {step.actor.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* SVG Visual Telemetry Canvas */}
            <div style={{
              backgroundColor: '#0d0f1e',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px',
              marginBottom: '16px',
              position: 'relative'
            }}>
              <svg viewBox="0 0 760 170" width="100%" height="auto" style={{ display: 'block' }}>
                <defs>
                  <marker id="tap-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill={phase.color} />
                  </marker>
                  <filter id="glowBallTap" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                  </filter>
                </defs>

                {/* POS Terminal Node */}
                <g transform="translate(40, 20)">
                  <rect width="180" height="110" rx="8" fill="#070913" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
                  <rect x="10" y="10" width="160" height="24" rx="4" fill="rgba(56, 189, 248, 0.15)" />
                  <text x="90" y="26" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">POS TERMINAL (PCD)</text>
                  <text x="20" y="55" fill="#94a3b8" fontSize="10">&bull; 13.56 MHz Drive Coil</text>
                  <text x="20" y="72" fill="#94a3b8" fontSize="10">&bull; Amplitude Demodulator</text>
                  <text x="20" y="89" fill="#94a3b8" fontSize="10">&bull; APDU Reader Engine</text>
                  <text x="20" y="106" fill="#94a3b8" fontSize="10">&bull; DUKPT Tamper Sensor</text>
                </g>

                {/* Moving Conduit Path */}
                <path
                  id="tap-signal-path"
                  d={stepIdx % 2 === 0 ? "M 225 75 L 530 75" : "M 530 75 L 225 75"}
                  stroke={phase.color}
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  markerEnd="url(#tap-arrow)"
                />
                <circle r="4.5" fill={phase.color} filter="url(#glowBallTap)">
                  <animateMotion dur="1.8s" repeatCount="indefinite">
                    <mpath href="#tap-signal-path" />
                  </animateMotion>
                </circle>

                {/* Center Protocol Label */}
                <g transform="translate(380, 48)">
                  <rect x="-110" y="-14" width="220" height="28" rx="6" fill="#0c0e17" stroke={phase.color} strokeWidth="1" />
                  <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="10.5" fontWeight="700">
                    {phase.sequenceSteps[stepIdx].action}
                  </text>
                </g>

                {/* Card / Secure Element Node */}
                <g transform="translate(540, 20)">
                  <rect width="180" height="110" rx="8" fill="#070913" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
                  <rect x="10" y="10" width="160" height="24" rx="4" fill="rgba(52, 211, 153, 0.15)" />
                  <text x="90" y="26" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">CARD / SECURE ELEMENT</text>
                  <text x="20" y="55" fill="#94a3b8" fontSize="10">&bull; Antenna Perimeter Coil</text>
                  <text x="20" y="72" fill="#94a3b8" fontSize="10">&bull; Rectifier &amp; Tuning Cap</text>
                  <text x="20" y="89" fill="#94a3b8" fontSize="10">&bull; Load Modulation Switch</text>
                  <text x="20" y="106" fill="#94a3b8" fontSize="10">&bull; Hardware RSA/AES CoProc</text>
                </g>

                {/* Step Detail Footer */}
                <text x="380" y="152" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10.5">
                  Current Step {stepIdx + 1} of {phase.sequenceSteps.length}: {phase.sequenceSteps[stepIdx].detail}
                </text>
              </svg>
            </div>

            {/* 2-Column Split: Hardware Teardown & Security Gotcha */}
            <div className="tap-split-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
              <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: phase.color, fontWeight: 700, marginBottom: '10px' }}>
                  Physical Hardware Teardown &amp; Standards
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Hardware Components</div>
                  <div style={{ fontSize: '12px', color: '#fff', marginTop: '2px', lineHeight: 1.4 }}>{phase.hardwareTeardown}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Governing Protocol Specification</div>
                  <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '2px', fontFamily: 'monospace' }}>{phase.communicationProtocol}</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: phase.color, fontWeight: 700, marginBottom: '10px' }}>
                  Cryptographic Engine &amp; Attack Defenses
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Cryptographic Mechanism</div>
                  <div style={{ fontSize: '12px', color: '#fff', marginTop: '2px', lineHeight: 1.4 }}>{phase.cryptography}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>Attack Vector &amp; Engineering Defense</div>
                  <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', marginTop: '2px', lineHeight: 1.4 }}>{phase.vulnerabilityAndDefense}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* View 2: RFID & NFC Spectrum, Devices & Physical Cousins */
          <div>
            {/* Device Archetype Selector Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {(Object.keys(RFID_DEVICES) as DeviceKey[]).map((key) => {
                const item = RFID_DEVICES[key];
                const isSelected = selectedDevice === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDevice(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: isSelected ? `1.5px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: isSelected ? `${item.color}18` : '#0c0e17',
                      color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '12px',
                      transition: 'all 0.18s ease',
                      boxShadow: isSelected ? `0 0 12px ${item.color}33` : 'none'
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                    {item.name}
                  </button>
                );
              })}
            </div>

            {/* Device Detail Header Banner */}
            <div style={{
              backgroundColor: '#0c0e17',
              padding: '14px 18px',
              borderRadius: '10px',
              borderLeft: `4px solid ${device.color}`,
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{device.name}</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${device.color}22`, color: device.color, fontWeight: 700 }}>
                    {device.category}
                  </span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#fbbf24', fontWeight: 600 }}>
                    {device.frequencyBand}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  {device.physicsMechanism}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Operating Range</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: device.color }}>{device.range}</div>
              </div>
            </div>

            {/* SVG Visual Electromagnetic Field Canvas */}
            <div style={{
              backgroundColor: '#0d0f1e',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px',
              marginBottom: '16px',
              position: 'relative'
            }}>
              <svg viewBox="0 0 760 180" width="100%" height="auto" style={{ display: 'block' }}>
                <defs>
                  <marker id="rfid-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill={device.color} />
                  </marker>
                  <marker id="rfid-backscatter-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#f87171" />
                  </marker>
                  <filter id="glowBallDevice" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
                  </filter>
                </defs>

                {/* Left Emitter Node */}
                <g transform="translate(30, 25)">
                  <rect width="190" height="120" rx="8" fill="#070913" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
                  <rect x="10" y="10" width="170" height="24" rx="4" fill={`${device.color}22`} />
                  <text x="95" y="26" textAnchor="middle" fill={device.color} fontSize="10" fontWeight="700">
                    {device.emitterNode}
                  </text>
                  <text x="18" y="58" fill="#94a3b8" fontSize="10">&bull; Coupling: {device.couplingType.split(' ')[0]}</text>
                  <text x="18" y="76" fill="#94a3b8" fontSize="10">&bull; Band: {device.frequencyBand.split(' ')[0]}</text>
                  <text x="18" y="94" fill="#94a3b8" fontSize="10">&bull; Power: {device.powerLevel.split('(')[0]}</text>
                  <text x="18" y="112" fill="#94a3b8" fontSize="10">&bull; Standard: {device.standard.split('/')[0]}</text>
                </g>

                {/* Mid Propagation Field Render */}
                {device.waveVisualType === 'magnetic_near' && (
                  <g>
                    {/* Magnetic Flux Loops */}
                    <path d="M 235 60 C 330 20, 440 20, 525 60" fill="none" stroke={device.color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                    <path d="M 235 85 C 330 55, 440 55, 525 85" fill="none" stroke={device.color} strokeWidth="2.5" />
                    <path d="M 235 110 C 330 140, 440 140, 525 110" fill="none" stroke={device.color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

                    <path id="mag-flow" d="M 235 85 L 525 85" fill="none" stroke="transparent" />
                    <circle r="4" fill={device.color} filter="url(#glowBallDevice)">
                      <animateMotion dur="1.5s" repeatCount="indefinite">
                        <mpath href="#mag-flow" />
                      </animateMotion>
                    </circle>

                    <rect x="310" y="70" width="145" height="30" rx="6" fill="#0c0e17" stroke={device.color} strokeWidth="1" />
                    <text x="382" y="89" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">
                      B-Field Magnetic Induction
                    </text>
                    <text x="382" y="125" textAnchor="middle" fill="#94a3b8" fontSize="9.5">
                      Mutual Inductance (1/r³ Falloff)
                    </text>
                  </g>
                )}

                {device.waveVisualType === 'rf_far' && (
                  <g>
                    {/* Radiative UHF Sinusoidal Forward Wave */}
                    <path
                      d="M 235 75 Q 260 55, 285 75 T 335 75 T 385 75 T 435 75 T 485 75 L 525 75"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2.5"
                      markerEnd="url(#rfid-arrow)"
                    />
                    {/* Reflected Backscatter Wave */}
                    <path
                      d="M 525 95 Q 485 110, 445 95 T 365 95 T 285 95 L 235 95"
                      fill="none"
                      stroke="#f87171"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      markerEnd="url(#rfid-backscatter-arrow)"
                    />
                    <rect x="310" y="42" width="150" height="26" rx="5" fill="#0c0e17" stroke="#34d399" strokeWidth="1" />
                    <text x="385" y="59" textAnchor="middle" fill="#34d399" fontSize="9.5" fontWeight="700">
                      Forward RF Wave (915 MHz)
                    </text>
                    <rect x="310" y="112" width="150" height="26" rx="5" fill="#0c0e17" stroke="#f87171" strokeWidth="1" />
                    <text x="385" y="129" textAnchor="middle" fill="#f87171" fontSize="9.5" fontWeight="700">
                      Reflected RF Backscatter
                    </text>
                  </g>
                )}

                {device.waveVisualType === 'swirl_eddy' && (
                  <g>
                    {/* High-Current Swirling Eddy Current Field */}
                    <circle cx="380" cy="85" r="45" fill="none" stroke="#f87171" strokeWidth="2.5" strokeDasharray="6 3">
                      <animateTransform attributeName="transform" type="rotate" from="0 380 85" to="360 380 85" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="380" cy="85" r="28" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 2">
                      <animateTransform attributeName="transform" type="rotate" from="360 380 85" to="0 380 85" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="380" cy="85" r="12" fill="#f87171" opacity="0.6" />

                    <rect x="305" y="20" width="150" height="24" rx="4" fill="#0c0e17" stroke="#f87171" strokeWidth="1" />
                    <text x="380" y="36" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="700">
                      Swirling Eddy Currents (I²R Heat)
                    </text>
                    <text x="380" y="150" textAnchor="middle" fill="#fbbf24" fontSize="9.5">
                      Massive 3,000W Flux (Zero Data Bits)
                    </text>
                  </g>
                )}

                {device.waveVisualType === 'blocked_flux' && (
                  <g>
                    {/* Blocked Magnetic Flux by Faraday Cage */}
                    <path d="M 235 65 L 360 65" fill="none" stroke="#f87171" strokeWidth="2.5" markerEnd="url(#rfid-backscatter-arrow)" />
                    <path d="M 235 85 L 360 85" fill="none" stroke="#f87171" strokeWidth="2.5" markerEnd="url(#rfid-backscatter-arrow)" />
                    <path d="M 235 105 L 360 105" fill="none" stroke="#f87171" strokeWidth="2.5" markerEnd="url(#rfid-backscatter-arrow)" />

                    {/* Shield Barrier */}
                    <rect x="365" y="35" width="22" height="100" rx="4" fill="#2dd4bf" stroke="#fff" strokeWidth="1.5" />
                    <text x="376" y="90" textAnchor="middle" fill="#090b14" fontSize="11" fontWeight="800" transform="rotate(-90 376 90)">
                      FARADAY SHIELD
                    </text>

                    {/* Inside Cage Zero Flux */}
                    <line x1="400" y1="85" x2="520" y2="85" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.3" />
                    <rect x="420" y="70" width="95" height="28" rx="4" fill="#070913" stroke="#2dd4bf" strokeWidth="1" />
                    <text x="467" y="87" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontWeight="700">
                      Flux Φ = 0
                    </text>
                    <text x="467" y="115" textAnchor="middle" fill="#94a3b8" fontSize="9">
                      0 Volts Induced (Card Dormant)
                    </text>
                  </g>
                )}

                {/* Right Target Node */}
                <g transform="translate(540, 25)">
                  <rect width="190" height="120" rx="8" fill="#070913" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
                  <rect x="10" y="10" width="170" height="24" rx="4" fill="rgba(52, 211, 153, 0.15)" />
                  <text x="95" y="26" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">
                    {device.targetNode}
                  </text>
                  <text x="18" y="58" fill="#94a3b8" fontSize="10">&bull; Data: {device.dataRate}</text>
                  <text x="18" y="76" fill="#94a3b8" fontSize="10">&bull; Crypto: {device.securityProfile.split(';')[0]}</text>
                  <text x="18" y="94" fill="#94a3b8" fontSize="10">&bull; Distance: {device.range}</text>
                  <text x="18" y="112" fill="#34d399" fontSize="10" fontWeight="700">&bull; Category: {device.category}</text>
                </g>

                {/* SVG Footer Info */}
                <text x="380" y="170" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
                  Physical Medium: {device.couplingType} &bull; Operating Range: {device.range}
                </text>
              </svg>
            </div>

            {/* 2-Column Split: Physical Engineering & Attack Vectors */}
            <div className="tap-split-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: device.color, fontWeight: 700, marginBottom: '10px' }}>
                  Coupling Dynamics &amp; Silicon Specification
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Electromagnetic Coupling</div>
                  <div style={{ fontSize: '12px', color: '#fff', marginTop: '2px', lineHeight: 1.4 }}>{device.couplingType}</div>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Data &amp; Power Dynamic</div>
                  <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '2px', lineHeight: 1.4 }}>
                    Power: {device.powerLevel} | Data Rate: {device.dataRate}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Governing Specification</div>
                  <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '2px', fontFamily: 'monospace' }}>{device.standard}</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: device.color, fontWeight: 700, marginBottom: '10px' }}>
                  Security Architecture &amp; Cloning Realities
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Cryptographic Profile</div>
                  <div style={{ fontSize: '12px', color: '#fff', marginTop: '2px', lineHeight: 1.4 }}>{device.securityProfile}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', color: '#f87171', textTransform: 'uppercase', fontWeight: 700 }}>Cloning Vulnerabilities &amp; Defenses</div>
                  <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', marginTop: '2px', lineHeight: 1.4 }}>{device.cloningRiskAndDefense}</div>
                </div>
              </div>
            </div>

            {/* Comprehensive Cross-Technology Comparison Matrix */}
            <div style={{ backgroundColor: '#0c0e17', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                Comprehensive Frequency Spectrum &amp; Physics Comparison Matrix
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', color: 'var(--ifm-color-content)' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ padding: '10px 12px' }}>Device / System</th>
                      <th style={{ padding: '10px 12px' }}>Frequency Band</th>
                      <th style={{ padding: '10px 12px' }}>Coupling Mode</th>
                      <th style={{ padding: '10px 12px' }}>Read Range</th>
                      <th style={{ padding: '10px 12px' }}>Data Rate</th>
                      <th style={{ padding: '10px 12px' }}>Power Harvest</th>
                      <th style={{ padding: '10px 12px' }}>Security Profile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(RFID_DEVICES).map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: selectedDevice === item.id ? 'rgba(56, 189, 248, 0.05)' : 'transparent' }}>
                        <td style={{ padding: '9px 12px', fontWeight: 700, color: item.color }}>{item.name}</td>
                        <td style={{ padding: '9px 12px', fontFamily: 'monospace' }}>{item.frequencyBand.split(' ')[0]}</td>
                        <td style={{ padding: '9px 12px' }}>{item.couplingType.split(' ')[0]}</td>
                        <td style={{ padding: '9px 12px', color: '#fbbf24' }}>{item.range.split('(')[0]}</td>
                        <td style={{ padding: '9px 12px' }}>{item.dataRate.split('(')[0]}</td>
                        <td style={{ padding: '9px 12px' }}>{item.powerLevel.split('(')[0]}</td>
                        <td style={{ padding: '9px 12px' }}>{item.securityProfile.split(';')[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
