# MyQRCode

A pure frontend QR code generator built with Vite. Live at https://qrcode.unibuy.fun

## Development

```bash
npm install
npm run dev
```

## Deployment

This project is hosted on Vercel and connected to the GitHub repository. Deployment is automatic.

### Auto Deploy (recommended)

Push changes to the `main` branch and Vercel will redeploy automatically:

```bash
git add .
git commit -m "your message"
git push
```

### Manual Deploy

```bash
npm install -g vercel   # only needed once
vercel --prod
```

## DNS

Custom domain `qrcode.unibuy.fun` is managed in Cloudflare:

- **Type**: CNAME
- **Name**: `qrcode`
- **Value**: `cname.vercel-dns.com`
- **Proxy**: Enabled (orange cloud)
