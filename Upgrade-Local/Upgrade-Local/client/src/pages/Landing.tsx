// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Landing() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        // Check for invite code
        const params = new URLSearchParams(window.location.search);
        const inviteCode = params.get('invite');
        if (inviteCode) {
            console.log("Invite code detected:", inviteCode);
            localStorage.setItem('invite_code', inviteCode);
        }

        const fetchMentors = async () => {
            try {
                const { data, error } = await supabase.from('mentors').select('*').order('name');
                if (data) setMentors(data);
            } catch (err) {
                console.error("Error fetching mentors", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMentors();
    }, []);

    const nextSlide = () => {
        if (mentors.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % mentors.length);
    };

    const prevSlide = () => {
        if (mentors.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + mentors.length) % mentors.length);
    };

    const getVisibleMentors = () => {
        if (mentors.length === 0) return [];
        const count = 4;
        const visible = [];
        for (let i = 0; i < count; i++) {
            visible.push(mentors[(currentIndex + i) % mentors.length]);
        }
        return visible;
    };

    const visibleItems = getVisibleMentors();

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-[var(--font-main)]">

            {/* HERO SECTION */}
            <header className="max-w-[1200px] mx-auto px-6 py-12 md:py-24">
                <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-16">
                    <div className="md:w-1/2">
                        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight leading-tight text-[var(--color-primary)]">
                            {t('landing_hero_title')}
                        </h1>
                        <p className="text-xl text-[var(--color-text-secondary)] mb-8 leading-relaxed">
                            {t('landing_hero_subtitle')}
                        </p>
                        <Button
                            onClick={() => navigate('/login')}
                            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-lg h-auto py-3 px-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] transition-all hover:-translate-y-1"
                        >
                            {t('landing_cta_button')}
                        </Button>
                    </div>
                    <div className="md:w-1/2 flex justify-center">
                        <div className="bg-[var(--color-surface)] p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] border border-[var(--color-border)] w-full max-w-md">
                            <p className="font-mono text-sm text-[var(--color-text-tertiary)] uppercase mb-4 tracking-widest">{t('dashboard_status')}</p>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-[var(--color-border-light)] pb-2">
                                    <span className="text-[var(--color-text)]">Operating System</span>
                                    <span className="font-bold text-[var(--color-primary)]">v5.0 (Latest)</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-[var(--color-border-light)] pb-2">
                                    <span className="text-[var(--color-text)]">Complexity Handling</span>
                                    <span className="text-green-600 font-medium">Optimized</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[var(--color-text)]">Status</span>
                                    <span className="bg-green-100 text-green-800 px-3 py-1 text-xs font-bold uppercase rounded-full">Online</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ABOUT SECTION */}
            <section className="bg-[var(--color-bg-secondary)] py-20">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[var(--color-text)]">{t('landing_what_title')}</h2>
                        <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                            {t('landing_what_desc')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: t('landing_card_1_title'), desc: t('landing_card_1_desc') },
                            { title: t('landing_card_2_title'), desc: t('landing_card_2_desc') },
                            { title: t('landing_card_3_title'), desc: t('landing_card_3_desc') }
                        ].map((item, i) => (
                            <div key={i} className="bg-[var(--color-surface)] p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all border border-[var(--color-border)]">
                                <h3 className="text-xl font-bold mb-4 text-[var(--color-primary)]">{item.title}</h3>
                                <p className="text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* UPGRADE 0 */}
            <section className="py-20 bg-[var(--color-primary-light)]">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1">
                            <span className="inline-block px-3 py-1 bg-white text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider rounded-full mb-4 shadow-sm border border-[var(--color-primary-light)]">{t('landing_upgrade0_badge')}</span>
                            <h2 className="text-4xl font-bold mb-4 text-[var(--color-text)]">Upgrade! 0</h2>
                            <h3 className="text-xl text-[var(--color-text-secondary)] mb-6 font-medium">{t('landing_upgrade0_subtitle')}</h3>
                            <p className="text-lg mb-6 text-[var(--color-text-secondary)] leading-relaxed">
                                {t('landing_upgrade0_desc')}
                            </p>
                            <p className="font-bold text-[var(--color-primary)]">{t('landing_upgrade0_highlight')}</p>
                        </div>
                        <div className="flex-1 flex justify-center">
                            <div className="bg-[var(--color-primary)] text-white p-12 rounded-[var(--radius-full)] shadow-[var(--shadow-xl)] w-64 h-64 flex flex-col items-center justify-center text-center transform hover:scale-105 transition-transform">
                                <div className="text-6xl font-black mb-2">0</div>
                                <div className="text-sm font-bold uppercase tracking-widest">Base Module</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MENTORS */}
            <section className="py-20 bg-[var(--color-bg)] overflow-hidden">
                <div className="max-w-[1200px] mx-auto px-6 relative">
                    <h2 className="text-3xl font-bold mb-12 text-center text-[var(--color-text)]">{t('landing_mentors_title')}</h2>

                    {loading ? (
                        <p className="text-center text-[var(--color-text-secondary)]">Loading mentors...</p>
                    ) : (
                        <div className="relative group/carousel">
                            <button
                                className="absolute left-[-20px] md:left-[-40px] top-1/2 -translate-y-1/2 z-10 rounded-full w-12 h-12 flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all hover:scale-110"
                                onClick={prevSlide}
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>

                            <div className="md:grid md:grid-cols-4 md:gap-8 flex flex-col items-center">
                                {visibleItems.map((mentor, index) => (
                                    <div
                                        key={`${mentor.id}-${index}`}
                                        className={`w-full text-center group ${index !== 0 ? 'hidden md:block' : 'block'}`}
                                    >
                                        <div className="w-40 h-40 bg-[var(--color-bg-tertiary)] rounded-full mx-auto mb-6 overflow-hidden shadow-[var(--shadow-md)] group-hover:scale-105 transition-transform duration-300 border-4 border-[var(--color-surface)]">
                                            {mentor.image_url ? (
                                                <img src={mentor.image_url} alt={mentor.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)] font-bold">NO IMG</div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-xl leading-tight mb-2 text-[var(--color-text)]">{mentor.name}</h3>
                                        <p className="text-sm uppercase text-[var(--color-primary)] mb-2 font-bold tracking-wide">{mentor.role || mentor.specialty}</p>
                                        <p className="text-sm text-[var(--color-text-secondary)] px-4 line-clamp-3">{mentor.description || mentor.bio}</p>
                                    </div>
                                ))}
                                {mentors.length === 0 && <p className="text-center w-full text-[var(--color-text-tertiary)] italic md:col-span-4">No mentors added yet.</p>}
                            </div>

                            <button
                                className="absolute right-[-20px] md:right-[-40px] top-1/2 -translate-y-1/2 z-10 rounded-full w-12 h-12 flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all hover:scale-110"
                                onClick={nextSlide}
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-32 bg-[#1A1A1A] text-white text-center">
                <div className="max-w-[800px] mx-auto px-6">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('landing_cta_title')}</h2>
                    <p className="text-xl md:text-2xl mb-12 text-gray-400 font-light">{t('landing_cta_subtitle')}</p>
                    <Button
                        onClick={() => navigate('/login')}
                        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xl py-6 px-12 h-auto rounded-[var(--radius-lg)] shadow-[0_10px_40px_-10px_rgba(255,107,0,0.5)] transform hover:scale-105 transition-all"
                    >
                        {t('landing_cta_button')}
                    </Button>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                <p>&copy; {new Date().getFullYear()} Upgrade Platform. Designed with ARIS.</p>
            </footer>
        </div>
    );
}
