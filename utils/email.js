const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter.
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    // This was suggested by stack overflow.
    // link: https://stackoverflow.com/questions/66317125/node-js-nodemailer-error-wrong-version-number-invalid-greeting
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
    },
  });

  // 2) Define the email options.
  const mailOptions = {
    from: 'Pranjal Gupta <pranjal@pranjal.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: // used to specify the html content of the message.
  };

  // 3) Actually send the email.
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
