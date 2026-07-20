-- Update only the CTA button text in the active version of the legacy artist campaign template.
-- No template ID, structure, design, backend logic, or CTA URL is changed.
UPDATE email_template_versions
SET html_content = REPLACE(html_content, 'ACTIVEAZĂ-ȚI NOUL PROFIL DE ARTIST', 'CREEAZĂ-ȚI NOUL PROFIL DE ARTIST')
WHERE id = 'ebaf6689-a718-4d60-adaa-b630e98a6e12';