const TronWeb = require('tronweb');
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// TronWeb setup - PRIVATE_KEY must be set in environment variables on Render
const tronWeb = new TronWeb({
  fullHost: process.env.TRON_FULL_NODE || 'https://nile.trongrid.io',
  privateKey: process.env.PRIVATE_KEY || ''
});

// Default USDT (TRC20) contract for Nile testnet (change via ENV if needed)
const USDT_CONTRACT = process.env.USDT_CONTRACT || 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf';

// Nodemailer transporter (EMAIL_USER and EMAIL_PASS required in environment)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.get('/', (req, res) => {
  res.send('✅ TetherApp backend (Render) is running');
});

// Send USDT (TRC20) route
app.post('/send-usdt', async (req, res) => {
  try {
    const recipient = req.body.recipient || req.body.to || req.body.address;
    const amountRaw = req.body.amount || req.body.value;
    if (!recipient || !amountRaw) {
      return res.status(400).json({ success:false, error: 'recipient and amount required' });
    }

    // Convert decimal input (e.g., "1.5") into token units (6 decimals for USDT)
    function toTokenUnits(amount) {
      const parts = String(amount).split('.');
      let whole = parts[0] || '0';
      let frac = parts[1] || '';
      while (frac.length < 6) frac += '0';
      if (frac.length > 6) frac = frac.slice(0, 6);
      const wholeBig = BigInt(whole) * BigInt(1000000);
      const fracBig = BigInt(frac || '0');
      return (wholeBig + fracBig).toString();
    }

    const amount = toTokenUnits(amountRaw);
    console.log(`Sending ${amountRaw} USDT -> ${recipient} (units: ${amount})`);

    const contract = await tronWeb.contract().at(USDT_CONTRACT);
    // call TRC20 transfer method; set a safe feeLimit
    const tx = await contract.methods.transfer(recipient, amount).send({ feeLimit: 1_000_000_000 });

    console.log('Transaction result:', tx);

    // Normalize hash
    let txHash = null;
    if (typeof tx === 'string') txHash = tx;
    else if (tx && tx.transaction && tx.transaction.txID) txHash = tx.transaction.txID;
    else if (tx && tx.txId) txHash = tx.txId;
    else if (tx && tx.txID) txHash = tx.txID;
    else if (tx && tx.result && tx.result.txID) txHash = tx.result.txID;
    else txHash = JSON.stringify(tx);

    return res.json({ success: true, txHash });
  } catch (err) {
    console.error('Send error', err && err.message ? err.message : err);
    return res.status(500).json({ success: false, error: (err && err.message) || String(err) });
  }
});

// Balance route - returns USDT balance for the server wallet (uses address from PRIVATE_KEY)
app.get('/balance', async (req, res) => {
  try {
    const address = tronWeb.address.fromPrivateKey(process.env.PRIVATE_KEY);
    const contract = await tronWeb.contract().at(USDT_CONTRACT);
    const balance = await contract.methods.balanceOf(address).call();
    const readable = Number(balance) / 1_000_000;
    res.json({ success: true, balance: readable });
  } catch (err) {
    console.error('Balance error', err && err.message ? err.message : err);
    res.status(500).json({ success: false, error: (err && err.message) || String(err) });
  }
});

// Send simple email (useful for receipts if you want to call separately)
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    if (!to || !subject || !message) {
      return res.status(400).json({ success:false, error:'to, subject, message required' });
    }

    const mailOptions = {
      from: `"TetherApp" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: message
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent to', to);
    res.json({ success: true });
  } catch (err) {
    console.error('Email error', err && err.message ? err.message : err);
    res.status(500).json({ success:false, error:(err && err.message) || String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 TetherApp backend running on port ${PORT}`));
