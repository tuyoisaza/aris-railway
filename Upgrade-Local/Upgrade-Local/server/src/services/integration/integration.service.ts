import { Request, Response } from 'express';
import { INTEGRATION_CONFIG } from '../../../config/integration.config';

interface IntegrationResult {
    success: boolean;
    data?: any;
    error?: string;
    service: 'aris' | 'kedon' | 'local';
}

export class IntegrationService {
    // Método para obtener capacidades de mentoría avanzada de ARIS
    static async getAdvancedMentoring(userId: string, context: string, conversationId?: string): Promise<IntegrationResult> {
        try {
            const response = await fetch(`${INTEGRATION_CONFIG.ARIS.SERVICE_URL}/api/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${INTEGRATION_CONFIG.ARIS.API_KEY}`
                },
                body: JSON.stringify({
                    userId,
                    conversationId: conversationId || 'upgrade-mentoring',
                    role: 'user',
                    content: context
                })
            });
            
            if (!response.ok) {
                throw new Error(`ARIS service error: ${response.status}`);
            }
            
            const data = await response.json();
            return {
                success: true,
                data,
                service: 'aris'
            };
        } catch (error: any) {
            console.error('ARIS integration failed, falling back to local AI:', error);
            // Fallback al sistema local de UPGRADE!
            return {
                success: false,
                error: error.message,
                service: 'local'
            };
        }
    }
    
    // Método para obtener capacidades de atención al cliente de KELEDON
    static async getCustomerSupport(userId: string, issue: string): Promise<IntegrationResult> {
        try {
            const response = await fetch(`${INTEGRATION_CONFIG.KELEDON.SERVICE_URL}/api/support/ticket`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${INTEGRATION_CONFIG.KELEDON.API_KEY}`
                },
                body: JSON.stringify({
                    userId,
                    issue,
                    priority: 'normal'
                })
            });
            
            if (!response.ok) {
                throw new Error(`KELEDON service error: ${response.status}`);
            }
            
            const data = await response.json();
            return {
                success: true,
                data,
                service: 'kedon'
            };
        } catch (error: any) {
            console.error('KELEDON integration failed:', error);
            return {
                success: false,
                error: error.message,
                service: 'local'
            };
        }
    }

    // Método para llamar con retry y circuit breaker
    static async callWithRetry(serviceUrl: string, options: any, maxRetries: number = INTEGRATION_CONFIG.ARIS.RETRY_ATTEMPTS) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(serviceUrl, options);
                if (response.ok) {
                    return response;
                }
            } catch (error: any) {
                if (i === maxRetries - 1) throw error;
                // Esperar con backoff exponencial
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }
}