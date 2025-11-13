TetherApp (Render-ready) backend
--------------------------------
This backend provides:
  - POST /send-usdt   -> send TRC20 USDT (Nile testnet)
  - GET  /balance     -> returns server wallet's USDT balance
  - POST /send-email  -> sends an email via Gmail SMTP

IMPORTANT (security):
  - This package does NOT include your private key. You MUST set PRIVATE_KEY in Render's Environment settings.
  - Do NOT commit any file that contains your private key.

Deploying on Render:
  1. Create a new Web Service on Render and connect your repo (or upload files).
  2. In the Render service settings, set Environment -> Environment Variables:
     - PRIVATE_KEY = (your nile testnet private key)
     - EMAIL_USER   = tetherflashapp@gmail.com
     - EMAIL_PASS   = <your gmail app password>
     - USDT_CONTRACT (optional) defaults to the Nile USDT token
  3. Start the service (Render will run `npm install` and `npm start`).

Testing endpoints:
  - GET  /           -> health check
  - GET  /balance    -> returns { success: true, balance: <number> }
  - POST /send-usdt  -> body: { "recipient":"T...","amount":"1.5" }

Notes:
  - USDT uses 6 decimals on Tron; amounts are entered in human-readable units (e.g., 1.5).
  - Ensure the server wallet (PRIVATE_KEY) has enough TRX to pay transaction fees on Nile testnet.
