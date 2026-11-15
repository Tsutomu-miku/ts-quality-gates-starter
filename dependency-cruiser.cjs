const { createDependencyConfig } = require("./tools/dependency-policy.cjs");

module.exports = createDependencyConfig({
  root: __dirname,
  architecture: "flat",
});
