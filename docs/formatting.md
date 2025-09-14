# Code Formatting Guidelines

This project uses industry standard tools to keep code style consistent across languages.

## JavaScript / TypeScript
- **Formatter:** [Prettier](https://prettier.io)
- **Command:** `npm run format`
- **Config:** `.prettierrc` and `.prettierignore`

## Python
- **Formatter:** [Black](https://black.readthedocs.io/en/stable/) with [isort](https://pycqa.github.io/isort/)
- **Command:** `black . && isort .`
- **Config:** `pyproject.toml`

## Ruby
- **Formatter:** [RuboCop](https://docs.rubocop.org)
- **Command:** `bundle exec rubocop -A`
- **Config:** `.rubocop.yml`

## Rust
- **Formatter:** [rustfmt](https://rust-lang.github.io/rustfmt/)
- **Command:** `cargo fmt`
- **Config:** `rustfmt.toml`

## Go
- **Formatter:** `gofmt`
- **Command:** `go fmt ./...`
- **Config:** none (uses canonical Go style)

## C# / .NET
- **Formatter:** `dotnet format`
- **Config:** `.editorconfig`

Use `npm run format` to format JavaScript, TypeScript, JSON, Markdown, and YAML files. Other languages have their own tooling as noted above.

## Formatting Hooks
A post-tool hook can automatically run these formatters after Claude edits a file. See `cli-tool/components/hooks/post-tool/format-all-files.json` for an example. The hook inspects `$CLAUDE_TOOL_FILE_PATH` to choose the formatter based on file extension, and each tool discovers its configuration (`.prettierrc`, `pyproject.toml`, `.rubocop.yml`, etc.) using its built-in rules.
