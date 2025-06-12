import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,     // Your email (e.g., thermopackers@gmail.com)
    pass: process.env.EMAIL_PASS,     // App password from Gmail
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Thermo Packers" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log("✅ Email sent to:", to);
  } catch (error) {
    console.error("❌ Email sending error:", error);
  }
};

export default sendEmail;
