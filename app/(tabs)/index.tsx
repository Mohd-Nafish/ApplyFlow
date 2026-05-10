import { JobStatusBadge } from '@/components/job-status-badge';
import { Job, JobStatus, useJobs } from '@/context/jobs-context';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type StatusFilter = 'All' | JobStatus;

const FILTERS: StatusFilter[] = ['All', 'Applied', 'Interview', 'Offer', 'Rejected'];

export default function HomeScreen() {
  const router = useRouter();
  const { jobs, isLoading, deleteJob } = useJobs();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>('All');

  const dashboard = useMemo(
    () => ({
      total: jobs.length,
      interviews: jobs.filter((job) => job.status === 'Interview').length,
      offers: jobs.filter((job) => job.status === 'Offer').length,
      rejections: jobs.filter((job) => job.status === 'Rejected').length,
    }),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesFilter = selectedFilter === 'All' || job.status === selectedFilter;
      const matchesSearch =
        query.length === 0 ||
        job.company.toLowerCase().includes(query) ||
        job.role.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [jobs, selectedFilter, searchQuery]);

  const renderItem = ({ item }: { item: Job }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.companyText}>{item.company}</Text>
        <JobStatusBadge status={item.status} />
      </View>
      <Text style={styles.roleText}>{item.role}</Text>
      <Text style={styles.dateText}>Applied: {item.appliedDate}</Text>
      {item.notes.length > 0 ? <Text style={styles.notesText}>{item.notes}</Text> : null}
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => router.push(`/edit-job/${item.id}`)}
          style={[styles.actionButton, styles.editButton]}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => deleteJob(item.id)}
          style={[styles.actionButton, styles.deleteButton]}>
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>ApplyFlow</Text>
        <Text style={styles.subtitle}>Track your applications in one place</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{dashboard.total}</Text>
          <Text style={styles.summaryLabel}>Total Applications</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{dashboard.interviews}</Text>
          <Text style={styles.summaryLabel}>Interviews</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{dashboard.offers}</Text>
          <Text style={styles.summaryLabel}>Offers</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{dashboard.rejections}</Text>
          <Text style={styles.summaryLabel}>Rejections</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by company or role"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filtersRow}>
        {FILTERS.map((filter) => {
          const selected = selectedFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={[styles.filterChip, selected && styles.filterChipSelected]}>
              <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Loading jobs...</Text>
          <Text style={styles.emptyText}>Your applications are being prepared.</Text>
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No job applications yet</Text>
          <Text style={styles.emptyText}>Add your first application to get started.</Text>
          <TouchableOpacity onPress={() => router.push('/add-job')} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Add Job</Text>
          </TouchableOpacity>
        </View>
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No matching jobs</Text>
          <Text style={styles.emptyText}>Try a different search query or filter.</Text>
        </View>
      ) : (
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      )}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Add new job application"
        onPress={() => router.push('/add-job')}
        style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
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
    marginTop: 8,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  summaryLabel: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 14,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
  },
  filtersRow: {
    paddingHorizontal: 20,
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 12,
  },
  card: {
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
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  companyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  roleText: {
    fontSize: 15,
    color: '#374151',
  },
  dateText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  notesText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  cardActions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  editButton: {
    backgroundColor: '#DBEAFE',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  actionText: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '500',
  },
});
