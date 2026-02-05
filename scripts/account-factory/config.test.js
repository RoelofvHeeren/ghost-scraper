/**
 * Test Configuration for Nextdoor Stealth Bot
 * 
 * INSTRUCTIONS:
 * 1. Update the proxy settings with your current residential proxy
 * 2. Update the account details with a fresh email
 * 3. Run: npm run create
 */

module.exports = {
    // Proxy settings (UPDATE WITH YOUR CURRENT PROXY)
    proxy: {
        server: 'http://192.53.67.129:5678',
        username: 'juvgugun',
        password: 'm1c1h51kdgjm'
    },

    // GPS spoofing coordinates (Nautilus Drive, Miami Beach)
    location: {
        latitude: 25.821702,
        longitude: -80.135205,
        address: '4554 Nautilus Drive',
        city: 'Miami Beach',
        state: 'FL',
        zip: '33140'
    },

    // Account details (UPDATE WITH FRESH EMAIL)
    account: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'test' + Date.now() + '@example.com', // Auto-generate unique email
        password: 'SecurePass123!'
    },

    // Timing settings (adjust for more/less human-like behavior)
    timing: {
        preBrowsing: 120000, // 2 minutes on homepage (increase if still detected)
        minDelay: 2000,      // Minimum delay between actions
        maxDelay: 8000,      // Maximum delay between actions
        typingSpeed: 150     // Average ms per character
    }
};
