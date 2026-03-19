import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import LanguageSelector from '@/components/LanguageSelector';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
    const { user, signOut } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const isAdmin = user?.email && [
        'admin@upgrade.com',
        'tuyo@upgrade.com',
        'thetboard@gmail.com' // Hardcoded for now based on legacy logic, ideally from profile/claim
    ].includes(user.email);

    return (
        <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)] py-4 sticky top-0 z-50 shadow-[var(--shadow-sm)]">
            <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">

                {/* LOGO */}
                <Link to="/" className="text-2xl font-black uppercase tracking-tighter hover:text-[var(--color-primary)] transition-colors text-[var(--color-text)]">
                    Upgrade<span className="text-[var(--color-primary)]">!</span>
                </Link>

                {/* NAVIGATION LINKS */}
                <div className="hidden md:flex items-center gap-8 font-mono font-bold uppercase text-sm text-[var(--color-text)]">
                    <Link to="/dashboard" className="hover:text-[var(--color-primary)] transition-colors">{t('nav_dashboard')}</Link>
                    <Link to="/pensum" className="hover:text-[var(--color-primary)] transition-colors">{t('nav_pensum')}</Link>
                    <a href="/#about" className="hover:text-[var(--color-primary)] transition-colors">{t('nav_manifesto')}</a>
                </div>

                {/* USER MENU */}
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <LanguageSelector />
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-[var(--color-border)] p-0 hover:bg-[var(--color-bg-tertiary)]">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
                                        <AvatarFallback className="font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                                            {user.email?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-[var(--color-surface)] border border-[var(--color-border)] z-50 rounded-[var(--radius-md)] shadow-[var(--shadow-lg)]" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none text-[var(--color-text)]">{user.user_metadata?.full_name || 'User'}</p>
                                        <p className="text-xs leading-none text-[var(--color-text-secondary)]">
                                            {user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-[var(--color-border)]" />
                                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] cursor-pointer">
                                    {t('nav_dashboard')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/profile')} className="text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] cursor-pointer">
                                    {t('btn_profile')}
                                </DropdownMenuItem>

                                {isAdmin && (
                                    <>
                                        <DropdownMenuSeparator className="bg-[var(--color-border)]" />
                                        <DropdownMenuItem onClick={() => navigate('/admin')} className="font-bold text-[var(--color-primary)] uppercase hover:bg-[var(--color-bg-tertiary)] cursor-pointer">
                                            Admin Command
                                        </DropdownMenuItem>
                                    </>
                                )}

                                <DropdownMenuSeparator className="bg-[var(--color-border)]" />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer">
                                    {t('btn_logout')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex gap-4">
                            <Link to="/login">
                                <Button variant="ghost" className="font-mono font-bold uppercase text-[var(--color-text)] hover:text-[var(--color-primary)] hover:bg-transparent">{t('btn_login')}</Button>
                            </Link>
                            <Link to="/login">
                                <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white h-auto py-2 px-6 text-xs rounded-[var(--radius-sm)]">{t('landing_cta_button')}</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
