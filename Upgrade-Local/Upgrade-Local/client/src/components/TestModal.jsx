import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { saveProgress, getTests } from '../lib/api';

const LEVELS = {
    basic: { max: 10, key: 'level_beginner', feedbackKey: 'feedback_beginner' },
    intermediate: { max: 20, key: 'level_intermediate', feedbackKey: 'feedback_intermediate' },
    advanced: { max: 26, key: 'level_advanced', feedbackKey: 'feedback_advanced' },
    expert: { max: 32, key: 'level_expert', feedbackKey: 'feedback_expert' }
};

function getLevel(score) {
    if (score <= LEVELS.basic.max) return LEVELS.basic;
    if (score <= LEVELS.intermediate.max) return LEVELS.intermediate;
    if (score <= LEVELS.advanced.max) return LEVELS.advanced;
    return LEVELS.expert;
}

export const TestModal = ({ isOpen, onClose, axis, onComplete }) => {
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [saving, setSaving] = useState(false);

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const letters = ['A', 'B', 'C', 'D'];

    useEffect(() => {
        const loadQuestions = async () => {
            setLoading(true);
            try {
                const allTests = await getTests();
                const axisQuestions = allTests.filter(q => q.axis_id === axis);

                // Randomize answers using Fisher-Yates shuffle
                const randomized = axisQuestions.map(q => {
                    const options = [...q.options];
                    for (let i = options.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [options[i], options[j]] = [options[j], options[i]];
                    }
                    return { ...q, options };
                });

                setQuestions(randomized.length > 0 ? randomized : []);
            } catch (e) {
                console.error('Error loading questions:', e);
            }
            setLoading(false);
        };

        if (isOpen) {
            loadQuestions();
        }
    }, [isOpen, axis]);

    if (loading) return null;

    if (!questions.length && isOpen) return (
        <div className="test-modal-overlay">
            <div className="test-modal-container">
                <h3>No hay preguntas disponibles para este eje.</h3>
                <button onClick={onClose} className="btn btn-primary">Cerrar</button>
            </div>
        </div>
    );

    const currentQuestion = questions[currentIndex];

    const handleAnswer = (points) => {
        const newScore = score + points;
        setScore(newScore);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setIsComplete(true);
        }
    };

    const handleFinish = async () => {
        setSaving(true);
        const level = getLevel(score);

        const success = await saveProgress(axis, {
            score,
            levelTitle: level.key
        });

        if (!success) {
            alert('Error al guardar el progreso. Por favor intenta de nuevo.');
            setSaving(false);
            return;
        }

        setSaving(false);
        onComplete?.(axis, { score, levelTitle: level.key });
        handleClose();
    };

    const handleClose = () => {
        setCurrentIndex(0);
        setScore(0);
        setIsComplete(false);
        onClose();
    };

    if (!isOpen) return null;

    const level = getLevel(score);

    return (
        <AnimatePresence>
            <motion.div
                className="test-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
            >
                <motion.div
                    className="test-modal-container"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className="test-modal-close" onClick={handleClose}>
                        <X size={24} />
                    </button>

                    {!isComplete ? (
                        <div className="test-content">
                            <div className="test-progress">
                                Pregunta {currentIndex + 1} / {questions.length}
                            </div>
                            <div className="test-question">
                                {currentQuestion.q}
                            </div>
                            <div className="test-options">
                                {currentQuestion.options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        className="option-btn"
                                        onClick={() => handleAnswer(opt.points)}
                                    >
                                        <span className="option-letter">{letters[idx]}</span>
                                        <span>{opt.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="test-result">
                            <h2>Diagnóstico Finalizado</h2>
                            <div className="result-level">{t(level.key)}</div>
                            <div className="result-score">Puntaje: {score} / {questions.length * 4}</div>
                            <div className="result-feedback">
                                <strong>Feedback UPGRADE:</strong>
                                <p>{t(level.feedbackKey)}</p>
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={handleFinish}
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Finalizar'}
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
