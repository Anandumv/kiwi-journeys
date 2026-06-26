-- Deactivate Arthur's Pass TranzAlpine tour (no longer offered)
UPDATE "Tour" SET "isActive" = false WHERE slug = 'arthurs-pass-tranzalpine';
