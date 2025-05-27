import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // Get the access token from the request (from cookies or header)
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies['sb-access-token'];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  // Get the user from the token
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return res.status(401).json({ error: 'Invalid user session' });

  // Delete the user using the admin client
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ success: true });
} 