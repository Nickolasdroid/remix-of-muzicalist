# Homepage artist-category statistics

## Goal
Replace only the contents of the existing homepage statistics bar with four live artist-category counts: Soliști, Instrumentiști, DJ, and Formații.

## Changes
- Extend the existing authoritative public statistics query to return counts for each existing artist specialization, counting only active artist profiles.
- Update the shared statistics hook to expose those four values and retain its existing refresh behavior.
- Update only the items rendered inside the existing statistics bar, preserving its container, dimensions, colors, typography, separators, alignment, and responsive styling.
- Use the existing Romanian localization system for the exact requested labels; no hardcoded counts.

## Validation
- Confirm the values match active profile data grouped by the existing specialization field.
- Verify exactly four evenly distributed statistics at desktop and mobile widths, without overflow.
- Check the preview build and runtime for errors.

## Technical details
The existing category enum remains the source of category identity. The existing public statistics function will remain the single database request, avoiding client-side fetching or counting of artist profiles.
