---
name: security-audit
description: Run a security audit on a PostPilot file or the whole project. Usage: /security-audit <filepath> OR /security-audit all — checks authentication, authorization, token safety, input validation, and secret management.
---

## Instructions

You are performing a security audit for PostPilot.

### Step 1: Read context
- Security rules: `.claude/rules/security.md`
- Target: `!cat $ARGUMENTS 2>/dev/null || echo "Auditing full project"`

### Step 2: Scan for vulnerabilities

Run these checks dynamically:

```bash
# Check for any types (TypeScript safety)
!grep -rn ": any" --include="*.ts" backend/src/ frontend/src/ | head -20

# Check for hardcoded secrets
!grep -rn "secret\|password\|token\|apikey\|api_key" --include="*.ts" backend/src/ \
  | grep -v "process.env\|REDACTED\|//\|test" | head -20

# Check for console.log with sensitive words
!grep -rn "console\.log.*token\|console\.log.*secret" --include="*.ts" backend/src/ | head -10

# Check for routes without auth middleware
!grep -rn "router\.\(get\|post\|put\|patch\|delete\)" --include="*.ts" backend/src/routes/ \
  | grep -v "requireAuth\|health\|callback" | head -20

# Check for missing Zod validation
!grep -rn "req\.body" --include="*.ts" backend/src/routes/ \
  | grep -v "\.parse\|\.safeParse" | head -20

# Check for SQL without ownership check
!grep -A3 "\.from(" --include="*.ts" -rn backend/src/ \
  | grep -v "user_id\|auth\.uid\|service" | head -20
```

### Step 3: Produce audit report

```
🔒 PostPilot Security Audit
Scope: $ARGUMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CRITICAL (block launch):
  [issue] at [file:line]
  Risk: [what attacker can do]
  Fix: [exact code fix]

🟡 HIGH (fix this week):
  [issue] at [file:line]

🟢 MEDIUM (next sprint):
  [issue] at [file:line]

ℹ️ BEST PRACTICE:
  [suggestion]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Passing checks: [X]/[total]
🎯 Overall Risk Level: LOW | MEDIUM | HIGH | CRITICAL
🚀 Launch Clearance: YES | NO — fix [X] issues first
```
