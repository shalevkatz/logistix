// src/styles/CreateEmployee.styles.ts
import { StyleSheet } from 'react-native';

export const e = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f10',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  label: {
    color: '#c7c9cc',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#2a2b2f',
    backgroundColor: '#17181b',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  error: {
    color: '#ff6b6b',
    marginTop: 4,
  },
  btnPrimary: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  btnSecondary: {
    backgroundColor: '#2a2b2f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: 'white',
    fontWeight: '700',
  },
});