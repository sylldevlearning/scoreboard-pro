# Code Review

Run a comprehensive code review using parallel agents, then synthesize findings.

## Scope

Determine what code to review using this priority:

1. **User specifies scope** - If the user provides a branch name, commit SHA, PR number/URL, or file paths, review that
2. **On a feature branch** - Review all changes on current branch vs main/master (`git diff main...HEAD`)
3. **On main/master with staged changes** - Review staged files (`git diff --staged`)
4. **On main/master, nothing staged** - Review the latest commit (`git show HEAD`)

## Instructions

Launch all 9 agents in parallel using a single message with multiple Task tool calls:

### Agent 1: Test Runner

```
Run relevant tests for the changed files. Report:
- Which tests were run
- Pass/fail status
- Any test failures with details
```

### Agent 2: Linter & Static Analysis

```
Run linters AND collect IDE diagnostics for the changed files.
Report:
- Linting tool(s) used
- Any warnings or errors found
- Auto-fixable vs manual fixes needed
- Type errors or unresolved references
```

### Agent 3: Code Reviewer

```
First, check if CLAUDE.md exists. If so, read it for project conventions.
Review the code changes and provide up to 5 concrete improvements, ranked by Impact and Effort.
Only include genuinely important issues. Skip formatting nitpicks and things linters catch.
Format: [HIGH/MED/LOW Impact, HIGH/MED/LOW Effort] Title - What / Why / How
```

### Agent 4: Security Reviewer

```
Review code changes for:
- Input validation and sanitization
- Injection risks (SQL, command, XSS)
- Authentication/authorization issues
- Secrets or credentials in code
- Error handling that leaks sensitive info
- Missing try/catch, swallowed errors
Report issues with severity (Critical/High/Medium/Low) and file:line references.
```

### Agent 5: Quality & Style Reviewer

```
Review code changes for:
- Complexity (functions too long, deeply nested)
- Dead code (unused imports, unreachable code)
- Duplication (copy-pasted logic that should be abstracted)
- Naming conventions and consistency
- File/folder organization
- Architectural patterns
```

### Agent 6: Test Quality Reviewer

```
Review test coverage and quality:
- Are critical paths tested? (scoring logic, timers, card system)
- Do tests verify behavior, not implementation details?
- Are there flakiness risks? (timing dependencies, race conditions)
- Could tests be parameterized to reduce duplication?
- Missing edge case coverage?
```

### Agent 7: Performance Reviewer

```
Review code changes for:
- Unnecessary re-renders (React Native)
- Blocking operations in async contexts
- Memory leaks (unclosed resources, intervals, Audio.Sound)
- Expensive operations in hot paths (timers ticking every second)
- Missing useCallback/useMemo where beneficial
```

### Agent 8: Dependency & Deployment Safety Reviewer

```
Review for:
- New dependencies justified? Could existing deps cover it?
- Dependencies well-maintained and compatible with Expo SDK 54?
- Breaking changes in public interfaces
- Deployment safety (app.json plugins, eas.json config)
- Are all required Expo plugins declared?
```

### Agent 9: Simplification & Maintainability Reviewer

```
Ask "could this be simpler?" for each changed file:
- Over-engineered abstractions
- Code that could use existing utilities
- Changes that are atomic and well-scoped
- Opportunities to reduce line count without losing clarity
- Duplicated patterns across sport screens that could be shared hooks/components
```

## Synthesis

After all agents complete, combine findings into a single prioritized report:

### Format

```
## Code Review Summary

### Verdict: [Ready to Merge | Needs Attention | Needs Work]

### Critical (must fix)
- ...

### High (should fix)
- ...

### Medium (consider fixing)
- ...

### Low (nice to have)
- ...

### Stats
- Tests: X passed, Y failed
- TypeScript: X errors
- Lint: X warnings, Y errors
- Issues found: X critical, Y high, Z medium, W low
```

Filter out low-confidence issues. Only include genuinely actionable findings.
