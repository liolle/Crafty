// eslint.config.mjs
import tsparser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
	// Then apply the obsidianmd rules
	...obsidianmd.configs.recommended,
	{
		ignores: [
			"**/node_modules/",    // Ignore all node_modules
			".git/",              // Ignore .git folder (default)
			"dist/",              // Ignore your build output
			"**/*.config.js",     // Ignore all config files
			"**/__tests__/**"     // Ignore your test files like 'node.test.js'
		]
	},
	// First, configure TypeScript files with type info
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: import.meta.dirname, // Add this
			},
		},
	},
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tsparser,
			parserOptions: { project: "./tsconfig.json" },
		},

		// You can add your own configuration to override or add rules
		rules: {
			// example: turn off a rule from the recommended set
			//"obsidianmd/sample-names": "off",
			// example: add a rule not in the recommended set and set its severity
			//"obsidianmd/prefer-file-manager-trash": "error",
			"obsidianmd/prefer-file-manager-trash-file": "error"
		},
	},
	{
		ignores: ["**/*.js",
			"**/*.mjs",
			"**/*.json"], // This will make ESLint skip all JS files
	},
]);
