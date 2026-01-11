# Frontend Azure Web App Setup Guide

## Prerequisites
- Azure subscription with Resource Group `pluto-rg`
- GitHub repository with frontend code
- Backend API external IP (from AKS deployment)

## Step 1: Create Azure Web App

```bash
# Create Azure Web App for React frontend
az webapp create \
  --resource-group pluto-rg \
  --name pluto-frontend \
  --plan "pluto-frontend-plan" \
  --runtime "NODE|18-lts" \
  --deployment-local-git

# Create App Service Plan (if not exists)
az appservice plan create \
  --resource-group pluto-rg \
  --name pluto-frontend-plan \
  --sku B1 \
  --is-linux
```

## Step 2: Configure Web App Settings

```bash
# Enable static files serving
az webapp config appsettings set \
  --resource-group pluto-rg \
  --name pluto-frontend \
  --settings WEBSITE_WEBDEPLOY_USEMSDEPLOY=true

# Set startup file for React app
az webapp config set \
  --resource-group pluto-rg \
  --name pluto-frontend \
  --startup-file "hostingstart.html"
```

## Step 3: Update Frontend API URL

Update your frontend to use the backend API URL:

### In `frontend/src/api/config.js` or similar:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const config = {
  apiUrl: API_BASE_URL,
  // other config...
};
```

### Update package.json scripts:
```json
{
  "scripts": {
    "build": "REACT_APP_API_URL=https://your-backend-api-url react-scripts build"
  }
}
```

## Step 4: Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add this secret:
- `AZURE_CREDENTIALS`: Your Azure service principal credentials

### How to get Azure credentials:
```bash
# Create service principal
az ad sp create-for-rbac --name "pluto-github-actions" --role contributor --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resource-groups/pluto-rg --json-auth

# Copy the output and add as AZURE_CREDENTIALS secret
```

## Step 5: Create Azure Web App Deployment Workflow

The workflow file `.github/workflows/deploy-frontend.yml` is already created with:
- Node.js 18 setup
- React app build
- Azure Web App deployment
- Automatic deployment on frontend changes

## Step 6: Update API URL in Production

After your backend is deployed, get the external IP:

```bash
# Get backend external IP
kubectl get service pluto-backend-service -n pluto
```

Then update the GitHub Actions workflow to use the correct API URL:

```yaml
- name: Build React app
  run: |
    cd frontend
    REACT_APP_API_URL=http://YOUR_BACKEND_EXTERNAL_IP npm run build
```

## Step 7: Test Deployment

1. Push changes to main branch
2. GitHub Actions will automatically build and deploy
3. Access your app at: `https://pluto-frontend.azurewebsites.net`

## Configuration Files Created:

✅ `.github/workflows/deploy-frontend.yml` - GitHub Actions workflow
✅ `FRONTEND_AZURE_SETUP.md` - This setup guide

## Troubleshooting:

### Common Issues:

1. **Build fails**: Check Node.js version compatibility
2. **API calls fail**: Verify backend external IP is accessible
3. **Static files not serving**: Check Web App configuration
4. **Deployment fails**: Verify Azure credentials

### Debug Commands:

```bash
# Check Web App logs
az webapp log tail --resource-group pluto-rg --name pluto-frontend

# Check Web App configuration
az webapp config show --resource-group pluto-rg --name pluto-frontend

# Test deployment manually
git push azure main
```

## Next Steps:

1. Create Azure Web App using the commands above
2. Add Azure credentials to GitHub secrets
3. Update API URL with backend external IP
4. Push frontend code to trigger deployment
5. Test the live application

## Production Considerations:

- Set up custom domain
- Configure SSL certificate
- Enable Application Insights
- Set up auto-scaling
- Configure CDN for static assets
