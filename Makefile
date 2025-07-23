lint:
	@if [ -n "$(FILE)" ]; then \
		pnpm exec eslint --fix $(FILE) >&2; \
		pnpm exec prettier --write $(FILE) >&2; \
		pnpm typecheck >&2; \
	else \
		pnpm run lint:fix >&2; \
		pnpm run prettier >&2; \
		pnpm typecheck >&2; \
	fi

test:
	@if [ -n "$(FILE)" ]; then \
		pnpm exec vitest run $(FILE) >&2; \
	else \
		pnpm test >&2; \
	fi