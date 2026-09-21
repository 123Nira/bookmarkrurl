# bookmarkrurl

## Password reset

Password reset links expire after 15 minutes and can only be used once. For local development, the reset link is returned by the API after submitting the forgot-password form. For production email delivery, configure these backend environment variables:

```env
FRONTEND_URL=https://your-frontend.example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=no-reply@example.com
CONTACT_EMAIL=your-inbox@example.com
```

The public contact form sends messages to `CONTACT_EMAIL` and sets the visitor's email as `Reply-To`.