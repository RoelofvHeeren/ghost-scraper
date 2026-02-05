# Nextdoor Account Factory - Incognia Bypass

Automated Nextdoor account creation with sophisticated bot detection bypass.

## Features

- ✅ **GPS Spoofing** - Injected directly (no extension, undetectable)
- ✅ **Stealth Mode** - Playwright with anti-detection patches
- ✅ **Human Behavior** - Bezier mouse movements, realistic typing, natural scrolling
- ✅ **Residential Proxy** - Support for proxy authentication
- ✅ **Anti-Fingerprinting** - Removes automation signals

## Configuration

Edit `nextdoor-stealth.js` and update the `CONFIG` object:

```javascript
const CONFIG = {
  proxy: {
    server: 'http://YOUR_PROXY_IP:PORT',
    username: 'YOUR_USERNAME',
    password: 'YOUR_PASSWORD'
  },
  location: {
    latitude: 25.821702,  // Your target GPS coordinates
    longitude: -80.135205,
    address: '4554 Nautilus Drive',
    city: 'Miami Beach',
    state: 'FL',
    zip: '33140'
  },
  account: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'SecurePass123!'
  }
};
```

## Usage

```bash
# Install dependencies
npm install

# Run account creation
npm run create
```

## How It Works

### 1. Stealth Browser Launch
- Removes `navigator.webdriver` flag
- Patches Chrome runtime
- Disables WebRTC (prevents IP leaks)
- Sets realistic viewport and user agent

### 2. GPS Spoofing Injection
- Overrides `navigator.geolocation` API
- Intercepts Fetch API for address rewriting
- Rewrites coordinates, street addresses, city/state/zip
- **No browser extension** (Incognia can't detect it)

### 3. Human Behavior Simulation
- **Mouse Movement**: Bezier curves with random jitter
- **Typing**: Variable speed with 5% typo rate
- **Scrolling**: Natural patterns with occasional reverse scrolling
- **Delays**: Random 2-8 second delays between actions

### 4. Signup Flow
1. **Pre-browsing** (2 minutes on homepage)
2. **Navigate to signup** (human-like clicks)
3. **Fill form** (with realistic typing patterns)
4. **Address selection** (GPS spoofing active)
5. **Submit** (wait for verification)

## Detection Bypass

### Incognia Detection Layers

| Layer | Bypass Method |
|-------|---------------|
| Location Intelligence | GPS spoofing injection |
| Device Fingerprinting | Anti-detection patches |
| Behavioral Biometrics | Human behavior simulation |
| Tamper Detection | No extension, direct injection |
| Network Analysis | Residential proxy |

## Troubleshooting

### "ERR_TUNNEL_CONNECTION_FAILED"
- Your proxy requires authentication
- Update `CONFIG.proxy` with correct credentials

### "Redirected to /logout/"
- Incognia detected bot behavior
- Try with different residential proxy
- Increase pre-browsing time
- Check if proxy IP is flagged

### Address not showing "Nautilus Drive"
- GPS spoofing injection failed
- Check console for `👻 [GPS Spoof]` messages
- Verify coordinates in CONFIG

## Success Indicators

Look for these console messages:

```
✅ Stealth mode activated
✅ GPS spoofing injected
👻 [GPS Spoof] Injection complete - Location set to 4554 Nautilus Drive
👻 [GPS Spoof] Rewrote address data in: /api/gql/reverseGeocodeQuery
✅ Address selected: 4554 Nautilus Drive
✅ Account created! Waiting for verification...
```

## Screenshots

The script automatically saves screenshots:
- `nextdoor-signup-success.png` - Successful signup
- `nextdoor-signup-failed.png` - Failed signup
- `nextdoor-signup-unknown.png` - Unknown state

## Notes

- Browser stays open for manual inspection
- Close browser manually when done
- Use fresh email for each account
- Rotate proxies between signups
- Recommended: Use residential proxies from target area (Miami)
