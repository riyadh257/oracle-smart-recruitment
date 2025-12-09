#!/bin/bash
# Auto-answer drizzle-kit prompts with "create table" (first option)

# Create a script that sends Enter repeatedly
yes "" | pnpm drizzle-kit push 2>&1 | tee migration.log

echo "Migration completed. Check migration.log for details."
