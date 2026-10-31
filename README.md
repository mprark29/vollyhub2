# Friends of Pine Ridge — Volunteer Hub 2.0 (Vite startup fix)

This version fixes the indefinite startup screen caused by importing Supabase from an external CDN at runtime. Supabase is now an npm dependency bundled by Vite during deployment. The original database and RLS are unchanged.

## GitHub → Vercel deployment

1. Upload **the contents of this folder** to the root of your GitHub repository, replacing the previous initial rebuild. Keep `package.json`, `index.html`, `src/` and `vercel.json` at the repository root.
2. In Vercel, select **Framework Preset: Vite**. **Root Directory:** repository root (`./`). **Build Command:** `npm run build`. **Output Directory:** `dist`. **Install Command:** `npm install` (default).
3. Redeploy staging and check the deployment build log for success. Vercel must run the build; do not serve `index.html` as an unbuilt static file.
4. Test sign-in, access levels and data reads. Keep production unchanged.

## Local development

`npm install` then `npm run dev`. To check production build: `npm run build`.

## Limitations

This fixes the loading mechanism, not every application workflow. Supabase operations and RLS have not been live tested. Event creation, gallery moderation, hazard evidence and attendance approvals are not yet ported. No SQL changes required. Never commit a service-role key.
