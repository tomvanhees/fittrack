// jest.setup.js

// RNTL v13+ registreert zijn Jest-matchers automatisch; de aparte
// '@testing-library/react-native/extend-expect'-import bestaat niet meer.

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
