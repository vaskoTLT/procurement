# Telegram Authentication Setup Guide

## Overview

This guide provides comprehensive instructions for setting up Telegram authentication in the Procurement application. The system ensures that only authorized users with Telegram IDs stored in the PostgreSQL database can access the application.

## Current Implementation

The application currently uses the following authentication flow:

1. **Telegram WebApp Integration**: Users access the application through a Telegram bot
2. **Telegram ID Verification**: The backend checks the user's Telegram ID against the `authorized_users` table
3. **Database Storage**: Authorized Telegram IDs are stored in PostgreSQL with user metadata

## New Features Implemented

### 1. Enhanced Telegram Authentication

- **JWT Token Generation**: Secure token generation for Telegram deep links
- **Token Verification**: Middleware for validating Telegram WebApp initData
- **Deep Link Support**: Secure URL generation for authorized access

### 2. Telegram Bot Setup

- **Bot Creation**: Step-by-step guide for creating Telegram bots
- **WebApp Configuration**: Instructions for setting up Telegram WebApps
- **Security Settings**: Best practices for bot security configuration

### 3. User Management

- **SQL-Based Management**: Easy addition/removal of authorized users
- **Access Control**: Fine-grained control over user permissions
- **Audit Logging**: Tracking of authentication attempts

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.production.example`:

```bash
cp .env.production.example .env
```

Edit the `.env` file with your specific values:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_TOKEN_SECRET=your_strong_secret_key_for_jwt
TELEGRAM_BOT_USERNAME=your_bot_username
```

### 3. Set Up Telegram Bot

Follow the detailed instructions in `TELEGRAM_BOT_SETUP.md`:

1. Create a new bot with @BotFather
2. Configure WebApp settings
3. Set up domain and security settings
4. Generate deep link tokens

### 4. Add Authorized Users

Add users to the `authorized_users` table:

```sql
INSERT INTO authorized_users (telegram_id, username, description)
VALUES (123456789, 'user_name', 'User description')
ON CONFLICT (telegram_id) DO NOTHING;
```

### 5. Start the Application

```bash
cd backend
npm start
```

## API Endpoints

### Telegram Authentication Endpoints

- **POST `/api/telegram/generate-token`**: Generate a secure token for Telegram deep links
- **GET `/api/telegram/verify-token`**: Verify a token from a Telegram deep link
- **GET `/api/telegram/authorized-users`**: Get list of authorized users (admin only)

### Existing Authentication Endpoints

- **GET `/api/auth/check`**: Check if user is authorized
- **GET `/api/auth/me`**: Get current user information

## Security Best Practices

1. **Token Security**: Use strong secret keys and short expiration times
2. **HTTPS Only**: Ensure all communications use HTTPS
3. **Regular Audits**: Review authorized users periodically
4. **Logging**: Monitor authentication attempts for suspicious activity
5. **Rate Limiting**: Implement rate limiting on authentication endpoints

## Troubleshooting

### Common Issues

1. **Bot not opening WebApp**:
   - Verify domain is added in BotFather
   - Ensure HTTPS is used
   - Check WebApp configuration

2. **User authorized but access denied**:
   - Verify Telegram ID is correctly added to database
   - Check `is_active = true` status
   - Review backend logs for errors

3. **Token validation errors**:
   - Ensure correct bot token is used
   - Verify HMAC algorithm implementation
   - Check token expiration settings

## Migration from Existing System

If upgrading from a previous version:

1. **Backup your database** before running migrations
2. **Run the migration script**:
   ```bash
   docker exec -it procurement-db psql -U procurement_user -d procurement_db -f /docker-entrypoint-initdb.d/05-add-telegram-auth.sql
   ```
3. **Update environment variables** with new Telegram settings
4. **Test thoroughly** before deploying to production

## Support

For additional help or questions about Telegram authentication setup, refer to:

- `TELEGRAM_BOT_SETUP.md` - Detailed bot setup instructions
- `TELEGRAM_AUTH.md` - Original authentication documentation
- Project README files for general setup information

## License

This authentication system is provided as part of the Procurement application under the same license terms.