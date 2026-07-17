import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCreateJob, useCategories, useSkills } from '@/hooks/useJobs';
import Header from '@/components/ui/Header';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Toast from '@/components/ui/Toast';

const JOB_TYPES = [
  { label: 'Digital', value: 'digital' },
  { label: 'Physical', value: 'physical' },
  { label: 'On-site', value: 'onsite' },
];

const PAYMENT_TYPES = [
  { label: 'Fixed Price', value: 'fixed' },
  { label: 'Hourly', value: 'hourly' },
  { label: 'Milestone', value: 'milestone' },
];

export default function NewJobScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createJob = useCreateJob();
  const { data: categories } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [jobType, setJobType] = useState<string>('digital');
  const [paymentType, setPaymentType] = useState<string>('fixed');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [skillIds, setSkillIds] = useState<number[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleSubmit = async () => {
    if (!title.trim()) {
      setToastMessage('Please enter a job title');
      setToastType('error');
      setToastVisible(true);
      return;
    }
    if (!description.trim()) {
      setToastMessage('Please enter a job description');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    try {
      await createJob.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        budget: budget ? Number(budget) : undefined,
        job_type: jobType as 'digital' | 'in_person',
        payment_type: paymentType as 'fixed' | 'milestone',
        category_id: categoryId ?? undefined,
        skills: skillIds.length > 0 ? skillIds : undefined,
      });
      setToastMessage('Job posted successfully!');
      setToastType('success');
      setToastVisible(true);
      setTimeout(() => router.back(), 1000);
    } catch {
      setToastMessage('Failed to post job. Please try again.');
      setToastType('error');
      setToastVisible(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Post a Job" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="Job Title"
          placeholder="e.g. Logo Design for Tech Startup"
          value={title}
          onChangeText={setTitle}
        />

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.textArea]}
            placeholder="Describe the job in detail..."
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <Input
          label="Budget (NGN)"
          placeholder="e.g. 50000"
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Job Type</Text>
          <View style={styles.chipRow}>
            {JOB_TYPES.map((jt) => (
              <TouchableOpacity
                key={jt.value}
                style={[styles.chip, jobType === jt.value && styles.chipActive]}
                onPress={() => setJobType(jt.value)}
              >
                <Text style={[styles.chipText, jobType === jt.value && styles.chipTextActive]}>
                  {jt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Payment Type</Text>
          <View style={styles.chipRow}>
            {PAYMENT_TYPES.map((pt) => (
              <TouchableOpacity
                key={pt.value}
                style={[styles.chip, paymentType === pt.value && styles.chipActive]}
                onPress={() => setPaymentType(pt.value)}
              >
                <Text style={[styles.chipText, paymentType === pt.value && styles.chipTextActive]}>
                  {pt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {categories && categories.length > 0 && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {categories.map((cat: { id: number; name: string }) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, categoryId === cat.id && styles.chipActive]}
                    onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                  >
                    <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <Input
          label="City (Optional)"
          placeholder="e.g. Lagos"
          value={city}
          onChangeText={setCity}
        />

        <Input
          label="State (Optional)"
          placeholder="e.g. Lagos"
          value={state}
          onChangeText={setState}
        />

        <Button
          title="Post Job"
          onPress={handleSubmit}
          loading={createJob.isPending}
          disabled={createJob.isPending}
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDone={() => setToastVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    minHeight: 120,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  chipActive: {
    backgroundColor: '#2563eb',
  },
  chipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#ffffff',
  },
});
