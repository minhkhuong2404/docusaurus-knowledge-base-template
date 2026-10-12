const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers, validateJsxEntities } = require('./helpers/transpileHelper');

describe('UUID & Unique Identifier Architecture Suite (Monis Yousuf Analysis)', () => {
  const timeAndOrderingDoc = 'docs/technical-knowledge/system-design/time-and-ordering-and-unique-ids.md';
  const relationalFundamentalsDoc = 'docs/technical-knowledge/database/relational-fundamentals.md';
  const databaseDesignDoc = 'docs/technical-knowledge/database/database-design.md';
  const systemDesignCourseDoc = 'docs/technical-knowledge/system-design/full-system-design-course.md';
  const diagramPath = 'src/components/TimeAndUniqueIdDiagram.tsx';

  it('Time and Ordering doc should cover comprehensive UUIDv7 and Monis Yousuf concepts', () => {
    assert.ok(fs.existsSync(timeAndOrderingDoc), `${timeAndOrderingDoc} must exist`);
    const content = fs.readFileSync(timeAndOrderingDoc, 'utf8');

    assert.ok(content.includes('Monis Yousuf'), 'Must reference Monis Yousuf architectural analysis');
    assert.ok(content.includes('RFC 9562'), 'Must reference RFC 9562 standard for UUIDv7');
    assert.ok(content.includes('German Tank Problem'), 'Must explain the German Tank Problem business leakage');
    assert.ok(content.includes('Page Split') || content.includes('page split'), 'Must explain B-Tree page split physics');
    assert.ok(content.includes('Buffer Pool') || content.includes('buffer pool'), 'Must explain buffer pool cache thrashing');
    assert.ok(content.includes('UUIDv4') && content.includes('UUIDv7'), 'Must compare UUIDv4 and UUIDv7');
    assert.ok(content.includes('48-bit') || content.includes('48 bits'), 'Must detail UUIDv7 48-bit timestamp');
  });

  it('Relational Fundamentals doc should cover clustered index page splits and UUIDv7', () => {
    assert.ok(fs.existsSync(relationalFundamentalsDoc), `${relationalFundamentalsDoc} must exist`);
    const content = fs.readFileSync(relationalFundamentalsDoc, 'utf8');

    assert.ok(content.includes('UUIDv7') && content.includes('UUIDv4'), 'Must discuss UUIDv7 and UUIDv4 as primary keys');
    assert.ok(content.includes('Page Split') || content.includes('page split'), 'Must explain B-Tree page split implications');
    assert.ok(content.includes('RFC 9562'), 'Must reference RFC 9562');
  });

  it('Database Design doc should cover surrogate primary key strategies', () => {
    assert.ok(fs.existsSync(databaseDesignDoc), `${databaseDesignDoc} must exist`);
    const content = fs.readFileSync(databaseDesignDoc, 'utf8');

    assert.ok(content.includes('Surrogate Key Architecture') || content.includes('Surrogate Primary Key'), 'Must cover surrogate keys');
    assert.ok(content.includes('German Tank Problem'), 'Must discuss German Tank Problem in database design');
    assert.ok(content.includes('UUIDv7'), 'Must discuss UUIDv7');
    assert.ok(content.includes('Fill Factor') || content.includes('fill factor'), 'Must discuss fill factor bloat');
  });

  it('Full System Design Course doc should cross-reference primary key trade-offs', () => {
    assert.ok(fs.existsSync(systemDesignCourseDoc), `${systemDesignCourseDoc} must exist`);
    const content = fs.readFileSync(systemDesignCourseDoc, 'utf8');

    assert.ok(content.includes('UUIDv7') && content.includes('RFC 9562'), 'Must cross-reference UUIDv7 RFC 9562 in module 2');
  });

  it('TimeAndUniqueIdDiagram.tsx should transpile cleanly and have 0 undeclared variables', () => {
    assert.ok(fs.existsSync(diagramPath), `${diagramPath} must exist`);
    const code = transpileCode(diagramPath);
    assert.ok(code && code.length > 100, 'Transpiled code must not be empty');

    const undeclared = getUndeclaredIdentifiers(diagramPath);
    assert.deepStrictEqual(undeclared, [], `Diagram must have 0 undeclared identifiers, found: ${undeclared.join(', ')}`);

    const invalidEntities = validateJsxEntities(diagramPath);
    assert.deepStrictEqual(invalidEntities, [], `Diagram has unescaped raw entities: ${invalidEntities.map(e => e.text).join(', ')}`);

    const rawContent = fs.readFileSync(diagramPath, 'utf8');
    assert.ok(rawContent.includes('decision_matrix'), 'Diagram must include decision_matrix tab');
    assert.ok(rawContent.includes('Monis Yousuf'), 'Diagram must reference Monis Yousuf');
    assert.ok(rawContent.includes('UUIDv7'), 'Diagram must include UUIDv7');
  });
});
