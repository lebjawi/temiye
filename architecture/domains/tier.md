# Tier Domain

**Collection**: `tiers`
**Complexity**: ⭐ (Low)
**Mutability**: Mostly immutable (can't delete if users assigned)

---

## Domain Purpose

The Tier domain manages **membership levels** that represent a user's tier in the community. Tiers determine access to certain features and may have different capabilities.

### Key Concepts

- **Membership levels**: bronze, silver, gold, platinum, etc.
- **Feature access**: Each tier unlocks specific features
- **Level hierarchy**: 1-5, higher = more features
- **User assignments**: Users have exactly one tier
- **Immutable references**: Once users are assigned, tier can't be deleted

---

## Firestore Document Structure

```javascript
// Collection: tiers
{
  id: "silver",              // Unique ID (lowercase)

  name: "Silver",            // Display name

  level: 2,                  // Hierarchy 1-5

  features: [
    "vote_in_elections",
    "view_transactions",
    "participate_in_boards"
  ],

  description: "Silver membership tier",

  createdAt: "2025-10-18T08:00:00Z",
  updatedAt: "2025-10-18T08:00:00Z"
}
```

---

## Entity (Tier.js)

### Properties
```javascript
{
  id: string,
  name: string,
  level: number,           // 1-5
  features: string[],
  description: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Methods
```javascript
// Validation
validate()
isValidLevel()

// Feature checks
hasFeature(featureName)
getFeatures()

// Hierarchy
isHigherThan(otherTier)
isLowerThan(otherTier)

// Static factory
static create(data)
```

### Business Rules
1. **Level must be 1-5**: Represents tier ranking
2. **ID must be unique**: Lowercase, no spaces
3. **Name must be unique**: Display name
4. **Cannot delete if users assigned**: Checked at service level

---

## DTOs

### CreateTierDTO
```javascript
{
  id: "gold",
  name: "Gold",
  level: 3,
  features: [
    "vote_in_elections",
    "view_transactions",
    "participate_in_boards",
    "access_analytics"
  ],
  description: "Premium membership tier"
}
```

### UpdateTierDTO
```javascript
{
  name: "Gold Plus",
  features: [...],
  description: "..."
}
```

**Constraints**:
- Cannot change ID or level
- Cannot delete if users assigned

---

## Predefined Tiers

```javascript
{
  id: "bronze",
  name: "Bronze",
  level: 1,
  features: ["view_announcements"],
  description: "Entry level tier"
}

{
  id: "silver",
  name: "Silver",
  level: 2,
  features: ["view_announcements", "vote_in_elections", "view_transactions"],
  description: "Standard member tier"
}

{
  id: "gold",
  name: "Gold",
  level: 3,
  features: ["view_announcements", "vote_in_elections", "view_transactions", "access_analytics"],
  description: "Premium tier"
}

{
  id: "platinum",
  name: "Platinum",
  level: 4,
  features: ["view_announcements", "vote_in_elections", "view_transactions", "access_analytics", "leadership_perks"],
  description: "Elite tier"
}
```

---

## Repository Methods

```javascript
create(tierData)
findById(id)
findByName(name)
findAll()
update(id, updates)
delete(id)
countUsersWithTier(id)    // For deletion constraint
```

---

## Service Methods

```javascript
async createTier(data)
async getTierById(id)
async getAllTiers()           // Cached (rarely changes)
async updateTier(id, updates)
async deleteTier(id)          // If no users assigned
async tierExists(id)
async canDeleteTier(id)
async hasFeature(tierId, feature)
```

---

## Controller Endpoints

### Public
```
GET    /api/tiers                 List all tiers
GET    /api/tiers/:id             Get tier by ID
```

### Admin-Only
```
POST   /api/tiers                 CreateTierDTO
PUT    /api/tiers/:id             UpdateTierDTO
DELETE /api/tiers/:id             Delete (if no users)
```

---

## Business Logic Rules

### 1. Tier Levels
- Level 1: Entry level (bronze)
- Level 2: Standard (silver)
- Level 3: Premium (gold)
- Level 4: Elite (platinum)
- Level 5: VIP (reserved)

### 2. Feature Granting
- Features are cumulative (higher tier = more features)
- Level 3 tier automatically gets level 1 and 2 features

### 3. Deletion Constraint
- Cannot delete tier if users are assigned
- Must migrate users to different tier first

---

## Dependencies

- **tierRepository**
- **userRepository**: To count users with tier

---

## Implementation Order

1. Create `Tier.js`
2. Create `CreateTierDTO.js`, `UpdateTierDTO.js`
3. Create `tier.repository.js`
4. Create `tier.service.js`
5. Create `tier.controller.js`
6. Create `tier.routes.js`
7. Seed predefined tiers

---

## Testing Considerations

- Unit test: Feature checks
- Integration test: Cannot delete tier with users
- Integration test: CRUD operations

---

## Questions to Validate Understanding

- ✅ Tiers = membership levels (bronze, silver, gold, etc.)
- ✅ Each user has exactly one tier
- ✅ Tiers grant access to features
- ✅ Tier levels are 1-5 (higher = more features)
- ✅ Cannot delete tier if users assigned

---

Does this match your understanding?
