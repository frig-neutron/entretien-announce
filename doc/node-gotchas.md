# Node Gotchas

Sometimes node gets you

## npm test

```
Error: You must provide the URL of lib/mappings.wasm by calling SourceMapConsumer.initialize({ 'lib/mappings.wasm': ... }) before using SourceMapConsumer
```

This is a known issue with node 18. Use `nvm` to install 17.

*Double-gotcha*: you have to run `nvm use 17` in every open session, or it will keep using 18.

*Triple-gotcha*: intellij keeps picking up node 18 for new run configs. `nvm unistall 18`.
