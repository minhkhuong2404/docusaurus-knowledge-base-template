const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

describe('Senior/Staff Interview Playbook Test Suite (Java & Spring)', () => {
  const javaDoc = 'docs/technical-knowledge/java/java-interview-questions.md';
  const springDoc = 'docs/technical-knowledge/spring/spring-interview-questions.md';
  const springBootDoc = 'docs/technical-knowledge/spring/spring-boot-interview-questions.md';
  const jpaDoc = 'docs/technical-knowledge/spring/spring-data-jpa-interview-questions.md';

  it('Java interview doc must contain Senior/Staff Playbook and classic interviewer traps', () => {
    assert.ok(fs.existsSync(javaDoc), `${javaDoc} must exist`);
    const content = fs.readFileSync(javaDoc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: How to Ace Java Technical Interviews'));
    assert.ok(content.includes('Custom HashMap keys must be strictly IMMUTABLE'));
    assert.ok(content.includes('ZERO atomicity for compound operations'));
    assert.ok(content.includes('Carrier Thread Pinning'));
    assert.ok(content.includes('ThreadLocalMap'));
    assert.ok(content.includes('Thread.currentThread().isInterrupted()'));
  });

  it('Spring Framework interview doc must contain Senior/Staff Playbook and classic interviewer traps', () => {
    assert.ok(fs.existsSync(springDoc), `${springDoc} must exist`);
    const content = fs.readFileSync(springDoc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: How to Ace Spring Framework Interviews'));
    assert.ok(content.includes('AOP Proxy Bypass (Self-Invocation Trap)'));
    assert.ok(content.includes('BeanCurrentlyInCreationException'));
    assert.ok(content.includes('rollbackFor = Exception.class'));
    assert.ok(content.includes('ObjectProvider'));
    assert.ok(content.includes('ApplicationContext'));
  });

  it('Spring Boot interview doc must contain Senior/Staff Playbook and classic interviewer traps', () => {
    assert.ok(fs.existsSync(springBootDoc), `${springBootDoc} must exist`);
    const content = fs.readFileSync(springBootDoc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: How to Ace Spring Boot Architecture Interviews'));
    assert.ok(content.includes('HikariCP sizing formula'));
    assert.ok(content.includes('Liveness Probe'));
    assert.ok(content.includes('Readiness Probe'));
    assert.ok(content.includes('Total RSS'));
    assert.ok(content.includes('proxyBeanMethods = false'));
    assert.ok(content.includes('17-tier precedence hierarchy'));
  });

  it('Spring Data JPA interview doc must contain Senior/Staff Playbook and classic interviewer traps', () => {
    assert.ok(fs.existsSync(jpaDoc), `${jpaDoc} must exist`);
    const content = fs.readFileSync(jpaDoc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: How to Ace JPA & Hibernate Interviews'));
    assert.ok(content.includes('JOIN FETCH'));
    assert.ok(content.includes('entityManager.clear()'));
    assert.ok(content.includes('Disables Hibernate Dirty Checking Snapshots'));
    assert.ok(content.includes('spring.jpa.open-in-view=false'));
    assert.ok(content.includes('Optimistic Locking'));
    assert.ok(content.includes('Pessimistic Locking'));
  });

  it('SOLID Principles doc must contain Senior/Staff Playbook, Liskov-Wing rules, and architectural trade-offs', () => {
    const solidDoc = 'docs/technical-knowledge/low-level-design/oop/principles.md';
    assert.ok(fs.existsSync(solidDoc), `${solidDoc} must exist`);
    const content = fs.readFileSync(solidDoc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: How to Ace SOLID & OOP in Senior Interviews'));
    assert.ok(content.includes('Barbara Liskov & Jeannette Wing, 1994'));
    assert.ok(content.includes('Square vs. Rectangle Geometry Paradox'));
    assert.ok(content.includes('Preconditions Cannot Be Strengthened'));
    assert.ok(content.includes('Postconditions Cannot Be Weakened'));
    assert.ok(content.includes('Class Invariants Must Be Preserved'));
    assert.ok(content.includes('Collections.unmodifiableList(list).add(...)'));
    assert.ok(content.includes('When to Intentionally Violate SRP'));
    assert.ok(content.includes('Domain-Driven Design (DDD) Aggregates'));
    assert.ok(content.includes('When to Intentionally Violate OCP'));
    assert.ok(content.includes('The "Rule of Three" in Refactoring'));
    assert.ok(content.includes('The Architecture Triad: DIP vs. DI vs. IoC'));
    assert.ok(content.includes('Hollywood Principle'));
    assert.ok(content.includes('Composition over Inheritance'));
  });

  it('Design Patterns Overview doc must contain Senior/Staff Playbook, JVM runtime truth, and distributed mapping', () => {
    const patternDoc = 'docs/technical-knowledge/design-patterns/design-patterns-overview.md';
    assert.ok(fs.existsSync(patternDoc), `${patternDoc} must exist`);
    const content = fs.readFileSync(patternDoc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: How to Ace Design Pattern Interviews'));
    assert.ok(content.includes('JVM & Spring Framework Runtime Engine Truth for Core Patterns'));
    assert.ok(content.includes('Double-Checked Locking (DCL) with `volatile`'));
    assert.ok(content.includes('StoreStore'));
    assert.ok(content.includes('StoreLoad'));
    assert.ok(content.includes('Initialization-on-Demand Holder Idiom'));
    assert.ok(content.includes('Enum Singleton'));
    assert.ok(content.includes('JDK Dynamic Proxy'));
    assert.ok(content.includes('CGLIB / ByteBuddy'));
    assert.ok(content.includes('Self-Invocation Trap in Spring Proxies'));
    assert.ok(content.includes('Lapsed Listener Memory Leak'));
    assert.ok(content.includes('Rule 1: Never Start an LLD Interview by Naming a Pattern'));
    assert.ok(content.includes('Cognitive Tax of Indirection'));
    assert.ok(content.includes('Mapping GoF (In-Process) to Modern Distributed/Cloud Architecture'));
    assert.ok(content.includes('Transactional Outbox Pattern'));
    assert.ok(content.includes('Distributed Saga Orchestrator'));
  });

  it('OOP Concepts doc must contain Senior/Staff Playbook, Anemic vs Rich models, and fragile base class traps', () => {
    const doc = 'docs/technical-knowledge/low-level-design/oop/concepts.md';
    assert.ok(fs.existsSync(doc), `${doc} must exist`);
    const content = fs.readFileSync(doc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: Passing OOP in Senior Interviews'));
    assert.ok(content.includes('Modern OOP: Data-Oriented Programming (Java 17/21)'));
    assert.ok(content.includes('The Anemic Domain Model vs. Rich Domain Model Trap'));
    assert.ok(content.includes('The Fragile Base Class Problem & Defensive Copying'));
    assert.ok(content.includes('List.copyOf'));
  });

  it('LLD Patterns Overview doc must contain 5-stage protocol and premature abstraction guidance', () => {
    const doc = 'docs/technical-knowledge/low-level-design/design-patterns/overview.md';
    assert.ok(fs.existsSync(doc), `${doc} must exist`);
    const content = fs.readFileSync(doc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: Mastering Pattern Trade-offs in LLD'));
    assert.ok(content.includes('The 5-Stage Senior LLD Execution Protocol'));
    assert.ok(content.includes('The Anti-Pattern of Premature Abstraction'));
    assert.ok(content.includes('Rule of Three'));
  });

  it('LLD Creational Patterns doc must contain Senior Playbook and production gotchas', () => {
    const doc = 'docs/technical-knowledge/low-level-design/design-patterns/creational.md';
    assert.ok(fs.existsSync(doc), `${doc} must exist`);
    const content = fs.readFileSync(doc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: Creational Patterns in Production'));
    assert.ok(content.includes('The Singleton in Distributed Environments'));
    assert.ok(content.includes('The Lombok `@Builder` Collection Null-Pointer Trap'));
    assert.ok(content.includes('Static Factory Methods vs. Abstract Factory Hell'));
  });

  it('LLD Structural Patterns doc must contain Senior Playbook and disambiguation matrix', () => {
    const doc = 'docs/technical-knowledge/low-level-design/design-patterns/structural.md';
    assert.ok(fs.existsSync(doc), `${doc} must exist`);
    const content = fs.readFileSync(doc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: Structural Patterns in Production'));
    assert.ok(content.includes('The "Big 4" Confusion Disambiguation'));
    assert.ok(content.includes('The Decorator Order-of-Execution Trap'));
    assert.ok(content.includes('The Proxy Self-Invocation Bypass'));
  });

  it('LLD Behavioral Patterns doc must contain Senior Playbook and Strategy vs State comparison', () => {
    const doc = 'docs/technical-knowledge/low-level-design/design-patterns/behavioral.md';
    assert.ok(fs.existsSync(doc), `${doc} must exist`);
    const content = fs.readFileSync(doc, 'utf8');

    assert.ok(content.includes('Senior/Staff Interview Playbook: Behavioral Patterns in Production'));
    assert.ok(content.includes('The Classic Showdown: Strategy vs. State'));
    assert.ok(content.includes('The Observer Synchronous Blocking Trap'));
    assert.ok(content.includes('The Chain of Responsibility "Black Hole"'));
  });

  it('senior-interview-playbook skill and reference manual must exist and enforce mandatory interview tips & traps', () => {
    const skillPath = '.agents/skills/senior-interview-playbook/SKILL.md';
    const refPath = '.agents/skills/senior-interview-playbook/references/INTERVIEW_PLAYBOOK_GUIDELINES.md';
    const agentsPath = '.agents/AGENTS.md';

    assert.ok(fs.existsSync(skillPath), `${skillPath} must exist`);
    assert.ok(fs.existsSync(refPath), `${refPath} must exist`);
    assert.ok(fs.existsSync(agentsPath), `${agentsPath} must exist`);

    const skillContent = fs.readFileSync(skillPath, 'utf8');
    assert.ok(skillContent.includes('name: senior-interview-playbook'));
    assert.ok(skillContent.includes('The Senior Framing Strategy'));
    assert.ok(skillContent.includes('Classic Interviewer Traps & Principal Rebuttals'));
    assert.ok(skillContent.includes('Mid-Level vs. Principal Candidate Cheat Sheet'));

    const refContent = fs.readFileSync(refPath, 'utf8');
    assert.ok(refContent.includes('Domain-Specific Interview Trap Catalog'));
    assert.ok(refContent.includes('Ready-to-Use Markdown Template'));

    const agentsContent = fs.readFileSync(agentsPath, 'utf8');
    assert.ok(agentsContent.includes('MANDATORY: Always Apply senior-interview-playbook Skill for Every Knowledge Added'));
  });
});
