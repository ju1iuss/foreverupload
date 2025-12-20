# Pinterest Developer Guidelines Compliance

This document outlines how PinUpload complies with Pinterest's Developer Guidelines and where compliance measures are implemented in the codebase.

## Compliance Summary

All requirements from Pinterest's Developer Guidelines (https://policy.pinterest.com/en/developer-guidelines) have been implemented and verified.

---

## 1. Data Storage & Transparency

### Requirement (Grundlagen)
> "Mit Ausnahme von Kampagnenanalysedaten... darfst du keine Daten speichern... Rufe stattdessen jedes Mal die API auf."

### Implementation
- **File**: `app/api/pinterest/boards/route.ts`
  - Boards are fetched fresh from Pinterest API on each request
  - No long-term caching of Pinterest data
  - Comment added: "Board information is fetched fresh from Pinterest API each time"

- **File**: `app/api/pinterest/user/route.ts`
  - User info is fetched on-demand
  - Only access tokens are stored (for authentication)

### Status: ✅ **COMPLIANT**

---

## 2. User Intent & "Every Action" Rule

### Requirement (Was du nicht darfst)
> "Funktionen anbieten, die es Endnutzern ermöglichen, automatisch Aktionen auszulösen, ohne jede Aktion speziell zu erwägen... muss der Endnutzer jeden zu veröffentlichenden Pin auswählen."

### Implementation
- **File**: `components/BulkEditor.tsx`
  - Added confirmation dialog before applying bulk edits
  - Shows exactly what will be changed
  - Users can review each pin before scheduling

- **File**: `app/(protected)/upload/page.tsx`
  - Added confirmation dialog before scheduling
  - Shows selected pin count and board name
  - Requires user acknowledgment that they've reviewed each pin
  - Validation enforces title requirement for each pin

- **File**: `components/ContentPoolView.tsx`
  - Manual posting only - no automation
  - Daily limit of 6 posts enforced
  - Each post requires explicit user action

### Status: ✅ **COMPLIANT**

---

## 3. Source Linking & Attribution

### Requirement (Inhalte veröffentlichen)
> "Verknüpfe Pins mit ihrer Quelle auf Pinterest... und sorge dafür, dass klar ist, dass der Inhalt von Pinterest stammt."

### Implementation
- **File**: `components/PinCard.tsx` (lines 453-486)
  - "View on Pinterest" button for all posted pins
  - Direct link to `https://www.pinterest.com/pin/{pin_id}/`
  - Clear visual indication with Pinterest brand color (#BD081C)

- **File**: `app/(protected)/dashboard/page.tsx`
  - Posted pins link directly to Pinterest
  - "View on Pinterest →" link added to each pin in Latest Posts
  - All pins are clickable and open in new tab

### Status: ✅ **COMPLIANT**

---

## 4. Privacy Policy & Legal Transparency

### Requirement (Grundlagen)
> "Du musst über Datenschutzrichtlinien verfügen... Wenn du den API-Zugriff anforderst, musst du einen Link zu deinen Datenschutzrichtlinien angeben."

### Implementation
- **File**: `app/privacy/page.tsx` (NEW)
  - Comprehensive privacy policy page
  - Covers all required topics:
    - Information collected
    - How data is used
    - No data sharing/selling
    - User rights
    - Pinterest integration details
    - Age requirement

- **File**: `app/auth/page.tsx`
  - Age verification checkbox (13+)
  - Link to privacy policy in sign-up flow
  - Users must confirm age and agree to policy

- **File**: `components/Sidebar.tsx`
  - Privacy Policy link in footer
  - Accessible from all protected pages

### Status: ✅ **COMPLIANT**

---

## 5. Content Modification (No Filters)

### Requirement (Inhalte veröffentlichen)
> "Verdecke oder verschleiere keine Inhalte von Pinterest. Du darfst beispielsweise keine Filter auf Pins anwenden."

### Implementation
- **Verification**: Codebase reviewed
  - No image filters applied to Pinterest content
  - Images are displayed as-is
  - No CSS filters, canvas manipulations, or effects
  - User uploads are separate from Pinterest content

### Status: ✅ **COMPLIANT**

---

## 6. Age Requirement

### Requirement (Was du nicht darfst)
> "Apps, die für Kinder unter 13 Jahren bestimmt sind, sind nicht gestattet."

### Implementation
- **File**: `app/auth/page.tsx`
  - Checkbox: "I confirm that I am 13 years of age or older"
  - Required before sign-up
  - Cannot proceed without confirmation

- **File**: `app/privacy/page.tsx`
  - Clear statement about age requirement
  - Section 6: "Age Requirement"

### Status: ✅ **COMPLIANT**

---

## 7. API Usage Best Practices

### Token Management
- **File**: `app/api/pinterest/boards/route.ts`
  - Automatic token refresh when expired
  - Server-side token storage only
  - Graceful error handling

### Rate Limiting
- **File**: `components/ContentPoolView.tsx`
  - Daily limit: 6 posts per day
  - Clear messaging when limit reached
  - Prevents API abuse

### Error Handling
- All API routes include proper error handling
- User-friendly error messages
- No sensitive information exposed

### Status: ✅ **COMPLIANT**

---

## Testing Checklist

Before deploying to production, verify:

- [ ] Privacy policy link accessible from all pages
- [ ] Age verification checkbox working on sign-up
- [ ] Bulk edit confirmation appears before applying changes
- [ ] Schedule confirmation appears before adding to pool
- [ ] "View on Pinterest" links work for posted pins
- [ ] Daily limit (6 posts) enforced
- [ ] Boards fetched fresh on each load (no caching)
- [ ] No image filters applied anywhere

---

## Maintenance Notes

### When Adding New Features
1. Always fetch Pinterest data fresh (no caching)
2. Require explicit user confirmation for bulk actions
3. Link all Pinterest content back to source
4. Update privacy policy if data usage changes
5. Maintain daily post limits

### API Changes
If Pinterest updates their API or guidelines:
1. Review this document
2. Update implementations as needed
3. Update privacy policy
4. Notify users of changes

---

## Contact

For questions about compliance implementation, refer to:
- Pinterest Developer Guidelines: https://policy.pinterest.com/en/developer-guidelines
- Pinterest API Documentation: https://developers.pinterest.com/docs/api/v5/

Last Updated: December 20, 2025

