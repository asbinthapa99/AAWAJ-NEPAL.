// Environment variable validation for Awaaz Nepal
// This file validates all required environment variables at startup

const requiredEnvVars = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key',
  
  // Email (Brevo)
  BREVO_SMTP_USER: 'Brevo SMTP username',
  BREVO_SMTP_PASS: 'Brevo SMTP password',
  BREVO_SENDER_EMAIL: 'Sender email address',
  BREVO_SENDER_NAME: 'Sender name (optional)',
  
  // hCaptcha
  HCAPTCHA_SECRET_KEY: 'hCaptcha secret key',
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY: 'hCaptcha site key',
} as const;

const optionalEnvVars = {
  BREVO_SENDER_NAME: 'Awaaz Nepal',
} as const;

export function validateEnvironment() {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  for (const [key, description] of Object.entries(requiredEnvVars)) {
    if (!process.env[key]) {
      missing.push(`${key}: ${description}`);
    }
  }

  // Check optional environment variables and set defaults
  for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      warnings.push(`Using default value for ${key}: ${defaultValue}`);
    }
  }

  // Report issues
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(msg => console.error(`  - ${msg}`));
    console.error('\nPlease set these environment variables and restart the server.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    warnings.forEach(msg => console.warn(`  - ${msg}`));
  }

  console.log('✅ Environment variables validated successfully');
}

// Validate environment immediately when this module is imported
validateEnvironment();
