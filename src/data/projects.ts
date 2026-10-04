/** Single source of truth for project content. Every fact comes from the CV. */
export type VisualMode = 'verix' | 'tapguard' | 'smartmarket' | 'swiflo'

export interface Project {
  id: VisualMode
  number: string
  name: string
  descriptor: string
  summary: string
  /** CV bullets, kept faithful to the source. */
  built: string[]
  stack: string[]
  technicalDetails?: string[]
  achievement?: string
  /** Only set when a real URL is verified. */
  github?: string
  demo?: string
  visualMode: VisualMode
  /** Conceptual runtime stages narrated by the 3D scene. */
  stages: string[]
  visualConcept: string
}

export const projects: Project[] = [
  {
    id: 'verix',
    number: '01',
    name: 'Verix',
    descriptor: 'Carbon Credit Trading Ecosystem',
    summary: 'A Solana-based carbon credit ecosystem combining real-time IoT monitoring with AI-driven automation.',
    built: [
      'Developed a Solana-based carbon credit trading ecosystem combining real-time IoT monitoring with AI-driven automation.',
      'Built multi-agent A2A marketplace automation using Google ADK to coordinate agent interactions.',
      'Ensured verifiable on-chain credits and transparent, scalable environmental compliance tracking.',
    ],
    stack: ['Solana', 'AI Agents', 'IoT Integration', 'Google ADK'],
    technicalDetails: ['Multi-agent A2A marketplace automation', 'Verifiable on-chain credits'],
    achievement: 'Winner — Cypherpunk $5,000 Local Track (Superteam)',
    github: 'https://github.com/Rishavbhusal/carbon_credit',
    visualMode: 'verix',
    visualConcept: 'Convergence',
    stages: ['IoT sensor', 'Telemetry', 'Data', 'AI agents', 'Marketplace', 'Verified credit', 'On-chain state'],
  },
  {
    id: 'tapguard',
    number: '02',
    name: 'TapGuard Vault',
    descriptor: 'NFC Tap-to-Pay Smart Vault',
    summary: 'A decentralized NFC tap-to-pay system on Solana, secured by on-chain smart vaults.',
    built: [
      'Built a decentralized NFC tap-to-pay payment system on Solana with on-chain smart vaults using Anchor/Rust.',
      'Implemented secp256k1 chip signature verification for secure NFC-based authentication.',
      'Designed PDA-based vault accounts with daily spending limits, emergency freeze, and SOL/SPL token transfers.',
    ],
    stack: ['Rust (Anchor)', 'Solana', 'React', 'TypeScript', 'Web NFC'],
    technicalDetails: [
      'secp256k1 chip signature verification',
      'PDA-based vault accounts',
      'Daily spending limits',
      'Emergency freeze',
      'SOL / SPL token transfers',
    ],
    github: 'https://github.com/Rishavbhusal/tap-to-pay',
    visualMode: 'tapguard',
    visualConcept: 'Verification',
    stages: ['NFC', 'Signal', 'Signature', 'Verify', 'Vault', 'Solana'],
  },
  {
    id: 'smartmarket',
    number: '03',
    name: 'SmartMarket',
    descriptor: 'AI-Powered Decentralized Marketplace',
    summary: 'A decentralized, AI-driven marketplace built on Hedera Agent Kit and Google’s A2A framework.',
    built: [
      'Built a decentralized AI-driven marketplace leveraging Hedera Agent Kit and Google’s A2A (Agent-to-Agent) framework.',
      'Designed multi-agent workflows to coordinate marketplace operations and enable secure, automated transactions.',
      'Enhanced trust, automation, and transaction efficiency through AI orchestration.',
    ],
    stack: ['Hedera', 'Hedera Agent Kit', 'Google A2A', 'AI Agents'],
    technicalDetails: ['Multi-agent workflows', 'Agent-to-Agent (A2A) coordination', 'Automated transactions'],
    achievement: '2nd Place — ETHOnline 2025 (ETHGlobal)',
    visualMode: 'smartmarket',
    visualConcept: 'Coordination',
    stages: ['Task', 'Agent activates', 'Split', 'Coordinate', 'Respond', 'Transaction', 'Settlement'],
  },
  {
    id: 'swiflo',
    number: '04',
    name: 'Swiflo',
    descriptor: 'Cross-Border Remittance Platform',
    summary: 'A blockchain-based remittance platform for transfers between the Gulf region and Nepal, built on Solana.',
    built: [
      'Built a blockchain-based cross-border remittance platform facilitating transfers between the Gulf region and Nepal using Solana.',
      'Developed the application backend and database layer with Prisma and PostgreSQL.',
      'Integrated Privy for wallet/authentication infrastructure and Pyth price feeds for real-time exchange-rate data.',
      'Designed the payment workflow to support secure and efficient cross-border transfers.',
    ],
    stack: ['Solana', 'TypeScript', 'Prisma', 'PostgreSQL', 'Supabase', 'Privy', 'Pyth'],
    technicalDetails: [
      'Privy wallet / auth infrastructure',
      'Pyth real-time exchange-rate feeds',
      'Prisma + PostgreSQL data layer',
    ],
    github: 'https://github.com/Rishavbhusal/swiflo',
    visualMode: 'swiflo',
    visualConcept: 'Value transfer',
    stages: ['Sender', 'Auth / wallet', 'Payment request', 'Rate data', 'Transaction', 'Solana', 'Settlement', 'Recipient'],
  },
]
