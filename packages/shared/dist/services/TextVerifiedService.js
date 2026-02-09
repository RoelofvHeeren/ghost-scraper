import fetch from 'node-fetch';
export class TextVerifiedService {
    baseUrl = 'https://www.textverified.com/api/pub/v2';
    apiKey;
    bearerToken = null; // V2 uses Bearer Token (Wait, docs say Bearer Key from settings)
    constructor(apiKey) {
        // User provided "Simple Access Token" or "Bearer Key". Both work as Bearer <token>.
        this.apiKey = apiKey;
    }
    get headers() {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    }
    /**
     * Rent a new number for Nextdoor verification
     */
    async createVerification() {
        // 1. Find Nextdoor Service ID
        const targetName = 'Nextdoor';
        const services = await this.getServices();
        const service = services.find(s => s.name.toLowerCase().includes(targetName.toLowerCase()));
        if (!service) {
            throw new Error(`Service '${targetName}' not found in TextVerified.`);
        }
        console.log(`Found Service: ${service.name} (ID: ${service.id})`);
        // 2. Create Verification
        const response = await fetch(`${this.baseUrl}/verifications`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ id: service.id })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create verification: ${response.statusText} - ${errorText}`);
        }
        // 3. Follow Location or Parse Body
        // API documentation says it returns location header OR the object.
        const location = response.headers.get('location');
        if (location) {
            const id = location.split('/').pop();
            return this.getVerification(id);
        }
        // Fallback: Parse body directly if returned
        return await response.json();
    }
    async getServices() {
        // Cache this ideally, but for now fetch fresh
        const response = await fetch('https://www.textverified.com/api/pub/v2/services', {
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });
        if (!response.ok)
            throw new Error("Failed to fetch services list");
        return await response.json();
    }
    // Helper to find Nextdoor Service ID if needed.
    async getVerification(id) {
        const response = await fetch(`${this.baseUrl}/verifications/${id}`, {
            headers: this.headers
        });
        if (!response.ok)
            throw new Error("Failed to get verification status");
        return await response.json();
    }
    async cancelVerification(id) {
        await fetch(`${this.baseUrl}/verifications/${id}/cancel`, {
            method: 'POST',
            headers: this.headers
        });
    }
}
