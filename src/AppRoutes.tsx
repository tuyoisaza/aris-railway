import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
const AdminLayout = lazy(() => import('./features/admin/AdminLayout'));
const AdminAgents = lazy(() => import('./features/admin/components/AdminAgents'));
const AdminActions = lazy(() => import('./features/admin/components/AdminActions'));
const AdminSystemStatus = lazy(() => import('./features/admin/components/AdminSystemStatus'));
const AdminBadges = lazy(() => import('./features/admin/components/AdminBadges'));
const AdminUsers = lazy(() => import('./features/admin/components/AdminUsers'));
const AdminDebug = lazy(() => import('./features/admin/components/AdminDebug'));
const AdminGuidedActions = lazy(() => import('./features/admin/components/AdminGuidedActions'));
const AdminFeatureFlags = lazy(() => import('./features/admin/components/AdminFeatureFlags'));
const AdminAuditLog = lazy(() => import('./features/admin/components/AdminAuditLog'));
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

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/agents" replace />} />
                    <Route path="agents" element={<AdminAgents />} />
                    <Route path="actions" element={<AdminActions />} />
                    <Route path="systemstatus" element={<AdminSystemStatus />} />
                    <Route path="badges" element={<AdminBadges />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="debug" element={<AdminDebug />} />
                    <Route path="guidedactions" element={<AdminGuidedActions />} />
                    <Route path="featureflags" element={<AdminFeatureFlags />} />
                    <Route path="audit" element={<AdminAuditLog />} />
                </Route>
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/update-password" element={<UpdatePasswordPage />} />

                {/* Utilities */}
                <Route path="/guided-actions" element={<GuidedActionsPage />} />
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
