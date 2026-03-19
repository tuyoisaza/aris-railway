import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

interface Option {
    text: string;
    points: number;
}

interface Question {
    id: string;
    q: string;
    options: Option[];
    axis_id: string;
    sort_order: number;
}

export default function Test() {
    const { axisId } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchQuestions();
    }, [axisId]);

    const fetchQuestions = async () => {
        try {
            // Fetch all questions
            const res = await fetch('/api/tests'); // Public endpoint returns all questions
            if (res.ok) {
                const data: any[] = await res.json();
                // Filter by axis and normalize/shuffle options
                const axisQuestions: Question[] = data
                    .filter((q: any) => q.axis_id === axisId)
                    .map((q: any) => {
                        // Normalize options to {text, points}
                        const normalizedOptions: Option[] = q.options.map((opt: any, idx: number) => {
                            if (typeof opt === 'string') {
                                return { text: opt, points: idx };
                            } else {
                                return { text: opt.text, points: opt.points ?? idx };
                            }
                        });

                        // Shuffle options
                        const shuffledOptions = shuffleArray(normalizedOptions);

                        return {
                            ...q,
                            options: shuffledOptions
                        };
                    });

                setQuestions(axisQuestions);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const shuffleArray = <T,>(array: T[]): T[] => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const handleAnswer = (optionIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[currentIndex] = optionIndex;
        setAnswers(newAnswers);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const getOptionPoints = (q: Question, optIdx: number) => {
        return q.options[optIdx]?.points ?? 0;
    };

    const handleSubmit = async () => {
        setSubmitting(true);

        // Calculate Score
        let totalPossible = 0;
        let totalObtained = 0;

        questions.forEach((q, idx) => {
            // Assume max points is the highest value in options? Or just based on length?
            // Usually 3 points max (0,1,2,3).
            // Let's find max points in this question's options
            let maxQ = 0;
            q.options.forEach((opt) => {
                if (opt.points > maxQ) maxQ = opt.points;
            });
            totalPossible += maxQ;

            const ansIdx = answers[idx] ?? 0;
            totalObtained += getOptionPoints(q, ansIdx);
        });

        const normalizedScore = totalPossible > 0
            ? Math.round((totalObtained / totalPossible) * 100)
            : 0;

        // Determine Level
        let level = 'Novice'; // Basic
        if (normalizedScore > 30) level = 'Apprentice'; // Intermediate
        if (normalizedScore > 60) level = 'Practitioner'; // Advanced
        if (normalizedScore > 90) level = 'Master'; // Compatible?

        // Map to specific titles if needed
        // < 30 : Basic
        // 30-60: Intermediate
        // 60-90: Advanced
        // > 90 : Compatible

        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;

            await fetch('/api/user/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    axis: axisId,
                    data: {
                        score: normalizedScore,
                        levelTitle: level
                    }
                })
            });

            navigate('/dashboard');
        } catch (e) {
            console.error(e);
            alert('Error saving results');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12">LOADING TEST PROTOCOL...</div>;
    if (questions.length === 0) return <div className="p-12">NO QUESTIONS FOUND FOR AXIS: {axisId}</div>;

    const currentQ = questions[currentIndex];
    const isLast = currentIndex === questions.length - 1;

    return (
        <div className="brutal-container py-12 max-w-2xl mx-auto">
            <div className="mb-8 flex justify-between items-center text-[var(--color-text-secondary)]">
                <span className="uppercase">Diagnostic: {axisId}</span>
                <span>Steps: {currentIndex + 1} / {questions.length}</span>
            </div>

            <Card className="brutal-card p-6">
                <h2 className="text-xl font-bold mb-6">{currentQ.q}</h2>
                <div className="space-y-3">
                    {currentQ.options.map((opt, idx) => (
                        <Button
                            key={idx}
                            variant={answers[currentIndex] === idx ? "default" : "outline"}
                            className={`w-full justify-start text-left h-auto py-3 px-4 ${answers[currentIndex] === idx ? 'bg-[var(--color-primary)] text-white' : ''}`}
                            onClick={() => handleAnswer(idx)}
                        >
                            {opt.text}
                        </Button>
                    ))}
                </div>

                <div className="mt-8 flex justify-between">
                    <Button
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex(currentIndex - 1)}
                        variant="ghost"
                    >
                        Back
                    </Button>

                    {isLast && (
                        <Button
                            className="brutal-btn primary"
                            disabled={submitting || answers[currentIndex] === undefined}
                            onClick={handleSubmit}
                        >
                            {submitting ? 'Processing...' : 'Complete Diagnostic'}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
