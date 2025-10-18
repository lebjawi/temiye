# Password Reset Domain

**Collection**: `password_reset_tokens`
**Complexity**: ⭐ (Low)
**Mutability**: Temporary tokens only (not persistent)
**Special**: NOT for admins (use Firebase for admins)

---

## Domain Purpose

The Password Reset domain manages **temporary reset codes** for main app users (phone+password auth). It handles forgot password flows by generating and validating one-time use codes that expire after 15 minutes.

### Key Concepts

- **Temporary tokens**: Short-lived (15 minutes), one-time use
- **Phone-based lookup**: Users identify by phone number
- **Main app only**: NOT for admins (who use Firebase password reset)
- **Expiration**: Automatic expiry after 15 minutes
- **One-time use**: Code becomes invalid after use
- **No password storage**: Only tracks reset state, not passwords

---

## Firestore Document Structure

```javascript
// Collection: password_reset_tokens
{
  id: "token-123",

  // User lookup
  phone: "+22212345678",

  // Reset code
  code: "123456",               // 6-digit code (sent via SMS/WhatsApp)

  // Expiration & state
  expiresAt: "2025-10-18T10:15:00Z",    // Token expires 15 min after creation
  isUsed: false,                        // Becomes true after used once

  // Metadata
  createdAt: "2025-10-18T10:00:00Z",
  usedAt: null
}
```

---

## Entity (PasswordResetToken.js)

### Properties
```javascript
{
  id: string,
  phone: string,
  code: string,
  expiresAt: Date,
  isUsed: boolean,
  createdAt: Date,
  usedAt: Date | null
}
```

### Methods
```javascript
// Validation
validate()
isValidCode()               // 6 digits

// Status checks
isExpired()                // expiresAt < now
isUsed()                   // isUsed === true
isValid()                  // NOT expired AND NOT used

// Static factory
static create(data)
static generateCode()      // Random 6-digit code
```

### Business Rules
1. **Code is 6 digits**: Random number 000000-999999
2. **Code expires in 15 minutes**: From creation time
3. **One-time use only**: After used, becomes invalid
4. **Phone must be valid**: User must exist in users collection
5. **Cannot be updated**: Create and mark used, that's it

---

## DTOs

### RequestResetDTO
**Purpose**: User requests password reset by entering phone

```javascript
{
  phone: "+22212345678"
}
```

**Validation**:
- phone: Required, must match Mauritanian format
- Constraint: Phone must exist in users collection
- Constraint: User must NOT be admin (admin use Firebase)

**Process**:
1. Generate 6-digit code
2. Save token with 15-minute expiry
3. Send code via SMS/WhatsApp (implement separately)
4. Return message: "Reset code sent to your phone"

### VerifyResetDTO
**Purpose**: User enters code to verify it's valid

```javascript
{
  phone: "+22212345678",
  code: "123456"
}
```

**Validation**:
- phone: Required
- code: Required, 6 digits
- Constraint: Token must exist
- Constraint: Token must NOT be expired
- Constraint: Token must NOT be used
- Constraint: Code must match

**Process**:
1. Find token by phone + code
2. Check not expired, not used
3. Return success (but don't mark as used yet)
4. Frontend can now request password reset

### ResetPasswordDTO
**Purpose**: User sets new password after verifying code

```javascript
{
  phone: "+22212345678",
  code: "123456",
  newPassword: "secureNewPass123"
}
```

**Validation**:
- phone: Required
- code: Required, 6 digits
- newPassword: Required, min 8 chars
- Constraint: Token must exist and be valid
- Constraint: Token must NOT be used

**Process**:
1. Verify token one more time
2. Update user's password in users collection
3. Mark token as used
4. Return success

---

## Repository Methods

```javascript
create(tokenData)                   // Create new reset token
findById(id)
findByPhone(phone)                  // Most recent token
findByCode(phone, code)             // Find specific code
findValid(phone, code)              // Only non-expired, non-used
markAsUsed(id)                      // Mark token as used
delete(id)                          // Clean up old tokens (optional)
deleteExpired()                     // Clean up expired tokens (scheduler)
```

---

## Service Methods

### Reset Flow
```javascript
async requestReset(phone)           // Generate token, send code
async verifyCode(phone, code)       // Check code is valid
async resetPassword(phone, code, newPassword)
```

### Validation
```javascript
async codeExists(phone, code)
async isCodeValid(phone, code)      // Not expired, not used
async isCodeExpired(phone, code)
async isCodeUsed(phone, code)
async phoneExists(phone)            // User must exist
```

### Cleanup
```javascript
async deleteExpiredTokens()         // Scheduler task
async cleanupUsedTokens()           // Optional, keep for audit
```

---

## Controller Endpoints

### Public (No auth required)
```
POST   /api/password-reset/request       RequestResetDTO
POST   /api/password-reset/verify        VerifyResetDTO
POST   /api/password-reset/reset         ResetPasswordDTO
```

**Flow**:
1. User calls `/request` with phone → code sent to phone
2. User calls `/verify` with phone + code → verify it's valid
3. User calls `/reset` with phone + code + newPassword → password changed

---

## Error Handling

### Expected Errors
- **400 Bad Request**: Invalid phone format, weak password, etc.
- **404 Not Found**: User not found, code not found
- **400 Bad Request**: Code expired, code already used, code invalid
- **400 Bad Request**: Phone not in users collection

### Custom Errors
```javascript
new ValidationError('Invalid phone format')
new NotFoundError('User not found')
new NotFoundError('Reset code not found')
new ValidationError('Reset code expired')
new ValidationError('Reset code already used')
new ValidationError('Invalid reset code')
```

---

## Business Logic Rules

### 1. Request Reset
- User enters phone
- Check phone exists in users collection
- Generate random 6-digit code
- Create token with 15-minute expiry
- Send code via SMS/WhatsApp (implement SMS provider)

### 2. Verify Code
- User enters phone + code
- Find token matching both
- Check not expired and not used
- Return success (confirmation for user to proceed)

### 3. Reset Password
- User enters phone + code + new password
- Find token matching phone + code
- Verify token still valid
- Hash new password with bcrypt
- Update user's passwordHash in users collection
- Mark token as used
- Return success

### 4. Security
- 15-minute window: Code expires after 15 minutes
- One-time use: After used, can't use again (must request new)
- No password in URL: Always POST, never GET
- Rate limit: Limit requests per phone (prevent abuse)

### 5. Phone-based not Email
- Uses phone number (matches main app auth)
- Code sent via SMS/WhatsApp (not email)
- For Mauritanian context (mobile-first)

---

## Dependencies

- **passwordResetRepository**
- **userRepository**: Validate phone exists, update password
- **SMS/WhatsApp provider**: Send code (Twilio, AWS SNS, etc.)
- **bcrypt**: Hash new password

---

## Implementation Order

1. Create `PasswordResetToken.js`
2. Create DTOs: `RequestResetDTO.js`, `VerifyResetDTO.js`, `ResetPasswordDTO.js`
3. Create `password-reset.repository.js`
4. Create `password-reset.service.js`
5. Create `password-reset.controller.js`
6. Create `password-reset.routes.js`
7. Integrate SMS provider (TODO: implement)
8. Add rate limiting middleware

---

## SMS Provider Integration (TODO)

Choose one provider (not implemented yet):
- **Twilio**: Industry standard
- **AWS SNS**: If using AWS
- **Local provider**: Mauritanian SMS gateway

Configuration:
```javascript
// .env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+222XXXXX

// OR

SMS_PROVIDER=aws-sns
AWS_SNS_REGION=...
AWS_SNS_ACCESS_KEY=...
```

---

## Scheduler Task (Optional)

Clean up old reset tokens daily:
```javascript
// Run every hour
async cleanupExpiredTokens() {
  await passwordResetRepository.deleteExpired();
}
```

---

## Testing Considerations

- Unit test: Code generation (6 digits)
- Unit test: Expiry check
- Integration test: Complete reset flow (request → verify → reset)
- Integration test: Cannot reuse code
- Integration test: Cannot use expired code
- Integration test: Cannot reset non-existent user
- Mock SMS provider in tests

---

## Questions to Validate Understanding

- ✅ Reset tokens are temporary (15 minutes)
- ✅ One-time use only
- ✅ Phone-based (SMS/WhatsApp, not email)
- ✅ For main app users only (phone+password)
- ✅ NOT for admins (they use Firebase)
- ✅ 6-digit code sent to phone
- ✅ After reset, token cannot be reused

---

Does this match your understanding?
