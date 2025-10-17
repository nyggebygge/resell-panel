# Railway Deployment Guide

This guide explains how to deploy your Resell Panel application to Railway with MySQL database.

## 🚀 Quick Deployment

### 1. Prerequisites
- Railway account (sign up at [railway.app](https://railway.app))
- GitHub repository with your code
- Stripe account for payments

### 2. Deploy to Railway

#### Option A: Deploy from GitHub
1. Connect your GitHub repository to Railway
2. Railway will automatically detect it's a Node.js project
3. Add MySQL database service
4. Configure environment variables
5. Deploy!

#### Option B: Deploy with Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add MySQL database
railway add mysql

# Deploy
railway up
```

## 🔧 Environment Variables

Set these environment variables in your Railway project:

### Required Variables
```env
# Database (Auto-configured by Railway MySQL)
MYSQL_HOST=${MYSQL_HOST}
MYSQL_PORT=${MYSQL_PORT}
MYSQL_DATABASE=${MYSQL_DATABASE}
MYSQL_USER=${MYSQL_USER}
MYSQL_PASSWORD=${MYSQL_PASSWORD}

# Application
NODE_ENV=production
PORT=3001

# JWT Security
JWT_SECRET=your_super_secure_jwt_secret_here

# CORS (Railway will provide this)
CORS_ORIGIN=${RAILWAY_PUBLIC_DOMAIN}
FRONTEND_URL=${RAILWAY_PUBLIC_DOMAIN}

# Stripe (Get from your Stripe dashboard)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Optional
KEY_LENGTH=16
KEY_CHARS=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789
```

## 🗄️ Database Setup

### 1. Add MySQL Service
In your Railway project:
1. Click "New Service"
2. Select "Database" → "MySQL"
3. Railway will automatically configure the connection

### 2. Database Initialization
The application will automatically create tables on first run. You can also run:

```bash
# Connect to Railway MySQL
railway connect mysql

# Run the schema
mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -h $MYSQL_HOST $MYSQL_DATABASE < backend/sql/schema.sql
```

## 🔐 Security Configuration

### 1. JWT Secret
Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Stripe Configuration
1. Go to your Stripe Dashboard
2. Get your live API keys
3. Set up webhook endpoints pointing to your Railway domain
4. Configure the webhook secret

### 3. CORS Configuration
Railway automatically provides `RAILWAY_PUBLIC_DOMAIN` which is used for CORS.

## 📊 Monitoring & Logs

### View Logs
```bash
railway logs
```

### Monitor Performance
- Railway provides built-in monitoring
- Check the Railway dashboard for metrics
- Set up alerts for errors

## 🔄 Database Migrations

### Initial Setup
The application automatically creates tables on first run.

### Manual Migration (if needed)
```bash
# Connect to your Railway project
railway connect

# Run migration script
node migrate-to-mysql.js
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```
Error: connect ECONNREFUSED
```
**Solution**: Ensure MySQL service is running and environment variables are set.

#### 2. CORS Errors
```
Access to fetch at 'https://your-app.railway.app' from origin 'https://your-frontend.railway.app' has been blocked by CORS policy
```
**Solution**: Set `CORS_ORIGIN` to your frontend domain.

#### 3. Stripe Webhook Errors
```
Invalid webhook signature
```
**Solution**: Ensure `STRIPE_WEBHOOK_SECRET` matches your Stripe webhook configuration.

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

## 🔧 Railway-Specific Optimizations

### 1. Health Checks
Railway automatically monitors the `/health` endpoint.

### 2. Auto-scaling
Railway automatically scales based on traffic.

### 3. SSL/HTTPS
Railway provides automatic SSL certificates.

### 4. Custom Domains
You can add custom domains in the Railway dashboard.

## 📈 Performance Tips

### 1. Database Connection Pooling
The application is configured with optimal connection pooling for Railway:
```javascript
pool: {
  max: 10,
  min: 0,
  acquire: 30000,
  idle: 10000
}
```

### 2. Caching
Consider adding Redis for session storage and caching.

### 3. CDN
Use Railway's built-in CDN for static assets.

## 🔄 Updates & Deployments

### Automatic Deployments
Railway automatically deploys when you push to your main branch.

### Manual Deployments
```bash
railway up
```

### Rollbacks
```bash
railway rollback
```

## 📞 Support

### Railway Support
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)

### Application Support
- Check logs: `railway logs`
- Monitor metrics in Railway dashboard
- Use Railway's built-in debugging tools

## 🎯 Production Checklist

- [ ] MySQL database configured
- [ ] Environment variables set
- [ ] JWT secret configured
- [ ] Stripe keys configured
- [ ] CORS properly configured
- [ ] Health check working
- [ ] SSL certificate active
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Backup strategy in place

## 🚀 Go Live!

Once everything is configured:

1. **Test the deployment**: Visit your Railway URL
2. **Check health**: `https://your-app.railway.app/health`
3. **Test API**: `https://your-app.railway.app/api/test`
4. **Create admin user**: Use the admin creation script
5. **Configure Stripe webhooks**: Point to your Railway domain
6. **Test payments**: Ensure Stripe integration works

Your Resell Panel is now live on Railway! 🎉

---

**Railway Deployment Complete!** 

Your application is now hosted on Railway with:
- ✅ Automatic SSL/HTTPS
- ✅ MySQL database
- ✅ Auto-scaling
- ✅ Global CDN
- ✅ Built-in monitoring
- ✅ Easy updates via Git
