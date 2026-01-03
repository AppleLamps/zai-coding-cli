# Plan: Improve Agent UI to Match Claude Code Style

## Overview

This plan outlines changes to transform the current spinner/boxen-based UI into a Claude Code-style interface with bullet points, nested tree output, and compact formatting.

---

## Visual Comparison

### Current Style
```
⠙ Running "npm test"...
✓ Ran npm test.
┌─ Command Output ───────────────────────────┐
│ 12 tests passed                            │
└────────────────────────────────────────────┘
```

### Target Style (Claude Code)
```
• Bash npm test
  └ 12 tests passed
```

---

## Changes Required

### 1. Replace Spinner with Bullet-Style Tool Display

**File: `src/ui/terminal.ts`**

**Current behavior:**
- `startToolSpinner()` shows animated spinner: `⠙ Running "npm test"...`
- `endToolSpinner()` shows checkmark: `✓ Ran npm test.`

**New behavior:**
- `writeToolStart()` shows bullet with tool name: `• Bash npm test`
- `writeToolResult()` shows nested result: `  └ 12 tests passed`

**Changes:**
```typescript
// Add new method
writeToolAction(toolName: string, target: string) {
  const formattedName = chalk.bold(this.formatToolName(toolName));
  console.log(`• ${formattedName} ${target}`);
}

// Add new method
writeToolResult(result: string) {
  console.log(chalk.dim(`  └ ${result}`));
}

// Helper to format tool names to match Claude Code style
formatToolName(name: string): string {
  const nameMap: Record<string, string> = {
    'read_file': 'Read',
    'write_file': 'Write',
    'edit_file': 'Edit',
    'run_command': 'Bash',
    'list_files': 'Glob',
    'search_project': 'Grep',
    'git_commit': 'Bash',
    'web_search': 'WebSearch',
    'read_url': 'WebFetch'
  };
  return nameMap[name] || name;
}
```

---

### 2. Compact Diff Display with Collapsible Lines

**File: `src/ui/terminal.ts`**

**Current behavior:**
- Full boxen box with all diff lines
- `... 50 more lines hidden` at bottom

**New behavior:**
- Inline diff display without box borders
- Clickable/collapsible: `Show full diff (26 more lines)`

**Changes to `writeDiff()` method:**
```typescript
writeDiff(diff: string, title = "Proposed Edit") {
  // Show first 10 lines inline
  const lines = diff.split(/\r?\n/);
  const previewLines = 10;
  const visible = lines.slice(0, previewLines);

  // Render without box, just indented colored lines
  for (const line of visible) {
    console.log(`  ${this.colorDiffLine(line)}`);
  }

  if (lines.length > previewLines) {
    const remaining = lines.length - previewLines;
    console.log(chalk.dim(`    Show full diff (${remaining} more lines)`));
  }
}
```

---

### 3. Nested Command Output Display

**File: `src/ui/terminal.ts`**

**Current behavior:**
- Boxed output with `Command Output` title
- Separate from tool completion

**New behavior:**
- Nested under tool action with `└` prefix
- Compact, no box borders

**Changes to `writeCommandOutput()` method:**
```typescript
writeCommandOutput(output: string, maxLines = 4) {
  const lines = output.trim().split(/\r?\n/);
  const visible = lines.slice(-maxLines); // Show last N lines

  for (let i = 0; i < visible.length; i++) {
    const prefix = i === 0 ? '└' : ' ';
    console.log(chalk.dim(`  ${prefix} ${visible[i]}`));
  }
}
```

---

### 4. Update Agent Tool Callbacks

**File: `src/agent.ts`**

**Current behavior:**
```typescript
this.onToolStart?.(startMessage);  // → startToolSpinner()
this.onToolEnd?.(summary);         // → endToolSpinner()
```

**New behavior:**
```typescript
// Pass structured data instead of just message strings
this.onToolAction?.(toolName, target);   // → writeToolAction()
this.onToolResult?.(toolName, result);   // → writeToolResult()
```

**Update `describeToolStart()` to return structured data:**
```typescript
private getToolDisplayInfo(name: string, args: unknown): { tool: string; target: string } {
  switch (name) {
    case 'read_file':
      return { tool: 'Read', target: this.extractStringArg(args, 'path') || 'file' };
    case 'run_command':
      return { tool: 'Bash', target: this.extractStringArg(args, 'command') || 'command' };
    case 'edit_file':
      return { tool: 'Edit', target: this.extractStringArg(args, 'path') || 'file' };
    // ... etc
  }
}
```

**Update `summarizeToolResult()` to return compact results:**
```typescript
// Current: "Read src/index.ts."
// New: "Read 100 lines"

private getToolResultDisplay(name: string, args: unknown, result: string): string {
  switch (name) {
    case 'read_file': {
      const lineCount = result.split('\n').length;
      return `Read ${lineCount} lines`;
    }
    case 'run_command': {
      // Extract exit code or summary
      return result.includes('exit code 0') ? 'Success' : 'Completed';
    }
    // ... etc
  }
}
```

---

### 5. Remove Boxen for Most Output

**File: `src/ui/terminal.ts`**

Replace boxed output with indented text for:
- Tool results
- Command output
- Search results

Keep boxen only for:
- Permission panels (dangerous operations)
- Error messages (critical)

---

### 6. Update Permission Panels Style

**Current:**
```
┌─ Run Command ─────────────────┐
│ rm -rf important_folder       │
└───────────────────────────────┘
? Allow this command? (y/N)
```

**New (Claude Code style):**
```
• Bash rm -rf important_folder
  ⚠ This command requires approval
  ? Allow this command? (y/N)
```

---

### 7. File Structure Changes Summary

| File | Changes |
|------|---------|
| `src/ui/terminal.ts` | Add `writeToolAction()`, `writeToolResult()`, `formatToolName()`. Update `writeDiff()`, `writeCommandOutput()`. Remove spinner dependency for tools. |
| `src/agent.ts` | Update tool callbacks to pass structured data. Modify `describeToolStart()` and `summarizeToolResult()`. |
| `src/index.ts` | Update callback wiring if needed. |

---

## Implementation Steps

### Step 1: Add New UI Methods
- [ ] Add `writeToolAction(toolName: string, target: string)`
- [ ] Add `writeToolResult(result: string)`
- [ ] Add `formatToolName(name: string)` helper
- [ ] Add `colorDiffLine(line: string)` helper

### Step 2: Update Diff Display
- [ ] Modify `writeDiff()` to show inline without box
- [ ] Add collapsible line count indicator
- [ ] Keep diff coloring (green/red for +/-)

### Step 3: Update Command Output
- [ ] Modify `writeCommandOutput()` to use nested tree format
- [ ] Remove boxen wrapper
- [ ] Show last N lines with `└` prefix

### Step 4: Update Agent Callbacks
- [ ] Change `onToolStart` to `onToolAction` with structured params
- [ ] Change `onToolEnd` to `onToolResult` with display-ready string
- [ ] Update `describeToolStart()` → `getToolDisplayInfo()`
- [ ] Update `summarizeToolResult()` → `getToolResultDisplay()`

### Step 5: Wire Up New Callbacks
- [ ] Update `src/index.ts` to use new callback signatures
- [ ] Test each tool type displays correctly

### Step 6: Simplify Permission Panels
- [ ] Update `renderPermissionPanel()` to use inline format
- [ ] Remove box for most operations
- [ ] Keep warning indicator (⚠) for dangerous ops

### Step 7: Testing & Polish
- [ ] Test read_file displays as `• Read /path/file` → `└ Read N lines`
- [ ] Test run_command displays as `• Bash command` → `└ output`
- [ ] Test edit_file shows compact diff
- [ ] Verify permission prompts work correctly

---

## Example Output After Changes

```
[ACT] > Read the main entry file and run tests

• Read src/index.ts
  └ Read 45 lines

• Read package.json
  └ Read 32 lines

• Bash npm test
  └ > jest --coverage
    PASS src/index.test.ts
    12 tests passed

• Edit src/utils.ts
  --- a/src/utils.ts
  +++ b/src/utils.ts
  @@ -10,3 +10,5 @@
  -const old = true;
  +const new = false;
    Show full diff (8 more lines)

  ? Apply this edit? (y/N)

The tests are passing and I've updated the utility file.

⚡ 12,340/200,000  in 8,234  out 4,106  $0.08  Context 2  Mode ACT
```

---

## Notes

- Keep the status bar at bottom (this matches Claude Code)
- Maintain color scheme (green for success, red for errors)
- Preserve the PLAN/ACT mode toggle functionality
- Keep Ctrl+C abort support
