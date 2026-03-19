import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ConversationPage from './features/conversation/ConversationPage';
import LearningMap from './features/learning-map/LearningMap';
import TopicPage from './features/topic/TopicPage';
import SkillsPage from './features/skills/SkillsPage';
import SkillDetailPage from './features/skills/SkillDetailPage';

// Lazy Loaded Components
const ProjectDashboard = lazy(() => import('./features/projects/ProjectDashboard'));
const ParentDashboard = lazy(() => import('./features/parent/ParentDashboard'));
const ParentTopicDetail = lazy(() => import('./features/parent/ParentTopicDetail'));
const AccountSettings = lazy(() => import('./features/account/AccountSettings'));
const JoinFamily = lazy(() => import('./features/invite/JoinFamily'));
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'));
const ProjectDetail = lazy(() => import('./features/projects/ProjectDetail'));
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage'));
const UpdatePasswordPage = lazy(() => import('./features/auth/UpdatePasswordPage'));
const GuidedActionsPage = lazy(() => import('./features/guided-actions/GuidedActionsPage'));

const AppRoutes = () => {
    return (
        <Suspense fallback={<div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-secondary)'
        }}>Loading...</div>}>
            <Routes>
                {/* Core Experience */}
                <Route path="/" element={<ConversationPage />} />
                <Route path="/conversation" element={<ConversationPage />} />
                <Route path="/conversation/:id" element={<ConversationPage />} />
                <Route path="/map" element={<LearningMap />} />
                <Route path="/skills" element={<SkillsPage />} />
                <Route path="/skills/:id" element={<SkillDetailPage />} />
                <Route path="/topic/:id" element={<TopicPage />} />

                {/* Projects */}
                <Route path="/projects" element={<ProjectDashboard />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />

                {/* Family & Account */}
                <Route path="/parent" element={<ParentDashboard />} />
                <Route path="/parent/topic/:id" element={<ParentTopicDetail />} />
                <Route path="/account" element={<AccountSettings />} />
                <Route path="/settings" element={<AccountSettings />} />
                <Route path="/join/:token" element={<JoinFamily />} />

                {/* Auth & Admin */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/update-password" element={<UpdatePasswordPage />} />

                {/* Utilities */}
                <Route path="/guided-actions" element={<GuidedActionsPage />} />
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
