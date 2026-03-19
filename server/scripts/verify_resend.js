require('dotenv').config({ path: '../.env' });
const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
    console.error("❌ RESEND_API_KEY is missing from .env");
    process.exit(1);
}

const resend = new Resend(apiKey);

async function testEmail() {
    console.log("📧 Sending test email via Resend...");
    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev', // Default testing domain
            to: 'delivered@resend.dev', // Safe testing address
            subject: 'Aris SaaS Readiness Check',
            html: '<p><strong>SaaS Readiness verified.</strong> Email integration is operational.</p>'
        });

        if (error) {
            console.error("❌ Resend Error:", error);
            process.exit(1);
        }

        console.log("✅ Email sent successfully!", data);
    } catch (e) {
        console.error("❌ Exception:", e);
        process.exit(1);
    }
}

testEmail();
