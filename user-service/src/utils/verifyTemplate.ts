export const getVerifyEmail = (url: string) => ({
  subject: 'Confirm your PeerPrep account',
  text: `Click on the link to verify your email address: ${url}`,
  html: `
    <div style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 20px; text-align: center;">
        <div style="margin-bottom: 20px;">
            <span style="font-size: 24px; font-weight: bold; color: #3b82f6;">
                <span style="color: #6b7280;">&lt;/</span>PeerPrep<span style="color: #6b7280;">&gt;</span>
            </span>
        </div>

        <h1 style="font-size: 24px; color: #1f2937; margin-bottom: 20px;">
            Confirm Your Account
        </h1>

        <a href="${url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 25px; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #3b82f6; border-radius: 6px; text-decoration: none; transition: background-color 0.2s;">
            Verify Email Address
        </a>

        <p style="font-size: 14px; color: #9ca3af; line-height: 1.5; margin-top: 30px;">
            If the button does not work, copy and paste the following link into your web browser:
            <br>
            <a href="${url}" style="color: #3b82f6; word-break: break-all;">${url}</a>
        </p>
    </div>
    `,
});
