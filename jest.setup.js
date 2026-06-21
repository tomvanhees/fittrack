// jest.setup.js

// RNTL v13+ registreert zijn Jest-matchers automatisch; de aparte
// '@testing-library/react-native/extend-expect'-import bestaat niet meer.

// AsyncStorage heeft geen native module onder Jest; gebruik de meegeleverde mock
// zodat de prefs-store (persist) laadbaar is in tests.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// @expo/vector-icons laadt fonts via een native module dat onder Jest niet
// bestaat. We vervangen elke icon-set door een lichtgewicht stub zodat
// componenten die iconen gebruiken gewoon renderbaar zijn in tests.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name, testID }) =>
    React.createElement(Text, { testID: testID ?? `icon-${name}` });
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === '__esModule') return true;
        return Icon;
      },
    }
  );
});
