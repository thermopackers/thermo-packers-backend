import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendWhatsAppNotification = async (toNumber) => {
  try {
    await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio Sandbox or approved number
      to: `whatsapp:${toNumber}`,     // e.g., +919876543210
      contentSid: process.env.TASK_TEMPLATE_SID,         // Your approved template SID
      contentVariables: JSON.stringify({
        '1': date,           // 👈 corresponds to {{1}}
        '2': taskTitle       // 👈 corresponds to {{2}}
      })
    });
    console.log(`✅ WhatsApp message sent to ${toNumber}`);
  } catch (err) {
    console.error("❌ Failed to send WhatsApp message:", err);
  }
};

export default sendWhatsAppNotification;
