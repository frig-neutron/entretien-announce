.PHONY: deploy

init:
	pnpm install
	npx clasp login

deploy:
	ENV=$(env) ./deploy/deploy.sh
