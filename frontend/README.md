This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Run Locally

Start the backend on port `5000` and the frontend on port `3000`:

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

The frontend proxies `/api/*` to `http://localhost:5000`, so browser requests and
the authentication cookie stay on the frontend origin.

## Share With ngrok

Use a production Next.js server for the public tunnel. Next development mode
expects a local HMR WebSocket, which ngrok cannot reliably provide:

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run build
npm run start -- -H 0.0.0.0 -p 3000

# terminal 3
ngrok http 3000 --request-header-add "ngrok-skip-browser-warning: 1"
```

Share the HTTPS URL printed by ngrok. This header prevents ngrok's free-tier
`ERR_NGROK_6024` warning page from replacing the application. If the warning
still appears, click **Visit Site** once, then reload the URL. Do not set
`NEXT_PUBLIC_API_URL` for this setup and do not run ngrok against port `5000`;
the Next.js proxy handles the backend connection. Restart `npm run dev` after
changing environment variables, rebuild and restart `next start`, then open the
ngrok URL in a fresh browser window.

For a different local backend address, set `API_URL` in `frontend/.env` before
starting Next.js, for example `API_URL=http://127.0.0.1:5000`.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
