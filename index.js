import express from "express";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ⚙️ Transporter config — use your own email + app password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yourgmail@gmail.com", // your Gmail
    pass: "your_app_password"    // use Google App Password, not normal password
  }
});

app.post("/send-usdt", async (req, res) => {
  try {
    const { email, amount, txid } = req.body;

    const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; background-color:#ffffff; padding:20px; border-radius:12px; border:1px solid #00C853; max-width:600px; margin:auto;">
      <h2 style="color:#00C853; text-align:center;">TetherFlash Transaction Confirmation</h2>
      <p style="font-size:16px; color:#333;">Dear user,</p>
      <p style="font-size:16px; color:#333;">
        Your recent <strong>USDT transaction</strong> was successful.
      </p>
      <div style="background:#f8f8f8; padding:15px; border-radius:8px; border-left:5px solid #00C853; margin:15px 0;">
        <p><strong>Amount:</strong> ${amount} USDT</p>
        <p><strong>Transaction ID:</strong> ${txid}</p>
        <p><strong>Status:</strong> Successful ✅</p>
      </div>
      <p style="font-size:14px; color:#555;">
        Thank you for using <strong style="color:#00C853;">TetherFlash</strong>.  
        If you did not authorize this transaction, please contact support immediately.
      </p>
      <div style="text-align:center; margin-top:25px;">
        <a href="https://tetherflash.app" style="background-color:#00C853; color:white; padding:10px 25px; text-decoration:none; border-radius:6px; font-weight:bold;">
          Visit Dashboard
        </a>
      </div>
      <p style="text-align:center; color:#999; font-size:12px; margin-top:25px;">
        © 2025 TetherFlash. All rights reserved.
      </p>
    </div>
    `;

    await transporter.sendMail({
      from: '"TetherFlash" <yourgmail@gmail.com>',
      to: email,
      subject: "Your USDT Transaction Receipt",
      html: htmlTemplate
    });

    res.json({ success: true, message: "Email sent successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send email", error: err.message });
  }
});

app.listen(3000, () => console.log("✅ Server running on port 3000"));