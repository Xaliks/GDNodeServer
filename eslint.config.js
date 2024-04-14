const js = require("@eslint/js");
const prettier = require("eslint-plugin-prettier");
const globals = require("globals");

module.exports = [
	js.configs.recommended,
	{
		files: ["**/*.js"],

		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "commonjs",
			globals: { ...globals.node },
		},

		plugins: { prettier },

		rules: {
			"no-async-promise-executor": "off",
			"no-case-declarations": "off",
			"no-template-curly-in-string": "warn",

			"no-constructor-return": "error",
			"no-duplicate-imports": "error",
			"no-self-compare": "error",
			"no-unmodified-loop-condition": "error",
			"no-unreachable-loop": "error",
			"no-useless-assignment": "error",
			"no-useless-return": "error",
			"no-useless-rename": "error",
			"no-useless-constructor": "error",
			"no-useless-concat": "error",
			"no-useless-computed-key": "error",
			"no-unused-expressions": "error",
			"no-object-constructor": "error",
			"no-new-wrappers": "error",
			"no-new-func": "error",
			"no-new": "error",
			"no-negated-condition": "error",
			"no-multi-str": "error",
			"no-multi-assign": "error",
			"no-lonely-if": "error",
			"no-var": "error",
			yoda: "error",
			"prefer-template": "error",
			"prefer-rest-params": "error",
			"prefer-regex-literals": "error",
			"no-lone-blocks": "error",
			"no-labels": "error",
			"no-label-var": "error",
			"no-implied-eval": "error",
			"no-eval": "error",
			"no-eq-null": "error",
			"no-else-return": "error",
			"no-array-constructor": "error",
			"logical-assignment-operators": "error",
			eqeqeq: "error",
			"dot-notation": "error",
			"default-param-last": "error",
			"default-case-last": "error",
			"default-case": "error",

			"prefer-arrow-callback": ["error", { allowNamedFunctions: true }],
			"prefer-const": ["error", { destructuring: "all" }],
			curly: ["error", "multi-line"],
			"no-use-before-define": ["error", { functions: false, classes: false }],
			"object-shorthand": ["error", "always", { avoidQuotes: true }],
			"prefer-destructuring": ["error", { array: true, object: false }],
			"no-unneeded-ternary": ["error", { defaultAssignment: false }],
			"operator-assignment": ["error", "always"],
			"no-empty-function": ["error", { allow: ["arrowFunctions"] }],
			camelcase: ["error", { properties: "never" }],

			"prettier/prettier": [
				"error",
				{
					useTabs: true,
					endOfLine: "auto",
					printWidth: 123,
				},
			],
		},
	},
];
