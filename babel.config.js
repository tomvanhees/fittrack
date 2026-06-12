module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo voegt de worklets-plugin (Reanimated 4) automatisch toe
    // wanneer react-native-worklets geïnstalleerd is — niet apart toevoegen.
    presets: ['babel-preset-expo'],
  };
};
