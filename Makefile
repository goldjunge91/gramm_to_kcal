lint:
	@if [ -n "$(FILE)" ]; then \
		pnpm exec eslint --fix --config /Users/marco/Github.tmp/gramm_to_kcal/eslint.config.mjs $(FILE) >&2; \
		pnpm typecheck >&2; \
	else \
		pnpm run lint:fix >&2; \
		pnpm typecheck >&2; \
	fi

test:
	@if [ -n "$(FILE)" ]; then \
		pnpm exec vitest run $(FILE) >&2; \
	else \
		pnpm test >&2; \
	fi