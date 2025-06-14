import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendWhatsAppNotification = async (toNumber,taskTitle) => {
     const date = new Date().toLocaleDateString('en-IN'); // e.g., 14/06/2025
  console.log("Sending WhatsApp to:", toNumber);
  console.log("Date:", date, "| Task Title:", taskTitle);

  try {
    await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio Sandbox or approved number
      to: `whatsapp:${toNumber}`,     // e.g., +919876543210
      contentSid: process.env.TASK_TEMPLATE_SID,         // Your approved template SID
     contentVariables: JSON.stringify({
        '1': date,
        '2': taskTitle || 'New Task Assigned'
      })
    });
    console.log(`✅ WhatsApp message sent to ${toNumber}`);
  } catch (err) {
    console.error("❌ Failed to send WhatsApp message:", err);
  }
};

export default sendWhatsAppNotification;
