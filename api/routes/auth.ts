/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// Validation schema for premium registration
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['premium_advertiser', 'premium_publisher', 'media_agency']),
  business_name: z.string().min(1),
  trade_license: z.string().min(1),
  media_license: z.string().optional(),
});

/**
 * Premium User Registration
 * POST /api/auth/register-premium
 */
router.post('/register-premium', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validate request body
    const validatedData = registerSchema.parse(req.body);

    // 2. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirm for now, or handle verification flow
      user_metadata: {
        role: validatedData.role,
        business_name: validatedData.business_name,
      },
    });

    if (authError) {
      res.status(400).json({
        success: false,
        error: authError.message,
      });
      return;
    }

    if (!authData.user) {
      res.status(500).json({
        success: false,
        error: 'Failed to create user',
      });
      return;
    }

    // 3. Insert into premium_users table
    const { error: profileError } = await supabaseAdmin
      .from('premium_users')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        role: validatedData.role,
        business_name: validatedData.business_name,
        trade_license: validatedData.trade_license,
        media_license: validatedData.media_license,
        verification_status: 'pending',
      });

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      res.status(500).json({
        success: false,
        error: 'Failed to create user profile: ' + profileError.message,
      });
      return;
    }

    // 4. Return success
    res.status(201).json({
      success: true,
      data: {
        user_id: authData.user.id,
        role: validatedData.role,
        verification_status: 'pending',
        message: 'User registered successfully. Please wait for license verification.',
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      });
      return;
    }
    
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  // Login is usually handled by the frontend using Supabase Client,
  // but if we need a backend proxy login:
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
         res.status(401).json({ success: false, error: error.message });
         return;
    }

    res.json({ success: true, data });

  } catch (error) {
     res.status(500).json({ success: false, error: 'Login failed' });
  }
});

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
   // Handled by client usually
   res.json({ success: true, message: 'Logged out' });
});

export default router;
