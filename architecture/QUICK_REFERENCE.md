# Quick Reference Guide

## 📂 Files Overview

### Main Documentation
| File | Purpose |
|------|---------|
| `README.md` | Start here - Overview and navigation |
| `ddd.md` | DDD architecture principles and guidelines |
| `diagrams.md` | Visual diagrams (ERD, state machines, sequences) |
| `QUICK_REFERENCE.md` | This file - Quick reference |

### Domain Documentation (11 files)

| # | Domain | File | Complexity | Key Feature |
|----|--------|------|-----------|------------|
| 1 | User | `domains/user.md` | ⭐⭐⭐ | Phone auth |
| 2 | Role | `domains/role.md` | ⭐⭐ | Permissions |
| 3 | Tier | `domains/tier.md` | ⭐ | Membership |
| 4 | Board | `domains/board.md` | ⭐⭐⭐ | Hierarchy |
| 5 | Transaction | `domains/transaction.md` | ⭐⭐ | Immutable |
| 6 | Election | `domains/election.md` | ⭐⭐⭐⭐ | Voting |
| 7 | Vote | `domains/vote.md` | ⭐⭐ | Immutable |
| 8 | Announcement | `domains/announcement.md` | ⭐ | Communications |
| 9 | Admin | `domains/admin.md` | ⭐⭐ | OAuth |
| 10 | Password Reset | `domains/password-reset.md` | ⭐ | Temporary |
| 11 | Constants | `domains/constants.md` | ⭐ | Config |

---

## 🎯 How to Use This Documentation

### As a Developer

1. **Understand Architecture**
   - Read: `README.md` → `ddd.md` → `diagrams.md`

2. **Implement a Domain**
   - Read: `domains/[domain].md`
   - Implement: Entity → DTO → Repository → Service → Controller → Routes

3. **Questions?**
   - Check domain `.md` file for validation checklist
   - Review diagrams for visual understanding
   - Refer to `ddd.md` for general patterns

### As a Code Reviewer

1. **Architecture questions?** → Check `ddd.md`
2. **Domain-specific rules?** → Check `domains/[domain].md`
3. **Business logic correct?** → Review entity and service logic
4. **Request flow clear?** → Check `diagrams.md`

---

## 🔑 Key Files by Use Case

### "How does [domain] work?"
→ Read `domains/[domain].md`

### "What's the request flow?"
→ Read `diagrams.md` → Request Flow Diagram

### "What's the database schema?"
→ Read `diagrams.md` → Entity Relationship Diagram (ERD)

### "How do state transitions work?"
→ Read `diagrams.md` → State Machine Diagrams

### "What are the relationships between domains?"
→ Read `diagrams.md` → Domain Relationship Diagram

### "Walk me through [operation]?"
→ Read `diagrams.md` → Sequence Diagrams

### "What's the implementation order?"
→ Read `README.md` → Implementation Order

### "What files do I need to create?"
→ Read `ddd.md` → Folder Structure

### "What layers do I need?"
→ Read `ddd.md` → Layer Responsibilities

---

## 📋 Domain File Structure

Each domain `.md` file contains (in order):

1. **Header** - Collection name, complexity, mutability, special notes
2. **Domain Purpose** - What does this domain do?
3. **Key Concepts** - Main ideas
4. **Firestore Document Structure** - Example JSON doc
5. **Entity** - Properties, methods, business rules
6. **DTOs** - Request validation DTOs
7. **Repository Methods** - Database operations
8. **Service Methods** - Business logic operations
9. **Controller Endpoints** - REST API routes
10. **Error Handling** - Expected errors and custom exceptions
11. **State Diagram** (if applicable) - State transitions
12. **Business Logic Rules** - Key rules and constraints
13. **Dependencies** - Other services/repositories used
14. **Implementation Order** - Step-by-step how to build
15. **Testing Considerations** - What to test
16. **Questions** - Validation checklist (✅ confirms my understanding)

---

## 🚀 Implementation Checklist

### For Each Domain Implementation:

- [ ] Read domain `.md` file completely
- [ ] Validate understanding with checklist questions
- [ ] Create Entity class with validation
- [ ] Create DTOs with validation
- [ ] Create Repository with Firestore queries
- [ ] Create Service with business logic
- [ ] Create Controller with HTTP endpoints
- [ ] Create Routes mapping
- [ ] Add comprehensive error handling
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Update API documentation
- [ ] Test all error scenarios
- [ ] Code review with architecture team

---

## 🎓 Core Concepts

### Three-Tier Architecture

```
┌─────────────────────┐
│    Controller       │ HTTP handling
├─────────────────────┤
│     Service         │ Business logic
├─────────────────────┤
│    Repository       │ Database access
├─────────────────────┤
│    Entity           │ Domain object
├─────────────────────┤
│     Firestore       │ Persistence
└─────────────────────┘
```

### Request Flow

```
HTTP → Routes → Controller → DTO → Service → Entity → Repository → Firestore
```

### Immutable Domains

- **Transaction**: Cannot edit, only soft delete
- **Vote**: Cannot edit, only soft delete

### Stateful Domains

- **Election**: created → voting → closed → archived
- **User**: pending → active/rejected/inactive/banned
- **Board**: active ↔ archived
- **Admin**: pending → approved/rejected

### Key Patterns

| Pattern | Purpose |
|---------|---------|
| Repository | Encapsulate database queries |
| DTO | Validate input at boundary |
| Entity | Domain object with behavior |
| Service | Orchestrate repositories |
| Controller | Handle HTTP requests |
| State Machine | Validate transitions |
| Error Handling | Consistent error responses |

---

## 📊 Quick Domain Reference

### Authentication Domains

| Domain | Auth Type | Mutable | Notes |
|--------|-----------|--------|-------|
| User | Phone + bcrypt | Yes | Main app |
| Admin | Firebase OAuth | Limited | Admin dashboard |

### Configuration Domains

| Domain | Purpose | Mutable | Notes |
|--------|---------|--------|-------|
| Role | Permissions | Limited | Predefined roles |
| Tier | Membership | Limited | 5 tiers max |
| Constants | Config values | Yes | Dynamic CRUD |

### Core Entity Domains

| Domain | Purpose | Mutable | Notes |
|--------|---------|--------|-------|
| Board | Organization | Yes | Hierarchical |
| Transaction | Financial | No | Immutable |
| Announcement | Communications | Yes | Soft delete |

### Voting Domains

| Domain | Purpose | Mutable | Notes |
|--------|---------|--------|-------|
| Election | Voting process | Lifecycle | State machine |
| Vote | Cast votes | No | Immutable |

### Utility Domains

| Domain | Purpose | Mutable | Notes |
|--------|---------|--------|-------|
| Password Reset | Temp tokens | N/A | 15-min expiry |

---

## 🔍 Finding Answers

### "How do I implement [operation]?"

1. Find the domain: `domains/[domain].md`
2. Look for the operation in Service Methods
3. Trace through the code layers
4. Check DTOs for validation
5. Review business rules

### "What's the endpoint for [operation]?"

1. Find the domain: `domains/[domain].md`
2. Go to Controller Endpoints section
3. Copy the endpoint pattern

### "What's the error for [scenario]?"

1. Find the domain: `domains/[domain].md`
2. Go to Error Handling section
3. Find the scenario

### "How do domains interact?"

1. Check `diagrams.md` → Domain Relationship Diagram
2. Check specific domain `.md` files → Dependencies section

---

## 💡 Implementation Tips

1. **Start with Constants first** - Unblocks other domains
2. **Then User** - Foundation for everything
3. **Then Role + Tier** - Referenced by User
4. **Follow the dependency chain** - Don't skip steps
5. **Test each layer** - Unit test, integration test
6. **Use error handling consistently** - Same pattern everywhere
7. **Cache where appropriate** - Constants, roles, tiers
8. **Validate early** - In DTOs, not in service
9. **Keep repositories simple** - Just queries
10. **Keep services focused** - Orchestration, not queries

---

## 📞 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "What does [domain] do?" | Read `domains/[domain].md` purpose section |
| "How do I query [data]?" | Check repository methods in `domains/[domain].md` |
| "What errors can happen?" | Check error handling section in domain `.md` |
| "What's the flow?" | Check `diagrams.md` sequence diagrams |
| "How do [domain1] and [domain2] relate?" | Check dependency section in domain `.md` files |
| "Can I delete [entity]?" | Check business rules section in domain `.md` |
| "What's the state machine?" | Check `diagrams.md` state machine diagrams |

---

## 🎯 Success Criteria

Each domain implementation is successful when:

✅ All CRUD operations work (or intentionally disabled)
✅ Business rules are enforced
✅ DTOs validate all input
✅ Error scenarios handled correctly
✅ State transitions validated (if applicable)
✅ Dependencies are clear and working
✅ Unit tests pass
✅ Integration tests pass
✅ Code is readable and maintainable
✅ Documentation matches implementation

---

**Need to review a specific domain?** Find it in the table above and open the file!

