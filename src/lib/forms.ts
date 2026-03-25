import { createClient } from '@/lib/supabase/client'

export type QuestionType = 'short_text' | 'long_text' | 'number' | 'scale' | 'yes_no' | 'progress_photo' | 'metric'

export type Question = {
  id: string
  label: string
  type: QuestionType
  required: boolean
}

export type FormType = 'check_in' | 'questionnaire'
export type ScheduleType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'not_set'

export type CheckInForm = {
  id: string
  coach_id: string
  name: string
  form_type: FormType
  schedule_type: ScheduleType
  schedule_day: string | null
  questions: Question[]
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  submission_count?: number
}

export type FormSubmission = {
  id: string
  form_id: string
  client_id: string
  coach_id: string
  responses: Record<string, string | number | boolean>
  status: 'pending' | 'reviewed'
  coach_notes: string | null
  submitted_at: string
  reviewed_at: string | null
  // joined
  form?: { name: string }
  client?: { full_name: string; email: string; avatar_url: string | null }
}

export type CreateFormInput = {
  name: string
  form_type: FormType
  schedule_type?: ScheduleType
  schedule_day?: string | null
  questions?: Question[]
}

export type UpdateFormInput = Partial<CreateFormInput> & { is_active?: boolean }

// ─── Forms ────────────────────────────────────────────────────────────────────

export async function getForms(formType: FormType): Promise<CheckInForm[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('check_in_forms')
    .select('*')
    .eq('coach_id', user.id)
    .eq('form_type', formType)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getForm(id: string): Promise<CheckInForm> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('check_in_forms')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createForm(input: CreateFormInput): Promise<CheckInForm> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('check_in_forms')
    .insert({
      coach_id: user.id,
      name: input.name,
      form_type: input.form_type,
      schedule_type: input.schedule_type ?? 'not_set',
      schedule_day: input.schedule_day ?? null,
      questions: input.questions ?? [],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateForm(id: string, input: UpdateFormInput): Promise<CheckInForm> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('check_in_forms')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.form_type !== undefined && { form_type: input.form_type }),
      ...(input.schedule_type !== undefined && { schedule_type: input.schedule_type }),
      ...(input.schedule_day !== undefined && { schedule_day: input.schedule_day }),
      ...(input.questions !== undefined && { questions: input.questions }),
      ...(input.is_active !== undefined && { is_active: input.is_active }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteForm(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('check_in_forms')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export async function getSubmissions(formId?: string): Promise<FormSubmission[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let query = supabase
    .from('form_submissions')
    .select(`
      *,
      form:check_in_forms(name),
      client:profiles!form_submissions_client_id_fkey(full_name, email, avatar_url)
    `)
    .eq('coach_id', user.id)
    .order('submitted_at', { ascending: false })

  if (formId) query = query.eq('form_id', formId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function markSubmissionReviewed(id: string, notes?: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('form_submissions')
    .update({
      status: 'reviewed',
      coach_notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}
