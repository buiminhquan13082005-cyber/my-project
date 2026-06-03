/**
 * Reusable form components cho CineStaff mobile app.
 * Tích hợp với react-hook-form, hiển thị lỗi validation với animation.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Animated,
  TextInputProps, TouchableOpacity, ViewStyle,
  Modal, FlatList, Dimensions, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller, Control, FieldValues, Path, useFormState } from 'react-hook-form';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// FormInput - Input text có validation
// ============================================
interface FormInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<any>;
  name: string;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  error?: string;
}

/** Component TextInput bọc Controller của react-hook-form, hỗ trợ animation rung (shake) khi có lỗi validation */
export function FormInput({
  control, name, label, icon, iconColor = '#8b8fa3', error, ...inputProps
}: FormInputProps) {
  const { errors } = useFormState({ control });
  const fieldError = errors[name] as any;
  const displayError = error || (fieldError?.message as string | undefined);

  const [isFocused, setIsFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (displayError) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
  }, [displayError]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur: rhfOnBlur, value }, fieldState: { error: controllerError } }) => {
        const displayErrorResolved = error || (controllerError?.message as string | undefined);
        return (
          <View style={styles.fieldWrap}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
              styles.inputWrap,
              displayErrorResolved ? styles.inputWrapError : null,
              isFocused ? styles.inputWrapFocused : null,
            ]}>
              {icon && (
                <Ionicons name={icon} size={20} color={displayErrorResolved ? '#ff6b6b' : iconColor} style={styles.inputIcon} />
              )}
              <TextInput
                style={styles.input}
                placeholderTextColor="#8b8fa3"
                value={typeof value === 'string' ? value : String(value ?? '')}
                onChangeText={onChange}
                onBlur={() => {
                  rhfOnBlur();
                  setIsFocused(false);
                }}
                onFocus={() => setIsFocused(true)}
                {...inputProps}
              />
            </View>
            {displayErrorResolved && (
              <Animated.View style={[styles.errorRow, { opacity: fadeAnim }]}>
                <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                <Text style={styles.errorText}>{displayErrorResolved}</Text>
              </Animated.View>
            )}
          </View>
        );
      }}
    />
  );
}

// ============================================
// FormTextArea - Textarea có validation
// ============================================
interface FormTextAreaProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<any>;
  name: string;
  label?: string;
  error?: string;
}

/** Component Textarea nhiều dòng bọc Controller, hiển thị text báo lỗi khi validation thất bại */
export function FormTextArea({
  control, name, label, error, ...inputProps
}: FormTextAreaProps) {
  const { errors } = useFormState({ control });
  const fieldError = errors[name] as any;
  const displayError = error || (fieldError?.message as string | undefined);

  const [isFocused, setIsFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: displayError ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [displayError]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur: rhfOnBlur, value }, fieldState: { error: controllerError } }) => {
        const displayErrorResolved = error || (controllerError?.message as string | undefined);
        return (
          <View style={styles.fieldWrap}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
              style={[
                styles.textArea,
                displayErrorResolved ? styles.textAreaError : null,
                isFocused ? styles.textAreaFocused : null,
              ]}
              placeholderTextColor="#8b8fa3"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={typeof value === 'string' ? value : ''}
              onChangeText={onChange}
              onBlur={() => {
                rhfOnBlur();
                setIsFocused(false);
              }}
              onFocus={() => setIsFocused(true)}
              {...inputProps}
            />
            {displayErrorResolved && (
              <Animated.View style={[styles.errorRow, { opacity: fadeAnim }]}>
                <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                <Text style={styles.errorText}>{displayErrorResolved}</Text>
              </Animated.View>
            )}
          </View>
        );
      }}
    />
  );
}

// ============================================
// FormRadioGroup - Radio selection có validation
// ============================================
interface RadioOption {
  value: string;
  label: string;
  icon?: string;
}

interface FormRadioGroupProps {
  control: Control<any>;
  name: string;
  label?: string;
  options: RadioOption[];
  error?: string;
}

/** Component nhóm nút chọn Radio bọc Controller, có thể thêm icon cho từng lựa chọn */
export function FormRadioGroup({
  control, name, label, options, error,
}: FormRadioGroupProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => {
        const displayError = error || (fieldError?.message as string | undefined);
        return (
          <View style={styles.fieldWrap}>
            {label && <Text style={styles.label}>{label}</Text>}
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.radioBtn, value === opt.value && styles.radioBtnActive]}
                onPress={() => onChange(opt.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.radioCircle, value === opt.value && styles.radioCircleActive]}>
                  {value === opt.value && <View style={styles.radioCircleInner} />}
                </View>
                <Text style={[styles.radioText, value === opt.value && styles.radioTextActive]}>
                  {opt.icon ? `${opt.icon} ` : ''}{opt.label}
                </Text>
              </TouchableOpacity>
            ))}
            {displayError && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

// ============================================
// FormPicker - Shadcn/UI-inspired bottom sheet dropdown
// ============================================
interface PickerOption {
  value: number;
  label: string;
}

interface FormPickerProps {
  control: Control<any>;
  name: string;
  nameName?: string; // field for storing name
  label?: string;
  options: PickerOption[];
  placeholder?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  searchable?: boolean;
}

/** Component Dropdown dạng Bottom Sheet (giống Shadcn UI), có hỗ trợ thanh tìm kiếm bên trong */
export function FormPicker({
  control, name, nameName, label, options, placeholder = 'Chọn...', error, icon = 'location-outline', searchable = true,
}: FormPickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openModal = () => {
    setSearch('');
    setShowModal(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
        mass: 0.8,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModal(false);
    });
  };

  const filteredOptions = search.trim()
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => {
        const displayError = error || (fieldError?.message as string | undefined);
        const selectedOption = options.find(o => o.value === value);
        const selectedLabel = selectedOption?.label || placeholder;

        const handleSelect = (opt: PickerOption) => {
          onChange(opt.value);
          closeModal();
        };

        return (
          <View style={styles.fieldWrap}>
            {label && <Text style={styles.label}>{label}</Text>}

            {/* Trigger Button */}
            <TouchableOpacity
              style={[
                styles.pickerTrigger,
                displayError && styles.pickerTriggerError,
                selectedOption && styles.pickerTriggerSelected,
              ]}
              onPress={openModal}
              activeOpacity={0.7}
            >
              <View style={[
                styles.pickerIconWrap,
                displayError && styles.pickerIconWrapError,
                selectedOption && styles.pickerIconWrapSelected,
              ]}>
                <Ionicons
                  name={icon}
                  size={18}
                  color={displayError ? '#ff6b6b' : selectedOption ? '#a29bfe' : '#8b8fa3'}
                />
              </View>
              <Text style={[
                styles.pickerTriggerText,
                !selectedOption && styles.pickerTriggerPlaceholder,
              ]}>
                {selectedLabel}
              </Text>
              <View style={styles.pickerChevronWrap}>
                <Ionicons name="chevron-expand" size={18} color="#8b8fa3" />
              </View>
            </TouchableOpacity>

            {/* Bottom Sheet Modal */}
            <Modal
              visible={showModal}
              transparent
              animationType="none"
              statusBarTranslucent
              onRequestClose={closeModal}
            >
              <View style={styles.modalContainer}>
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
                  <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
                </Animated.View>

                {/* Sheet */}
                <Animated.View
                  style={[
                    styles.sheet,
                    { transform: [{ translateY: slideAnim }] },
                  ]}
                >
                  {/* Handle bar */}
                  <View style={styles.sheetHandleWrap}>
                    <View style={styles.sheetHandle} />
                  </View>

                  {/* Header */}
                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>{label || 'Chọn giá trị'}</Text>
                    <TouchableOpacity style={styles.sheetCloseBtn} onPress={closeModal}>
                      <Ionicons name="close" size={20} color="#8b8fa3" />
                    </TouchableOpacity>
                  </View>

                  {/* Search */}
                  {searchable && options.length > 3 && (
                    <View style={styles.searchWrap}>
                      <Ionicons name="search-outline" size={18} color="#8b8fa3" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm..."
                        placeholderTextColor="#8b8fa3"
                        value={search}
                        onChangeText={setSearch}
                        autoFocus={false}
                      />
                      {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                          <Ionicons name="close-circle" size={18} color="#8b8fa3" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Options list */}
                  <FlatList
                    data={filteredOptions}
                    keyExtractor={(item) => String(item.value)}
                    style={styles.optionsList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                      <View style={styles.emptySearch}>
                        <Ionicons name="search" size={28} color="#8b8fa3" />
                        <Text style={styles.emptySearchText}>Không tìm thấy kết quả</Text>
                      </View>
                    }
                    renderItem={({ item, index }) => {
                      const isSelected = value === item.value;
                      const isLast = index === filteredOptions.length - 1;
                      return (
                        <TouchableOpacity
                          style={[
                            styles.optionItem,
                            isSelected && styles.optionItemSelected,
                            !isLast && styles.optionItemBorder,
                          ]}
                          onPress={() => handleSelect(item)}
                          activeOpacity={0.6}
                        >
                          <View style={styles.optionContent}>
                            <View style={[
                              styles.optionDot,
                              isSelected && styles.optionDotSelected,
                            ]}>
                              {isSelected && (
                                <Ionicons name="checkmark" size={14} color="#fff" />
                              )}
                            </View>
                            <Text style={[
                              styles.optionText,
                              isSelected && styles.optionTextSelected,
                            ]}>
                              {item.label}
                            </Text>
                          </View>
                          {isSelected && (
                            <View style={styles.optionSelectedBadge}>
                              <Text style={styles.optionSelectedBadgeText}>Đang chọn</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    }}
                  />
                </Animated.View>
              </View>
            </Modal>

            {/* Error message */}
            {displayError && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

// ============================================
// GradientButton - Nút bấm gradient chuyên nghiệp
// ============================================
interface GradientButtonProps {
  onPress: () => void;
  label: string;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  colors?: [string, string];
  style?: ViewStyle;
}

/** Nút bấm có hiệu ứng Gradient và animation scale khi nhấn, hỗ trợ trạng thái loading */
export function GradientButton({
  onPress, label, loading, loadingLabel, disabled, icon, style,
}: GradientButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <Animated.View style={[
        styles.gradientBtn,
        (disabled || loading) && styles.gradientBtnDisabled,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}>
        {icon && !loading && <Ionicons name={icon} size={18} color="#fff" />}
        {loading && <Ionicons name="reload-outline" size={18} color="#fff" />}
        <Text style={styles.gradientBtnText}>
          {loading ? (loadingLabel || 'Đang xử lý...') : label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#e4e6f0', marginBottom: 8 },
  // Input
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0f1117', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#2a2e3d',
  },
  inputWrapError: { borderColor: '#ff6b6b' },
  inputWrapFocused: { borderColor: '#6c5ce7' },
  inputIcon: { paddingLeft: 16 },
  input: {
    flex: 1,
    padding: 16,
    color: '#e4e6f0',
    fontSize: 16,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
      default: {},
    }),
  },
  // TextArea
  textArea: {
    backgroundColor: '#0f1117', borderWidth: 1.5, borderColor: '#2a2e3d',
    borderRadius: 14, padding: 16, color: '#e4e6f0', fontSize: 15,
    minHeight: 110, textAlignVertical: 'top',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
      default: {},
    }),
  },
  textAreaError: { borderColor: '#ff6b6b' },
  textAreaFocused: { borderColor: '#6c5ce7' },
  // Error
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 4 },
  errorText: { color: '#ff6b6b', fontSize: 13, fontWeight: '500' },
  // Radio
  radioBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    backgroundColor: '#0f1117', borderWidth: 1.5, borderColor: '#2a2e3d', marginBottom: 8,
  },
  radioBtnActive: { borderColor: '#6c5ce7', backgroundColor: 'rgba(108,92,231,0.06)' },
  radioCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#2a2e3d',
    justifyContent: 'center', alignItems: 'center',
  },
  radioCircleActive: { borderColor: '#6c5ce7' },
  radioCircleInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#6c5ce7' },
  radioText: { fontSize: 15, color: '#8b8fa3' },
  radioTextActive: { color: '#e4e6f0', fontWeight: '600' },

  // ========================
  // Picker - Shadcn/UI-inspired
  // ========================
  pickerTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0f1117', borderWidth: 1.5, borderColor: '#2a2e3d',
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
  },
  pickerTriggerError: { borderColor: '#ff6b6b' },
  pickerTriggerSelected: { borderColor: 'rgba(108,92,231,0.4)', backgroundColor: 'rgba(108,92,231,0.04)' },
  pickerIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(139,143,163,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  pickerIconWrapError: { backgroundColor: 'rgba(255,107,107,0.08)' },
  pickerIconWrapSelected: { backgroundColor: 'rgba(108,92,231,0.12)' },
  pickerTriggerText: { flex: 1, color: '#e4e6f0', fontSize: 16, fontWeight: '500' },
  pickerTriggerPlaceholder: { color: '#8b8fa3', fontWeight: '400' },
  pickerChevronWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(139,143,163,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Modal & Sheet
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#1a1d27',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.65,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#2a2e3d',
    // Shadow
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3a3e4d',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2e3d',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e4e6f0',
  },
  sheetCloseBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(139,143,163,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#0f1117',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2a2e3d',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
  },
  searchInput: {
    flex: 1,
    color: '#e4e6f0',
    fontSize: 15,
  },

  // Options
  optionsList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  optionItemSelected: {
    backgroundColor: 'rgba(108,92,231,0.08)',
  },
  optionItemBorder: {
    // subtle separator handled by margin
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionDot: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3a3e4d',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  optionDotSelected: {
    borderColor: '#6c5ce7',
    backgroundColor: '#6c5ce7',
  },
  optionText: {
    fontSize: 16,
    color: '#c0c3d1',
    fontWeight: '400',
  },
  optionTextSelected: {
    color: '#e4e6f0',
    fontWeight: '600',
  },
  optionSelectedBadge: {
    backgroundColor: 'rgba(108,92,231,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  optionSelectedBadgeText: {
    color: '#a29bfe',
    fontSize: 11,
    fontWeight: '600',
  },

  // Empty search
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptySearchText: {
    color: '#8b8fa3',
    fontSize: 14,
  },

  // Gradient Button
  gradientBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#6c5ce7', borderRadius: 14, paddingVertical: 16, marginTop: 8,
    shadowColor: '#6c5ce7', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  gradientBtnDisabled: { opacity: 0.6 },
  gradientBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
