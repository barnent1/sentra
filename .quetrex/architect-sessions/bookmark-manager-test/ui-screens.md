# Bookmark Manager - UI Screens Specification

## Design System

### Color Palette (Dark Theme)
- Background: `#0a0a0a` (true black)
- Surface: `#1a1a1a` (dark cards)
- Primary: `#8b5cf6` (violet-500)
- Primary Hover: `#7c3aed` (violet-600)
- Text Primary: `#ffffff`
- Text Secondary: `#a1a1aa` (zinc-400)
- Border: `#27272a` (zinc-800)
- Error: `#ef4444` (red-500)
- Success: `#10b981` (green-500)

### Typography
- Font Family: Inter (system fallback: -apple-system, BlinkMacSystemFont)
- Headings: 600 weight
- Body: 400 weight
- Labels: 500 weight

### Spacing
- Base unit: 4px (0.25rem)
- Component padding: 16px (1rem)
- Card padding: 24px (1.5rem)

---

## Screen 1: Login/Register Page

### Route
`/auth` (default shows login, toggle to register)

### Visual Description

**Layout:**
- Centered card (max-width: 400px) on dark background
- Logo at top center
- Tab toggle: "Login" | "Register"
- Form below tabs
- Footer link to switch modes

**Login Form:**
```
┌─────────────────────────────────┐
│       [Bookmark Manager]        │
│                                 │
│   [Login] | Register            │
│                                 │
│   Email                         │
│   [user@example.com________]    │
│                                 │
│   Password                      │
│   [••••••••••••________]        │
│                                 │
│   [      Login Button      ]    │
│                                 │
│   Don't have an account?        │
│   Create one →                  │
└─────────────────────────────────┘
```

**Register Form:**
```
┌─────────────────────────────────┐
│       [Bookmark Manager]        │
│                                 │
│   Login | [Register]            │
│                                 │
│   Name (optional)               │
│   [John Doe____________]        │
│                                 │
│   Email                         │
│   [user@example.com____]        │
│                                 │
│   Password                      │
│   [••••••••••••________]        │
│   • At least 8 characters       │
│   • One uppercase letter        │
│   • One number                  │
│                                 │
│   [    Create Account      ]    │
│                                 │
│   Already have account?         │
│   Sign in →                     │
└─────────────────────────────────┘
```

### Component Hierarchy
```tsx
<AuthPage>
  <Card className="max-w-md mx-auto">
    <Logo />
    <Tabs value={mode} onValueChange={setMode}>
      <TabsList>
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Register</TabsTrigger>
      </TabsList>
    </Tabs>

    {mode === 'login' ? (
      <LoginForm onSubmit={handleLogin} />
    ) : (
      <RegisterForm onSubmit={handleRegister} />
    )}

    <FooterLink onClick={toggleMode} />
  </Card>
</AuthPage>
```

### User Actions

1. **Switch between Login/Register**
   - Click "Register" tab → Shows register form
   - Click "Login" tab → Shows login form
   - Click footer link → Toggles mode

2. **Login Flow**
   - Type email → Validates on blur (must be valid email)
   - Type password → Validates on blur (min 8 chars)
   - Click "Login" button → Submits form
   - On success → Redirect to `/dashboard`
   - On error → Show error toast

3. **Register Flow**
   - Type name (optional) → No validation
   - Type email → Validates on blur (must be valid email, check uniqueness on submit)
   - Type password → Validates on change (shows requirements checklist)
   - Click "Create Account" → Submits form
   - On success → Redirect to `/dashboard`
   - On error → Show error toast with specific message

### States

**Loading State:**
- Button shows spinner + "Logging in..." or "Creating account..."
- Form inputs disabled
- Tab switching disabled

**Error States:**
- Invalid email → Red border, "Please enter a valid email" below field
- Password too short → Red border, "Password must be at least 8 characters" below field
- Login failed → Toast notification: "Invalid email or password"
- Email exists → Toast notification: "Email already registered"
- Network error → Toast notification: "Connection error. Please try again."

**Empty State:**
- Initial state, all fields empty
- Submit button disabled until form valid

**Validation State (Register Password):**
- Show checklist below password field:
  - ✓ At least 8 characters (green when met)
  - ✓ One uppercase letter (green when met)
  - ✓ One number (green when met)

### E2E Test Scenarios

#### Scenario 1: Successful Login
```gherkin
Given I am on the /auth page
When I click the "Login" tab
And I type "test@example.com" in the email field
And I type "Test123!" in the password field
And I click the "Login" button
Then I should see a loading spinner
And I should be redirected to "/dashboard"
And I should see "Welcome back" message
```

#### Scenario 2: Failed Login (Invalid Credentials)
```gherkin
Given I am on the /auth page
When I type "wrong@example.com" in the email field
And I type "WrongPass123!" in the password field
And I click the "Login" button
Then I should see an error toast "Invalid email or password"
And I should remain on the /auth page
And the password field should be cleared
```

#### Scenario 3: Successful Registration
```gherkin
Given I am on the /auth page
When I click the "Register" tab
And I type "New User" in the name field
And I type "newuser@example.com" in the email field
And I type "NewPass123!" in the password field
And all password requirements are met
And I click the "Create Account" button
Then I should be redirected to "/dashboard"
And I should see "Account created successfully" message
```

#### Scenario 4: Registration with Existing Email
```gherkin
Given I am on the /auth page
When I click the "Register" tab
And I type "existing@example.com" in the email field
And I type "Test123!" in the password field
And I click the "Create Account" button
Then I should see an error toast "Email already registered"
And I should remain on the /auth page
```

#### Scenario 5: Password Validation Feedback
```gherkin
Given I am on the /auth page in register mode
When I type "short" in the password field
Then I should see "✗ At least 8 characters" in red
When I type "shortlower123" in the password field
Then I should see "✓ At least 8 characters" in green
And I should see "✓ One number" in green
And I should see "✗ One uppercase letter" in red
When I type "ShortLower123" in the password field
Then all password requirements should be green
And the "Create Account" button should be enabled
```

---

## Screen 2: Dashboard (Bookmark List)

### Route
`/dashboard`

### Visual Description

**Layout:**
- Header with logo, search bar, "Add Bookmark" button, user menu
- Sidebar with tag filter (left, 250px width)
- Main content area with bookmark cards (grid or list view)
- Pagination footer

```
┌────────────────────────────────────────────────────────┐
│ [Logo]  [Search...________]  [+ Add]  [@User ▼]       │
├──────────┬─────────────────────────────────────────────┤
│          │                                             │
│ TAGS     │  Bookmarks (42)              [Grid] [List] │
│          │                                             │
│ All (42) │  ┌─────────────────┐ ┌─────────────────┐   │
│ ai (15)  │  │ [favicon]       │ │ [favicon]       │   │
│ api (12) │  │ Anthropic Docs  │ │ Next.js Docs    │   │
│ docs (8) │  │ docs.anthropic. │ │ nextjs.org/docs │   │
│ react (7)│  │                 │ │                 │   │
│          │  │ Claude API ref  │ │ React framework │   │
│          │  │                 │ │                 │   │
│          │  │ ai, api, docs   │ │ nextjs, react   │   │
│          │  │ Jan 15, 2025    │ │ Jan 14, 2025    │   │
│          │  │         [•••]   │ │         [•••]   │   │
│          │  └─────────────────┘ └─────────────────┘   │
│          │                                             │
│          │  ┌─────────────────┐ ┌─────────────────┐   │
│          │  │ [favicon]       │ │ [favicon]       │   │
│          │  │ TypeScript Docs │ │ Prisma Docs     │   │
│          │  └─────────────────┘ └─────────────────┘   │
│          │                                             │
│          │  [<] Page 1 of 3 [>]                        │
└──────────┴─────────────────────────────────────────────┘
```

### Component Hierarchy
```tsx
<DashboardLayout>
  <Header>
    <Logo />
    <SearchBar value={search} onChange={setSearch} />
    <Button onClick={openAddModal}>+ Add Bookmark</Button>
    <UserMenu />
  </Header>

  <div className="flex">
    <Sidebar>
      <TagList
        tags={tagsWithCounts}
        selected={selectedTag}
        onSelect={setSelectedTag}
      />
    </Sidebar>

    <MainContent>
      <ViewToggle view={view} onChange={setView} />
      <BookmarkGrid bookmarks={bookmarks} loading={loading} />
      <Pagination
        page={page}
        total={total}
        onPageChange={setPage}
      />
    </MainContent>
  </div>

  <AddBookmarkModal
    open={modalOpen}
    onClose={closeModal}
    onSubmit={handleAddBookmark}
  />
</DashboardLayout>
```

### User Actions

1. **Search Bookmarks**
   - Type in search bar → Debounced search (500ms)
   - Search queries title, URL, description
   - Clear search → Click X icon or clear text

2. **Filter by Tag**
   - Click tag in sidebar → Filters bookmarks
   - Click "All" → Shows all bookmarks
   - Selected tag highlighted in violet

3. **View Bookmark Details**
   - Click bookmark card → Opens detail view (modal or page)
   - Click favicon/title → Opens URL in new tab

4. **Open Actions Menu**
   - Click ••• icon → Shows dropdown menu
     - Edit
     - Delete
     - Copy URL
     - Open in new tab

5. **Add Bookmark**
   - Click "+ Add Bookmark" → Opens modal

6. **Paginate**
   - Click Next → Loads next page
   - Click Previous → Loads previous page
   - Click page number → Jumps to page

7. **Toggle View**
   - Click Grid icon → Shows grid view
   - Click List icon → Shows list view

### States

**Loading State:**
- Skeleton cards (3 rows of 3)
- Search bar disabled
- Add button disabled

**Empty State (No Bookmarks):**
```
┌─────────────────────────┐
│    [Bookmark Icon]      │
│                         │
│  No bookmarks yet       │
│                         │
│  Start saving your      │
│  favorite links         │
│                         │
│  [+ Add First Bookmark] │
└─────────────────────────┘
```

**Empty Search Results:**
```
┌─────────────────────────┐
│    [Search Icon]        │
│                         │
│  No results for "xyz"   │
│                         │
│  Try different keywords │
│  or browse by tags      │
└─────────────────────────┘
```

**Error State:**
- Toast notification: "Failed to load bookmarks. Please refresh."
- Retry button

**Populated State:**
- Shows bookmark cards with:
  - Favicon (or default icon if missing)
  - Title (truncated to 2 lines)
  - URL (truncated, show domain)
  - Description (truncated to 2 lines)
  - Tags (max 3 visible, "+ 2 more" if exceeded)
  - Created date (relative: "2 days ago")
  - Actions menu (•••)

### E2E Test Scenarios

#### Scenario 1: View All Bookmarks
```gherkin
Given I am logged in
When I navigate to "/dashboard"
Then I should see the header with search bar
And I should see the tag sidebar
And I should see 20 bookmark cards
And I should see pagination showing "Page 1 of 3"
```

#### Scenario 2: Search Bookmarks
```gherkin
Given I am on the dashboard with 42 bookmarks
When I type "anthropic" in the search bar
And I wait 500ms for debounce
Then I should see only bookmarks matching "anthropic"
And the count should update to show filtered results
When I clear the search
Then I should see all 42 bookmarks again
```

#### Scenario 3: Filter by Tag
```gherkin
Given I am on the dashboard
When I click the "ai" tag in the sidebar
Then the tag should be highlighted in violet
And I should see only bookmarks with the "ai" tag
And the title should show "Bookmarks (15)"
When I click "All"
Then I should see all bookmarks again
```

#### Scenario 4: Delete Bookmark
```gherkin
Given I am on the dashboard
When I click the "•••" menu on a bookmark card
And I click "Delete"
Then I should see a confirmation dialog
When I click "Confirm"
Then the bookmark should disappear from the list
And I should see a success toast "Bookmark deleted"
And the total count should decrease by 1
```

#### Scenario 5: Pagination
```gherkin
Given I am on the dashboard with 42 bookmarks
And I am on page 1
When I click the "Next" button
Then I should see page 2 bookmarks
And the URL should update to "?page=2"
And the previous button should be enabled
When I click a bookmark on page 2
And I navigate back
Then I should remain on page 2
```

---

## Screen 3: Add Bookmark Modal

### Visual Description

**Modal Overlay:**
- Dark overlay (rgba(0, 0, 0, 0.8))
- Modal centered, max-width: 600px
- Modal background: #1a1a1a

```
┌─────────────────────────────────────┐
│  Add Bookmark                    [X]│
├─────────────────────────────────────┤
│                                     │
│  URL *                              │
│  [https://docs.anthropic.com____]   │
│  [Fetch Info] button                │
│                                     │
│  Title *                            │
│  [Anthropic Documentation_______]   │
│                                     │
│  Description                        │
│  [Claude API reference and______]   │
│  [guides____________________]       │
│  [____________________________]     │
│                                     │
│  Tags (comma-separated)             │
│  [ai, api, documentation_______]    │
│                                     │
│  Preview:                           │
│  ┌───────────────────────────────┐ │
│  │ [fav] Anthropic Documentation │ │
│  │       docs.anthropic.com      │ │
│  │       Claude API reference... │ │
│  │       ai, api, documentation  │ │
│  └───────────────────────────────┘ │
│                                     │
│         [Cancel]  [Save Bookmark]   │
└─────────────────────────────────────┘
```

### Component Hierarchy
```tsx
<Modal open={open} onOpenChange={setOpen}>
  <ModalHeader>
    <h2>Add Bookmark</h2>
    <CloseButton onClick={onClose} />
  </ModalHeader>

  <ModalBody>
    <Form onSubmit={handleSubmit}>
      <UrlField
        value={url}
        onChange={setUrl}
        onFetch={handleFetchInfo}
      />

      <TitleField
        value={title}
        onChange={setTitle}
      />

      <DescriptionField
        value={description}
        onChange={setDescription}
      />

      <TagsField
        value={tags}
        onChange={setTags}
      />

      <PreviewCard bookmark={previewData} />
    </Form>
  </ModalBody>

  <ModalFooter>
    <Button variant="outline" onClick={onClose}>
      Cancel
    </Button>
    <Button type="submit" disabled={!isValid}>
      Save Bookmark
    </Button>
  </ModalFooter>
</Modal>
```

### User Actions

1. **Open Modal**
   - Click "+ Add Bookmark" button on dashboard
   - Modal slides in from center with fade animation

2. **Enter URL**
   - Paste or type URL → Validates format on blur
   - Click "Fetch Info" → Auto-fills title and favicon
   - Validation: Must be valid HTTP/HTTPS URL

3. **Auto-Fetch Metadata**
   - After entering URL, click "Fetch Info" button
   - Shows loading spinner
   - Fetches page title and favicon
   - Auto-populates title field
   - Auto-populates favicon preview

4. **Enter Title**
   - Type title (required)
   - Max 500 characters
   - Character counter shows remaining

5. **Enter Description**
   - Type description (optional)
   - Max 2000 characters
   - Multi-line textarea
   - Character counter shows remaining

6. **Add Tags**
   - Type tags separated by commas
   - Auto-lowercase on blur
   - Remove whitespace
   - Shows tag pills below input
   - Click X on pill to remove tag

7. **Preview**
   - Live preview updates as fields change
   - Shows how bookmark will appear on dashboard

8. **Submit**
   - Click "Save Bookmark" → Validates form
   - On success → Modal closes, bookmark appears on dashboard
   - On error → Shows error message

9. **Cancel**
   - Click "Cancel" → Closes modal without saving
   - Click X icon → Same as cancel
   - Click outside modal → Same as cancel (with confirmation if form dirty)

### States

**Initial Empty State:**
- All fields empty
- "Save Bookmark" button disabled
- No preview shown

**Loading State (Fetching Info):**
- "Fetch Info" button shows spinner
- URL field disabled
- Title and favicon fields show skeleton loaders

**Validation States:**
- Invalid URL → Red border, "Please enter a valid URL" error
- Empty title → Red border, "Title is required" error
- Too many tags (>20) → Red border, "Maximum 20 tags allowed" error
- Tag too long (>50 chars) → Red border, "Tag must be under 50 characters"

**Valid State:**
- All required fields filled
- All validations pass
- "Save Bookmark" button enabled
- Preview card shows filled data

**Success State:**
- Form submits successfully
- Modal closes with slide-out animation
- Success toast: "Bookmark added successfully"
- Dashboard updates with new bookmark

**Error State:**
- API error → Toast: "Failed to save bookmark. Please try again."
- Network error → Toast: "Connection error. Check your internet."
- Form remains open, data preserved

### E2E Test Scenarios

#### Scenario 1: Add Bookmark with Auto-Fetch
```gherkin
Given I am on the dashboard
When I click "+ Add Bookmark"
Then the modal should appear
When I paste "https://docs.anthropic.com" in the URL field
And I click "Fetch Info"
Then I should see a loading spinner
And the title field should auto-fill with "Anthropic Documentation"
And I should see the favicon in the preview
When I type "ai, api, documentation" in the tags field
And I click "Save Bookmark"
Then the modal should close
And I should see the new bookmark on the dashboard
And I should see a success toast
```

#### Scenario 2: Add Bookmark Manually
```gherkin
Given the add bookmark modal is open
When I type "https://example.com/article" in the URL field
And I type "Great Article" in the title field
And I type "Really useful information" in the description field
And I type "tutorial, learning" in the tags field
Then the preview should show all entered information
When I click "Save Bookmark"
Then the modal should close
And the bookmark should appear on the dashboard
```

#### Scenario 3: Validation Errors
```gherkin
Given the add bookmark modal is open
When I type "not-a-url" in the URL field
And I blur the field
Then I should see "Please enter a valid URL" error
When I correct the URL to "https://example.com"
And I leave the title field empty
And I click "Save Bookmark"
Then I should see "Title is required" error
And the modal should remain open
```

#### Scenario 4: Tag Management
```gherkin
Given the add bookmark modal is open with URL and title filled
When I type "React, TypeScript, Tutorial" in the tags field
Then I should see three tag pills below the input
And the tags should be lowercase: "react, typescript, tutorial"
When I click the X on the "typescript" tag pill
Then the tag should be removed
And the tags field should update to "react, tutorial"
```

#### Scenario 5: Cancel with Unsaved Changes
```gherkin
Given the add bookmark modal is open
When I type "https://example.com" in the URL field
And I type "Example Site" in the title field
And I click "Cancel"
Then I should see a confirmation dialog
And the dialog should say "Discard unsaved changes?"
When I click "Discard"
Then the modal should close
And no bookmark should be added
```

---

## Screen 4: Bookmark Detail View

### Route
`/dashboard/bookmarks/{id}` or modal overlay

### Visual Description

**Full Page Layout:**
```
┌────────────────────────────────────────────────────┐
│ [< Back to Dashboard]                [@User ▼]     │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ [fav] Anthropic Documentation                │ │
│  │       https://docs.anthropic.com             │ │
│  │                                              │ │
│  │  [Open URL] [Edit] [Delete]                  │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  Description                                       │
│  ┌──────────────────────────────────────────────┐ │
│  │ Comprehensive documentation for Claude API,  │ │
│  │ including reference guides, tutorials, and   │ │
│  │ best practices for building with AI.         │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  Tags                                              │
│  [ai] [api] [documentation]                        │
│                                                    │
│  Metadata                                          │
│  Created:  Jan 15, 2025 at 2:30 PM                │
│  Modified: Jan 15, 2025 at 2:30 PM                │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Edit Mode:**
Same layout but fields become editable:
```
┌────────────────────────────────────────────────────┐
│ [< Cancel]                            [Save]       │
├────────────────────────────────────────────────────┤
│                                                    │
│  URL                                               │
│  [https://docs.anthropic.com_______________]       │
│                                                    │
│  Title                                             │
│  [Anthropic Documentation__________________]       │
│                                                    │
│  Description                                       │
│  [Comprehensive documentation for Claude___]       │
│  [API, including reference guides_________]        │
│  [______________________________________]          │
│                                                    │
│  Tags (comma-separated)                            │
│  [ai, api, documentation_______________]           │
│                                                    │
│  [Cancel]                      [Save Changes]      │
└────────────────────────────────────────────────────┘
```

### Component Hierarchy
```tsx
<BookmarkDetailPage bookmarkId={id}>
  <Header>
    <BackButton to="/dashboard" />
    <UserMenu />
  </Header>

  {editMode ? (
    <EditForm
      bookmark={bookmark}
      onSave={handleSave}
      onCancel={() => setEditMode(false)}
    />
  ) : (
    <DetailView>
      <BookmarkHeader
        favicon={bookmark.favicon}
        title={bookmark.title}
        url={bookmark.url}
      />

      <ActionButtons>
        <Button onClick={openUrl}>Open URL</Button>
        <Button onClick={() => setEditMode(true)}>Edit</Button>
        <Button variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      </ActionButtons>

      <DescriptionSection text={bookmark.description} />

      <TagsSection tags={bookmark.tags} />

      <MetadataSection
        createdAt={bookmark.createdAt}
        updatedAt={bookmark.updatedAt}
      />
    </DetailView>
  )}
</BookmarkDetailPage>
```

### User Actions

1. **View Bookmark**
   - Click bookmark card from dashboard → Navigates to detail page
   - All bookmark information displayed
   - Read-only mode by default

2. **Open URL**
   - Click "Open URL" button → Opens URL in new tab
   - Click URL text → Opens URL in new tab

3. **Edit Bookmark**
   - Click "Edit" button → Switches to edit mode
   - All fields become editable
   - "Save Changes" and "Cancel" buttons appear

4. **Save Changes**
   - Modify fields in edit mode
   - Click "Save Changes" → Validates and saves
   - On success → Returns to view mode
   - On error → Shows error message

5. **Cancel Edit**
   - Click "Cancel" → Discards changes
   - If changes made → Shows confirmation dialog
   - Returns to view mode

6. **Delete Bookmark**
   - Click "Delete" button → Shows confirmation dialog
   - Confirm → Deletes bookmark
   - Redirects to dashboard
   - Shows success toast

7. **Filter by Tag**
   - Click tag pill → Navigates to dashboard with tag filter applied

8. **Navigate Back**
   - Click "< Back to Dashboard" → Returns to dashboard
   - Preserves dashboard state (page, filters, search)

### States

**Loading State:**
- Skeleton loaders for all sections
- Action buttons disabled

**View Mode State:**
- All fields read-only
- Action buttons: "Open URL", "Edit", "Delete"
- Description shown with full text or "Show more" if long
- Tags clickable

**Edit Mode State:**
- All fields editable
- Action buttons: "Cancel", "Save Changes"
- Validation feedback on each field
- Character counters on description

**Saving State:**
- "Save Changes" button shows spinner
- All inputs disabled
- Cannot cancel during save

**Error State (Load Failed):**
```
┌─────────────────────────┐
│    [Error Icon]         │
│                         │
│  Bookmark not found     │
│                         │
│  It may have been       │
│  deleted or moved       │
│                         │
│  [← Back to Dashboard]  │
└─────────────────────────┘
```

**Delete Confirmation Dialog:**
```
┌─────────────────────────────────┐
│  Delete Bookmark?               │
├─────────────────────────────────┤
│  Are you sure you want to       │
│  delete "Anthropic Docs"?       │
│                                 │
│  This action cannot be undone.  │
│                                 │
│  [Cancel]  [Delete]             │
└─────────────────────────────────┘
```

### E2E Test Scenarios

#### Scenario 1: View Bookmark Details
```gherkin
Given I am on the dashboard
When I click on a bookmark card
Then I should navigate to "/dashboard/bookmarks/{id}"
And I should see the bookmark title in the header
And I should see the full URL
And I should see the description
And I should see all tags as clickable pills
And I should see creation and modification dates
And I should see "Open URL", "Edit", and "Delete" buttons
```

#### Scenario 2: Edit Bookmark Successfully
```gherkin
Given I am viewing a bookmark detail page
When I click the "Edit" button
Then I should see all fields become editable
And I should see "Cancel" and "Save Changes" buttons
When I change the title to "Updated Title"
And I add ", tutorial" to the tags field
And I click "Save Changes"
Then I should see a loading spinner
And I should return to view mode
And I should see the updated title
And I should see the new tag added
And I should see a success toast "Bookmark updated"
```

#### Scenario 3: Cancel Edit with Changes
```gherkin
Given I am in edit mode on a bookmark detail page
When I change the description field
And I click "Cancel"
Then I should see a confirmation dialog
And the dialog should say "Discard unsaved changes?"
When I click "Discard"
Then I should return to view mode
And the changes should not be saved
When I click "Edit" again
Then the original description should be shown
```

#### Scenario 4: Delete Bookmark
```gherkin
Given I am viewing a bookmark detail page
When I click the "Delete" button
Then I should see a confirmation dialog
And the dialog should show the bookmark title
When I click "Delete" in the dialog
Then I should be redirected to "/dashboard"
And the bookmark should no longer appear in the list
And I should see a success toast "Bookmark deleted"
```

#### Scenario 5: Open URL in New Tab
```gherkin
Given I am viewing a bookmark detail page
When I click the "Open URL" button
Then a new browser tab should open
And it should navigate to the bookmark's URL
And the detail page should remain open
```

#### Scenario 6: Filter by Tag from Detail View
```gherkin
Given I am viewing a bookmark detail page
And the bookmark has tags ["ai", "api", "tutorial"]
When I click the "api" tag pill
Then I should navigate to "/dashboard?tag=api"
And I should see only bookmarks with the "api" tag
And the "api" tag should be selected in the sidebar
```

---

## Responsive Behavior

### Mobile (< 768px)
- Single column layout
- Sidebar becomes bottom sheet or hamburger menu
- Bookmark cards stack vertically
- Modal takes full screen
- Search bar full width
- Actions menu in dropdown

### Tablet (768px - 1024px)
- 2-column bookmark grid
- Sidebar remains visible
- Modal max-width: 90vw

### Desktop (> 1024px)
- 3-column bookmark grid
- Full sidebar visible
- Modal max-width: 600px

## Accessibility

### Keyboard Navigation
- Tab through all interactive elements
- Enter to submit forms
- Escape to close modals
- Arrow keys for pagination

### Screen Reader Support
- Proper ARIA labels on all buttons
- Form field labels associated
- Error messages announced
- Loading states announced
- Success/error toasts announced

### Focus Management
- Focus trap in modals
- Focus returns to trigger on modal close
- Visible focus indicators (violet ring)

## Animations

- Modal open/close: 200ms ease-in-out
- Toast notifications: Slide in from top, 300ms
- Button hover: 150ms ease
- Page transitions: 150ms fade
- Loading skeletons: Pulse animation
