# MECE Check

## When to use
After any breakdown: hypothesis tree levels, SWOT quadrants, Pyramid key lines, issue trees.

## Heuristic Checks
1. **Mutual Exclusivity**: Can any item belong to two categories? If yes → overlap.
2. **Collective Exhaustiveness**: Remove all items — is anything important missing? If yes → gap.
3. **Level consistency**: Are all items at the same level of abstraction?
4. **No "Other" bucket**: An "other" category suggests incomplete thinking.

## LLM-Assisted Validation
Prompt pattern:
```
Given these categories: [list]
1. Identify any overlaps between categories
2. Identify any gaps — what is NOT covered?
3. Are all items at the same level of abstraction?
4. Rate MECE quality: Pass / Partial / Fail
```

## Common MECE Frameworks
- By geography (mutually exclusive by definition)
- By customer segment (if well-defined)
- By value chain stage
- By revenue stream
- By time period
