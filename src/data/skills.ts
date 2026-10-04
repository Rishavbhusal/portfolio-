export interface Skill {
  name: string
  /** Project ids whose CV stack line names this technology. */
  usedIn?: string[]
}
export interface SkillGroup {
  id: string
  title: string
  items: Skill[]
}

export const skillGroups: SkillGroup[] = [
  {
    id: 'backend',
    title: 'Backend',
    items: [
      { name: 'Node.js' },
      { name: 'TypeScript', usedIn: ['tapguard', 'swiflo'] },
      { name: 'RESTful APIs' },
      { name: 'gRPC' },
      { name: 'Microservices' },
      { name: 'PostgreSQL', usedIn: ['swiflo'] },
      { name: 'Redis' },
      { name: 'SQL optimization & database design' },
      { name: 'Docker' },
      { name: 'Authentication / JWT' },
    ],
  },
  {
    id: 'blockchain',
    title: 'Blockchain',
    items: [
      { name: 'Solana', usedIn: ['verix', 'tapguard', 'swiflo'] },
      { name: 'Anchor / Rust', usedIn: ['tapguard'] },
      { name: 'Solidity' },
      { name: 'ERC-20' },
      { name: 'Foundry' },
      { name: 'Hardhat' },
      { name: 'Web3.js / Ethers.js' },
      { name: 'Wallet integration (MetaMask, Phantom)' },
      { name: 'Smart contract testing & deployment' },
      { name: 'Tokenomics & DeFi logic' },
    ],
  },
  {
    id: 'system',
    title: 'System design',
    items: [
      { name: 'Event-driven systems' },
      { name: 'Message queues' },
      { name: 'Idempotency' },
      { name: 'Scalable system design' },
      { name: 'Testing' },
    ],
  },
  {
    id: 'protocol',
    title: 'Protocol / DeFi',
    items: [
      { name: 'Liquidity pool integration' },
      { name: 'Transaction fee mechanisms' },
      { name: 'On-chain voting systems' },
      { name: 'Supply chain smart contracts' },
      { name: 'AI agent ↔ blockchain interaction', usedIn: ['verix', 'smartmarket'] },
      { name: 'x402 payment integration' },
    ],
  },
]

export const tools = ['Git', 'GitHub', 'npm / yarn', 'VS Code']
