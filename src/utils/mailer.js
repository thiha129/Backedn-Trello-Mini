const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(to, code) {
  const mailOptions = {
    from: `Mini Trello <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Mã xác thực Mini Trello',
    text: `Mã xác thực của bạn là: ${code}`,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail }; 