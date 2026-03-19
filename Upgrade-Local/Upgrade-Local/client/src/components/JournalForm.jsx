import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { saveJournalEntry } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

export const JournalForm = ({ isOpen, onClose, onSuccess }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        decision: '',
        context: '',
        outcome: '',
        reviewDate: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const success = await saveJournalEntry(formData);
            if (success) {
                setFormData({ decision: '', context: '', outcome: '', reviewDate: '' });
                onSuccess?.();
                onClose();
            } else {
                setError(t('err_save_entry') || 'Error al guardar la entrada');
            }
        } catch (err) {
            setError(t('err_save_entry') || 'Error al guardar la entrada');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            className="journal-form-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
        >
            <div className="journal-form-header">
                <h3>{t('title_new_entry')}</h3>
                <button className="btn-icon" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="decision">{t('label_decision')}</label>
                    <input
                        type="text"
                        id="decision"
                        name="decision"
                        value={formData.decision}
                        onChange={handleChange}
                        required
                        placeholder={t('ph_decision')}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="context">{t('label_context') || 'Contexto'}</label>
                    <textarea
                        id="context"
                        name="context"
                        value={formData.context}
                        onChange={handleChange}
                        required
                        rows={3}
                        placeholder={t('ph_context')}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="outcome">{t('label_expected_outcome')}</label>
                    <textarea
                        id="outcome"
                        name="outcome"
                        value={formData.outcome}
                        onChange={handleChange}
                        required
                        rows={2}
                        placeholder={t('ph_outcome')}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="reviewDate">{t('label_review_date')}</label>
                    <input
                        type="date"
                        id="reviewDate"
                        name="reviewDate"
                        value={formData.reviewDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                {error && <div className="form-error">{error}</div>}

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                >
                    {saving ? t('btn_saving') : t('btn_save')}
                </button>
            </form>
        </motion.div>
    );
};
