import { prisma } from '../../../db.js';

class OgmaAgent {
    async processBuffer(userId) {
        console.log(`[Ogma] Processing signal buffer for user ${userId}`);

        try {
            const signals = await prisma.agoraPostActionBuffer.findMany({
                where: {
                    userId,
                    processed: false
                },
                orderBy: { createdAt: 'asc' }
            });

            if (signals.length === 0) {
                return { processed: 0 };
            }

            const grouped = this.groupSignals(signals);

            for (const [traitKey, traitSignals] of Object.entries(grouped)) {
                await this.inferTrait(userId, traitKey, traitSignals);
            }

            await prisma.agoraPostActionBuffer.updateMany({
                where: {
                    id: { in: signals.map(s => s.id) }
                },
                data: {
                    processed: true,
                    processedAt: new Date()
                }
            });

            return { processed: signals.length };
        } catch (err) {
            console.error('[Ogma] Process buffer error:', err);
            return { processed: 0, error: err.message };
        }
    }

    async processAllUsers() {
        console.log(`[Ogma] Processing all users`);

        try {
            const users = await prisma.user.findMany({
                select: { id: true }
            });

            const results = [];
            for (const user of users) {
                const result = await this.processBuffer(user.id);
                results.push({ userId: user.id, ...result });
            }

            return results;
        } catch (err) {
            console.error('[Ogma] Process all users error:', err);
            return [];
        }
    }

    groupSignals(signals) {
        const grouped = {};

        for (const signal of signals) {
            let parsed;
            try {
                parsed = JSON.parse(signal.signalData);
            } catch {
                parsed = {};
            }

            const traitKey = parsed.trait_key || this.signalTypeToTraitKey(signal.signalType);
            
            if (!grouped[traitKey]) {
                grouped[traitKey] = [];
            }
            grouped[traitKey].push({ ...parsed, signal });
        }

        return grouped;
    }

    signalTypeToTraitKey(signalType) {
        const map = {
            'TOPIC_RECURRENCE': 'topic_affinity',
            'CROSS_TOPIC_REUSE': 'reasoning_style',
            'VOLUNTARY_CONTINUATION': 'persistence_pattern',
            'EXPRESSION_MODE_CHOSEN': 'expression_preference',
            'ENGAGEMENT_SIGNAL': 'engagement_pattern',
            'DISENGAGEMENT_SIGNAL': 'disengagement_pattern',
            'REASONING_STYLE_OBSERVED': 'reasoning_style',
            'DEPTH_PROGRESSION': 'depth_preference',
            'BRANCH_EXPLORATION': 'exploration_style'
        };

        return map[signalType] || 'inferred_trait';
    }

    async inferTrait(userId, traitKey, signals) {
        if (signals.length < 3) {
            console.log(`[Ogma] Not enough signals for ${traitKey}: ${signals.length}`);
            return null;
        }

        const values = signals.map(s => s.observed_value || s.traitValue || s.signalData).filter(Boolean);
        
        if (values.length === 0) return null;

        const mostCommon = this.mostCommon(values);
        const confidence = Math.min(0.3 + (signals.length * 0.1), 0.9);

        try {
            await prisma.agoraUserMemory.upsert({
                where: {
                    userId_traitKey: { userId, traitKey }
                },
                create: {
                    userId,
                    traitKey,
                    traitValue: mostCommon,
                    confidence
                },
                update: {
                    traitValue: mostCommon,
                    confidence,
                    lastConfirmed: new Date()
                }
            });

            console.log(`[Ogma] Inferred trait: ${traitKey} = ${mostCommon} (confidence: ${confidence})`);
            return { traitKey, value: mostCommon, confidence };
        } catch (err) {
            console.error('[Ogma] Error inferring trait:', err);
            return null;
        }
    }

    mostCommon(arr) {
        const counts = {};
        let maxCount = 0;
        let mostCommon = arr[0];

        for (const item of arr) {
            const key = String(item);
            counts[key] = (counts[key] || 0) + 1;
            if (counts[key] > maxCount) {
                maxCount = counts[key];
                mostCommon = key;
            }
        }

        return mostCommon;
    }
}

export default new OgmaAgent();
