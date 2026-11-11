-- Remove duplicate member rows, keeping the oldest row per (organization_id, user_id)
DELETE FROM member
WHERE ctid NOT IN (
  SELECT MIN(ctid)
  FROM member
  GROUP BY organization_id, user_id
);

-- Add unique constraint to prevent duplicate memberships going forward
ALTER TABLE member
ADD CONSTRAINT member_organization_id_user_id_unique
UNIQUE (organization_id, user_id);
