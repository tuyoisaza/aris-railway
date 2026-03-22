import { setUnauthorizedCallback } from './api/base-client';
import * as authModule from './api/auth';
import * as family from './api/family';
import * as projects from './api/projects';
import * as topics from './api/topics';
import * as chat from './api/chat';
import * as user from './api/user';
import * as billing from './api/billing';
import * as admin from './api/admin';
import * as agora from './api/agora';
import * as skills from './api/skills';

export const api = {
  setUnauthorizedCallback,

  signup: authModule.signup,
  login: authModule.login,
  requestPasswordReset: authModule.requestPasswordReset,
  updatePassword: authModule.updatePassword,
  logout: authModule.logout,
  initiateGoogleLogin: authModule.initiateGoogleLogin,

  onAuthStateChange: authModule.onAuthStateChange,
  getSession: authModule.getSession,

  createFamily: family.createFamily,
  getFamily: family.getFamily,
  getFamilyActivity: family.getFamilyActivity,
  inviteMember: family.inviteMember,
  updatePin: family.updatePin,
  deleteFamilyMember: family.deleteFamilyMember,
  deleteInvite: family.deleteInvite,
  getInvites: family.getInvites,
  acceptInvite: family.acceptInvite,

  updatePreferences: user.updatePreferences,
  updateAvatar: user.updateAvatar,
  getUser: user.getUser,
  updateUser: user.updateUser,

  getResources: topics.getResources,

  getSkills: skills.getSkills,
  getAllSkills: skills.getAllSkills,
  createSkill: skills.createSkill,
  deleteSkill: skills.deleteSkill,
  deleteSkills: skills.deleteSkills,
  getSkillNotifications: skills.getSkillNotifications,

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

  createCheckoutSession: billing.createCheckoutSession,

  admin,
  agora,
};

export default api;
