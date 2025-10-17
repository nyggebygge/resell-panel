# Configuration Guide

## Environment Variables

Create a `.env` file in the project root with the following variables:

### Frontend Configuration
```env
FRONTEND_PORT=3000
FRONTEND_URL=http://localhost:3000
```

### Backend Configuration
```env
BACKEND_PORT=3001
BACKEND_URL=http://localhost:3001
API_BASE_URL=http://localhost:3001/api
CORS_ORIGIN=http://localhost:3000
```

### Database Configuration
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=resell_panel
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_DIALECT=mysql
```

### JWT Configuration
```env
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
```

### Key Generation Configuration
```env
KEY_LENGTH=16
KEY_CHARS=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789
```

### Development Configuration
```env
NODE_ENV=development
DEBUG_MODE=true
```

## Hardcoded Values Removed

The following hardcoded values have been made configurable:

1. **API Base URL**: Now uses `CONFIG.API.BASE_URL`
2. **Port Numbers**: Now use environment variables
3. **Key Thresholds**: Now use `CONFIG.KEYS.NEW_KEY_THRESHOLD`
4. **Timeouts**: Now use `CONFIG.UI.NOTIFICATION_DURATION`
5. **Default Credentials**: Now use `CONFIG.DEV.DEFAULT_EMAIL` and `CONFIG.DEV.DEFAULT_PASSWORD`
6. **Key Generation**: Now uses `CONFIG.KEYS.KEY_LENGTH` and `CONFIG.KEYS.KEY_CHARS`
7. **Demo Keys**: Now uses `CONFIG.KEYS.DEMO_KEYS` configuration

## Configuration Files

- `js/config.js` - Frontend configuration
- `backend/.env` - Backend environment variables
- `CONFIG.md` - This documentation

## Usage

The configuration is automatically loaded in the frontend. For the backend, ensure your `.env` file is in the `backend/` directory.
