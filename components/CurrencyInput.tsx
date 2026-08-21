import { TextInput, TextInputProps } from 'react-native';

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'> {
  value: string;
  onChangeValue: (rawDigits: string) => void;
}

export default function CurrencyInput({ value, onChangeValue, ...rest }: Props) {
  const formatted = value ? new Intl.NumberFormat('es-AR').format(Number(value)) : '';

  function handleChange(text: string) {
    onChangeValue(text.replace(/\D/g, ''));
  }

  return (
    <TextInput
      {...rest}
      keyboardType="numeric"
      value={formatted}
      onChangeText={handleChange}
    />
  );
}
