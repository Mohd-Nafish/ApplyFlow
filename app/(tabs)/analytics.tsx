import { JobStatus, useJobs } from '@/context/jobs-context';
import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import * as Progress from 'react-native-progress';

type StatItem = {
  label: string;
  value: number;
  color: string;
  status: JobStatus;
};

export default function AnalyticsScreen() {
  const { jobs, isLoading } = useJobs();

  const stats = useMemo(() => {
    const total = jobs.length;
    const interviews = jobs.filter((job) => job.status === 'Interview').length;
    const offers = jobs.filter((job) => job.status === 'Offer').length;
    const rejections = jobs.filter((job) => job.status === 'Rejected').length;
    const applied = jobs.filter((job) => job.status === 'Applied').length;
    return { total, interviews, offers, rejections, applied };
  }, [jobs]);

  const statItems: StatItem[] = [
    { label: 'Applied', value: stats.applied, color: '#8B5CF6', status: 'Applied' },
    { label: 'Interview', value: stats.interviews, color: '#3B82F6', status: 'Interview' },
    { label: 'Offer', value: stats.offers, color: '#0E9F6E', status: 'Offer' },
    { label: 'Rejected', value: stats.rejections, color: '#EF4444', status: 'Rejected' },
  ];

  const total = stats.total;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>See your application pipeline at a glance</Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.total}</Text>
            <Text style={styles.summaryLabel}>Total Applications</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.interviews}</Text>
            <Text style={styles.summaryLabel}>Interviews</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.offers}</Text>
            <Text style={styles.summaryLabel}>Offers</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.rejections}</Text>
            <Text style={styles.summaryLabel}>Rejections</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Status Distribution</Text>
          <Text style={styles.chartSubtitle}>
            {isLoading ? 'Loading data...' : total === 0 ? 'No data yet' : `${total} applications tracked`}
          </Text>

          {statItems.map((item) => {
            const progress = total === 0 ? 0 : item.value / total;
            return (
              <View key={item.status} style={styles.progressRow}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>{item.label}</Text>
                  <Text style={styles.progressValue}>
                    {item.value} ({Math.round(progress * 100)}%)
                  </Text>
                </View>
                <Progress.Bar
                  progress={progress}
                  color={item.color}
                  unfilledColor="#E5E7EB"
                  borderWidth={0}
                  width={null}
                  height={10}
                  borderRadius={999}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  content: {
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#6B7280',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 12,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  summaryLabel: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
  },
  chartCard: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  chartSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  progressRow: {
    marginTop: 14,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressValue: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
});
