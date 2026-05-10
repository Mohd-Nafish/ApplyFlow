import React from 'react';
import { useRouter } from 'expo-router';
import { JobForm } from '@/components/job-form';
import { useJobs } from '@/context/jobs-context';

export default function AddJobScreen() {
  const router = useRouter();
  const { addJob } = useJobs();

  return (
    <JobForm
      title="Add Job"
      saveLabel="Save Job"
      initialValues={{
        company: '',
        role: '',
        status: 'Applied',
        appliedDate: new Date().toISOString().slice(0, 10),
        notes: '',
      }}
      onBack={() => router.back()}
      onSave={(values) => {
        addJob(values);
        router.back();
      }}
    />
  );
}
