-- Add RLS policy for inserting securities
CREATE POLICY "Authenticated users can insert securities"
    ON securities FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Verify the policy was created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'securities'
    AND policyname = 'Authenticated users can insert securities'; 