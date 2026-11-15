// Syntactic gates derived from the MIT pilot; semantic review is still required.
const key = (node) =>
  node?.type === "Identifier"
    ? node.name
    : node?.type === "Literal"
      ? node.value
      : undefined;
const metadata = (messages) => ({ type: "problem", schema: [], messages });
const isEmptyResult = (node) =>
  !node ||
  (node.type === "Identifier" && node.name === "undefined") ||
  (node.type === "Literal" && node.value === null) ||
  (node.type === "ObjectExpression" && node.properties.length === 0) ||
  (node.type === "ArrayExpression" && node.elements.length === 0);

// Deliberately syntactic: guarded fallbacks must propagate unhandled errors.
// Skip nested functions; a throw in an unrelated callback is not propagation.
function containsThrow(node, visitorKeys) {
  if (node.type === "ThrowStatement") return true;
  if (node.type.includes("Function")) return false;
  return (visitorKeys[node.type] || []).some((key) => {
    const children = Array.isArray(node[key]) ? node[key] : [node[key]];
    return children.some((child) => child && containsThrow(child, visitorKeys));
  });
}

export default {
  rules: {
    "no-empty-fallback": {
      meta: metadata({
        fallback:
          "Do not turn an arbitrary failure into an empty result; handle a known error and rethrow the rest.",
      }),
      create(context) {
        function check(body) {
          if (body.type !== "BlockStatement") {
            if (isEmptyResult(body))
              context.report({ node: body, messageId: "fallback" });
            return;
          }
          if (containsThrow(body, context.sourceCode.visitorKeys)) return;
          function visit(node) {
            if (node.type.includes("Function")) return;
            if (node.type === "ReturnStatement" && isEmptyResult(node.argument))
              context.report({ node, messageId: "fallback" });
            for (const key of context.sourceCode.visitorKeys[node.type] || []) {
              const children = Array.isArray(node[key])
                ? node[key]
                : [node[key]];
              for (const child of children) if (child) visit(child);
            }
          }
          visit(body);
        }
        return {
          CatchClause(node) {
            check(node.body);
          },
          CallExpression(node) {
            if (
              node.callee.type !== "MemberExpression" ||
              key(node.callee.property) !== "catch"
            )
              return;
            const handler = node.arguments[0];
            if (
              ["ArrowFunctionExpression", "FunctionExpression"].includes(
                handler?.type,
              )
            )
              check(handler.body);
          },
        };
      },
    },
    "no-silent-catch": {
      meta: metadata({
        silent:
          "Empty catch handlers hide failures; comments are not an error policy.",
      }),
      create(context) {
        return {
          CatchClause(node) {
            if (node.body.body.length === 0)
              context.report({ node, messageId: "silent" });
          },
          CallExpression(node) {
            if (
              node.callee.type !== "MemberExpression" ||
              key(node.callee.property) !== "catch"
            )
              return;
            const handler = node.arguments[0];
            if (
              !handler ||
              !["ArrowFunctionExpression", "FunctionExpression"].includes(
                handler.type,
              )
            )
              return;
            if (
              handler.body.type === "BlockStatement" &&
              handler.body.body.length === 0
            )
              context.report({ node: handler, messageId: "silent" });
          },
        };
      },
    },
  },
};
