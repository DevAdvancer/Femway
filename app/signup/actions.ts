'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signupAction(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'passenger' | 'driver' | 'admin'
  const adminCode = formData.get('adminCode') as string | null

  // Validate inputs
  if (!email || !password || !role) {
    return { error: 'All fields are required' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  // Validate admin code if role is admin
  if (role === 'admin') {
    if (!adminCode) {
      return { error: 'Admin code is required for admin registration' }
    }

    // Verify admin code exists and is active
    const { data: codeData, error: codeError } = await supabase
      .from('admin_codes')
      .select('id, is_active, used_by')
      .eq('code', adminCode)
      .single()

    if (codeError || !codeData) {
      return { error: 'Invalid admin code' }
    }

    if (!codeData.is_active) {
      return { error: 'This admin code has been deactivated' }
    }

    if (codeData.used_by) {
      return { error: 'This admin code has already been used' }
    }
  }

  // Create user account with auto-confirm for development
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role, // Store role in user metadata as backup
      },
    },
  })

  if (authError) {
    console.error('Signup error:', authError)

    if (authError.message.includes('already registered')) {
      return { error: 'Email already registered' }
    }

    return { error: authError.message || 'Failed to create account' }
  }

  if (!authData.user) {
    return { error: 'Failed to create account' }
  }

  // Wait a moment for the session to be established
  await new Promise(resolve => setTimeout(resolve, 100))

  // Create a new client to ensure we have the session
  const supabaseWithSession = await createClient()

  // Insert user role
  const { error: roleError } = await supabaseWithSession
    .from('user_roles')
    .insert({
      user_id: authData.user.id,
      role: role,
    })

  if (roleError) {
    console.error('Role insertion error:', roleError)
    console.error('Role error details:', JSON.stringify(roleError, null, 2))
    return { error: `Failed to assign user role: ${roleError.message}` }
  }

  // If admin, mark the code as used
  if (role === 'admin' && adminCode) {
    const { error: updateError } = await supabase
      .from('admin_codes')
      .update({
        used_by: authData.user.id,
        used_at: new Date().toISOString(),
        is_active: false,
      })
      .eq('code', adminCode)

    if (updateError) {
      console.error('Admin code update error:', updateError)
      // Don't fail the signup, just log the error
    }
  }

  // Revalidate the path
  revalidatePath('/', 'layout')

  // Redirect based on role
  switch (role) {
    case 'passenger':
      redirect('/passengers')
    case 'driver':
      redirect('/driver')
    case 'admin':
      redirect('/admin')
    default:
      return { error: 'Invalid user role' }
  }
}
