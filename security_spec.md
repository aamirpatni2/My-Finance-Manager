# Security Specification & Verification Spec

## 1. Data Invariants
1. **User Identity Boundary**: Every document stored under `/users/{userId}` and `/users/{userId}/financialData/{docId}` belongs exclusively to `{userId}`.
2. **Strict Authorization**: `request.auth.uid == userId`. No user may read, list, create, update, or delete another user's profile or financial state.
3. **No Blanket Access**: Default deny catch-all `match /{document=**} { allow read, write: if false; }` enforces zero-trust architecture.
4. **Data Validation**:
   - `isValidId(id)` guards against path poisoning (alphanumeric, hyphen, underscore, size <= 128).
   - `uid` / `userId` in payloads must match `request.auth.uid`.
   - String limits and object structure constraints must be strictly adhered to.
   - PII (`email`) is strictly isolated to the authenticated user owning the document.

## 2. Dirty Dozen Payloads (Rejection Matrix)
1. **Spoofed User UID**: Unauthenticated write to `/users/victim_123` with arbitrary payload. (Expected: `PERMISSION_DENIED`)
2. **Cross-User Hijack**: User A writes to `/users/user_B/financialData/main` with `userId: "user_B"`. (Expected: `PERMISSION_DENIED`)
3. **ID Poisoning Attack**: User attempts writing to `/users/$$$invalid%%%/financialData/main`. (Expected: `PERMISSION_DENIED`)
4. **Oversized String Injection**: User attempts to store a 2MB payload into `notes` or `displayName`. (Expected: `PERMISSION_DENIED`)
5. **Blanket List Read**: User executes an unbounded query across all users or all financial data. (Expected: `PERMISSION_DENIED`)
6. **Owner Swap on Update**: User attempts to update `userId` to transfer ownership. (Expected: `PERMISSION_DENIED`)
7. **Unverified Token Forgery**: User creates document with forged unverified credentials. (Expected: `PERMISSION_DENIED`)
8. **Shadow Field Injection**: User attempts to insert unwhitelisted administrative privilege keys. (Expected: `PERMISSION_DENIED`)
9. **Malformed Financial Payload**: Missing required `userId` or `updatedAt` on financial document. (Expected: `PERMISSION_DENIED`)
10. **Unauthenticated Read**: Anonymous/logged-out client queries `/users/{userId}`. (Expected: `PERMISSION_DENIED`)
11. **Orphaned Subcollection Injection**: Writing directly to non-existent root collections. (Expected: `PERMISSION_DENIED`)
12. **Null Resource Mutation**: Malicious update bypassing existence checks. (Expected: `PERMISSION_DENIED`)

## 3. Test Runner Invariant
All test vectors ensure that any request not matching the authenticated `request.auth.uid == userId` produces an immediate `PERMISSION_DENIED` rejection.
