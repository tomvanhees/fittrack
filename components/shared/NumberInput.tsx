// components/shared/NumberInput.tsx

import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { colors, fontSize, radius } from '@/constants/colors';

interface NumberInputProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  value: string;
  onChangeNumber: (value: string) => void;
  allowDecimal?: boolean;
}

/**
 * Gespecialiseerde numerieke input. Houdt de waarde als string aan zodat een
 * leeg veld (placeholder = vorige waarde) mogelijk blijft, en filtert ongeldige
 * tekens eruit.
 */
export function NumberInput({
  value,
  onChangeNumber,
  allowDecimal = false,
  style,
  ...rest
}: NumberInputProps) {
  function handleChange(text: string) {
    const cleaned = allowDecimal
      ? text.replace(/[^0-9.,]/g, '').replace(',', '.')
      : text.replace(/[^0-9]/g, '');
    onChangeNumber(cleaned);
  }

  return (
    <TextInput
      value={value}
      onChangeText={handleChange}
      keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
      placeholderTextColor={colors.textFaint}
      selectTextOnFocus
      style={[styles.input, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 10,
    textAlign: 'center',
    minWidth: 56,
  },
});
