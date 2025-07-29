# 🌐 Netlify Deployment Guide - AI Education Template

> **Specifieke Netlify configuratie voor de Complete AI Education Template met TTS, Streaming en Multi-Modal Features**

## ⚡ Quick Deploy via Bolt.new

### 1-Click Deploy
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy)

```bash
# Direct deployment vanuit Bolt.new:
1. Klik "Deploy to Netlify" in Bolt interface
2. Authorize Netlify GitHub access
3. Site wordt automatisch geconfigureerd
4. Add environment variables (zie hieronder)
5. Ready to go! 🚀
```

## 🔧 Netlify Configuration

### Build Settings (Kritisch!)
```toml
# netlify.toml - Automatisch geconfigureerd
[build]
  command = "npm run build"
  publish = ""                    # LEEG LATEN voor Next.js
  
[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "8"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Environment Variables Setup
**Site Settings → Environment Variables:**

| Variable | Value | Required | Purpose |
|----------|-------|----------|---------|
| `GEMINI_API_KEY` | `gai_xxxxxxx` | ✅ Yes | Alle AI functionaliteiten (Chat, TTS, Audio transcriptie) |
| `NODE_ENV` | `production` | ✅ Auto-set | Production optimizations |

🔑 **API Key Sources:**
- **Gemini**: [Google AI Studio](https://makersuite.google.com/app/apikey) - Alle functionaliteiten

## 🚀 Function Configuration

### Serverless Functions Overview
```javascript
// Automatisch gecreëerde Netlify Functions:
src/app/api/chat/route.ts           → /.netlify/functions/chat
src/app/api/chat-stream/route.ts    → /.netlify/functions/chat-stream  
src/app/api/generate-tts/route.ts   → /.netlify/functions/generate-tts
src/app/api/transcribe-audio/route.ts → /.netlify/functions/transcribe-audio
src/app/api/upload-docx/route.ts    → /.netlify/functions/upload-docx
```

### Function Limits & Timeouts
| Feature | Free Tier | Pro Tier | Notes |
|---------|-----------|----------|-------|
| **Function Timeout** | 10 seconds | 26 seconds | TTS kan 15s duren |
| **Memory** | 1024MB | 3008MB | Voor grote bestanden |
| **Monthly Executions** | 125K | 2M | Monitor TTS usage |
| **Background Functions** | ❌ No | ✅ Yes | Voor lange audio |

⚠️ **TTS Recommendation:** Pro account voor reliable TTS performance

## 🎯 Performance Optimizations

### Netlify Edge Functions
```toml
# netlify.toml - Edge optimizations
[[edge_functions]]
  function = "chat-stream"
  path = "/api/chat-stream"
  
[[edge_functions]]  
  function = "generate-tts"
  path = "/api/generate-tts"
```

### CDN & Caching
```toml
# Cache static assets
[[headers]]
  for = "/static/*"
  [headers.values]
    cache-control = "public, max-age=31536000, immutable"

# TTS Audio caching  
[[headers]]
  for = "/api/generate-tts"
  [headers.values]
    cache-control = "public, max-age=3600"
    Access-Control-Allow-Origin = "*"
```

### Image & Asset Optimization
```toml
# Automatic image optimization
[build.processing]
  skip_processing = false

[build.processing.images]
  compress = true
  
[build.processing.css]
  bundle = true
  minify = true
```

## 🛡️ Security Configuration

### Headers & CORS
```toml
# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com;"

# API CORS  
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
```

### Environment Security
```bash
# Best practices:
✅ Never commit API keys to code
✅ Use Netlify env vars only
✅ Rotate keys regularly  
✅ Monitor API usage/costs
✅ Restrict API key permissions waar mogelijk
```

## 📊 Monitoring & Analytics

### Netlify Analytics Setup
```toml
# netlify.toml
[build]
  environment = { NETLIFY_ANALYTICS = "true" }
```

**Enable in Dashboard:**
1. Site Settings → Analytics
2. Enable site analytics
3. Monitor TTS & API usage
4. Track performance metrics

### Function Monitoring
```bash
# Key metrics to monitor:
- Function execution duration (vooral TTS)
- Memory usage (voor file uploads)
- Error rates per endpoint
- API quota usage (Gemini/OpenAI)
- Bandwidth usage (TTS audio files)
```

### Custom Monitoring
```javascript
// Add to pages/api functions:
console.log('Function execution:', {
  timestamp: new Date().toISOString(),
  function: 'generate-tts',
  duration: Date.now() - startTime,
  success: true
});
```

## 🚨 Troubleshooting Netlify Issues

### Build Failures
```bash
# Common build errors:
❌ "Publish directory not found"     → Set publish to EMPTY
❌ "Command failed: npm run build"   → Check package.json scripts  
❌ "Out of memory"                   → Upgrade to Pro for more memory
❌ "Function build timeout"          → Check dependencies
```

**Fix Steps:**
1. Check Build Settings: `npm run build` + empty publish
2. Verify Node version: 18.x in env vars
3. Clear build cache: Deploys → Clear cache
4. Check build logs voor specific errors

### Function Errors
```bash
# TTS Function Issues:
❌ "Function timeout"               → Upgrade to Pro
❌ "API key not found"             → Check env vars exactly  
❌ "CORS error"                    → Add headers (zie config)
❌ "Audio generation failed"       → Check Gemini API quota
```

### Performance Issues
```bash
# Slow responses:
🐌 Cold starts (first request)     → Use Edge Functions
🐌 Large file processing          → Optimize file sizes  
🐌 TTS generation slow            → Monitor API response times
🐌 Memory issues                  → Upgrade plan or optimize code
```

## 🔄 Deployment Workflows

### Automatic Git Deployment
```bash
# Setup via Dashboard:
1. Site Settings → Build & Deploy
2. Connect to GitHub repository  
3. Set branch to 'main' or 'master'
4. Build settings: npm run build
5. Auto-deploy on push: ENABLED

# Every git push triggers:
git add .
git commit -m "Add new TTS features"
git push origin main
# → Automatic Netlify build & deploy
```

### Manual Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login & link site
netlify login
netlify link

# Manual deploy
netlify build
netlify deploy --prod

# Deploy with preview
netlify deploy --dir=.next
```

### Bolt.new Integration
```bash
# Via Bolt interface:
1. Make changes in Bolt editor
2. Click "Deploy to Netlify"  
3. Netlify automatically detects changes
4. Build & deploy happens automatically
5. Test deployed version
```

## 🎛️ Advanced Netlify Features

### A/B Testing
```toml
# Split testing voor UI improvements
[[redirects]]
  from = "/chat"
  to = "/chat-v2"
  status = 200
  conditions = { "Cookie" = "ab_test=v2" }
```

### Form Handling (voor feedback)
```html
<!-- Netlify form voor user feedback -->
<form name="feedback" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="feedback" />
  <textarea name="feedback" placeholder="Feedback over TTS kwaliteit"></textarea>
  <button type="submit">Verstuur</button>
</form>
```

### Branch Deploys
```bash
# Automatische preview deploys:
feature-branch → https://feature-branch--your-site.netlify.app
main-branch    → https://your-site.netlify.app

# Perfect voor testing nieuwe TTS features
```

## 💰 Cost Optimization

### Free Tier Limits
```bash
Free Plan Includes:
✅ 125,000 function executions/month
✅ 100GB bandwidth  
✅ 300 build minutes
✅ 1 concurrent build
✅ Deploy previews
❌ Background functions (voor lange TTS)
❌ Analytics (basic only)
```

### Pro Plan Benefits
```bash
Pro Plan ($19/month) Adds:
✅ 2M function executions/month  
✅ 1TB bandwidth
✅ Background functions (26s timeout)
✅ Advanced analytics  
✅ 3 concurrent builds
✅ Enhanced security
```

### Cost Monitoring
```bash
# Monitor usage:
1. Netlify Dashboard → Usage
2. Check function executions (TTS is expensive)
3. Monitor bandwidth (audio files)
4. Set up usage alerts
5. Optimize based on metrics
```

## 🎯 Production Checklist

### Pre-Launch
- [ ] **Environment variables** correctly set
- [ ] **Custom domain** configured (optional)
- [ ] **HTTPS** enabled (automatic)
- [ ] **Build settings** verified
- [ ] **All features tested** on live URL

### Post-Launch
- [ ] **Performance monitoring** enabled
- [ ] **Error tracking** configured  
- [ ] **Usage alerts** set up
- [ ] **Backup strategy** planned
- [ ] **Team access** configured

### Feature Testing
- [ ] **Chat functionality** works
- [ ] **All 3 AI models** respond correctly
- [ ] **File uploads** process successfully
- [ ] **TTS engines** generate audio
- [ ] **Streaming responses** work
- [ ] **Mobile experience** optimized
- [ ] **Error handling** user-friendly

## 🔗 Netlify Resources

### Official Documentation
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Next.js on Netlify](https://docs.netlify.com/frameworks/next-js/)
- [Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Headers & Redirects](https://docs.netlify.com/routing/headers/)

### Support Channels
- [Netlify Community](https://community.netlify.com/)
- [Netlify Support](https://netlify.com/support) 
- [Status Page](https://netlifystatus.com/)

### Useful Tools
- [Netlify CLI](https://cli.netlify.com/)
- [Build Plugins](https://docs.netlify.com/configure-builds/build-plugins/)
- [Deploy Previews](https://docs.netlify.com/site-deploys/deploy-previews/)

---

## 🚀 Ready for Netlify Production!

Deze Netlify-specifieke guide dekt alle aspecten van het deployen en beheren van de AI Education Template op het Netlify platform. Van basic deployment tot geavanceerde optimalisaties - alles wat je nodig hebt voor een succesvolle productie omgeving.

**🌐 Geoptimaliseerd voor Netlify + Next.js 15**  
**💜 Template door Tom Naberink**

---

*Netlify Deployment Guide v1.0*  
*Last updated: December 2024* 