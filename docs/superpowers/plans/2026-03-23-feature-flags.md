# Feature Flags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add feature flags system to ARIS admin with global/tenant/user scopes

**Architecture:** Prisma model + Express routes + React admin component

**Tech Stack:** Prisma 5.22.0, SQLite, Express.js, React 19, TypeScript

---

## Task 1: Add FeatureFlag Model to Prisma Schema

**Files:**
- Modify: `server/prisma/schema.prisma:629-635` (add at end)

- [ ] **Step 1: Add FeatureFlag model**

Add at end of schema.prisma:
```prisma
// ============ FEATURE FLAGS TABLE ============

model FeatureFlag {
  id          String    @id @default(uuid())
  name        String    @unique
  description String?
  scope       String    @default("GLOBAL")
  enabled     Boolean   @default(false)
  tenantId    String?
  userId      String?
  expiresAt   DateTime?
  reviewDate  DateTime?
  metadata    String    @default("{}")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("feature_flags")
}
```

- [ ] **Step 2: Run Prisma migration**

Run: `npx prisma generate && npx prisma db push`
Expected: Migration applied, FeatureFlag model available

---

## Task 2: Create Backend Route for Feature Flags

**Files:**
- Create: `server/routes/admin/featureflags.js`

- [ ] **Step 1: Create featureflags.js route**

```javascript
import express from 'express';
import { prisma } from '../../db.js';
import { requireAuth, requireAdmin, sendSuccess, sendError } from './middleware.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { scope } = req.query;
        const where = scope ? { scope: scope as string } : {};
        const flags = await prisma.featureFlag.findMany({ where });
        sendSuccess(res, flags);
    } catch (err) {
        next(err);
    }
});

router.get('/check/:name', requireAuth, async (req, res, next) => {
    try {
        const { name } = req.params;
        const { userId, tenantId } = req.user;
        
        const flag = await prisma.featureFlag.findFirst({
            where: {
                name,
                OR: [
                    { scope: 'GLOBAL' },
                    { scope: 'TENANT', tenantId },
                    { scope: 'USER', userId },
                ],
            },
        });

        const enabled = flag?.enabled && (!flag.expiresAt || flag.expiresAt > new Date());
        sendSuccess(res, { enabled, flag });
    } catch (err) {
        next(err);
    }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { name, description, scope, enabled, tenantId, userId, expiresAt, reviewDate, metadata } = req.body;
        
        const existing = await prisma.featureFlag.findUnique({ where: { name } });
        if (existing) {
            return sendError(res, 'Flag with this name already exists', 400);
        }

        const flag = await prisma.featureFlag.create({
            data: {
                name,
                description,
                scope: scope || 'GLOBAL',
                enabled: enabled ?? false,
                tenantId,
                userId,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                reviewDate: reviewDate ? new Date(reviewDate) : null,
                metadata: metadata || '{}',
            },
        });
        sendSuccess(res, flag);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, scope, enabled, tenantId, userId, expiresAt, reviewDate, metadata } = req.body;

        const flag = await prisma.featureFlag.update({
            where: { id },
            data: {
                name,
                description,
                scope,
                enabled,
                tenantId,
                userId,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                reviewDate: reviewDate ? new Date(reviewDate) : null,
                metadata,
            },
        });
        sendSuccess(res, flag);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.featureFlag.delete({ where: { id } });
        sendSuccess(res, { success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
```

- [ ] **Step 2: Register route in admin router**

Modify `server/routes/admin.js`:
```javascript
import featureflagsRouter from './admin/featureflags.js';
// Add after guidedactionsRouter
router.use('/featureflags', featureflagsRouter);
```

---

## Task 3: Add Feature Flags API Methods to Frontend

**Files:**
- Modify: `src/services/api/admin.ts` (add at end)

- [ ] **Step 1: Add feature flag API methods**

Add before the closing bracket:
```typescript
export const getFeatureFlags = async (scope?: string) => {
  const url = scope ? `${API_URL}/admin/featureflags?scope=${scope}` : `${API_URL}/admin/featureflags`;
  const res = await fetch(url, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const createFeatureFlag = async (flag: any) => {
  const res = await fetch(`${API_URL}/admin/featureflags`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(flag),
  });
  await handleResponse(res);
  return await res.json();
};

export const updateFeatureFlag = async (id: string, updates: any) => {
  const res = await fetch(`${API_URL}/admin/featureflags/${id}`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify(updates),
  });
  await handleResponse(res);
  return await res.json();
};

export const deleteFeatureFlag = async (id: string) => {
  const res = await fetch(`${API_URL}/admin/featureflags/${id}`, {
    method: 'DELETE',
    headers: await getHeaders(),
  });
  await handleResponse(res);
  return await res.json();
};

export const checkFeatureFlag = async (name: string) => {
  const res = await fetch(`${API_URL}/admin/featureflags/check/${name}`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};
```

- [ ] **Step 2: Export in api.ts**

Modify `src/services/api.ts`:
```typescript
import * as admin from './api/admin';
// Ensure admin object is exported with new methods (already done via default export)
```

---

## Task 4: Create Admin Feature Flags Component

**Files:**
- Create: `src/features/admin/components/AdminFeatureFlags.tsx`

- [ ] **Step 1: Create AdminFeatureFlags.tsx**

```tsx
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RefreshCw, Plus, Edit2, Trash2, Flag, ToggleLeft, ToggleRight, Calendar, X } from 'lucide-react';

interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  scope: 'GLOBAL' | 'TENANT' | 'USER';
  enabled: boolean;
  tenantId?: string;
  userId?: string;
  expiresAt?: string;
  reviewDate?: string;
  metadata: string;
  createdAt: string;
  updatedAt: string;
}

const AdminFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filterScope, setFilterScope] = useState<string>('');

  useEffect(() => {
    fetchFlags();
  }, [filterScope]);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getFeatureFlags(filterScope || undefined);
      setFlags(data?.data || data || []);
    } catch (err) {
      console.error('[Admin/FeatureFlags] Error fetching flags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      await api.admin.updateFeatureFlag(flag.id, { enabled: !flag.enabled });
      fetchFlags();
    } catch (err) {
      console.error('[Admin/FeatureFlags] Error toggling flag:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) return;
    try {
      await api.admin.deleteFeatureFlag(id);
      fetchFlags();
    } catch (err) {
      console.error('[Admin/FeatureFlags] Error deleting flag:', err);
    }
  };

  const handleSave = async (flagData: Partial<FeatureFlag>) => {
    try {
      if (editingFlag) {
        await api.admin.updateFeatureFlag(editingFlag.id, flagData);
      } else {
        await api.admin.createFeatureFlag(flagData);
      }
      setEditingFlag(null);
      setIsCreating(false);
      fetchFlags();
    } catch (err) {
      console.error('[Admin/FeatureFlags] Error saving flag:', err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const isExpired = (flag: FeatureFlag) => {
    if (!flag.expiresAt) return false;
    return new Date(flag.expiresAt) < new Date();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <div className="flex gap-4">
          <select
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Scopes</option>
            <option value="GLOBAL">Global</option>
            <option value="TENANT">Tenant</option>
            <option value="USER">User</option>
          </select>
          <button
            onClick={fetchFlags}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Flag
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Scope</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Expires</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Review Date</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {flags.map((flag) => (
              <tr key={flag.id} className={isExpired(flag) ? 'bg-red-50' : ''}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Flag size={16} className="text-gray-400" />
                    <div>
                      <div className="font-medium">{flag.name}</div>
                      <div className="text-sm text-gray-500">{flag.description || '-'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    flag.scope === 'GLOBAL' ? 'bg-purple-100 text-purple-700' :
                    flag.scope === 'TENANT' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {flag.scope}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(flag)}
                    className={`flex items-center gap-1 ${
                      flag.enabled ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {flag.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    <span className="text-sm">{flag.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                  {isExpired(flag) && (
                    <span className="ml-2 text-xs text-red-600">(Expired)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(flag.expiresAt)}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(flag.reviewDate)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditingFlag(flag)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(flag.id)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {flags.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Flag size={48} className="mx-auto mb-4 opacity-50" />
            <p>No feature flags found</p>
          </div>
        )}
      </div>

      {(isCreating || editingFlag) && (
        <FlagFormModal
          flag={editingFlag}
          onSave={handleSave}
          onClose={() => {
            setEditingFlag(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
};

interface FlagFormModalProps {
  flag: FeatureFlag | null;
  onSave: (data: Partial<FeatureFlag>) => void;
  onClose: () => void;
}

const FlagFormModal: React.FC<FlagFormModalProps> = ({ flag, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: flag?.name || '',
    description: flag?.description || '',
    scope: flag?.scope || 'GLOBAL',
    enabled: flag?.enabled ?? false,
    tenantId: flag?.tenantId || '',
    userId: flag?.userId || '',
    expiresAt: flag?.expiresAt ? flag.expiresAt.split('T')[0] : '',
    reviewDate: flag?.reviewDate ? flag.reviewDate.split('T')[0] : '',
    metadata: flag?.metadata || '{}',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      tenantId: formData.tenantId || undefined,
      userId: formData.userId || undefined,
      expiresAt: formData.expiresAt || undefined,
      reviewDate: formData.reviewDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{flag ? 'Edit' : 'Create'} Feature Flag</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
              disabled={!!flag}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
            <select
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="GLOBAL">Global</option>
              <option value="TENANT">Tenant</option>
              <option value="USER">User</option>
            </select>
          </div>

          {formData.scope === 'TENANT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant ID</label>
              <input
                type="text"
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          )}

          {formData.scope === 'USER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          )}

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Enabled</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Date</label>
              <input
                type="date"
                value={formData.reviewDate}
                onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {flag ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminFeatureFlags;
```

---

## Task 5: Add Route to AppRoutes

**Files:**
- Modify: `src/AppRoutes.tsx`

- [ ] **Step 1: Add AdminFeatureFlags import**

Add after AdminGuidedActions import:
```tsx
const AdminFeatureFlags = lazy(() => import('./features/admin/components/AdminFeatureFlags'));
```

- [ ] **Step 2: Add route**

Add after guidedactions route:
```tsx
<Route path="/admin/featureflags" element={<AdminFeatureFlags />} />
```

---

## Task 6: Verify and Build

- [ ] **Step 1: Run Prisma generate and build**

Run: `cd server && npx prisma generate && cd .. && npm run build`
Expected: No TypeScript errors

- [ ] **Step 2: Commit changes**

```bash
git add -A
git commit -m "v0.0.60: Add feature flags to admin"
```
