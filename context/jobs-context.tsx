import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { createJob, fetchJobs, removeJob, saveJob } from '@/lib/jobs-service';

export type JobStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected';

const STATUS_ORDER: JobStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected'];
const LEGACY_JOBS_STORAGE_KEY = 'job-tracker-jobs-v1';
const LEGACY_MIGRATION_KEY_PREFIX = 'job-tracker-jobs-v1-migrated';

export type Job = {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  appliedDate: string;
  notes: string;
};

type AddJobInput = Omit<Job, 'id'>;
type UpdateJobInput = Omit<Job, 'id'>;

type JobsContextValue = {
  jobs: Job[];
  isLoading: boolean;
  addJob: (job: AddJobInput) => Promise<void>;
  updateJob: (id: string, updates: UpdateJobInput) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  getJobById: (id: string) => Job | undefined;
};

const JobsContext = createContext<JobsContextValue | undefined>(undefined);

function normalizeDateForSort(date: string) {
  const time = Date.parse(date);
  return Number.isNaN(time) ? 0 : time;
}

function sortLatestJobs(jobs: Job[]) {
  return [...jobs].sort((a, b) => normalizeDateForSort(b.appliedDate) - normalizeDateForSort(a.appliedDate));
}

function sanitizeStatus(status: string): JobStatus {
  return STATUS_ORDER.includes(status as JobStatus) ? (status as JobStatus) : 'Applied';
}

function normalizeStoredJob(storedJob: unknown): Job | null {
  if (typeof storedJob !== 'object' || storedJob === null) {
    return null;
  }

  const candidate = storedJob as Partial<Job>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.company !== 'string' ||
    typeof candidate.role !== 'string' ||
    typeof candidate.status !== 'string'
  ) {
    return null;
  }

  const appliedDate =
    typeof candidate.appliedDate === 'string' && candidate.appliedDate.trim().length > 0
      ? candidate.appliedDate
      : new Date().toISOString().slice(0, 10);

  return {
    id: candidate.id,
    company: candidate.company,
    role: candidate.role,
    status: sanitizeStatus(candidate.status),
    appliedDate,
    notes: typeof candidate.notes === 'string' ? candidate.notes : '',
  };
}

async function loadLegacyJobs() {
  const storedJobs = await AsyncStorage.getItem(LEGACY_JOBS_STORAGE_KEY);
  if (!storedJobs) {
    return [];
  }

  const parsedJobs: unknown = JSON.parse(storedJobs);
  if (!Array.isArray(parsedJobs)) {
    return [];
  }

  return parsedJobs.map(normalizeStoredJob).filter((job): job is Job => job !== null);
}

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const providerIdRef = useRef(Math.random().toString(36).slice(2, 8));
  const mountTimeRef = useRef(Date.now());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log(
      `[JobsProvider:${providerIdRef.current}] mounted at ${new Date(mountTimeRef.current).toISOString()}`
    );
    return () => {
      console.log(
        `[JobsProvider:${providerIdRef.current}] unmounted after ${Date.now() - mountTimeRef.current}ms`
      );
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadJobsFromSupabase = async () => {
      if (!user) {
        setJobs([]);
        setIsLoading(false);
        return;
      }

      try {
        console.log(`[JobsProvider:${providerIdRef.current}] fetch start user=${user.id}`);
        let nextJobs = await fetchJobs();
        const migrationKey = `${LEGACY_MIGRATION_KEY_PREFIX}:${user.id}`;
        const hasMigratedLegacyJobs = await AsyncStorage.getItem(migrationKey);

        if (nextJobs.length === 0 && !hasMigratedLegacyJobs) {
          const legacyJobs = await loadLegacyJobs();
          if (legacyJobs.length > 0) {
            console.log(
              `[JobsProvider:${providerIdRef.current}] legacy migration start count=${legacyJobs.length}`
            );
            nextJobs = await Promise.all(
              legacyJobs.map(({ id: _id, ...legacyJob }) => createJob(user.id, legacyJob))
            );
            console.log(
              `[JobsProvider:${providerIdRef.current}] legacy migration success count=${nextJobs.length}`
            );
          }
          await AsyncStorage.setItem(migrationKey, 'true');
        }

        if (mounted) {
          console.log(
            `[JobsProvider:${providerIdRef.current}] fetch success loaded_count=${nextJobs.length}`
          );
          setJobs(sortLatestJobs(nextJobs));
        }
      } catch (error) {
        console.log(`[JobsProvider:${providerIdRef.current}] fetch failed`, error);
        if (mounted) {
          Alert.alert('Could not load jobs', error instanceof Error ? error.message : 'Please try again.');
          setJobs([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    loadJobsFromSupabase();

    return () => {
      mounted = false;
    };
  }, [user]);

  const addJob = useCallback(async (job: AddJobInput) => {
    if (!user) {
      throw new Error('You must be signed in to add a job.');
    }

    console.log(
      `[JobsProvider:${providerIdRef.current}] addJob company=${job.company} role=${job.role}`
    );
    const createdJob = await createJob(user.id, job);
    setJobs((currentJobs) => sortLatestJobs([createdJob, ...currentJobs]));
  }, [user]);

  const updateJob = useCallback(async (id: string, updates: UpdateJobInput) => {
    console.log(`[JobsProvider:${providerIdRef.current}] updateJob id=${id}`);
    const updatedJob = await saveJob(id, updates);
    setJobs((currentJobs) =>
      sortLatestJobs(currentJobs.map((job) => (job.id === id ? updatedJob : job)))
    );
  }, []);

  const deleteJob = useCallback(async (id: string) => {
    console.log(`[JobsProvider:${providerIdRef.current}] deleteJob id=${id}`);
    await removeJob(id);
    setJobs((currentJobs) => currentJobs.filter((job) => job.id !== id));
  }, []);

  const getJobById = useCallback((id: string) => jobs.find((job) => job.id === id), [jobs]);

  const value = useMemo(
    () => ({ jobs, isLoading, addJob, updateJob, deleteJob, getJobById }),
    [addJob, deleteJob, getJobById, jobs, isLoading, updateJob]
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error('useJobs must be used inside JobsProvider');
  }
  return context;
}
