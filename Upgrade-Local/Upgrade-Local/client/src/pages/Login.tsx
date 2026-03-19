import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export default function Login() {
    const { session, signInMock } = useAuth();
    const { debugMode } = useGlobal();
    const navigate = useNavigate();

    if (session) {
        navigate('/dashboard');
        return null;
    }

    const handleGoogleLogin = async () => {
        console.log("Login button clicked");
        console.log("Supabase URL present:", !!import.meta.env.VITE_SUPABASE_URL);
        console.log("Redirect URL:", `${window.location.origin}/dashboard`);

        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                },
            });
            if (error) {
                console.error("Supabase login error:", error);
                alert(`Login failed: ${error.message}`);
            } else {
                console.log("Supabase login initiated:", data);
            }
        } catch (e) {
            console.error("Login exception:", e);
            alert("Login exception occurred");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
            <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-8 m-4">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold font-[var(--font-main)] uppercase text-[var(--color-text)]">Access Upgrade!</h1>
                </div>
                <div className="space-y-6">
                    <p className="text-center text-[var(--color-text-secondary)]">
                        Connect to your personal upgrade system.
                    </p>
                    <Button
                        onClick={handleGoogleLogin}
                        className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-lg py-6 rounded-[var(--radius-sm)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all font-bold"
                    >
                        Sign in with Google
                    </Button>
                    <div className="text-center mt-4 space-y-2">
                        {debugMode && (
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-[var(--color-border)]" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-[var(--color-surface)] px-2 text-[var(--color-text-tertiary)]">
                                        Development
                                    </span>
                                </div>
                            </div>
                        )}
                        {debugMode && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline" size="sm"
                                        className="text-xs border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                        onClick={() => signInMock({ plan: 'free' })}
                                    >
                                        Free User
                                    </Button>
                                    <Button
                                        variant="outline" size="sm"
                                        className="text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                        onClick={() => signInMock({ plan: 'active' })}
                                    >
                                        Paid User (Active)
                                    </Button>
                                    <Button
                                        variant="outline" size="sm"
                                        className="text-xs border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                                        onClick={() => signInMock({ plan: 'active', isSuperAdmin: true })}
                                    >
                                        Super Admin
                                    </Button>
                                    <Button
                                        variant="outline" size="sm"
                                        className="text-xs border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                        onClick={() => signInMock({ plan: 'practitioner' })}
                                    >
                                        Practitioner
                                    </Button>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-[var(--color-border)]" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-[var(--color-surface)] px-2 text-[var(--color-text-secondary)]">Or</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            variant="link"
                            onClick={() => navigate('/')}
                            className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] block w-full"
                        >
                            Back to Home
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
