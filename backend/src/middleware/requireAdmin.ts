// backend/src/middleware/requireAdmin.ts
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../db/supabase';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header', code: 'UNAUTHORIZED' });
    return;
  }

  const token = authHeader.slice(7);

  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' });
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', data.user.id)
    .single();

  if (!profile?.is_admin) {
    res.status(403).json({ error: 'Admin access required', code: 'FORBIDDEN' });
    return;
  }

  req.user = { id: data.user.id, email: data.user.email ?? '' };
  next();
}
