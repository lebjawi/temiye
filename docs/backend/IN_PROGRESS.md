# ⏳ In Progress - Current Work

**Last Updated:** 2025-10-18
**Current Sprint:** Storage Domain Integration

---

## 🎯 Active Tasks

### 1. Storage Domain Integration (80% Complete)

**Status:** Backend complete, integration pending

#### ✅ Completed
- Storage entity, DTOs, services, controller, repository
- Upload URL generation (client-side upload flow)
- Backend proxy upload (alternative method)
- File validation by category (size, type, extensions)
- Reference counting system
- Soft/hard delete logic
- Swagger documentation
- Postman collection

#### ⏳ In Progress
- [ ] **User Domain Integration**
  - Add `profilePictureRef?: string` to User entity
  - Update UserService to handle profile picture reference counting
  - Update UserController PUT endpoint
  - Test: User uploads profile picture → references file → updates profile → old file dereferenced

- [ ] **Board Domain Integration**
  - Add `logoRef?: string` to Board entity
  - Update BoardService for logo reference counting
  - Update BoardController POST/PUT endpoints
  - Test: Board creation with logo → logo update → logo removal

- [ ] **Election Domain Integration**
  - Add `imageRef?: string` to Election entity
  - Update ElectionService for image reference counting
  - Update ElectionController POST/PUT endpoints
  - Test: Election with image → image change → election deletion (dereference)

#### 📋 Next Steps
1. Integrate with User domain (profile pictures)
2. Integrate with Board domain (logos)
3. Integrate with Election domain (images)
4. End-to-end integration testing
5. Update Postman collection with file upload workflows

**Target Completion:** End of Week 9

---

### 2. Blog Domain (0% Complete)

**Status:** Architecture approved, not started

#### Planned Work
- [ ] Create Blog entity with state machine (draft → scheduled → published → archived)
- [ ] Implement BlogController (CRUD + publish workflow)
- [ ] Implement BlogService:
  - Slug generation (URL-friendly, unique)
  - Workflow management
  - File reference validation
  - Related blogs recommendation
- [ ] Implement BlogRepository
- [ ] Add Swagger documentation
- [ ] Integrate with Storage domain (feature images, attachments)
- [ ] Test blog lifecycle

**Dependencies:**
- Storage domain must be 100% complete
- Boards domain (blog authors)

**Target Start:** Week 10
**Target Completion:** Week 11

---

### 3. Static Pages Domain (0% Complete)

**Status:** Architecture approved, not started

#### Planned Work
- [ ] Create StaticPage entity with version history
- [ ] Implement StaticPageController (CRUD)
- [ ] Implement StaticPageService (version tracking)
- [ ] Implement StaticPageRepository
- [ ] Initialize predefined pages:
  - about-us
  - vision
  - history
  - contact-info
- [ ] Add admin-only editing
- [ ] Test version history

**Target Start:** Week 12
**Target Completion:** Week 12

---

### 4. Contact Domain (0% Complete)

**Status:** Architecture approved, not started

#### Planned Work
- [ ] Create Contact entity
- [ ] Implement ContactController (submit, list, respond)
- [ ] Implement ContactService:
  - Spam detection scoring
  - Rate limiting (3 submissions/hour per IP)
  - Email notifications to admins
  - Email confirmation to submitter
- [ ] Implement ContactRepository
- [ ] Test contact submission workflow
- [ ] Test spam detection
- [ ] Test admin response workflow

**Target Start:** Week 13
**Target Completion:** Week 13

---

## 🚧 Blockers & Issues

### Current Blockers
None - all dependencies resolved

### Known Issues
1. TypeScript warnings (unused variables) - Non-critical
   - ~10 warnings in various files
   - Does not prevent compilation
   - Low priority cleanup

### Technical Debt
1. **No test suite** - Accepted for solo dev project
   - Mitigation: Comprehensive Postman collection (76 endpoints)
   - Mitigation: Manual testing before each deploy

2. **Tight coupling** - Some domains directly depend on other services
   - Example: UserService → StorageService
   - Future: Consider dependency injection framework

3. **No database migrations** - Schema changes not versioned
   - Current: Manual Firestore updates
   - Future: Consider migration framework if needed

---

## 📊 Progress Tracking

### Domain Status
| Domain | Backend | Frontend | Integration | Tests | Docs |
|--------|---------|----------|-------------|-------|------|
| Constants | ✅ | ⏸️ | ✅ | ⏸️ | ✅ |
| Role | ✅ | ⏸️ | ✅ | ⏸️ | ✅ |
| Tier | ✅ | ⏸️ | ✅ | ⏸️ | ✅ |
| User | ✅ | ⏸️ | ✅ | ⏸️ | ✅ |
| Admin | ✅ | ⏸️ | ✅ | ⏸️ | ✅ |
| Password Reset | ✅ | ⏸️ | ✅ | ⏸️ | ✅ |
| Board | ✅ | ⏸️ | ✅ | ⏸️ | ✅ |
| Transaction | ✅ | ⏸️ | ✅ | ⏸️ | ✅ |
| Announcement | ✅ | ⏸️ | ✅ | ⏸️ | ✅ |
| Election | ✅ | ⏸️ | ✅ | ⏸️ | ✅ |
| Vote | ✅ | ⏸️ | ✅ | ⏸️ | ✅ |
| **Storage** | **✅** | **⏸️** | **⏳ 80%** | **⏸️** | **✅** |
| **Blog** | **📋** | **📋** | **📋** | **📋** | **✅** |
| **Static Pages** | **📋** | **📋** | **📋** | **📋** | **✅** |
| **Contact** | **📋** | **📋** | **📋** | **📋** | **✅** |

Legend:
- ✅ Complete
- ⏳ In Progress
- ⏸️ Not Started (planned)
- 📋 Planned

### Overall Backend Progress
**Completed:** 11/14 domains (79%)
**In Progress:** 1/14 domains (7%)
**Planned:** 2/14 domains (14%)

---

## 🎯 This Week's Goals (Week 9)

### High Priority
1. Complete Storage domain integration
   - User profile pictures
   - Board logos
   - Election images
2. End-to-end file upload testing
3. Update Postman collection with upload workflows

### Medium Priority
1. Plan Blog domain implementation
2. Review Static Pages architecture
3. Design Contact form UI

### Low Priority
1. Fix TypeScript warnings
2. Add JSDoc comments
3. Update README files

---

## 💡 Notes

- **Focus:** Finish Storage integration before starting Blog
- **Strategy:** One domain at a time, fully complete before moving on
- **Testing:** Use Postman collection for comprehensive manual testing
- **Documentation:** Keep Swagger and Postman updated as you build

---

**Next Update:** When Storage integration completes or Blog domain starts

