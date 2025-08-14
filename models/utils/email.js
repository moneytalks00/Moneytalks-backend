const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
  try {
    // Create transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, //themoneytalks.web@gmail.com
        pass: process.env.EMAIL_PASS  // xkbw ogav yhdz xmsq
      }
    });

    // Send mail
    await transporter.sendMail({
      from: `"MoneyTalks" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });

    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Email sending failed:", err);
  }
};

module.exports = sendEmail;
      
