# Election Domain

**Collection**: `elections`
**Complexity**: ⭐⭐⭐⭐ (Very High)
**Mutability**: Lifecycle-based (limited updates during specific states)

---

## Domain Purpose

The Election domain manages **voting processes** within boards. Elections have a strict lifecycle: created → voting → closed → archived. They enforce one-vote-per-user constraints and produce vote tallies.

### Key Concepts

- **Lifecycle management**: Elections progress through defined states
- **Vote uniqueness**: One vote per eligible user per election
- **Ballot types**: Single-choice, multi-choice, ranking
- **Date-based voting**: Election open/closed based on dates
- **Results calculation**: Aggregate votes by candidate
- **Candidate management**: List of options to vote for

---

## Firestore Document Structure

```javascript
// Collection: elections
{
  id: "elec-123",

  // Identity
  boardId: "board-456",         // Which board runs this election
  title: "Board President Election",
  description: "Elect new board president",

  // Ballot configuration
  ballotType: "single-choice",  // single-choice | multi-choice | ranking
  candidates: [
    { id: "cand-1", name: "Ahmed Mohamed" },
    { id: "cand-2", name: "Fatima Hassan" },
    { id: "cand-3", name: "Omar Ibrahim" }
  ],

  // Lifecycle
  status: "voting",             // created | voting | closed | archived
  startDate: "2025-10-18T08:00:00Z",
  endDate: "2025-10-25T18:00:00Z",
  closedAt: null,               // When voting ended

  // Metadata
  createdBy: "user-123",
  createdAt: "2025-10-18T08:00:00Z",
  updatedAt: "2025-10-18T10:00:00Z"
}
```

---

## Entity (Election.js)

### Properties
```javascript
{
  id: string,
  boardId: string,
  title: string,
  description: string,
  ballotType: "single-choice" | "multi-choice" | "ranking",
  candidates: Array<{ id: string, name: string }>,
  status: "created" | "voting" | "closed" | "archived",
  startDate: Date,
  endDate: Date,
  closedAt: Date | null,
  createdBy: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Methods
```javascript
// Validation
validate()
isValidBallotType()
isValidCandidates()
hasValidDates()

// Status checks
isCreated()
isVotingOpen()     // status === voting AND now between startDate/endDate
isClosed()
isArchived()

// Voting eligibility
canStartVoting()   // status === 'created'
canCloseVoting()   // status === 'voting'
canArchive()       // status === 'closed'

// Results
calculateResults()
getWinner()        // For single-choice
getWinners()       // For multi-choice

// Static factory
static create(data)
```

### Business Rules
1. **Title required**: 3-100 characters
2. **Candidates required**: Minimum 2, each with unique name
3. **Dates valid**: endDate > startDate, both in future
4. **Board must exist**: Reference to valid board
5. **Status transitions strict**: Only allowed transitions
6. **Cannot edit after voting starts**: Lock updates
7. **Voting window**: Determined by startDate/endDate

---

## DTOs

### CreateElectionDTO
```javascript
{
  boardId: "board-456",
  title: "Board President Election",
  description: "Elect the new president",
  ballotType: "single-choice",
  candidates: [
    "Ahmed Mohamed",
    "Fatima Hassan",
    "Omar Ibrahim"
  ],
  startDate: "2025-10-20T08:00:00Z",
  endDate: "2025-10-27T18:00:00Z"
}
```

**Validation**:
- boardId: Must exist
- title: Required, 3-100 chars
- ballotType: Must be valid type
- candidates: Min 2, max 20, unique names
- startDate: Must be future
- endDate: Must be > startDate, must be future

### UpdateElectionDTO (Before voting starts only)
```javascript
{
  title: "New title",
  description: "New description",
  candidates: [...],
  startDate: "...",
  endDate: "..."
}
```

**Constraints**:
- Only before status becomes "voting"
- Cannot change boardId

### StartVotingDTO
```javascript
{
  reason: "Election officially started"
}
```

**Constraints**:
- status must be "created"

### CloseVotingDTO
```javascript
{
  reason: "Voting period ended"
}
```

**Constraints**:
- status must be "voting"

---

## Repository Methods

```javascript
create(electionData)
findById(id)                     // With vote count
findAll()
findByBoard(boardId)
findByStatus(status)
findActiveElections()            // voting now
updateStatus(id, newStatus)
update(id, updates)              // Before voting only
addCandidate(id, candidate)
removeCandidate(id, candidateId)
```

### Firestore Queries & Indexes
- **Regular indexes**: boardId, status, startDate, endDate
- **Compound indexes**: (boardId, status), (status, startDate)

---

## Service Methods

### Core CRUD
```javascript
async createElection(data)
async getElectionById(id)
async getAllElections()
async getElectionsByBoard(boardId)
async updateElection(id, updates)   // Before voting starts
async deleteElection(id)            // Before voting starts
```

### Lifecycle Management
```javascript
async startVoting(id, reason)       // created → voting
async closeVoting(id, reason)       // voting → closed
async archiveElection(id)           // closed → archived
async canStartVoting(id)
async canCloseVoting(id)
async canArchiveElection(id)
```

### Voting Management
```javascript
async getEligibleVoters(id)         // Users who can vote
async hasUserVoted(electionId, userId)
async canUserVote(electionId, userId)
async recordVote(electionId, userId, choice)  // Via vote service
```

### Results
```javascript
async getVoteCount(electionId)      // Total votes
async getResults(electionId)        // Tallied by candidate
async getWinner(electionId)         // For single-choice
async getWinners(electionId)        // For multi-choice
```

### Validation
```javascript
async boardExists(boardId)
async isVotingOpen(id)              // Check dates
```

---

## Controller Endpoints

### Public (Authenticated)
```
GET    /api/elections                List active elections
GET    /api/elections/:id            Get election details
GET    /api/elections/:id/results    Get vote results
GET    /api/elections/:id/can-vote   Can I vote in this?
```

### Admin-Only (Board managers)
```
POST   /api/elections                CreateElectionDTO

GET    /api/elections/board/:boardId Get elections for board
GET    /api/elections/status/:status Get elections by status

PUT    /api/elections/:id            UpdateElectionDTO (before voting)
DELETE /api/elections/:id            Delete (before voting)

POST   /api/elections/:id/start-voting   StartVotingDTO
POST   /api/elections/:id/close-voting   CloseVotingDTO
POST   /api/elections/:id/archive        Archive election
```

---

## Error Handling

### Expected Errors
- **400 Bad Request**: Invalid dates, invalid candidates, etc.
- **404 Not Found**: Election not found, board not found
- **409 Conflict**: Invalid state transition
- **400 Bad Request (Constraint)**: Cannot edit after voting started

### Custom Errors
```javascript
new ValidationError('End date must be after start date')
new ConflictError('Cannot update election after voting started')
new InvalidStateError('Can only start voting from created status')
new NotFoundError('Election not found')
```

---

## State Machine

```
[created]
  ↓ (POST /start-voting)
[voting]
  ↓ (POST /close-voting - admin or when endDate passes)
[closed]
  ↓ (POST /archive)
[archived]
```

**Allowed transitions only**:
- created → voting
- voting → closed
- closed → archived

**Forbidden transitions**:
- Backwards transitions
- Skipping states
- created → closed (must go through voting)

---

## Business Logic Rules

### 1. Lifecycle Constraints
- Can only edit (title, candidates, dates) before voting starts
- Once voting starts, election is locked for changes
- Results only visible after voting closes

### 2. Voting Windows
- Current time must be between startDate and endDate
- Election automatically "soft closes" after endDate (admin must confirm)

### 3. Vote Uniqueness
- One vote per eligible user per election
- Enforced by Firestore composite index on (electionId, userId)
- Service layer double-checks before accepting vote

### 4. Ballot Types
- **single-choice**: User picks one candidate (one winner)
- **multi-choice**: User picks one or more candidates
- **ranking**: User ranks all candidates (Condorcet voting)

### 5. Results Calculation
- Cannot calculate until voting is closed
- Results locked and immutable once published

---

## Dependencies

- **electionRepository**
- **boardRepository**: Validate board exists
- **voteService**: Record votes, check uniqueness
- **voteRepository**: Get votes for this election
- **userRepository**: Get eligible voters

---

## Implementation Order

1. Create `Election.js`
2. Create DTOs: `CreateElectionDTO.js`, `UpdateElectionDTO.js`, etc.
3. Create `election.repository.js`
4. Create `election.service.js`
5. Create `election.controller.js`
6. Create `election.routes.js`

---

## Testing Considerations

- Unit test: Date validation
- Unit test: Candidate validation
- Unit test: State transition validation
- Integration test: Cannot edit after voting starts
- Integration test: Vote uniqueness
- Integration test: Results calculation
- Integration test: Eligible voters

---

## Questions to Validate Understanding

- ✅ Elections = voting processes within boards
- ✅ Lifecycle: created → voting → closed → archived
- ✅ Ballot types: single-choice, multi-choice, ranking
- ✅ One vote per eligible user per election
- ✅ Dates determine voting window
- ✅ Cannot edit after voting starts
- ✅ Results locked after closed

---

Does this match your understanding?
