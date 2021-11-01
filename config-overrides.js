// This tutorial uses webpack directly https://www.youtube.com/watch?v=1QFTfbDXJCI
// This configuration file is probably inaccurate

module.exports = function override(config, env) {
  config.module.rules.push({
    test: /\.worker\.js$/,
    use: { loader: 'worker-plugin' },
  });
  return config;
};
