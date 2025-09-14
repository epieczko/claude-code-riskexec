# CLAUDE.md

This file provides guidance to Claude Code when working with .NET projects using C#.

## Project Overview

This project follows modern .NET development practices using the `dotnet` CLI.

## Development Commands

- `dotnet new` - Create new projects
- `dotnet restore` - Restore NuGet packages
- `dotnet build` - Build the solution
- `dotnet run` - Run application
- `dotnet test` - Run tests
- `dotnet format` - Format code

## Testing Commands

- `dotnet test` - Run all tests
- `dotnet test --filter <name>` - Run specific tests

## Code Quality Commands

- `dotnet format` - Format C# code
- `dotnet format --verify-no-changes` - Check formatting
- `dotnet build` - Build and check for compilation errors

## Technology Stack

- **C#** - Primary language
- **.NET 8+** - Target framework
- **xUnit/NUnit/MSTest** - Common testing frameworks

## Project Structure Guidelines

```
src/
  ProjectName/
    Program.cs
    ProjectName.csproj
tests/
  ProjectName.Tests/
    UnitTest1.cs
    ProjectName.Tests.csproj
```

## .NET Guidelines

- Use `async`/`await` for asynchronous operations
- Favor dependency injection via `IServiceCollection`
- Keep console output minimal; use structured logging
- Run `dotnet format` before committing
- Use `dotnet test` for continuous testing
