// components/shared/KeyboardAvoider.tsx

import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface KeyboardAvoiderProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Extra verticale offset, bv. voor de hoogte van een navigatie-header. */
  offset?: number;
  /**
   * Overschrijf het standaardgedrag. Default: iOS schuift met `padding`, Android
   * laat `adjustResize` het werk doen (behavior undefined) — dat voorkomt een
   * dubbele verschuiving. Voor een bottom-sheet binnen een <Modal> geef je
   * expliciet `behavior="padding"` mee, want daar grijpt adjustResize niet.
   */
  behavior?: 'padding' | 'height' | 'position';
}

export function KeyboardAvoider({
  children,
  style,
  offset = 0,
  behavior,
}: KeyboardAvoiderProps) {
  return (
    <KeyboardAvoidingView
      style={style}
      behavior={behavior ?? Platform.select({ ios: 'padding' })}
      keyboardVerticalOffset={offset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
