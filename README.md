# Password Strength Lab

A simple TypeScript demo that runs entirely in the browser (Vite + React) to visualize password strength, crack-time estimates, and quick explainers for MFA and passkeys.

## Project layout
- `client/`: React single-page app with a self-contained strength calculator.

## Getting started
1. Install dependencies:
   ```bash
   cd client
   npm install
   ```
2. Run the front end (Vite dev server):
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
4. Preview the production build locally:
   ```bash
   npm run preview
   ```

Use the preset buttons to quickly demonstrate how complexity changes the strength meter, then point to the MFA and passkey sections for extra security tips. Everything is computed locally—no API needed.
