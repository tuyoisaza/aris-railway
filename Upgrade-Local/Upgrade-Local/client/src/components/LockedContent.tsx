import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LockedContentProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    title?: string;
    description?: string;
}

export default function LockedContent({
    children,
    fallback,
    title = "Premium Content",
    description = "This content is available exclusively to Explorer and Builder plan members."
}: LockedContentProps) {
    const { profile } = useAuth();
    const navigate = useNavigate();

    const isPremium = profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing'; // Include trialing

    if (isPremium) {
        return <>{children}</>;
    }

    if (fallback) return <>{fallback}</>;

    return (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)] text-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-[var(--color-surface-hover)] rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Lock className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-xl font-bold mb-2 font-[var(--font-main)]">{title}</h3>
            <p className="text-[var(--color-text-secondary)] mb-6 max-w-md">
                {description}
            </p>
            <Button
                onClick={() => navigate('/profile')}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-md hover:shadow-lg transition-all"
            >
                Upgrade to Unlock
            </Button>
        </div>
    );
}
