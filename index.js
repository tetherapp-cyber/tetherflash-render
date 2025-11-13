const express = require("express");
const bodyParser = require("body-parser");
const TronWeb = require("tronweb");
const nodemailer = require("nodemailer");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ---------- TRONWEB SETUP ----------
const tronWeb = new TronWeb({
  fullHost: "https://nile.trongrid.io",
  privateKey: process.env.PRIVATE_KEY,
});

const USDT_CONTRACT = "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf";

// ---------- EMAIL SETUP ----------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail
    pass: process.env.EMAIL_PASS, // your Gmail App Password
  },
});

// ---------- HOME ROUTE ----------
app.get("/", (req, res) => {
  res.send("✅ TetherApp Backend Running Successfully");
});

// ---------- SEND USDT + EMAIL ----------
app.post("/send-usdt", async (req, res) => {
  try {
    const { recipient, amount, email } = req.body;
    if (!recipient || !amount) {
      return res.status(400).json({ success: false, error: "Missing recipient or amount" });
    }

    // Convert USDT decimal (6)
    const toTokenUnits = (amt) => {
      const [whole, frac = ""] = amt.split(".");
      const fixed = frac.padEnd(6, "0").slice(0, 6);
      return (BigInt(whole || "0") * 1000000n + BigInt(fixed)).toString();
    };

    const amountInUnits = toTokenUnits(amount);
    const contract = await tronWeb.contract().at(USDT_CONTRACT);
    const tx = await contract.methods.transfer(recipient, amountInUnits).send({ feeLimit: 1000000000 });
    const txHash = typeof tx === "string" ? tx : tx.txID || tx.transaction?.txID;

    // ---------- SEND EMAIL ----------
    if (email) {
      const template = fs.readFileSync("email-template.html", "utf8");
      const html = template
        .replace("{{amount}}", amount)
        .replace("{{recipient}}", recipient)
        .replace("{{txLink}}", `https://nile.tronscan.org/#/transaction/${txHash}`);

      await transporter.sendMail({
        from: `"TetherApp" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Transaction Successful ✅",
        html,
      });
    }

    return res.json({
      success: true,
      txHash,
      message: "Transaction sent successfully and email sent",
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));