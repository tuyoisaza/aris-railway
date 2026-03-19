import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';


export const Pricing = () => {
    const { signInWithGoogle, isAuthenticated } = useAuth();
    const { t } = useLanguage();

    const handleCTA = async (plan) => {
        if (!isAuthenticated) {
            signInWithGoogle();
            return;
        }

        try {
            const { url } = await import('../lib/api').then(m => m.api.createCheckoutSession(plan));
            if (url) window.location.href = url;
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error initiating checkout. Please try again.');
        }
    };

    return (
        <div className="pricing-page" style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div className="container">
                <div className="section-header">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2>{t('pricing_title') || 'Planes'}</h2>
                        <p>{t('pricing_subtitle') || 'Elige tu nivel de compromiso'}</p>
                    </motion.div>
                </div>
                <div className="pricing-grid">
                    <motion.div
                        className="pricing-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h3>Explorer</h3>
                        <div className="price">{t('plan_free') || 'Gratis'}</div>
                        <ul>
                            <li>{t('plan_explorer_feat_1') || 'Acceso a contenido básico'}</li>
                            <li>{t('plan_explorer_feat_2') || 'Tests de nivelación'}</li>
                            <li>{t('plan_explorer_feat_3') || 'Comunidad'}</li>
                        </ul>
                        <button className="btn btn-outline" onClick={() => handleCTA('explorer')}>{t('btn_start') || 'Comenzar'}</button>
                    </motion.div>

                    <motion.div
                        className="pricing-card featured"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3>Builder</h3>
                        <div className="price">$47/mes</div>
                        <ul>
                            <li>{t('plan_builder_feat_1') || 'Todo en Explorer'}</li>
                            <li>{t('plan_builder_feat_2') || 'Cursos completos'}</li>
                            <li>{t('plan_builder_feat_3') || 'Decision Journal'}</li>
                            <li>{t('plan_builder_feat_4') || 'Sesiones en vivo'}</li>
                        </ul>
                        <button className="btn btn-primary" onClick={() => handleCTA('builder')}>{t('btn_subscribe') || 'Suscribirse'}</button>
                    </motion.div>

                    <motion.div
                        className="pricing-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3>Teams</h3>
                        <div className="price">$197/mes</div>
                        <ul>
                            <li>{t('plan_teams_feat_1') || 'Todo en Builder'}</li>
                            <li>{t('plan_teams_feat_2') || '5 miembros'}</li>
                            <li>{t('plan_teams_feat_3') || 'Analytics de equipo'}</li>
                            <li>{t('plan_teams_feat_4') || 'Soporte prioritario'}</li>
                        </ul>
                        <button className="btn btn-outline" onClick={() => handleCTA('teams')}>{t('btn_contact') || 'Contactar'}</button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
