#!/bin/bash
# Auto-answer all drizzle-kit prompts with "create table" option
yes "" | pnpm drizzle-kit generate
pnpm drizzle-kit migrate
