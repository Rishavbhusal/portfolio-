export interface Achievement {
  id: string
  org: string
  result: string
  detail: string
  issuer: string
  projectId: string
}

export const achievements: Achievement[] = [
  {
    id: 'cypherpunk',
    org: 'Cypherpunk',
    result: 'Winner',
    detail: '$5,000 Local Track',
    issuer: 'Superteam',
    projectId: 'verix',
  },
  {
    id: 'ethonline',
    org: 'ETHOnline 2025',
    result: '2nd Place',
    detail: 'SmartMarket',
    issuer: 'ETHGlobal',
    projectId: 'smartmarket',
  },
]
