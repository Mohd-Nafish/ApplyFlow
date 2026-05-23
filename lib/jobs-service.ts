import type { Job } from '@/context/jobs-context';
import { supabase } from '@/lib/supabase';

type JobRow = {
  id: string;
  company: string;
  role: string;
  status: Job['status'];
  applied_date: string;
  notes: string | null;
};

type JobInput = Omit<Job, 'id'>;

function toJob(row: JobRow): Job {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    status: row.status,
    appliedDate: row.applied_date,
    notes: row.notes ?? '',
  };
}

export async function fetchJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, company, role, status, applied_date, notes')
    .order('applied_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(toJob);
}

export async function createJob(userId: string, job: JobInput) {
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      user_id: userId,
      company: job.company,
      role: job.role,
      status: job.status,
      applied_date: job.appliedDate,
      notes: job.notes,
    })
    .select('id, company, role, status, applied_date, notes')
    .single();

  if (error) {
    throw error;
  }

  return toJob(data);
}

export async function saveJob(id: string, job: JobInput) {
  const { data, error } = await supabase
    .from('jobs')
    .update({
      company: job.company,
      role: job.role,
      status: job.status,
      applied_date: job.appliedDate,
      notes: job.notes,
    })
    .eq('id', id)
    .select('id, company, role, status, applied_date, notes')
    .single();

  if (error) {
    throw error;
  }

  return toJob(data);
}

export async function removeJob(id: string) {
  const { error } = await supabase.from('jobs').delete().eq('id', id);

  if (error) {
    throw error;
  }
}
