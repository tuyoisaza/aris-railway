// Configuration for service integration
export const INTEGRATION_CONFIG = {
    // ARIS Service Configuration
    ARIS: {
        SERVICE_URL: process.env.ARIX_SERVICE_URL || 'http://localhost:3000',
        API_KEY: process.env.ARIX_API_KEY || '',
        TIMEOUT_MS: parseInt(process.env.ARIX_TIMEOUT_MS || '10000'),
        RETRY_ATTEMPTS: parseInt(process.env.ARIX_RETRY_ATTEMPTS || '3')
    },
    
    // KELEDON Service Configuration
    KELEDON: {
        SERVICE_URL: process.env.KELEDON_SERVICE_URL || 'http://localhost:4000',
        API_KEY: process.env.KELEDON_API_KEY || '',
        TIMEOUT_MS: parseInt(process.env.KELEDON_TIMEOUT_MS || '10000'),
        RETRY_ATTEMPTS: parseInt(process.env.KELEDON_RETRY_ATTEMPTS || '3')
    },
    
    // Fallback behavior
    FALLBACK_ENABLED: process.env.INTEGRATION_FALLBACK_ENABLED !== 'false',
    FALLBACK_DELAY_MS: parseInt(process.env.INTEGRATION_FALLBACK_DELAY_MS || '2000')
};