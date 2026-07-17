import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface FilterChip {
  label: string;
  value: string;
}

interface JobFiltersProps {
  filters: FilterChip[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

export default function JobFilters({ filters, selected, onSelect }: JobFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity
        style={[styles.chip, !selected && styles.chipActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.chipText, !selected && styles.chipTextActive]}>All</Text>
      </TouchableOpacity>
      {filters.map((f) => (
        <TouchableOpacity
          key={f.value}
          style={[styles.chip, selected === f.value && styles.chipActive]}
          onPress={() => onSelect(selected === f.value ? null : f.value)}
        >
          <Text
            style={[
              styles.chipText,
              selected === f.value && styles.chipTextActive,
            ]}
          >
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 0,
  },
  chipActive: {
    backgroundColor: '#2563eb',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#ffffff',
  },
});
