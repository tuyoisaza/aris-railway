import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Compass, Eye, Brain, Zap, Scale, Heart, Users, Shield, Hammer } from 'lucide-react';

const INSIGHT_STEPS = [
    { label: 'PROMISE', text: 'Confronting the limits of knowledge and reality.', keyword: 'Singularity', verb: 'Approach', description: 'Black holes promise access to the edge of space, time, and understanding — the singularities where our known laws collapse and new insights may emerge.', icon: Lightbulb },
    { label: 'PRACTICE', text: 'Observation, simulation, and indirect detection.', keyword: 'Event Horizon', verb: 'Observe', description: 'While black holes cannot be seen directly, their presence is inferred through gravitational lensing, x-ray emissions, time dilation, and the movement of nearby objects.', icon: Eye },
    { label: 'QUALITIES', text: 'Wonder, humility, and perseverance.', keyword: 'Curiosity', verb: 'Cultivate', description: 'To study black holes requires precision, patience, and a radical openness to uncertainty. They humble our models and stretch imagination.', icon: Heart },
    { label: 'INSIGHT', text: 'Space and time are not fixed — they bend.', keyword: 'Spacetime curvature', verb: 'Realize', description: 'Einstein’s General Relativity shows that mass warps spacetime. Black holes are extreme manifestations of this principle, where geometry itself breaks down.', icon: Zap },
    { label: 'COMPREHENSION', text: 'Theory, models, and milestones.', keyword: 'Schwarzschild Radius', verb: 'Study', description: 'From the first theoretical solutions to quantum paradoxes, black holes drive cutting-edge physics — linking gravity, quantum theory, and thermodynamics.', icon: Brain },
    { label: 'CONSCIOUSNESS', text: 'Existential and symbolic dimensions.', keyword: 'Abyss', verb: 'Reflect', description: 'Black holes evoke themes of annihilation, mystery, ego-death, and rebirth — and challenge our understanding of time, death, and the self.', icon: Compass },
    { label: 'INTERCONNECTION', text: 'Related phenomena and theories.', keyword: 'Wormholes', verb: 'Compare', description: 'Black holes are connected to other cosmic objects and speculative concepts like white holes, baby universes, or holographic principles.', icon: Users },
    { label: 'SUPPORT', text: 'Tools and collaborators.', keyword: 'LIGO', verb: 'Equip', description: 'Progress relies on advanced instruments, data processing, theoretical collaboration, and international cooperation.', icon: Shield },
    { label: 'DISCIPLINE', text: 'Scientific rigor and long-term inquiry.', keyword: 'Patience', verb: 'Sustain', description: 'Detecting black hole mergers, mapping shadows, or modeling accretion disks takes decades of persistent investigation.', icon: Scale },
    { label: 'ACTION', text: 'Influence on science, tech, and imagination.', keyword: 'Breakthroughs', verb: 'Apply', description: 'Insights from black hole physics inform quantum computing, cosmology, space-time engineering, and challenge our understanding of information itself.', icon: Hammer },
    { label: 'ASPIRATION', text: 'A unified theory of reality.', keyword: 'Quantum Gravity', verb: 'Seek', description: 'Black holes may hold the key to reconciling General Relativity and Quantum Mechanics — pointing toward a deeper “Theory of Everything”.', icon: Zap },
];

const PANTHEON = [
    { name: 'Albert Einstein', role: 'Theory of General Relativity', legacy: 'Made spacetime curvature fundamental' },
    { name: 'Karl Schwarzschild', role: 'First black hole solution', legacy: 'Gave us the Schwarzschild radius' },
    { name: 'Stephen Hawking', role: 'Quantum black hole thermodynamics', legacy: 'Showed black holes radiate & die' },
    { name: 'Event Horizon', role: 'Threshold between knowable & unknown', legacy: 'Modern symbol of ultimate boundary' },
    { name: 'The Abyss', role: 'Archetype of mystery & annihilation', legacy: 'Found in myth, literature, and physics alike' },
];

interface InsightsPathProps {
    topicId?: string;
    content?: any;
}

const InsightsPath = ({ topicId, content }: InsightsPathProps) => {
    // Merge dynamic data with icons
    const insights = content?.insights?.map(ins => {
        const defaultStep = INSIGHT_STEPS.find(s => s.label === ins.label) || {};
        return {
            ...ins, // Dynamic data overrides
            icon: defaultStep.icon || Lightbulb // Use mapped icon or default
        };
    }) || INSIGHT_STEPS;

    const pantheon = content?.pantheon || PANTHEON;
    const tone = content?.tone || "This path invites awe, humility, and deep inquiry. Black holes are not merely objects in space — they are challenges to what we think reality is. They are both literal and metaphorical portals: to science, to mystery, and perhaps to new forms of meaning.";

    return (
        <div className="card" style={{ marginTop: '40px', padding: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Compass size={28} color="var(--color-primary)" />
                Insights Path
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {insights.map((step, index) => {
                    const Icon = step.icon;
                    return (
                        <motion.div
                            key={step.label}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}
                        >
                            <div style={{
                                minWidth: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'var(--color-bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-primary)'
                            }}>
                                <Icon size={16} />
                            </div>
                            <div>
                                <span style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    color: 'var(--color-text-tertiary)',
                                    letterSpacing: '1px',
                                    marginBottom: '4px'
                                }}>
                                    {step.label}
                                </span>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>{step.keyword} · {step.verb}</h4>
                                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Pantheon Table */}
            <div style={{ marginTop: '48px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Pantheon / Archetypes</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ padding: '12px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Name / Symbol</th>
                                <th style={{ padding: '12px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Role</th>
                                <th style={{ padding: '12px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Legacy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pantheon.map((item) => (
                                <tr key={item.name} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                                    <td style={{ padding: '12px', fontWeight: '600' }}>{item.name}</td>
                                    <td style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>{item.role}</td>
                                    <td style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>{item.legacy}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tone */}
            <div style={{ marginTop: '32px', padding: '24px', background: 'var(--color-bg-secondary)', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '700', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Tone of this Path</h4>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.6', fontStyle: 'italic' }}>
                    {tone}
                </p>
            </div>
        </div>
    );
};

export default InsightsPath;
