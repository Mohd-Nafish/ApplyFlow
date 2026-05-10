import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { JobStatus } from '@/context/jobs-context';

const STATUS_COLORS: Record<JobStatus, string> = {
  Applied: '#8B5CF6',
  Interview: '#3B82F6',
  Offer: '#0E9F6E',
  Rejected: '#EF4444',
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] }]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
