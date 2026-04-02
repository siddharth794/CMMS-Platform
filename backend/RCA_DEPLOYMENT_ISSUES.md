# Root Cause Analysis (RCA): Deployment and Build Failures

**Date:** April 2026
**Impacted Services:** Backend API & WebSocket Server
**Platforms Involved:** Local Environment, Vercel, Render

## 1. Problem Statement
During the deployment of the Node.js/TypeScript backend, several critical issues were encountered:
1. **Local Environment:** The `npm run build` command failed to generate the `dist/` folder.
2. **Vercel Deployment:** The build failed with `MODULE_NOT_FOUND` because it could not find `dist/server.js`, and the deployment crashed.
3. **Render Deployment:** The deployment faced bottlenecks because the TypeScript compiler (`tsc`) was missing or running out of memory.

## 2. Root Causes

### Issue A: Local `dist` Folder Not Generating
**Cause:** The TypeScript compiler (`tsc`) requires type definitions (e.g., `@types/express`, `@types/node`) to successfully compile the code. These are stored in `devDependencies`. The local environment was missing these dependencies (likely due to a partial install or running an install command that omitted dev packages), causing `tsc` to fail with module resolution errors and halt the creation of the `dist/` directory.

### Issue B: Vercel Deployment Failure
**Cause:** There were two distinct root causes for Vercel:
1. **Missing Build Step:** Vercel did not automatically execute the TypeScript build step, so `dist/server.js` was never generated.
2. **Architectural Mismatch (Critical):** Vercel is a **Serverless** platform. Serverless functions spin up to answer a single HTTP request and immediately shut down. The CMMS backend is designed as a **Long-Running Process** that uses `httpServer.listen()` and relies heavily on **Socket.IO (WebSockets)** for real-time AI Agent features. Vercel *does not support* WebSockets or long-running Express servers, meaning even if the build succeeded, the app would fundamentally break.

### Issue C: Render Deployment Bottlenecks and Port Detection
**Cause:** When deploying to Render, the system encountered two distinct issues:
1. **Missing Dev Dependencies:** The deployment system sets `NODE_ENV=production` by default. When standard `npm install` or `npm ci` is run with this environment variable, NPM automatically skips installing `devDependencies`. Because TypeScript (`tsc`) is a dev dependency, the build phase failed immediately with missing type definition errors (e.g., `error TS2307: Cannot find module 'jest-mock-extended'`).
2. **Port Binding Timeout:** Render expects the application to bind to a specific port (usually defined by the `PORT` environment variable automatically injected by Render) within a certain timeframe after startup. The application initially failed to bind or report its port binding to Render in time, causing Render health checks to time out (`Port scan timeout reached, no open ports detected`).
Additionally, `tsc` is highly memory-intensive and often exceeds the 512MB RAM limit on free/starter tiers, causing `OOM (Out Of Memory)` crashes.

## 3. Resolution & Fixes Applied

### 1. Fixing Local Builds
To ensure the `dist/` folder is created locally, we restored the full dependency tree (including dev tools) by running:
```bash
npm install
npm run build
```

### 2. Migrating off Vercel
We determined Vercel is structurally incompatible with this backend due to the Socket.IO requirement. We shifted the deployment target to **Render** (a Platform-as-a-Service that supports long-running Docker/Node containers and WebSockets).

### 3. Optimizing Render Build Commands and Configuration
To solve the `devDependencies` stripping, port binding issues, and memory bottlenecks on Render, we implemented the following specific configurations:

*   **Build Command Fix:** We separated the build and start commands properly. Initially, the failing setup was trying to run `npm run build && npm run start` as the build command, causing timeouts and confusion. We corrected the Render configuration to:
    **Build Command:** 
    ```bash
    npm ci --include=dev && npm run build
    ```
    *Explanation:* The `--include=dev` flag overrides the `NODE_ENV=production` behavior, forcing NPM to install TypeScript and all necessary type definitions (fixing the `error TS7016` and `TS2307` errors) so the code can compile cleanly.
*   **Start Command Fix (Port Binding):** We ensured the Render "Start Command" was properly isolated:
    **Start Command:**
    ```bash
    npm start
    ```
    *Explanation:* This ensures the application starts cleanly *after* the build completes. The application's `server.ts` was already correctly configured to listen on `process.env.PORT || 8000`, allowing Render to successfully detect the service running on port 8000 and pass the health checks (`Detected service running on port 8000`).
*   **Memory Limit Configuration:** The `package.json` was already utilizing a memory-limited build script:
    ```json
    "build": "NODE_OPTIONS='--max-old-space-size=460' tsc"
    ```
    *Explanation:* This caps Node's memory usage at 460MB, preventing the Render container (512MB limit) from killing the process due to Out-Of-Memory errors.

## 4. Lessons Learned & Prevention
*   **Platform Evaluation:** Always evaluate the architectural requirements of an application (e.g., WebSockets, background cron jobs) against the hosting platform's capabilities before deployment. Serverless platforms (Vercel, Netlify) are strictly for stateless REST APIs and frontends.
*   **Production Build Pipelines:** When using TypeScript, the build pipeline must explicitly account for the presence of `devDependencies`. Standardizing the use of `npm ci --include=dev` for build pipelines ensures consistency across all environments.