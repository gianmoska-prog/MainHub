# Patch 3B — Gallery Visual Polish

Frontend-only refinement built from Patch 3A.

## Scope

- Polished the desktop Gallery accordion proportions.
- Widened the closed slit state so the Gallery no longer appears overly compressed.
- Added modest vertical breathing room between the Gallery plates and the fixed header/footer.
- Improved active plate framing, borders, shadowing, and caption legibility.
- Centred image object-position for more balanced slit excerpts.
- Restored a considered mobile Gallery layout using the existing gallery panels instead of hiding the route under 640px.
- Preserved the existing lazy/decode image preparation logic.

## Not changed

- Home section logic and Patch 3A treatment.
- Divisions section.
- Dashboard / Record logic.
- Record attachments and viewer.
- Supabase Auth, SQL, RLS, storage buckets, and policies.
- Desk database tables.

## Validation notes

Recommended manual checks after deployment:

1. Open Gallery from the side navigation on desktop.
2. Confirm the closed state is wider and more balanced.
3. Click each gallery plate and verify the active image, caption, and neighbouring slits behave correctly.
4. Resize the browser and confirm proportions remain stable.
5. Test Gallery under 640px and confirm images are visible in a vertical mobile layout.
6. Confirm Home, Divisions, and Dashboard still route normally.
