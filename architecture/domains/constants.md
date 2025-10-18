# Constants Domain

**Collection**: `config` (single document collection)
**Complexity**: ⭐ (Low)
**Mutability**: Fully mutable
**Special**: Hybrid approach - categorized constants with generic CRUD + named getters

---

## Domain Purpose

The Constants domain manages **system configuration values** that are used throughout the application. It provides both generic dynamic CRUD operations and strongly-typed named getter methods for frequently-used constants.

### Key Concepts

- **Categorized constants**: Organized by category (voting, board, transaction, system)
- **Dynamic CRUD**: Can add/update/delete any constant at runtime
- **Named getters**: Pre-defined helper methods for known constants
- **Caching**: In-memory cache for rarely-changing data
- **Type conversion**: Automatic type casting (number, boolean, string, JSON)
- **Zero authentication required**: Constants are public/readable by all

---

## Firestore Document Structure

```javascript
// Collection: config
// Single document: "settings"
{
  // Voting constants
  voting: {
    duration: 7,                    // Days voting is open
    minAge: 18,                     // Minimum age to vote
    maxVoters: 1000                 // Max voters per election
  },

  // Board constants
  board: {
    maxSize: 5,                     // Max members per board
    minMembers: 2,                  // Min members required
    maxHierarchyDepth: 3            // Max parent/child levels
  },

  // Transaction constants
  transaction: {
    minAmount: 1000,                // Minimum transaction amount
    maxAmount: 1000000,             // Maximum transaction amount
    dailyLimit: 5000000             // Daily limit per user
  },

  // System constants
  system: {
    name: "Tenmiye Community",
    timezone: "Africa/Nouakchott",
    language: "ar",                 // Primary language
    currency: "MRU",                // Mauritanian Ouguiya
    country: "MR"                   // ISO country code
  },

  // Metadata
  updatedAt: "2025-10-18T10:00:00Z",
  updatedBy: "admin-user-id",
  version: 1
}
```

---

## Entity (Constant.js) - Optional

Since constants are simple key-value pairs, you may not need a full entity class. But for consistency:

```javascript
{
  category: string,
  key: string,
  value: any,
  type: "string" | "number" | "boolean" | "json",
  description: string
}
```

---

## DTOs

### SetConstantDTO
**Purpose**: Create or update any constant dynamically

```javascript
{
  category: "voting",              // Required: voting, board, transaction, system
  key: "duration",                 // Required: constant name
  value: 7,                        // Required: constant value
  type: "number",                  // Optional: auto-detect if omitted
  description: "Days voting is open"
}
```

**Validation**:
- category: Must be valid category (enum)
- key: Required, alphanumeric, 3-50 chars
- value: Required, varies by type
- type: Optional, auto-detect if omitted (string, number, boolean, json)
- description: Optional, max 200 chars

**Process**:
1. Validate all fields
2. Get current config doc
3. Update nested field: `config[category][key] = value`
4. Save to Firestore
5. Invalidate cache
6. Return updated constant

### GetConstantDTO - No DTO needed

Just use path parameter: `/api/constants/voting/duration`

---

## Repository Methods

```javascript
// Generic methods
getCategory(category)              // Get all constants in category
get(category, key)                 // Get single constant
getAll()                           // Get entire config doc
set(category, key, value, type, description)  // Create/update
delete(category, key)              // Set to null (soft delete)

// Special handling
incrementValue(category, key, amount)  // For counters
appendToArray(category, key, value)    // For array constants
```

---

## Service Methods

### Generic CRUD
```javascript
async getConstant(category, key)              // Get one constant
async getCategory(category)                   // Get all in category
async getAllConstants()                       // Get all (cached)
async setConstant(category, key, value, type)
async deleteConstant(category, key)
```

### Typed Getters
```javascript
async getTyped(category, key)     // Auto-convert to type
async getAsNumber(category, key)
async getAsString(category, key)
async getAsBoolean(category, key)
async getAsJSON(category, key)
```

### Named Helper Getters (Strongly-typed)
```javascript
// Voting
async getVotingDuration()
async getMinVotingAge()
async getMaxVotersPerElection()

// Board
async getMaxBoardSize()
async getMinBoardMembers()
async getMaxBoardHierarchyDepth()

// Transaction
async getMinTransactionAmount()
async getMaxTransactionAmount()
async getDailyTransactionLimit()

// System
async getSystemName()
async getSystemTimezone()
async getSystemLanguage()
async getSystemCurrency()
```

### Caching
```javascript
async clearCache()                // Invalidate cache (on update)
async warmCache()                 // Load all constants into memory
```

---

## Controller Endpoints

### Public (No auth required)
```
GET    /api/constants                    Get all constants
GET    /api/constants/:category          Get constants by category
GET    /api/constants/:category/:key     Get single constant
```

### Admin-Only
```
POST   /api/constants                    SetConstantDTO
PUT    /api/constants/:category/:key     SetConstantDTO
DELETE /api/constants/:category/:key     Delete constant

// Bulk operations
POST   /api/constants/batch              Array of SetConstantDTO
```

---

## Error Handling

### Expected Errors
- **400 Bad Request**: Invalid category, invalid key format, etc.
- **404 Not Found**: Constant not found
- **400 Bad Request**: Invalid type, invalid value for type

### Custom Errors
```javascript
new ValidationError('Invalid category')
new ValidationError('Invalid key format')
new NotFoundError('Constant not found')
new ValidationError('Invalid value for type')
```

---

## Business Logic Rules

### 1. Categories
- **voting**: Election-related constants (duration, minAge, etc.)
- **board**: Board-related constants (maxSize, etc.)
- **transaction**: Financial constants (min/max amounts, daily limits)
- **system**: System-wide settings (name, timezone, language, currency)

### 2. Predefined Constants
```javascript
// Voting
voting.duration = 7                 // Days
voting.minAge = 18                  // Years
voting.maxVoters = 1000             // Per election

// Board
board.maxSize = 5                   // Members
board.minMembers = 2                // Required
board.maxHierarchyDepth = 3         // Levels

// Transaction
transaction.minAmount = 1000        // Currency units
transaction.maxAmount = 1000000
transaction.dailyLimit = 5000000

// System
system.name = "Tenmiye Community"
system.timezone = "Africa/Nouakchott"
system.language = "ar"
system.currency = "MRU"
system.country = "MR"
```

### 3. Type Handling
- **string**: Text values
- **number**: Integers and floats
- **boolean**: true/false
- **json**: Complex objects or arrays (stored as stringified JSON)

### 4. Caching Strategy
- Cache all constants in memory (small dataset)
- Invalidate cache on any update
- Reload from Firestore on next read
- 5-minute TTL if you want auto-refresh (optional)

### 5. No Deletion - Only Soft Delete
- Setting value to null = soft delete
- Can restore by setting new value
- Keeps history in Firestore

---

## Usage Examples

### In Services (How other domains use constants)

```javascript
// Transaction Service
async validateTransactionAmount(amount) {
  const minAmount = await constantsService.getAsNumber('transaction', 'minAmount');
  const maxAmount = await constantsService.getAsNumber('transaction', 'maxAmount');

  if (amount < minAmount || amount > maxAmount) {
    throw new ValidationError('Amount out of range');
  }
}

// Election Service
async canStartVoting(election) {
  const votingDuration = await constantsService.getVotingDuration();
  // Use duration in business logic
}

// Board Service
async canAddMember(board) {
  const maxSize = await constantsService.getMaxBoardSize();
  if (board.members.length >= maxSize) {
    throw new ConstraintError('Board is full');
  }
}
```

---

## Dependencies

- **constantsRepository**: For Firestore read/write
- **No other domain dependencies**: Constants are read-only from other domains

---

## Implementation Order

1. Create `constants.repository.js` (simple document queries)
2. Create `constants.service.js` (with caching + named getters)
3. Create `constants.controller.js`
4. Create `constants.routes.js`
5. Seed predefined constants in Firestore
6. Don't need entity or DTOs (too simple)

---

## Seed Data

On first app startup, create this document:

```javascript
// Collection: config, Document: settings
{
  voting: { duration: 7, minAge: 18, maxVoters: 1000 },
  board: { maxSize: 5, minMembers: 2, maxHierarchyDepth: 3 },
  transaction: { minAmount: 1000, maxAmount: 1000000, dailyLimit: 5000000 },
  system: { name: "Tenmiye Community", timezone: "Africa/Nouakchott", language: "ar", currency: "MRU", country: "MR" },
  updatedAt: new Date(),
  updatedBy: "system",
  version: 1
}
```

---

## Testing Considerations

- Unit test: Type conversion (getAsNumber, etc.)
- Integration test: CRUD operations
- Integration test: Cache invalidation
- Integration test: Named getters return correct values
- Integration test: Other domains can read constants

---

## Questions to Validate Understanding

- ✅ Constants = system configuration (voting duration, board size, transaction limits, etc.)
- ✅ Categorized: voting, board, transaction, system
- ✅ Dynamic CRUD: Add/update/delete at runtime
- ✅ Named getters: Helper methods for known constants
- ✅ Cached: In-memory for performance
- ✅ Typed: Auto-convert to number, boolean, string, JSON
- ✅ Public readable: No auth required to get constants

---

Does this match your understanding?
