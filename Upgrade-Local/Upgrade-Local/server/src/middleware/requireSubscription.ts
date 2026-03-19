import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db';

const requireSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userId = req.user.id;

        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('status, current_period_end')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;

        // Check if subscription exists and is valid
        const validStatuses = ['active', 'trialing'];
        if (!subscription || !validStatuses.includes(subscription.status)) {
            return res.status(403).json({
                error: 'Premium subscription required',
                code: 'SUBSCRIPTION_REQUIRED'
            });
        }

        req.subscription = subscription;
        next();
    } catch (error) {
        console.error('Subscription check error:', error);
        res.status(500).json({ error: 'Internal server error checking subscription' });
    }
};

export default requireSubscription;

