const nodemailer = require("nodemailer");

const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const recipient = process.env.CONTACT_EMAIL;

    if (!recipient || !process.env.SMTP_HOST) {
      return res.status(500).json({
        message: "Contact email is not configured",
        success: false,
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipient,
      replyTo: email,
      subject: `New bookmarkr contact message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    return res.status(200).json({
      message: "Your message was sent successfully.",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Unable to send your message right now",
      success: false,
    });
  }
};

module.exports = { sendContactMessage };
