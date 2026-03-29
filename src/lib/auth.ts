import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db'
import { users, sessions, accounts, verifications } from '@/db/schema'
import { magicLink } from 'better-auth/plugins'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token, url }) => {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'ClubOS <onboarding@resend.dev>',
          to: email,
          subject: 'Votre lien de connexion ClubOS',
          html: `
            <h2>Connexion à ClubOS</h2>
            <p>Cliquez sur le lien ci-dessous pour vous connecter :</p>
            <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
              Se connecter
            </a>
            <p style="color:#6b7280;font-size:14px;">Ce lien expire dans 10 minutes.</p>
          `,
        })
      },
    }),
  ],
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24,     // rafraîchi chaque jour
  },
  user: {
    additionalFields: {
      clubId: {
        type: 'string',
        required: false,
        input: false, // jamais depuis le client
      },
      role: {
        type: 'string',
        defaultValue: 'user',
        input: false, // jamais depuis le client
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
