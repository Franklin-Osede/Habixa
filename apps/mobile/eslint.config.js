const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// Patch expoConfig to remove 'typescript' resolver causing crashes in VS Code due to native binary incompatibility
const patchedExpoConfig = Array.isArray(expoConfig) ? expoConfig.map(config => {
  if (config.settings && config.settings['import/resolver'] && config.settings['import/resolver'].typescript) {
    const newSettings = { ...config.settings };
    const newResolver = { ...newSettings['import/resolver'] };
    delete newResolver.typescript; // Remove the crashing resolver
    
    // Ensure node resolver is present and configured for TS extensions
    if (!newResolver.node) {
       newResolver.node = { extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts', '.ios.ts', '.android.ts', '.web.ts'] };
    }
    
    newSettings['import/resolver'] = newResolver;
    return { ...config, settings: newSettings };
  }
  return config;
}) : expoConfig;

module.exports = defineConfig([
  ...patchedExpoConfig,
  {
    ignores: ['dist/*'],
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts', '.ios.ts', '.android.ts', '.web.ts']
        }
      }
    },
    rules: {
      'import/no-unresolved': 'off', // TypeScript handles resolution checks; disabling to avoid false positives with aliases
    }
  },
]);
