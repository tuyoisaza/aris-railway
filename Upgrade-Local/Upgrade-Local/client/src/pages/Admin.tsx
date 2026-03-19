import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, Users, Shield, FileQuestion } from 'lucide-react';
import AdminNav from '@/components/AdminNav';

export default function Admin() {
    const navigate = useNavigate();

    const sections = [
        {
            title: 'Manage Courses',
            description: 'Create and edit courses, assessments, and syllabus content.',
            icon: <BookOpen className="h-8 w-8 text-[var(--color-primary)] mb-4" />,
            path: '/admin/courses'
        },
        {
            title: 'Manage Users',
            description: 'View user progress, manage roles, and handle subscriptions.',
            icon: <Users className="h-8 w-8 text-[var(--color-primary)] mb-4" />,
            path: '/admin/users'
        },
        {
            title: 'Manage Mentors',
            description: 'Add or edit mentors displayed in courses.',
            icon: <Users className="h-8 w-8 text-[var(--color-primary)] mb-4" />, // Reusing users icon or maybe another?
            path: '/admin/mentors'
        },
        {
            title: 'Manage Agents',
            description: 'Configure IA Agents and Prompt Engineering.',
            icon: <Shield className="h-8 w-8 text-[var(--color-primary)] mb-4" />,
            path: '/admin/agents'
        },
        {
            title: 'Manage Tests',
            description: 'Edit diagnostic questions and scoring logic.',
            icon: <FileQuestion className="h-8 w-8 text-[var(--color-primary)] mb-4" />,
            path: '/admin/questions'
        },
        // Placeholder for future sections
        {
            title: 'System Logs',
            description: 'View system health, error logs, and audit trails.',
            icon: <Shield className="h-8 w-8 text-[var(--color-text-tertiary)] mb-4" />,
            path: '/admin/logs'
        }
    ];

    return (
        <>
            <AdminNav />
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h1 className="admin-title">Admin Command Center</h1>
                        <p className="admin-subtitle">Restricted Access Area</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {sections.map((section, idx) => (
                        <div
                            key={idx}
                            className="admin-card cursor-pointer hover:shadow-md hover:border-[var(--color-primary)] bg-[var(--color-surface)]"
                            onClick={() => section.path && navigate(section.path)}
                        >
                            <div className="flex flex-col h-full">
                                {section.icon}
                                <h3 className="admin-card-title mb-2">{section.title}</h3>
                                <p className="text-[var(--color-text-secondary)] text-sm">{section.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
