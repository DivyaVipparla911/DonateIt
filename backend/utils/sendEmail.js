const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendUpdateEmail = (toEmail, donation) => {
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
      console.error('Error sending update email:', error);
    } else {
      console.log('Update email sent:', info.response);
    }
  });
};

const sendDeleteEmail = (toEmail, donation) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Your Donation Has Been Deleted',
    text: `
Hi,

Your donation "${donation.description}" has been deleted.

Thank you for your contribution!
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending delete email:', error);
    } else {
      console.log('Delete email sent:', info.response);
    }
  });
};


const sendDeleteEventEmail = (toEmail, event) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Your Donation Has Been Deleted',
    text: `
Hi,

Your event "${event.name}" has been deleted.

Thank you for your contribution!
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending delete email:', error);
    } else {
      console.log('Delete email sent:', info.response);
    }
  });
};

module.exports = { sendUpdateEmail, sendDeleteEmail, sendDeleteEventEmail };
