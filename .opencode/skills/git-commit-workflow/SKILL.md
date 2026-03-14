---
name: git-commit-workflow
description: Standard operating procedure for finalizing tasks, analyzing changes, and preparing git commits for PULSE_RUNNER. Use this whenever asked to finish a task, create a commit, or save changes.
---
# PULSE_RUNNER Git Commit Workflow

When you have finished implementing code changes and the user asks you to commit or finalize the task, you MUST strictly follow this workflow:

1. **Read the Guidelines:** You MUST read the `CONTRIBUTING.md` file located at the root of the repository to understand the project's specific commit message conventions (e.g., Conventional Commits, required scopes, tense, formatting).
2. **Review the Changes:** Analyze all the files you have modified, added, or deleted during the current session to ensure the commit message accurately reflects the entire scope of the work.
3. **Draft the Message:** Create a precise, descriptive commit message that perfectly adheres to the rules found in `CONTRIBUTING.md`.
4. **Populate `commit.sh`:** You are STRICTLY FORBIDDEN from executing `git commit` directly in the terminal. Instead, you must overwrite/fill the `commit.sh` file located at the root of the repository with the exact command.
    - Format example inside the file: `git commit -m "type(scope): subject" -m "Detailed description of the changes based on the diff."`
5. **Report:** Inform the user that the changes have been analyzed and `commit.sh` is ready for them to review and execute.

**DO NOT** bypass reading `CONTRIBUTING.md` under any circumstances, as the project standards may evolve.