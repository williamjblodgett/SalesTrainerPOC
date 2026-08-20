# Authentication operations

Suadence uses Supabase Auth directly. It has no ChatGPT authentication dependency.

## Production contract

- Canonical Site URL: `https://salessim-five.vercel.app`
- Allowed callbacks: `/auth/confirm` and `/auth/callback` on the canonical origin
- Access mode: invite-only (`disable_signup=true`)
- Minimum password length: 12 characters
- Recovery and invitation templates: `supabase/auth-production-config.json`
- Recovery verification: token hash → server-side `verifyOtp` → SSR cookie → 15-minute HTTP-only recovery intent → password update → global sign-out

Run **Configure production Supabase Auth** with project reference `iwigbylktbudvmjtqdvi` and confirmation `CONFIGURE_AUTH`. The workflow needs a production `SUPABASE_ACCESS_TOKEN` secret with `auth_config_write` permission.

After configuration, request a fresh link from `/forgot-password`. Old recovery links cannot be repaired and should remain invalid because they are one-time credentials.

## Invite workflow

1. An owner invites an approved pilot user through Supabase Admin or a future owner-only team action.
2. The email uses the token-hash invite template and opens `/auth/confirm`.
3. The server verifies the token and opens `/reset-password` with a short-lived recovery session.
4. The user creates a password and is signed out globally.
5. The user signs in normally. A membership must exist before tenant data is available.

Do not create shared passwords, send temporary credentials in chat, or re-enable public signup for the pilot.
