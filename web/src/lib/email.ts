import nodemailer from 'nodemailer';

interface SendInvitationEmailParams {
    to: string;
    token: string;
    roleName: string;
    companyName: string;
}

export async function sendInvitationEmail({ to, token, roleName, companyName }: SendInvitationEmailParams) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
    // Remove trailing slash if present
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const inviteLink = `${cleanBaseUrl}/auth/accept-invitation?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"AtlasERP" <no-reply@atlaserp.com>',
        to,
        subject: `Invitation à rejoindre ${companyName} sur AtlasERP`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 12px;">
                <h2 style="color: #2563eb; font-weight: 800; margin-bottom: 20px;">Rejoignez ${companyName} sur AtlasERP</h2>
                <p>Bonjour,</p>
                <p>Vous avez été invité à rejoindre l'entreprise <strong>${companyName}</strong> sur AtlasERP en tant que <strong>${roleName}</strong>.</p>
                <p>Pour accepter cette invitation et configurer votre mot de passe, veuillez cliquer sur le lien ci-dessous :</p>
                <p style="margin: 30px 0; text-align: center;">
                    <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
                        Accepter l'invitation
                    </a>
                </p>
                <p style="color: #64748b; font-size: 12px; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                    Ce lien d'invitation est valable pendant 7 jours. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.
                </p>
            </div>
        `,
    };

    let transporter;

    if (process.env.EMAIL_SERVER) {
        // e.g. smtp://user:pass@smtp.mailtrap.io:2525
        transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);
    } else if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    } else {
        // Fallback: Ethereal test email account
        console.log('No SMTP configurations found. Creating an Ethereal test email account...');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`\n==================================================`);
        console.log(`📧 INVITATION EMAIL SENT TO: ${to}`);
        console.log(`Message ID: ${info.messageId}`);
        // If ethereal, print the test preview URL
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`Preview URL: ${previewUrl}`);
        } else {
            console.log(`Invite Link: ${inviteLink}`);
        }
        console.log(`==================================================\n`);
        return { success: true, messageId: info.messageId, previewUrl };
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}
