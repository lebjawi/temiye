# Vote Domain

**Collection**: `votes`
**Complexity**: ⭐⭐ (Medium)
**Mutability**: **IMMUTABLE** (cannot update or change vote)

---

## Domain Purpose

The Vote domain manages **cast votes** in elections. Votes are immutable records that enforce one-vote-per-user-per-election uniqueness and track who voted and when.

### Key Concepts

- **Immutable records**: Once cast, vote cannot be changed or retracted
- **Vote uniqueness**: One vote per user per election (compound index)
- **Voting window**: Only during election voting period
- **Eligible voters**: Only active users can vote
- **Audit trail**: Records who voted, when, and for whom

---

## Firestore Document Structure

```javascript
// Collection: votes
{
  id: "vote-123",

  // References
  electionId: "elec-456",
  userId: "user-789",

  // Choice
  choice: "cand-1",             // For single-choice OR multi-choice
                                // OR array for multi-choice
                                // OR ranked array for ranking

  // Metadata
  castAt: "2025-10-20T10:30:00Z",

  // Composite unique index: (electionId, userId)
  // Prevents duplicate votes
}
```

---

## Entity (Vote.js)

### Properties
```javascript
{
  id: string,
  electionId: string,
  userId: string,
  choice: string | string[] | string[],  // Depends on ballot type
  castAt: Date
}
```

### Methods
```javascript
// Validation
validate()
isValidChoice()

// Status checks
isCast()                // Always true (once in DB)
isImmutable()          // Always true

// Static factory
static create(data)
```

### Business Rules
1. **Election must exist**: Reference to valid election
2. **User must exist**: Reference to valid user
3. **User must be active**: Cannot vote while banned/inactive
4. **Election must be voting**: Current time between start/end
5. **Choice must be valid**: Must be valid candidate ID
6. **One vote per user per election**: Enforced by composite index
7. **Cannot update or change**: Ever. Immutable.

---

## DTOs

### CastVoteDTO
```javascript
{
  electionId: "elec-456",
  userId: "user-789",
  choice: "cand-1"             // Or array for multi-choice
}
```

**Validation**:
- electionId: Must exist, must be voting
- userId: Must exist, must be active
- choice: Must be valid candidate for this election
- Constraint: User hasn't voted in this election yet
- Constraint: User is eligible (active, correct tier)

### UpdateVoteDTO
**NONE** - Votes are immutable. Return 405 for any update attempts.

---

## Repository Methods

```javascript
create(voteData)                    // Record vote
findById(id)
findByElection(electionId)          // All votes in election
findByUser(userId)                  // All votes by user
findByUserAndElection(userId, electionId)  // Check if voted
findVotesByCandidate(electionId, candidateId)  // For tallying
countVotes(electionId)              // Total votes cast
countVotesByCandidate(electionId, candidateId)

// Firestore query with composite index
findUnique(electionId, userId)      // Unique constraint check

// NO UPDATE METHOD - Immutable
```

### Firestore Queries & Indexes
- **Composite unique index**: (electionId, userId) - REQUIRED!
- **Regular indexes**: electionId, userId, castAt

---

## Service Methods

### Core CRUD
```javascript
async castVote(data)               // Record vote
async getVoteById(id)
async getVotesByElection(id)
async getVotesByUser(userId)
```

### Validation
```javascript
async canUserVote(electionId, userId)      // Check all conditions
async hasUserVoted(electionId, userId)     // Already voted?
async isEligibleToVote(userId)             // User active, correct tier
async isElectionVoting(electionId)         // Dates valid
async isValidChoice(electionId, choice)    // Valid candidate
```

### Results (delegated to election service)
```javascript
async getVotesForCandidate(electionId, candidateId)
async tallyVotes(electionId)       // Called by election service
```

### Access Control
```javascript
async updateVote(id, updates)      // Throws 405: Method Not Allowed
```

---

## Controller Endpoints

### Authenticated
```
POST   /api/votes                    CastVoteDTO

GET    /api/votes/me/elections      Get my votes
GET    /api/votes/elections/:id     Get votes for election (admin)

// NO UPDATE/DELETE - Immutable
```

### Admin-Only
```
GET    /api/votes                   List all votes (superadmin)
GET    /api/votes/:id               Get specific vote

// Audit access
GET    /api/votes/audit             Vote audit trail
```

---

## Error Handling

### Expected Errors
- **400 Bad Request**: Invalid choice, invalid election state, etc.
- **404 Not Found**: Election not found, user not found
- **409 Conflict**: User already voted, election not voting
- **405 Method Not Allowed**: Attempt to update vote
- **403 Forbidden**: User not eligible to vote

### Custom Errors
```javascript
new ValidationError('Invalid candidate')
new ConflictError('User already voted in this election')
new InvalidStateError('Election is not voting')
new ForbiddenError('User is not eligible to vote')
new MethodNotAllowedError('Votes are immutable')
```

---

## Business Logic Rules

### 1. Immutability Contract
- Once cast, vote is permanent
- No changes, no retractions
- If user wants to change, only option is retract (creates new vote record)

### 2. Vote Uniqueness Enforcement
- Composite index on (electionId, userId) ensures one vote per user per election
- Service layer triple-checks before insert:
  1. Check Firestore query
  2. Check election is voting
  3. Then insert

### 3. Eligibility Checks
- User must be active (status = "active")
- Election must be voting (now between start/end dates)
- User must be eligible (role allows voting, tier allows voting)

### 4. Vote Recording
- Timestamp when vote cast (not server generated)
- UserId recorded for audit trail
- Election locked until vote recorded

---

## Dependencies

- **voteRepository**
- **electionRepository**: Validate election, check voting window
- **userRepository**: Validate user, check active status
- **userService**: Check voting eligibility

---

## Implementation Order

1. Create `Vote.js`
2. Create `CastVoteDTO.js`
3. Create `vote.repository.js` (with composite index setup)
4. Create `vote.service.js`
5. Create `vote.controller.js`
6. Create `vote.routes.js`
7. **Important**: Create Firestore composite index on (electionId, userId)

---

## Firestore Index Setup

Create composite index in Firestore console:
```
Collection: votes
Fields indexed:
  - electionId (Ascending)
  - userId (Ascending)

Query scope: Collection

Status: UNIQUE (prevents duplicates)
```

---

## Testing Considerations

- Unit test: Vote validation
- Integration test: Cannot vote twice
- Integration test: Cannot vote if election not voting
- Integration test: Cannot vote if user inactive
- Integration test: Cannot update vote (405 error)
- Integration test: Vote tallying

---

## Questions to Validate Understanding

- ✅ Votes are immutable (once cast, cannot change)
- ✅ One vote per user per election (enforced by composite index)
- ✅ Can only vote while election is voting
- ✅ User must be active
- ✅ Choice must be valid candidate
- ✅ Soft delete not needed (just don't query deleted votes)

---

Does this match your understanding?
