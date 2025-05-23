-- Add indexes for profiles table
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_profiles_updated_at ON profiles(updated_at);
CREATE INDEX idx_profiles_full_name ON profiles(full_name);

-- Verify the indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename = 'profiles'
ORDER BY
    indexname; 