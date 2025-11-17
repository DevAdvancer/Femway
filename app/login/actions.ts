'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginAction(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate inputs
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // Attempt to sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    console.error('Login error:', authError)
    return { error: 'Invalid email or password' }
  }

  if (!authData.user) {
    return { error: 'Authentication failed' }
  }

  // Get user role from database
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', authData.user.id)
    .single()

  if (roleError || !roleData) {
    console.error('Role fetch error:', roleError)
    return { error: 'Unable to determine user role' }
  }

  // Revalidate the path
  revalidatePath('/', 'layout')

  // Redirect based on role
  switch (roleData.role) {
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
