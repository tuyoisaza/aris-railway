import { setUnauthorizedCallback } from './api/base-client';
import * as auth from './api/auth';
import * as family from './api/family';
import * as projects from './api/projects';
import * as topics from './api/topics';
import * as chat from './api/chat';
import * as user from './api/user';
import * as billing from './api/billing';
import * as admin from './api/admin';
import * as agora from './api/agora';

export const api = {
  setUnauthorizedCallback,

  // Auth
  signup: auth.signup,
  login: auth.login,
  requestPasswordReset: auth.requestPasswordReset,
  updatePassword: auth.updatePassword,
  logout: auth.logout,
  initiateGoogleLogin: auth.initiateGoogleLogin,

  // Family
  createFamily: family.createFamily,
  getFamily: family.getFamily,
  getFamilyActivity: family.getFamilyActivity,
  inviteMember: family.inviteMember,
  updatePin: family.updatePin,
  deleteFamilyMember: family.deleteFamilyMember,
  deleteInvite: family.deleteInvite,
  getInvites: family.getInvites,
  acceptInvite: family.acceptInvite,

  // User Persistence
  updatePreferences: user.updatePreferences,
  updateAvatar: user.updateAvatar,
  getUser: user.getUser,
  updateUser: user.updateUser,

  // Resources
  getResources: topics.getResources,

  // Projects
  getProjects: projects.getProjects,
  createProjectFromSkill: projects.createProjectFromSkill,
  createProject: projects.createProject,
  updateProject: projects.updateProject,
  deleteProject: projects.deleteProject,
  architectProject: projects.architectProject,
  startProjectConversation: projects.startProjectConversation,
  getProjectArtifacts: projects.getProjectArtifacts,
  addProjectArtifact: projects.addProjectArtifact,
  deleteProjectArtifact: projects.deleteProjectArtifact,
  getProjectReflections: projects.getProjectReflections,
  addProjectReflection: projects.addProjectReflection,

  // Topics
  getTopics: topics.getTopics,
  getTopicGraph: topics.getTopicGraph,
  getTopic: topics.getTopic,
  getTopicProgress: topics.getTopicProgress,
  updateTopicProgress: topics.updateTopicProgress,
  deleteTopic: topics.deleteTopic,
  createTopic: topics.createTopic,
  remapTopics: topics.remapTopics,
  mergeTopics: topics.mergeTopics,
  enrichTopic: topics.enrichTopic,
  startTopicConversation: topics.startTopicConversation,
  startSkillLevelConversation: topics.startSkillLevelConversation,
  generateSkillCurriculum: topics.generateSkillCurriculum,

  // ResourcesChat
  getConversations: chat.getConversations,
  createConversation: chat.createConversation,
  deleteConversation: chat.deleteConversation,
  updateConversation: chat.updateConversation,
  renameConversation: chat.renameConversation,
  getFolders: chat.getFolders,
  createFolder: chat.createFolder,
  renameFolder: chat.renameFolder,
  deleteFolder: chat.deleteFolder,
  moveConversationToFolder: chat.moveConversationToFolder,
  generateSummary: chat.generateSummary,
  createMessage: chat.createMessage,

  // Stripe
  createCheckoutSession: billing.createCheckoutSession,

  // Admin and Agora APIs
  admin,
  agora,
};
