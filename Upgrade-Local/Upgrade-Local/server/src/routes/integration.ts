import express, { Request, Response } from 'express';
import { verifyAuth } from '../middleware/auth';
import { IntegrationService } from '../services/integration/integration.service';

const router = express.Router();

// Ruta para acceso a mentoría avanzada de ARIS
router.post('/aris/mentoring', verifyAuth, async (req: Request, res: Response) => {
    try {
        const { context, conversationId } = req.body;
        const userId = req.user.id;
        
        const result = await IntegrationService.getAdvancedMentoring(userId, context, conversationId);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json({ error: 'Failed to get mentoring from ARIS', fallback: 'Using local system' });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para acceso a soporte de KELEDON
router.post('/kedon/support', verifyAuth, async (req: Request, res: Response) => {
    try {
        const { issue } = req.body;
        const userId = req.user.id;
        
        const result = await IntegrationService.getCustomerSupport(userId, issue);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json({ error: 'Failed to get support from KELEDON' });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para verificar estado de integraciones
router.get('/status', verifyAuth, async (req: Request, res: Response) => {
    try {
        const results = {
            aris: { connected: false, message: 'Service unreachable' },
            kedon: { connected: false, message: 'Service unreachable' }
        };

        // Verificar conexión a ARIS
        try {
            const arisResponse = await fetch(`${process.env.ARIX_SERVICE_URL || 'http://localhost:3000'}/health`);
            results.aris.connected = arisResponse.ok;
            results.aris.message = arisResponse.ok ? 'Connected' : 'Service error';
        } catch (error) {
            results.aris.message = 'Connection failed';
        }

        // Verificar conexión a KELEDON
        try {
            const kedonResponse = await fetch(`${process.env.KELEDON_SERVICE_URL || 'http://localhost:4000'}/health`);
            results.kedon.connected = kedonResponse.ok;
            results.kedon.message = kedonResponse.ok ? 'Connected' : 'Service error';
        } catch (error) {
            results.kedon.message = 'Connection failed';
        }

        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;