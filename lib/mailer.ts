import { createTransporter, type MailTransporter } from './smtp';

const transporter: MailTransporter = createTransporter('mail');

if (process.env.GMAIL_USER && transporter.mailSettings) {
  const gmailUser = process.env.GMAIL_USER;
  const senderName = process.env.MAIL_FROM_NAME || 'ONCHYRA';
  transporter.mailSettings.sender = `"${senderName}" <${gmailUser}>`;
  transporter.mailSettings.senderEmail = gmailUser;
  if (transporter.mailSettings.auth) {
    transporter.mailSettings.auth.user = gmailUser;
    transporter.mailSettings.auth.pass = process.env.GMAIL_PASS || transporter.mailSettings.auth.pass;
  }
}

export default transporter;
