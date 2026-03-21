---
id: development
title: Phase 4 — Development
sidebar_label: Development
---

# Phase 4 — Development

## Overview

The **Development phase** is where the system is built according to the approved design. Engineers write code, conduct code reviews, write unit tests, and integrate components. This phase is typically the longest in the SDLC.

The goal is not just to write working code — it is to write **maintainable, tested, secure, and well-documented** code that satisfies the acceptance criteria defined in the Requirements phase.

---

## Goals

- Implement all user stories in the sprint/iteration
- Maintain code quality standards (coverage, Sonar gates, style)
- Continuously integrate code through CI/CD pipelines
- Identify and resolve defects as early as possible

---

## Entry Criteria

- System design is approved
- Development environment is configured
- User stories have acceptance criteria and are estimated
- Sprint is planned and committed

---

## Development Standards

### Branching Strategy (Git Flow)

```
main                    ← Production-ready code only
  └── release/1.2.0     ← Release preparation branch
        └── develop     ← Integration branch
              └── feature/JIRA-123-add-transaction-filter
              └── feature/JIRA-124-export-csv
              └── bugfix/JIRA-200-fix-null-pointer
              └── hotfix/JIRA-999-critical-payment-issue (from main)
```

**Branch naming convention:**
- `feature/TICKET-ID-short-description`
- `bugfix/TICKET-ID-short-description`
- `hotfix/TICKET-ID-short-description`
- `release/VERSION`

### Commit Message Convention (Conventional Commits)

```
feat(transactions): add date range filter to transaction history API
fix(auth): resolve token refresh race condition under high concurrency
test(transactions): add unit tests for date range validation edge cases
refactor(domain): extract TransactionMapper to dedicated MapStruct interface
docs(api): update OpenAPI spec for transaction filter endpoint
chore(deps): bump Spring Boot from 3.1.5 to 3.2.0
```

### Code Review Standards

Every PR must:
- [ ] Address a single concern (one feature or bugfix)
- [ ] Include unit tests for new logic
- [ ] Pass CI pipeline (build, test, Sonar gate)
- [ ] Be reviewed by at least one peer before merge
- [ ] Not decrease code coverage below threshold
- [ ] Address all reviewer comments before merging

---

## Java / Spring Boot Code Standards

### Controller Layer

```java
@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<Page<TransactionDto>> getTransactions(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 20, sort = "createdAt",
                             direction = Sort.Direction.DESC) Pageable pageable) {

        log.debug("Fetching transactions for user={} from={} to={}",
                  principal.getUserId(), fromDate, toDate);

        Page<TransactionDto> result = transactionService
                .findTransactions(principal.getUserId(), fromDate, toDate, pageable);

        return ResponseEntity.ok(result);
    }
}
```

### Service Layer

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;

    public Page<TransactionDto> findTransactions(
            UUID userId,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable) {

        validateDateRange(fromDate, toDate);

        return transactionRepository
                .findByUserIdAndCreatedAtBetween(
                        userId,
                        toInstantStart(fromDate),
                        toInstantEnd(toDate),
                        pageable)
                .map(transactionMapper::toDto);
    }

    private void validateDateRange(LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new InvalidDateRangeException(
                "fromDate must not be after toDate");
        }
    }
}
```

### Exception Handling

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidDateRangeException.class)
    public ResponseEntity<ErrorResponse> handleInvalidDateRange(
            InvalidDateRangeException ex, HttpServletRequest request) {
        log.warn("Invalid date range: {}", ex.getMessage());
        return ResponseEntity.unprocessableEntity()
                .body(ErrorResponse.of("INVALID_DATE_RANGE", ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(
            Exception ex, HttpServletRequest request) {
        log.error("Unexpected error on {}", request.getRequestURI(), ex);
        return ResponseEntity.internalServerError()
                .body(ErrorResponse.of("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}
```

---

## CI Pipeline (GitHub Actions)

```yaml
name: CI

on:
  push:
    branches: [develop, main, 'release/**']
  pull_request:
    branches: [develop, main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Build and test
        run: mvn verify -B

      - name: SonarQube Analysis
        run: mvn sonar:sonar -B
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: target/site/jacoco/
```

---

## Exit Criteria

- [ ] All stories in the sprint are implemented and demo-ready
- [ ] Unit test coverage ≥ 80% for new code
- [ ] Sonar quality gate is green (no blocker/critical issues)
- [ ] All PRs are reviewed and merged to develop
- [ ] CI pipeline is green on develop
- [ ] API documentation (Swagger) is up to date
- [ ] No TODO/FIXME comments in production-bound code

---

:::caution Definition of Done Reminder
A story is NOT done until it has passing unit tests, a peer code review, and QA sign-off on acceptance criteria. "Works on my machine" is not done.
:::
