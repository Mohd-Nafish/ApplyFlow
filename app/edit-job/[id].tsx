import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { JobForm } from '@/components/job-form';
import { useJobs } from '@/context/jobs-context';

export default function EditJobScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { getJobById, updateJob } = useJobs();

  const job = getJobById(params.id ?? '');

  if (!job) {
    return (
      <View style={styles.missingContainer}>
        <Text style={styles.missingTitle}>Job not found</Text>
        <Text style={styles.missingText}>This job may have been deleted.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.missingButton}>
          <Text style={styles.missingButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <JobForm
      title="Edit Job"
      saveLabel="Update Job"
      initialValues={{
        company: job.company,
        role: job.role,
        status: job.status,
        appliedDate: job.appliedDate,
        notes: job.notes,
      }}
      onBack={() => router.back()}
      onSave={(values) => {
        updateJob(job.id, values);
        router.back();
      }}
    />
  );
}

const styles = StyleSheet.create({
  missingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8FA',
    padding: 24,
  },
  missingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  missingText: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
  },
  missingButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  missingButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
