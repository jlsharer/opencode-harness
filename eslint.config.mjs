import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

const authoredTypeScript = ["bin/**/*.ts", ".opencode/src/**/*.ts", ".opencode/scripts/*.mts"];

const functionLike = [
  "function",
  { selector: "ExportNamedDeclaration[declaration.type='FunctionDeclaration']" },
  { selector: "Program > VariableDeclaration:has(ArrowFunctionExpression)" },
  {
    selector:
      "Program > ExportNamedDeclaration[declaration.type='VariableDeclaration']:has(ArrowFunctionExpression)",
  },
];

const classLike = [
  "class",
  { selector: "ExportNamedDeclaration[declaration.type='ClassDeclaration']" },
];

export default [
  {
    files: authoredTypeScript,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@stylistic/lines-between-class-members": [
        "error",
        "always",
        { exceptAfterOverload: true, exceptAfterSingleLine: true },
      ],
      "@stylistic/no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0, maxEOF: 0 }],
      "@stylistic/padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: [...functionLike, ...classLike], next: "*" },
        { blankLine: "always", prev: "*", next: [...functionLike, ...classLike] },
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "any", prev: "import", next: "import" },
        {
          blankLine: "always",
          prev: ["type", "interface"],
          next: ["const", "let", "var", "function", "class"],
        },
        {
          blankLine: "always",
          prev: ["const", "let", "var", "function", "class"],
          next: ["type", "interface"],
        },
      ],
    },
  },
];
