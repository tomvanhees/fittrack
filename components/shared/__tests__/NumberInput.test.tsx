// components/shared/__tests__/NumberInput.test.tsx

import { fireEvent, render, screen } from '@testing-library/react-native';
import { NumberInput } from '@/components/shared/NumberInput';

describe('<NumberInput />', () => {
  it('filtert niet-numerieke tekens weg', () => {
    const onChangeNumber = jest.fn();
    render(<NumberInput testID="n" value="" onChangeNumber={onChangeNumber} />);
    fireEvent.changeText(screen.getByTestId('n'), 'a1b2c3');
    expect(onChangeNumber).toHaveBeenCalledWith('123');
  });

  it('staat geen decimalen toe in integer-modus', () => {
    const onChangeNumber = jest.fn();
    render(<NumberInput testID="n" value="" onChangeNumber={onChangeNumber} />);
    fireEvent.changeText(screen.getByTestId('n'), '12.5');
    expect(onChangeNumber).toHaveBeenCalledWith('125');
  });

  it('behoudt en normaliseert decimalen wanneer allowDecimal aan staat', () => {
    const onChangeNumber = jest.fn();
    render(
      <NumberInput testID="n" value="" onChangeNumber={onChangeNumber} allowDecimal />
    );
    fireEvent.changeText(screen.getByTestId('n'), '82,5kg');
    expect(onChangeNumber).toHaveBeenCalledWith('82.5');
  });
});
