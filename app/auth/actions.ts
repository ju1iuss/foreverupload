'use server';

import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm?next=/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Please check your email to confirm your account' };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    // Check for specific error cases
    const errorMessage = error.message.toLowerCase();
    
    // Email not confirmed
    if (errorMessage.includes('email') && (errorMessage.includes('confirm') || errorMessage.includes('verify'))) {
      return { 
        error: 'Please verify your email before signing in. Check your inbox for the confirmation link.',
        shouldSignUp: false 
      };
    }
    
    // Invalid credentials - could be wrong password or user doesn't exist
    // We'll suggest signing up as a helpful option
    if (errorMessage.includes('invalid') || errorMessage.includes('credentials')) {
      return { 
        error: 'Invalid email or password. If you don\'t have an account, please sign up instead.',
        shouldSignUp: true 
      };
    }
    
    return { 
      error: error.message,
      shouldSignUp: false 
    };
  }

  redirect('/dashboard');
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm?next=/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

