const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS,
  },
});

const sendUpdateEmail = (toEmail, donation) => {
  console.log("here");
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Your Donation Has Been Updated',
    text: `
Hi,

Your donation "${donation.name}" has been updated.

Status: ${donation.status}
Assignee: ${donation.assignee}
Pickup Date and Time: ${donation.dateTime}

Thank you for your contribution!
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

module.exports = sendUpdateEmail;
