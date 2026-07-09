# Guest Purchase Linking

> **Status**: Implemented (Phase 3)  
> **Last Updated**: 2026-07-06

## Overview

Guest Purchase Linking automatically connects historical guest purchases to a customer's account after they verify ownership of the purchasing email address.

### Flow

```
Guest
  │
  ▼
Purchase (guest_email stored, user_id = NULL)
  │
  ▼
Later registers with SAME email
  │
  ▼
Email becomes VERIFIED
  │
  ▼
databaseHooks.user.update.after fires
  │
  ▼
linkPurchasesToUserByEmail(userId, email)
  │
  ├── UPDATE purchases SET user_id = userId WHERE guest_email = email AND user_id IS NULL
  └── UPDATE entitlements SET user_id = userId WHERE guest_email = email AND user_id IS NULL
  │
  ▼
Purchases immediately available in dashboard
Downloads continue working normally
```

No manual "Claim Purchase" flow is ever required.

## Ownership Rules

| Condition | Action |
|-----------|--------|
| Account exists AND email verified | Link guest purchases to user |
| Account exists BUT email NOT verified | Do NOT link |
| No account | Guest purchase remains as guest |
| Already linked | Skip (idempotent) |

## Module Structure

```
backend/src/purchase-linking/
├── types.ts        - LinkingResult interface
├── repository.ts   - Raw SQL for linking operations
└── service.ts      - Business logic and orchestration
```

No routes are required — linking is triggered automatically by database hooks.

## Trigger Mechanism

Linking is triggered by Better Auth's `databaseHooks.user.update.after` hook. When a user's email verification succeeds, Better Auth updates `email_verified` from `false` to `true`. The hook detects this change and calls `linkPurchasesToUserByEmail(userId, email)`.

**File**: `backend/src/auth.ts` (lines 125-149)

```typescript
databaseHooks: {
  user: {
    update: {
      after: async (user) => {
        const isVerified = Boolean(user.emailVerified ?? user.email_verified ?? false);
        if (isVerified) {
          await linkPurchasesToUserByEmail(user.id, user.email);
        }
      },
    },
  },
}
```

## Linking Logic

### Core Query

```sql
-- Link purchases
UPDATE purchases
SET user_id = $1::uuid, updated_at = NOW()
WHERE guest_email = $2 AND user_id IS NULL;

-- Link entitlements (skipping conflicts)
UPDATE entitlements
SET user_id = $1::uuid
WHERE guest_email = $2
  AND user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM entitlements e2
    WHERE e2.user_id = $1::uuid
      AND e2.product_id = entitlements.product_id
      AND e2.revoked_at IS NULL
  );
```

Both operations run inside a single database transaction for atomicity.

### Conflict Resolution

If a user already has an active entitlement for a product (via prior purchase or previous linking), the duplicate guest entitlement is:
1. **Skipped** — the existing active entitlement takes precedence
2. **Deleted** — redundant guest entitlement is removed

This prevents unique index violations on `idx_entitlements_user_product` and ensures no duplicates.

### Idempotency

Linking is idempotent because:
- The `WHERE user_id IS NULL` condition prevents re-linking already linked records
- Running `linkPurchasesToUser` multiple times with the same user and email produces the same result
- No duplicate purchases or entitlements can be created
- The operation is safe to call from duplicate verification callbacks

## API Functions

### `linkPurchasesToUser(userId: string): Promise<LinkingResult>`
- Looks up the user's email by ID
- Calls `linkPurchasesToUserByEmail`
- Returns counts of linked purchases and entitlements

### `linkPurchasesToUserByEmail(userId: string, email: string): Promise<LinkingResult>`
- Core linking function
- Runs linking queries in a transaction
- Logs results to `purchase_linking_log` table

### `findGuestPurchases(email: string): Promise<Purchase[]>`
- Returns all purchases with `guest_email = email` and `user_id IS NULL`
- Useful for checking if linking is needed

### `alreadyLinked(email: string): Promise<boolean>`
- Returns `true` if no unlinked guest purchases remain

## Logging

Every linking event is recorded in the `purchase_linking_log` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References users(id) |
| `email` | TEXT | Email used for linking |
| `purchases_linked` | INTEGER | Number of purchases linked |
| `entitlements_linked` | INTEGER | Number of entitlements linked |
| `linked_at` | TIMESTAMPTZ | When linking occurred |

No sensitive information (passwords, payment details) is logged.

## Logged-In Purchase Flow

When a logged-in user makes a purchase:

1. `c.get('user')` returns the authenticated user
2. The email in the checkout form is validated against the session email
3. If matching: `user_id` is set on the purchase record
4. If not matching: falls back to guest purchase with only `guest_email`
5. After payment verification: entitlement is granted by `user_id`

This means logged-in users immediately see purchases in their dashboard without needing the linking process.

## Edge Cases

### No purchases found
If no guest purchases exist for the verified email, linking is a no-op. The function returns `{ purchasesLinked: 0, entitlementsLinked: 0 }`.

### Multiple purchases
All purchases with matching `guest_email` and `user_id IS NULL` are linked in a single transaction.

### Multiple products
Each product's purchases and entitlements are independently linked. No product-specific limitations.

### Repeated linking
Idempotent by design. The `WHERE user_id IS NULL` condition ensures each purchase/entitlement is linked only once.

### Duplicate verification callbacks
If the verification email link is clicked multiple times, Better Auth only processes it once (token consumed). Even if the hook fires multiple times, linking remains idempotent.

### Partially linked accounts
If a linking transaction fails midway (e.g., database error), no partial state is left because both operations run atomically in a transaction.

### Refunded purchases
Refunded purchases already have `status = 'refunded'`. Linking updates `user_id` but preserves the refunded status. The associated entitlement (which has `revoked_at` set) is linked but remains revoked. The user does NOT regain access to a refunded product.

### Revoked downloads
Download tokens are not modified during linking. Previously revoked tokens remain revoked. Existing valid tokens continue working.

### Archived products
Products marked `active = false` are not affected. Linking works regardless of product active status. The user owns what they paid for, even if the product is no longer sold.

## Security Considerations

### Email Verification Requirement
Linking only occurs after email verification. An unverified email cannot trigger linking.

### No Session-Based Linking
Linking is driven by the `email_verified` database field, not by session state. This prevents linking based on temporary sessions.

### No User Enumeration
The linking process does not expose whether other users exist or have purchases.

### Parameterized Queries
All SQL queries use parameterized statements. No string concatenation of user input.

### Idempotency Prevents Abuse
Running linking multiple times produces the same result. There is no way to create duplicate links.

## Testing Scenarios

| Scenario | Expected Result |
|----------|----------------|
| Guest purchases, then registers with same email | Purchases linked on email verification |
| Guest purchases multiple products | All products linked |
| User already owns product via account | Guest entitlement skipped (no duplicate) |
| Refunded guest purchase | Linked but remains refunded |
| Repeated linking | No duplicates (idempotent) |
| No guest purchases | No-op |
| Logged-in purchase | `user_id` set immediately |
| Guest checkout still works | Unchanged |
| Existing download tokens | Remain valid |

## Database Schema

### Migration 012

```sql
CREATE TABLE IF NOT EXISTS purchase_linking_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  purchases_linked INTEGER NOT NULL DEFAULT 0,
  entitlements_linked INTEGER NOT NULL DEFAULT 0,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Future Compatibility

- **New auth providers (OAuth)**: Linking triggers on email verification, which works regardless of auth provider
- **Admin manual linking**: The `linkPurchasesToUserByEmail` function can be exposed via admin API
- **Purchase merging**: If a user has multiple accounts with different emails, admin can merge manually
- **Bulk linking**: The `linkPurchasesToUser` function can be run for all users during data migration
