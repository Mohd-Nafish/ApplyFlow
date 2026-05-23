import { JobStatus } from '@/context/jobs-context';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export type JobFormValues = {
  company: string;
  role: string;
  status: JobStatus;
  appliedDate: string;
  notes: string;
};

const STATUSES: JobStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected'];

type JobFormProps = {
  title: string;
  saveLabel: string;
  initialValues: JobFormValues;
  onBack: () => void;
  onSave: (values: JobFormValues) => void | Promise<void>;
};

export function JobForm({ title, saveLabel, initialValues, onBack, onSave }: JobFormProps) {
  const [company, setCompany] = useState(initialValues.company);
  const [role, setRole] = useState(initialValues.role);
  const [status, setStatus] = useState<JobStatus>(initialValues.status);
  const [appliedDate, setAppliedDate] = useState(initialValues.appliedDate);
  const [notes, setNotes] = useState(initialValues.notes);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(
    () =>
      company.trim().length > 0 &&
      role.trim().length > 0 &&
      appliedDate.trim().length > 0 &&
      !isSaving,
    [appliedDate, company, isSaving, role]
  );

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        company: company.trim(),
        role: role.trim(),
        status,
        appliedDate: appliedDate.trim(),
        notes: notes.trim(),
      });
    } catch (error) {
      Alert.alert('Could not save job', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" onPress={onBack}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              value={company}
              onChangeText={setCompany}
              placeholder="Enter company name"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Role</Text>
            <TextInput
              value={role}
              onChangeText={setRole}
              placeholder="Enter role"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Status</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setStatusModalVisible(true)}>
              <Text style={styles.dropdownText}>{status}</Text>
              <Text style={styles.dropdownChevron}>v</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Applied Date</Text>
            <TextInput
              value={appliedDate}
              onChangeText={setAppliedDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes"
              placeholderTextColor="#9CA3AF"
              style={[styles.input, styles.notesInput]}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={!canSave}
            onPress={handleSave}
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}>
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>{saveLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal animationType="fade" transparent visible={statusModalVisible} onRequestClose={() => setStatusModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setStatusModalVisible(false)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Status</Text>
            {STATUSES.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setStatus(item);
                  setStatusModalVisible(false);
                }}
                style={styles.modalOption}>
                <Text style={[styles.modalOptionText, status === item && styles.modalOptionTextSelected]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  keyboardAvoiding: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backText: { fontSize: 16, color: '#2563EB', fontWeight: '600' },
  title: { fontSize: 22, color: '#111827', fontWeight: '700' },
  headerSpacer: { width: 40 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 14 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14, color: '#374151', fontWeight: '600' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { fontSize: 15, color: '#111827' },
  dropdownChevron: { fontSize: 14, color: '#6B7280', fontWeight: '700' },
  notesInput: { minHeight: 120 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F7F8FA',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#93C5FD' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalOption: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalOptionText: { fontSize: 15, color: '#374151' },
  modalOptionTextSelected: { color: '#2563EB', fontWeight: '700' },
});
