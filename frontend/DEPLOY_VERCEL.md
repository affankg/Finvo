Deploying the frontend to Vercel

1. Ensure the repository is pushed to GitHub.
2. In Vercel dashboard, create a new project and import the `frontend` folder as a separate project or pick the monorepo and set the root directory to `frontend`.
3. Set the build command to:

    npm run vercel-build

4. Set the output directory to:

    dist

5. (Optional) Set environment variables in Vercel if you want to override the API URL at build time:

    VITE_API_URL = https://finvo-1vyg1q.fly.dev

6. Deploy.

Notes
- The project uses Vite and TypeScript; the `vercel-build` script sets `VITE_API_URL` so the built app points to the Fly backend.
- If you have CORS restrictions, make sure the backend allows requests from your Vercel domain.
