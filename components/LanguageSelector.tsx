import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';

type Language = 'en' | 'he' | 'ru';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function LanguageSelector({ visible, onClose }: Props) {
  const { language, setLanguage, t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  ];

  const handleSave = async () => {
    if (selectedLanguage !== language) {
      await setLanguage(selectedLanguage);

      // If switching to/from Hebrew, warn user about restart
      if (selectedLanguage === 'he' || language === 'he') {
        Alert.alert(
          t('settings.language'),
          'Please restart the app for the language change to take full effect.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('settings.selectLanguage')}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Language Options */}
          <View style={styles.languageList}>
            {languages.map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.languageOption,
                  selectedLanguage === lang.code && styles.selectedOption,
                ]}
                onPress={() => setSelectedLanguage(lang.code)}
              >
                <View style={styles.languageInfo}>
                  <Text style={[
                    styles.languageName,
                    selectedLanguage === lang.code && styles.selectedText,
                  ]}>
                    {lang.nativeName}
                  </Text>
                  <Text style={[
                    styles.languageSubtext,
                    selectedLanguage === lang.code && styles.selectedSubtext,
                  ]}>
                    {lang.name}
                  </Text>
                </View>
                {selectedLanguage === lang.code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>

          {/* Save Button */}
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  languageList: {
    padding: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#ede9fe',
    borderColor: '#8b5cf6',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  selectedText: {
    color: '#8b5cf6',
  },
  languageSubtext: {
    fontSize: 14,
    color: '#666',
  },
  selectedSubtext: {
    color: '#7c3aed',
  },
  checkmark: {
    fontSize: 24,
    color: '#8b5cf6',
    fontWeight: '700',
  },
  saveButton: {
    marginHorizontal: 20,
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
