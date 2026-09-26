const axios = require("axios");
require("dotenv").config();

// Exportamos un objeto con el mismo método sendMail para compatibilidad,
// pero internamente usa la API HTTP de Brevo (NUNCA será bloqueado por Railway).
const transporter = {
  sendMail: async ({ from, to, subject, html, text }) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER;
    if (!apiKey || !senderEmail) {
      throw new Error("Servicio de correo no configurado");
    }

    const senderName = process.env.BREVO_SENDER_NAME || "INVERSAN";

    // Aseguramos que 'to' sea siempre un arreglo y le damos formato a Brevo
    const toRecipients = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];

    const data = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: toRecipients,
      subject: subject,
      htmlContent: html,
      textContent: text || html.replace(/<[^>]+>/g, ''), // Fallback de texto
    };

    try {
      const response = await axios.post("https://api.brevo.com/v3/smtp/email", data, {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      return response.data;
    } catch (error) {
      console.error("❌ Error de Brevo API:", error.response?.data || error.message);
      throw error;
    }
  },
};

module.exports = transporter;
