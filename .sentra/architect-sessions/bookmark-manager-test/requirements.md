# Bookmark Manager - Business Requirements

## Product Vision
A simple, fast bookmark manager for solo users who need to organize 100-1000 bookmarks with tags and search.

## Target Users
- **Primary**: Individual knowledge workers managing research links
- **Use Case**: Developers, researchers, students collecting technical resources
- **Scale**: 100-1000 bookmarks per user
- **Access Pattern**: Daily bookmark additions, weekly organization, frequent searches

## Core Features

### 1. User Authentication
**Must Have:**
- Email/password registration
- Email/password login
- Persistent sessions (JWT)
- Logout functionality

**Won't Have (v1):**
- Social login
- Password reset via email
- Email verification
- Multi-factor authentication

### 2. Bookmark Management
**Must Have:**
- Create bookmark (URL, title, description, tags)
- View all bookmarks (paginated list)
- Edit bookmark details
- Delete bookmark
- Auto-fetch page title from URL
- Auto-fetch favicon from URL

**Won't Have (v1):**
- Browser extension
- Bulk import
- Collections/folders
- Sharing bookmarks
- Bookmark snapshots/archives

### 3. Organization
**Must Have:**
- Add multiple tags per bookmark (comma-separated input)
- Filter bookmarks by tag
- View all tags with counts

**Won't Have (v1):**
- Nested tags/hierarchies
- Tag suggestions
- Auto-tagging

### 4. Search
**Must Have:**
- Search by title (case-insensitive, partial match)
- Search by URL (partial match)
- Search by description (partial match)
- Combine search with tag filter

**Won't Have (v1):**
- Full-text search engine
- Search history
- Saved searches
- Advanced boolean operators

## Success Metrics
- User can add bookmark in < 10 seconds
- Search returns results in < 500ms
- Zero data loss (all CRUD operations reliable)
- Mobile responsive (works on phone browser)

## Technical Constraints
- Must use existing Sentra tech stack (Next.js 15, Prisma, PostgreSQL)
- Must achieve 75% test coverage (90% for services)
- Must follow Sentra security model
- Must deploy to Vercel/Netlify

## Non-Functional Requirements
- **Performance**: Page load < 2s, API response < 500ms
- **Security**: Password hashing, JWT auth, user isolation
- **Accessibility**: WCAG 2.1 AA compliance
- **Browser Support**: Chrome, Firefox, Safari (latest 2 versions)

## Out of Scope (Future Versions)
- Browser extension
- Mobile native apps
- Collaborative features
- Bookmark import/export
- Web page archiving
- Bookmark analytics
- Chrome/Firefox extension
- API for third-party integrations
