/**
 * Verified contact facts, taken from the CV. Anything not in the CV is read from
 * environment variables so it is never invented (see .env.example).
 */
const env = import.meta.env as Record<string, string | undefined>

export const site = {
  name: 'Rishav Bhusal',
  role: 'Backend & Blockchain Developer',
  tagline: 'Backend Systems · Node.js · Solana · Web3',
  email: 'rishavbhusal12@gmail.com',
  linkedin: 'https://www.linkedin.com/in/rishav-bhusal-b0854a287',
  github: env.VITE_GITHUB_URL?.trim() || 'https://github.com/Rishavbhusal',
  location: 'Rupandehi, Nepal',
  url: env.VITE_SITE_URL?.trim() || undefined,
} as const

export const education = {
  degree: 'Bachelor of Computer Applications (BCA)',
  school: 'Nepathya College',
  year: '2028',
} as const
