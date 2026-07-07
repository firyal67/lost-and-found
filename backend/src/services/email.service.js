const nodemailer = require('nodemailer');

const createTransporter = async () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  console.log(`Ethereal account: ${testAccount.user}`);
  return transporter;
};

const sendVerificationEmail = async ({ to, name, token }) => {
  const transporter = await createTransporter();
  const verifyUrl = `${process.env.CLIENT_URL}/auth/verify-email?token=${token}`;

  const info = await transporter.sendMail({
    from: `"Lost & Found Tunisie" <${process.env.SMTP_USER || 'noreply@lostandfound.tn'}>`,
    to,
    subject: 'Confirmez votre adresse email — Lost & Found Tunisie',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #1d4ed8; margin-bottom: 8px;">Lost&Found Tunisie</h2>
        <p style="color: #374151;">Bonjour <strong>${name}</strong>,</p>
        <p style="color: #374151;">Merci de vous être inscrit. Cliquez sur le bouton ci-dessous pour confirmer votre adresse email.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Confirmer mon email
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">Ce lien expire dans <strong>24 heures</strong>.</p>
        <p style="color: #6b7280; font-size: 13px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Lost & Found Tunisie — Plateforme de déclaration d'objets perdus et trouvés</p>
      </div>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) {
    console.log(`Email preview: ${previewUrl}`);
  }

  return { info, previewUrl };
};

const sendPasswordResetEmail = async ({ to, name, token }) => {
  const transporter = await createTransporter();
  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`;

  const info = await transporter.sendMail({
    from: `"Lost & Found Tunisie" <${process.env.SMTP_USER || 'noreply@lostandfound.tn'}>`,
    to,
    subject: 'Réinitialisation de votre mot de passe — Lost & Found Tunisie',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #1d4ed8; margin-bottom: 8px;">Lost&Found Tunisie</h2>
        <p style="color: #374151;">Bonjour <strong>${name}</strong>,</p>
        <p style="color: #374151;">Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">Ce lien expire dans <strong>1 heure</strong>.</p>
        <p style="color: #6b7280; font-size: 13px;">Si vous n'avez pas demandé de réinitialisation, ignorez cet email — votre mot de passe reste inchangé.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Lost & Found Tunisie — Plateforme de déclaration d'objets perdus et trouvés</p>
      </div>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) {
    console.log(`Password reset email preview: ${previewUrl}`);
  }

  return { info, previewUrl };
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
