# Roles & Permissions

## Overview

Sentra supports **team collaboration** with granular role-based access control (RBAC). Team members can be invited to projects with specific roles that determine what actions they can perform.

**Primary Use Case:** Allow team members to create and manage tasks/issues without giving them full administrative access to the project.

## Role Types

Sentra defines 5 roles with increasing levels of access:

### Quick Access Reference

| Feature Area | Viewer | Contributor | Developer | Admin | Owner |
|--------------|--------|-------------|-----------|-------|-------|
| **Dashboard Access** | ✅ View only | ✅ View + Create tasks | ✅ Full | ✅ Full | ✅ Full |
| **Tasks** | View all | Create/Edit own | Full CRUD | Full CRUD | Full CRUD |
| **Logs & Code** | ❌ No access | ❌ No access | ✅ View all | ✅ View all | ✅ View all |
| **Workflows** | ❌ No access | ❌ No access | ✅ View only | ✅ Manage | ✅ Manage |
| **Team** | View list | View list | View list | Invite/Manage | Invite/Manage |
| **Settings** | ❌ No access | ❌ No access | ✅ View only | ✅ Edit | ✅ Edit |
| **Project Deletion** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Billing** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

### 1. Viewer (Read-Only)

**Purpose:** Monitor project progress without making changes

**Permissions:**
- ✅ View project overview
- ✅ View tasks and their status
- ✅ View kanban board
- ❌ Cannot create or edit tasks
- ❌ Cannot view logs or code changes
- ❌ Cannot perform any write operations

**Use Case:** Stakeholders, product managers, clients who need visibility

### 2. Contributor (Task Creator)

**Purpose:** Create issues/tasks for the team to work on

**Permissions:**
- ✅ Create tasks
- ✅ Edit their own tasks
- ✅ View their own tasks
- ✅ Comment on tasks
- ❌ Cannot edit others' tasks
- ❌ Cannot view logs or code changes
- ❌ Cannot retry workflows
- ❌ Cannot manage team or settings

**Use Case:** QA testers, designers, product owners who identify work items

### 3. Developer (Full Task Access)

**Purpose:** Active development team members

**Permissions:**
- ✅ Create tasks
- ✅ Edit any task
- ✅ Delete tasks
- ✅ View logs
- ✅ View code changes and diffs
- ✅ Retry failed tasks
- ✅ Comment on tasks
- ✅ Upload design assets
- ❌ Cannot manage workflows
- ❌ Cannot invite team members
- ❌ Cannot change project settings

**Use Case:** Developers, engineers actively working on the project

### 4. Admin (Project Manager)

**Purpose:** Manage project operations and team

**Permissions:**
- ✅ All Developer permissions, plus:
- ✅ Manage workflows (create, edit, delete)
- ✅ Invite team members
- ✅ Change member roles (except Owner)
- ✅ Remove members
- ✅ Configure project settings
- ✅ Manage agent prompts
- ❌ Cannot delete the project
- ❌ Cannot manage billing

**Use Case:** Technical leads, project managers, DevOps engineers

### 5. Owner (Full Control)

**Purpose:** Project ownership and final authority

**Permissions:**
- ✅ All Admin permissions, plus:
- ✅ Delete the project
- ✅ Manage billing (if applicable)
- ✅ Transfer ownership
- ✅ Change any member's role including Admins

**Use Case:** Project creator, CTO, engineering lead

**Note:** Every project has exactly **one** Owner. Ownership can be transferred.

## Permission Matrix

| Permission | Owner | Admin | Developer | Contributor | Viewer |
|------------|-------|-------|-----------|-------------|--------|
| **Tasks** |
| View all tasks | ✅ | ✅ | ✅ | Own only | ✅ |
| Create tasks | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit own tasks | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit others' tasks | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete tasks | ✅ | ✅ | ✅ | ❌ | ❌ |
| Retry workflows | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Code & Logs** |
| View logs | ✅ | ✅ | ✅ | ❌ | ❌ |
| View code changes | ✅ | ✅ | ✅ | ❌ | ❌ |
| View diffs | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Assets** |
| Upload design assets | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete assets | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Workflows** |
| View workflows | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create workflows | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit workflows | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete workflows | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Team** |
| View team members | ✅ | ✅ | ✅ | ✅ | ✅ |
| Invite members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change roles | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Settings** |
| View project settings | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit project settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage agent prompts | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Billing** |
| View billing | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ | ❌ |

## Database Schema

### Project Members Table

```typescript
export const projectMembers = pgTable('project_members', {
  id: serial('id').primaryKey(),

  projectId: varchar('project_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),

  role: varchar('role', { length: 50 }).notNull(),
  // 'owner' | 'admin' | 'developer' | 'contributor' | 'viewer'

  invitedBy: varchar('invited_by', { length: 255 }), // userId who invited
  invitedAt: timestamp('invited_at').notNull(),
  acceptedAt: timestamp('accepted_at'),

  // Unique constraint: one role per user per project
  uniqueProjectUser: unique('project_user').on(projectId, userId),

  // Indexes
  projectIdIdx: index('project_id_idx').on(projectId),
  userIdIdx: index('user_id_idx').on(userId),
});
```

### Invitations Table

```typescript
export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),

  projectId: varchar('project_id', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),

  token: varchar('token', { length: 255 }).notNull().unique(),
  invitedBy: varchar('invited_by', { length: 255 }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // 7 days from creation
  acceptedAt: timestamp('accepted_at'),

  // Index for fast token lookup
  tokenIdx: index('token_idx').on(token),
});
```

### Updated Audit Log

```typescript
// Add userId to audit log for attribution
export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),

  userId: varchar('user_id', { length: 255 }), // Who performed the action
  projectId: varchar('project_id', { length: 255 }),
  taskId: varchar('task_id', { length: 255 }),

  action: varchar('action', { length: 100 }).notNull(),
  // Actions: task_created, task_edited, workflow_executed, member_invited, etc.

  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
```

### Updated Tasks Table

```typescript
// Add creator tracking
export const tasks = pgTable('tasks', {
  // ... existing fields ...

  createdBy: varchar('created_by', { length: 255 }).notNull(), // userId
  assignedTo: varchar('assigned_to', { length: 255 }), // Future: task assignment
});
```

## Team Management UI

### Team Page Layout

**Route:** `/projects/[projectId]/team`

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back to Project] Team Members                [+ Invite]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Members (5)                                                 │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 👤 John Doe                                    Owner │   │
│ │    john@example.com                                 │   │
│ │    Joined: Oct 1, 2025                              │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 👤 Jane Smith                     [Admin ▼] [Remove]│   │
│ │    jane@example.com                                 │   │
│ │    Joined: Oct 2, 2025 • Invited by: John Doe      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 👤 Bob Johnson                [Developer ▼] [Remove]│   │
│ │    bob@example.com                                  │   │
│ │    Joined: Oct 3, 2025 • Invited by: Jane Smith    │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Pending Invitations (2)                                     │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 📧 alice@example.com                       Developer │   │
│ │    Invited: Oct 4, 2025 by John Doe                │   │
│ │    Expires: Oct 11, 2025                            │   │
│ │    [Resend] [Cancel]                                │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Invite Member Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Invite Team Member                                      [×] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Email Address                                               │
│ [alice@example.com_______________________]                 │
│                                                             │
│ Role                                                        │
│ [Developer ▼]                                               │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Developer Role Permissions:                         │   │
│ │ • Create and edit tasks                             │   │
│ │ • View logs and code changes                        │   │
│ │ • Retry workflows                                   │   │
│ │ • Cannot manage team or settings                    │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Personal Message (optional)                                 │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Hey Alice, we'd love for you to join the project!  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ [Cancel] [Send Invitation]                                 │
└─────────────────────────────────────────────────────────────┘
```

## Invitation Flow

### Step 1: Owner/Admin Sends Invitation

```typescript
async function inviteTeamMember(
  projectId: string,
  email: string,
  role: string,
  invitedBy: string,
  message?: string
): Promise<void> {
  // Generate unique token
  const token = generateSecureToken();

  // Create invitation
  await db.insert(invitations).values({
    projectId,
    email,
    role,
    token,
    invitedBy,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Send email
  await sendEmail({
    to: email,
    subject: 'You've been invited to join a Sentra project',
    body: `
      You've been invited to join the "${projectName}" project on Sentra.

      Role: ${role}
      Invited by: ${inviterName}

      ${message ? `Message: ${message}` : ''}

      Click here to accept: https://app.sentra.dev/invite/${token}

      This invitation expires in 7 days.
    `,
  });

  // Log audit event
  await logAudit({
    userId: invitedBy,
    projectId,
    action: 'member_invited',
    metadata: { email, role },
  });
}
```

### Step 2: Recipient Receives Email

```
───────────────────────────────────────────────────────
From: Sentra <no-reply@sentra.dev>
To: alice@example.com
Subject: You've been invited to join a Sentra project
───────────────────────────────────────────────────────

You've been invited to join the "E-Commerce Platform"
project on Sentra.

Role: Developer
Invited by: John Doe (john@example.com)

Message:
Hey Alice, we'd love for you to join the project!

[Accept Invitation]
https://app.sentra.dev/invite/abc123token

This invitation expires on October 11, 2025.
───────────────────────────────────────────────────────
```

### Step 3: Accept Invitation Page

**Route:** `/invite/[token]`

```
┌─────────────────────────────────────────────────────────────┐
│ Sentra                                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   You've been invited to join a project!                   │
│                                                             │
│   Project: E-Commerce Platform                             │
│   Role: Developer                                           │
│   Invited by: John Doe                                      │
│                                                             │
│   ┌───────────────────────────────────────────────────┐   │
│   │ Developer Role Permissions:                       │   │
│   │ • Create and edit tasks                           │   │
│   │ • View logs and code changes                      │   │
│   │ • Retry workflows                                 │   │
│   └───────────────────────────────────────────────────┘   │
│                                                             │
│   [Existing User? Sign In] [New User? Create Account]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 4: Automatic Project Access

```typescript
// After login/registration
async function acceptInvitation(token: string, userId: string): Promise<void> {
  // Get invitation
  const invitation = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .where(isNull(invitations.acceptedAt))
    .where(gt(invitations.expiresAt, new Date()))
    .limit(1);

  if (invitation.length === 0) {
    throw new Error('Invitation not found or expired');
  }

  const inv = invitation[0];

  // Add user to project
  await db.insert(projectMembers).values({
    projectId: inv.projectId,
    userId,
    role: inv.role,
    invitedBy: inv.invitedBy,
    invitedAt: inv.createdAt,
    acceptedAt: new Date(),
  });

  // Mark invitation as accepted
  await db
    .update(invitations)
    .set({ acceptedAt: new Date() })
    .where(eq(invitations.id, inv.id));

  // Log audit event
  await logAudit({
    userId,
    projectId: inv.projectId,
    action: 'member_joined',
    metadata: { role: inv.role },
  });

  // Send notification to inviter
  await notify(inv.invitedBy, {
    type: 'member_accepted_invitation',
    message: `${userEmail} has joined ${projectName}`,
  });
}
```

## Permission Enforcement

### Middleware for API Routes

```typescript
// middleware/rbac.ts
export async function requirePermission(
  req: Request,
  projectId: string,
  action: string
): Promise<void> {
  const userId = await requireAuth(req);

  // Get user's role in this project
  const member = await db
    .select()
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId))
    .where(eq(projectMembers.userId, userId))
    .limit(1);

  if (member.length === 0) {
    throw new Error('You are not a member of this project');
  }

  const role = member[0].role;

  // Check permission
  if (!hasPermission(role, action)) {
    throw new Error('Insufficient permissions');
  }
}

function hasPermission(role: string, action: string): boolean {
  const permissions = {
    viewer: ['view_tasks', 'view_project'],
    contributor: ['view_tasks', 'view_project', 'create_tasks', 'edit_own_tasks'],
    developer: [
      'view_tasks',
      'view_project',
      'create_tasks',
      'edit_tasks',
      'delete_tasks',
      'view_logs',
      'view_code',
      'retry_workflows',
    ],
    admin: [
      // All developer permissions, plus:
      'manage_workflows',
      'invite_members',
      'manage_members',
      'edit_settings',
    ],
    owner: [
      // All admin permissions, plus:
      'delete_project',
      'manage_billing',
      'transfer_ownership',
    ],
  };

  const rolePerms = permissions[role] || [];

  // Owner and Admin inherit all lower permissions
  if (role === 'admin') {
    rolePerms.push(...permissions.developer);
  }
  if (role === 'owner') {
    rolePerms.push(...permissions.admin, ...permissions.developer);
  }

  return rolePerms.includes(action);
}
```

### Example: Task Creation Endpoint

```typescript
// API route: /api/projects/[projectId]/tasks
export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  // Check permission
  await requirePermission(req, params.projectId, 'create_tasks');

  const userId = await getUserId(req);
  const { title, description, type, priority } = await req.json();

  // Create task
  const task = await db.insert(tasks).values({
    projectId: params.projectId,
    title,
    description,
    type,
    priority,
    createdBy: userId, // Track creator
    status: 'backlog',
  }).returning();

  // Log audit event
  await logAudit({
    userId,
    projectId: params.projectId,
    taskId: task[0].id,
    action: 'task_created',
    metadata: { title, type },
  });

  return Response.json(task[0]);
}
```

### Example: Edit Task (Check Ownership for Contributors)

```typescript
// API route: /api/tasks/[taskId]
export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  const userId = await getUserId(req);

  // Get task
  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, params.taskId))
    .limit(1);

  if (task.length === 0) {
    return Response.json({ error: 'Task not found' }, { status: 404 });
  }

  const projectId = task[0].projectId;

  // Get user's role
  const member = await db
    .select()
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId))
    .where(eq(projectMembers.userId, userId))
    .limit(1);

  const role = member[0].role;

  // Enforce permission
  if (role === 'contributor' && task[0].createdBy !== userId) {
    return Response.json(
      { error: 'Contributors can only edit their own tasks' },
      { status: 403 }
    );
  }

  if (!hasPermission(role, 'edit_tasks')) {
    return Response.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Update task
  const updated = await db
    .update(tasks)
    .set({ ...req.json(), updatedAt: new Date() })
    .where(eq(tasks.id, params.taskId))
    .returning();

  return Response.json(updated[0]);
}
```

## Dashboard Role Indicators

### Task Cards Show Creator

```tsx
function TaskCard({ task }: { task: Task }) {
  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <div className="task-meta">
        <span>#{task.id}</span>
        <span>• {task.type}</span>
      </div>
      <div className="task-creator">
        <Avatar src={task.createdBy.avatar} size="sm" />
        <span className="text-xs text-muted-foreground">
          Created by {task.createdBy.name}
        </span>
      </div>
      {task.status === 'in_progress' && (
        <div className="progress">
          {task.currentPhase} ({task.progress}%)
        </div>
      )}
    </div>
  );
}
```

### Role Badge on Team Page

```tsx
function RoleBadge({ role }: { role: string }) {
  const colors = {
    owner: 'bg-violet-500',
    admin: 'bg-blue-500',
    developer: 'bg-green-500',
    contributor: 'bg-yellow-500',
    viewer: 'bg-gray-500',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs ${colors[role]}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}
```

## Filtering by Creator

**Dashboard filter:**

```tsx
function TaskFilters() {
  const members = useProjectMembers();

  return (
    <div className="filters">
      <Select>
        <SelectTrigger>Created By: All</SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Members</SelectItem>
          {members.map(member => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

## Notifications (Role-Based)

```typescript
async function notifyTaskFailure(taskId: string): Promise<void> {
  const task = await getTask(taskId);
  const projectId = task.projectId;

  // Get project members
  const members = await db
    .select()
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));

  for (const member of members) {
    // Notify based on role
    if (member.role === 'owner' || member.role === 'admin') {
      // All failures
      await sendNotification(member.userId, {
        type: 'task_failed',
        message: `Task "${task.title}" failed in ${task.phase} phase`,
        taskId,
      });
    } else if (member.role === 'developer' && task.createdBy === member.userId) {
      // Only their own tasks
      await sendNotification(member.userId, {
        type: 'task_failed',
        message: `Your task "${task.title}" failed`,
        taskId,
      });
    }
    // Contributors and Viewers: no notifications
  }
}
```

## Row-Level Security

**Database policies ensure users only access authorized projects:**

```sql
-- Enable RLS on project members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see memberships they're part of
CREATE POLICY project_members_access ON project_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Enable RLS on tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see tasks from projects they're members of
CREATE POLICY tasks_access ON tasks
  FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );
```

## Future: Organizations

**Phase 2 feature:**

```
Organization
  ├─ Team (shared across projects)
  ├─ Billing (centralized)
  └─ Projects
      ├─ Project A (inherits team)
      ├─ Project B (inherits team)
      └─ Project C (inherits team)
```

**Benefits:**
- Add users once, access all projects
- Centralized billing across projects
- Organization-level roles
- Cross-project reporting

## Summary

Sentra's roles & permissions system enables collaborative task management with:

1. **5 Role Types** - Owner, Admin, Developer, Contributor, Viewer
2. **Granular Permissions** - Detailed permission matrix
3. **Invitation System** - Email-based invitations with 7-day expiry
4. **Automatic Access** - One-click acceptance, instant project access
5. **Task Attribution** - Track who created each task
6. **Role-Based Notifications** - Different alerts based on role
7. **Audit Logging** - All actions tracked with user attribution
8. **Row-Level Security** - Database policies enforce access control
9. **Dashboard Indicators** - Visual role badges and creator info
10. **Filtering** - View tasks by creator/assignee

**Primary Goal:** Allow people to add issues/tasks without granting full administrative access.