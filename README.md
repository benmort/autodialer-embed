# Common Threads Calling Widget

A slim, embeddable React + TypeScript widget for integrating calling functionality into any website. This widget provides WebRTC calling capabilities through Twilio Voice SDK and real-time messaging via Pusher.

## Features

- 🎯 **Slim & Fast**: No Elm dependency, optimized React bundle
- 🔗 **Easy Embedding**: Simple HTML tag or JavaScript API
- 📱 **Responsive**: Works on desktop and mobile
- 🎨 **Customizable**: Full color customization with campaign routing
- 🔒 **CORS Ready**: Proper headers for cross-origin embedding
- 📞 **WebRTC**: Direct calling through Twilio Voice SDK
- ⚡ **Real-time**: Pusher integration for live updates
- 🎨 **Campaign Routing**: Route calls to specific autodialer campaigns
- 🎭 **Color Themes**: Primary, secondary, background, and text color customization

## Quick Start

### 1. HTML Tag Embedding (Recommended)

Add the script to your HTML and use the custom element:

```html
<!-- Load the embeddable script -->
<script src="https://your-cdn.com/autodialer-embed.iife.js"></script>

<!-- Embed the widget -->
<autodialer-widget 
    tenant="your-tenant" 
    token="your-auth-token" 
    campaign-id="your-campaign-id"
    primary-color="#3b82f6"
    secondary-color="#1d4ed8">
</autodialer-widget>
```

### 2. JavaScript API Embedding

```html
<div id="dialer-container"></div>
<script src="https://your-cdn.com/autodialer-embed.iife.js"></script>
<script>
const service = window.AutodialerEmbed.init({
    tenant: 'your-tenant',
    token: 'your-auth-token',
    campaignId: 'your-campaign-id',
    colors: {
        primary: '#3b82f6',
        secondary: '#1d4ed8',
        background: '#f8fafc',
        text: '#1e293b'
    },
    pusherConfigs: [{
        appId: 'your-pusher-app-id',
        cluster: 'us2',
        key: 'your-pusher-key'
    }],
    callerChannelId: 'unique-channel-id'
}, 'dialer-container');
</script>
```

## Configuration

### HTML Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `tenant` | ✅ | Your tenant identifier |
| `token` | ✅ | Authentication token |
| `campaign-id` | ❌ | Target campaign ID for routing calls |
| `primary-color` | ❌ | Primary button color (hex, default: #6b7280) |
| `secondary-color` | ❌ | Secondary/hover color (hex, default: #9ca3af) |
| `background-color` | ❌ | Background color (hex, optional) |
| `text-color` | ❌ | Text color (hex, optional) |
| `phone` | ❌ | Default phone number |
| `name` | ❌ | Default caller name |
| `email` | ❌ | Default caller email |
| `on-status-change` | ❌ | JavaScript function name for status changes |
| `on-error` | ❌ | JavaScript function name for errors |
| `on-call-start` | ❌ | JavaScript function name for call start |
| `on-call-end` | ❌ | JavaScript function name for call end |

### JavaScript API Config

```typescript
interface AutodialerConfig {
  tenant: string;
  token: string;
  backendUrl: string;
  pusherConfigs: PusherConfig[];
  twilioToken?: string;
  callerChannelId: string;
  dialIn?: boolean;
  phone?: string;
  name?: string;
  email?: string;
  referralCode?: string;
  campaignId?: string;
  colors?: AutodialerColors;
}

interface AutodialerColors {
  primary: string;
  secondary: string;
  background?: string;
  text?: string;
}

interface PusherConfig {
  appId: string;
  cluster: string;
  key: string;
}
```

## Event Handling

### HTML Attribute Events

```html
<autodialer-widget 
    tenant="demo" 
    token="demo-token" 
    backend-url="https://demo-backend.com"
    on-status-change="handleStatusChange"
    on-error="handleError">
</autodialer-widget>

<script>
function handleStatusChange(data) {
    console.log('Status changed:', data.status);
    // Status can be: 'idle', 'connecting', 'connected', 'in-call', 'error'
}

function handleError(data) {
    console.error('Error:', data.error);
    alert('Error: ' + data.error);
}
</script>
```

### JavaScript API Events

```javascript
service.setEvents({
    onStatusChange: (status) => {
        console.log('Status changed:', status);
    },
    onError: (error) => {
        console.error('Error:', error);
    },
    onCallStart: (data) => {
        console.log('Call started:', data);
    },
    onCallEnd: () => {
        console.log('Call ended');
    }
});
```

## Backend Integration

Your robotargeter backend needs to support these endpoints:

### Pusher Authentication
```
POST /pusher/auth
Headers: x-aws-waf-token (optional)
Query: tenant, token, app_id
```

### Twilio WebRTC
```
WebSocket endpoint for Twilio Voice SDK connections
Expects caller data and Twilio tokens
```

## Development

### Setup

```bash
npm install

# Create .env file with your backend URL and Twilio token
echo "VITE_AUTODIALER_API_URL=http://localhost:5001" > .env
echo "VITE_TWILIO_TOKEN=your-twilio-token" >> .env
echo "VITE_CDN_URL=https://your-cdn-url.com/autodialer-widget.js" >> .env

npm run dev
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Frontend-safe variables (exposed to browser)
VITE_AUTODIALER_API_URL=http://localhost:5001
VITE_CDN_URL=https://your-cdn-url.com/autodialer-widget.js
VITE_EMBED_TOKEN=embed-demo-token-12345

# Pusher configuration (frontend-safe)
VITE_PUSHER_APP_ID=your-pusher-app-id
VITE_PUSHER_CLUSTER=us2
VITE_PUSHER_KEY=your-pusher-key

# Server-side only variables (NOT exposed to frontend)
AUTODIALER_API_URL=http://localhost:5001
TWILIO_TOKEN=your-twilio-token-here
```

**Security Note**: Variables prefixed with `VITE_` are exposed to the frontend and should only contain non-sensitive values. Sensitive tokens like `TWILIO_TOKEN` are kept server-side only.

### Build

```bash
npm run build
```

This creates `dist/autodialer-embed.iife.js` - the embeddable bundle.

### Project Structure

```
src/
├── components/          # React components
│   └── DialerInterface.tsx
├── services/           # Core services
│   ├── AutodialerService.ts
│   ├── WebRTCService.ts
│   └── PusherService.ts
├── web-components/     # Custom HTML elements
│   └── AutodialerWidget.tsx
├── types/              # TypeScript definitions
│   └── index.ts
├── styles.css          # Tailwind CSS
└── index.ts           # Main entry point
```

## Customization

### Styling

The widget uses Tailwind CSS. You can customize styles by overriding the CSS:

```css
autodialer-widget {
    max-width: 500px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

autodialer-widget button {
    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
}
```

### Color Customization

The widget supports full color customization through HTML attributes or JavaScript configuration:

#### HTML Attributes
```html
<autodialer-widget 
    primary-color="#059669"
    secondary-color="#047857"
    background-color="#f0fdf4"
    text-color="#064e3b">
</autodialer-widget>
```

#### JavaScript Configuration
```javascript
const service = window.AutodialerEmbed.init({
    colors: {
        primary: '#059669',
        secondary: '#047857', 
        background: '#f0fdf4',
        text: '#064e3b'
    }
}, 'dialer-container');
```

#### Default Monochromatic Theme
If no colors are specified, the widget defaults to a clean monochromatic theme:
- Primary: `#6b7280` (gray)
- Secondary: `#9ca3af` (lighter gray)
- Background: `#ffffff` (white)
- Text: `#111827` (dark gray)

### Theming

Modify `tailwind.config.js` to change the default color scheme:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#your-color',
        600: '#your-darker-color',
      }
    }
  }
}
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Security

- CORS headers properly configured
- No sensitive data in client bundle
- Token-based authentication
- WebRTC security through Twilio

## License

MIT License - see LICENSE file for details.

## Support

For integration support or questions, please refer to the robotargeter documentation or contact your development team.
