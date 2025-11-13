// Adapted from https://medium.com/@tajircuet/support-of-import-meta-on-vite-jest-typescript-91b49eb0446f
module.exports = {
  presets: [
    ['@babel/preset-env', {useBuiltIns: 'entry', corejs: '2', targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
  plugins: [
    function () {
      return {
        visitor: {
          MetaProperty(path) {
            path.replaceWithSourceString('process');
          },
        },
      };
    },
  ],
};
