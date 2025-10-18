# Transaction Domain

**Collection**: `transactions`
**Complexity**: ⭐⭐ (Medium)
**Mutability**: **IMMUTABLE** (cannot update, can only delete as superadmin)

---

## Domain Purpose

The Transaction domain manages **financial records** of the community. Transactions represent contributions, expenses, dividends, and fines. They are immutable to ensure audit trail integrity.

### Key Concepts

- **Immutable records**: Once created, cannot be modified
- **Transaction types**: contribution, expense, dividend, fine
- **Amount validation**: Must follow min/max from constants
- **User tracking**: All transactions linked to users
- **Audit trail**: Who created it, when, why
- **Financial integrity**: No edits, only additions (append-only)

---

## Firestore Document Structure

```javascript
// Collection: transactions
{
  id: "txn-123",

  // Who and what
  userId: "user-123",           // User involved in transaction
  type: "contribution",         // contribution | expense | dividend | fine

  // Amount
  amount: 50000,                // In currency units, always > 0

  // Description
  description: "Monthly contribution for Q4 2025",
  reference: "election-456",    // Optional: link to election, board, etc.

  // Metadata
  createdBy: "user-789",        // Who recorded this transaction
  createdAt: "2025-10-18T10:00:00Z",

  // Soft delete (immutable records tracked)
  deletedAt: null,              // null = active, timestamp = deleted
  deletedBy: null,              // Who deleted
  deletionReason: null          // Why deleted

  // Audit
  notes: "Approved by board"    // Optional audit notes
}
```

---

## Entity (Transaction.js)

### Properties
```javascript
{
  id: string,
  userId: string,
  type: "contribution" | "expense" | "dividend" | "fine",
  amount: number,
  description: string,
  reference: string | null,
  createdBy: string,
  createdAt: Date,
  deletedAt: Date | null,
  deletedBy: string | null,
  deletionReason: string | null,
  notes: string | null
}
```

### Methods
```javascript
// Validation
validate()
isValidType()
isValidAmount()

// Status checks
isActive()                // deletedAt === null
isDeleted()              // deletedAt !== null
isImmutable()            // Always returns true

// Calculations
getDisplayAmount()       // Formatted for UI
getDisplayType()         // Localized type name

// Static factory
static create(data)
```

### Business Rules
1. **Amount must be > 0**: Never zero or negative
2. **Type must be valid**: contribution, expense, dividend, fine
3. **User must exist**: Reference to valid user
4. **Description required**: Min 5 characters
5. **Cannot update**: Ever. Immutable by design.
6. **Cannot delete**: Only by superadmin, only soft delete
7. **Amount must respect constants**: Check MAX_TRANSACTION_AMOUNT
8. **Amount must respect minimum**: Check MIN_TRANSACTION_AMOUNT

---

## DTOs

### CreateTransactionDTO
```javascript
{
  userId: "user-123",
  type: "contribution",         // Required
  amount: 50000,                // Required, > 0
  description: "Quarterly contribution",
  reference: "board-456",       // Optional
  notes: "Approved by treasurer"
}
```

**Validation**:
- userId: Must exist in users collection
- type: Must be valid type
- amount: Must be number > 0
- amount: Must not exceed MAX_TRANSACTION_AMOUNT constant
- amount: Must not be less than MIN_TRANSACTION_AMOUNT constant
- description: Required, min 5 chars, max 500 chars
- reference: Optional, if provided must exist
- notes: Optional, max 200 chars

### UpdateTransactionDTO
**NONE** - Transactions are immutable. Return 405 Method Not Allowed for any update attempts.

### DeleteTransactionDTO (Admin-only)
```javascript
{
  reason: "Recorded in error"
}
```

**Constraints**:
- Only superadmin can delete
- Only recent transactions (< 7 days old)
- Soft delete (keeps record, marks as deleted)

---

## Repository Methods

```javascript
create(transactionData)         // Create new transaction
findById(id)                    // Get transaction
findAll(filters)                // Get all with optional filters
findByUserId(userId)            // All transactions for user
findByType(type)                // All transactions of type
findByDateRange(start, end)     // Transactions between dates
findActive()                    // Where deletedAt === null
findDeleted()                   // Where deletedAt !== null

// Soft delete (not hard delete)
softDelete(id, reason, deletedBy)

// NO UPDATE METHOD - Intentionally omitted
```

### Firestore Queries
- **Indexes**: userId, type, createdAt, isActive
- **Compound indexes**: (userId, createdAt), (type, createdAt)

---

## Service Methods

### Core CRUD
```javascript
async createTransaction(data)
async getTransactionById(id)
async getAllTransactions(filters)
async deleteTransaction(id, reason)  // Soft delete only
async updateTransaction(id, updates) // Throws 405: Method Not Allowed
```

### Query Methods
```javascript
async getTransactionsByUser(userId, filters)
async getTransactionsByType(type)
async getTransactionsByDateRange(start, end)
async getRecentTransactions(days)
async getTransactionSummary(filters)  // Total by type
```

### Validation
```javascript
async validateAmount(amount)        // Check against constants
async userExists(userId)            // Validate user
async referenceExists(reference)    // Validate reference
```

---

## Controller Endpoints

### Public (Authenticated)
```
GET    /api/transactions/me           Get my transactions
GET    /api/transactions/me/summary   Get my summary
```

### Admin-Only
```
POST   /api/transactions              CreateTransactionDTO

GET    /api/transactions              List all transactions
GET    /api/transactions/:id          Get transaction

GET    /api/transactions/user/:userId Get user's transactions
GET    /api/transactions/type/:type   Get by type
GET    /api/transactions/range        Get by date range

DELETE /api/transactions/:id          Soft delete (superadmin only)

// DO NOT SUPPORT PUT/PATCH - Immutable
```

---

## Error Handling

### Expected Errors
- **400 Bad Request**: Invalid amount, invalid type, etc.
- **404 Not Found**: Transaction not found, user not found
- **405 Method Not Allowed**: Attempt to update transaction
- **403 Forbidden**: User not authorized to delete

### Custom Errors
```javascript
new ValidationError('Amount exceeds maximum')
new ValidationError('Invalid transaction type')
new ConflictError('User not found')
new MethodNotAllowedError('Transactions are immutable')
new ForbiddenError('Only superadmin can delete transactions')
```

---

## Business Logic Rules

### 1. Immutability Contract
- **Once created**: Stays as-is forever
- **No edits**: If error, delete and recreate
- **Append-only**: New transactions added, old ones stay
- **Soft delete**: Mark as deleted, don't remove

### 2. Amount Validation
- Minimum: Get from constants: MIN_TRANSACTION_AMOUNT
- Maximum: Get from constants: MAX_TRANSACTION_AMOUNT
- Always > 0
- User can't exceed daily limit (if defined in constants)

### 3. Types
- **contribution**: User giving money to community
- **expense**: Community spending money
- **dividend**: Community paying user
- **fine**: Penalty for user

### 4. Deletion Rules
- Only superadmin can delete
- Only soft delete (keeps history)
- Reason required (audit trail)
- Only deletable if < 7 days old

### 5. Audit Trail
- createdBy: Who recorded this
- createdAt: When recorded
- deletedBy: Who deleted (if deleted)
- deletedAt: When deleted (if deleted)
- deletionReason: Why deleted (if deleted)

---

## Dependencies

- **transactionRepository**
- **userRepository**: Validate user exists
- **constantsService**: Get MIN/MAX amounts
- **boardRepository**: Validate board reference if provided
- **electionRepository**: Validate election reference if provided

---

## Implementation Order

1. Create `Transaction.js`
2. Create `CreateTransactionDTO.js`
3. Create `transaction.repository.js`
4. Create `transaction.service.js`
5. Create `transaction.controller.js`
6. Create `transaction.routes.js`

---

## Testing Considerations

- Unit test: Amount validation
- Unit test: Type validation
- Integration test: Cannot update transaction
- Integration test: Can soft delete (superadmin only)
- Integration test: Query by user, type, date range
- Integration test: Summary calculations

---

## Questions to Validate Understanding

- ✅ Transactions are immutable (once created, never updated)
- ✅ Soft delete only (marks as deleted, keeps history)
- ✅ Types: contribution, expense, dividend, fine
- ✅ Amount validated against constants (min/max)
- ✅ User must exist
- ✅ Audit trail: who created, when, who deleted
- ✅ Only superadmin can delete

---

Does this match your understanding?
