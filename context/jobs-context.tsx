import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type JobStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected';

const STATUS_ORDER: JobStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected'];
const JOBS_STORAGE_KEY = 'job-tracker-jobs-v1';

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
  addJob: (job: AddJobInput) => void;
  updateJob: (id: string, updates: UpdateJobInput) => void;
  deleteJob: (id: string) => void;
  getJobById: (id: string) => Job | undefined;
};

const initialJobs: Job[] = [
  {
    id: '1',
    company: 'Google',
    role: 'Software Engineer',
    status: 'Interview',
    appliedDate: '2026-05-01',
    notes: '',
  },
  {
    id: '2',
    company: 'Stripe',
    role: 'Frontend Developer',
    status: 'Applied',
    appliedDate: '2026-04-28',
    notes: '',
  },
  {
    id: '3',
    company: 'Notion',
    role: 'Product Engineer',
    status: 'Offer',
    appliedDate: '2026-04-20',
    notes: '',
  },
  {
    id: '4',
    company: 'Airbnb',
    role: 'Mobile Developer',
    status: 'Rejected',
    appliedDate: '2026-04-14',
    notes: '',
  },
];

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

export function JobsProvider({ children }: { children: React.ReactNode }) {
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

    const loadJobs = async () => {
      try {
        console.log(
          `[JobsProvider:${providerIdRef.current}] hydration start key=${JOBS_STORAGE_KEY}`
        );
        const storedJobs = await AsyncStorage.getItem(JOBS_STORAGE_KEY);
        let hydratedJobs = sortLatestJobs(initialJobs);
        let hydrationSource: 'defaults' | 'storage' = 'defaults';

        if (storedJobs) {
          hydrationSource = 'storage';
          const parsedJobs: unknown = JSON.parse(storedJobs);
          if (Array.isArray(parsedJobs)) {
            const normalizedJobs = parsedJobs
              .map(normalizeStoredJob)
              .filter((job): job is Job => job !== null);
            hydratedJobs = sortLatestJobs(normalizedJobs);
          }
        }

        if (mounted) {
          console.log(
            `[JobsProvider:${providerIdRef.current}] hydration success source=${hydrationSource} loaded_count=${hydratedJobs.length}`
          );
          setJobs(hydratedJobs);
        }
      } catch (error) {
        console.log(
          `[JobsProvider:${providerIdRef.current}] hydration failed, fallback defaults count=${initialJobs.length}`,
          error
        );
        if (mounted) {
          setJobs(sortLatestJobs(initialJobs));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadJobs();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const persistJobs = async () => {
      try {
        console.log(
          `[JobsProvider:${providerIdRef.current}] persist start key=${JOBS_STORAGE_KEY} count=${jobs.length}`
        );
        await AsyncStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
        console.log(
          `[JobsProvider:${providerIdRef.current}] persist success key=${JOBS_STORAGE_KEY} count=${jobs.length}`
        );
      } catch (error) {
        console.log(`[JobsProvider:${providerIdRef.current}] persist failed`, error);
      }
    };

    persistJobs();
  }, [jobs, isLoading]);

  const addJob = (job: AddJobInput) => {
    console.log(
      `[JobsProvider:${providerIdRef.current}] addJob company=${job.company} role=${job.role}`
    );
    setJobs((currentJobs) => sortLatestJobs([{ id: Date.now().toString(), ...job }, ...currentJobs]));
  };

  const updateJob = (id: string, updates: UpdateJobInput) => {
    console.log(`[JobsProvider:${providerIdRef.current}] updateJob id=${id}`);
    setJobs((currentJobs) =>
      sortLatestJobs(currentJobs.map((job) => (job.id === id ? { ...job, ...updates } : job)))
    );
  };

  const deleteJob = (id: string) => {
    console.log(`[JobsProvider:${providerIdRef.current}] deleteJob id=${id}`);
    setJobs((currentJobs) => currentJobs.filter((job) => job.id !== id));
  };

  const getJobById = (id: string) => jobs.find((job) => job.id === id);

  const value = useMemo(
    () => ({ jobs, isLoading, addJob, updateJob, deleteJob, getJobById }),
    [jobs, isLoading]
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
