import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Resend → @react-email/render importe `prettier/plugins/html` et
  // `prettier/standalone` (utilisés pour le pretty-print des emails JSX).
  // On envoie du HTML brut, donc ce code est mort pour nous.
  // Externaliser le bundling pour que Node les charge à l'exécution
  // (et tolère les imports manquants).
  serverExternalPackages: ['resend', '@react-email/render'],
}

export default nextConfig
