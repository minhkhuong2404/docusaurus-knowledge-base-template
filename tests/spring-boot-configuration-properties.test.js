const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers, validateJsxEntities } = require('./helpers/transpileHelper');

describe('Spring Boot Configuration & Properties Architecture Suite', () => {
  const docPath = 'docs/technical-knowledge/spring/spring-boot-configuration-properties.md';
  const sidebarPath = 'sidebars.ts';
  const diagramPath = 'src/components/SpringBootConfigPropertiesDiagram.tsx';

  it('Configuration & Properties markdown documentation should exist and cover principal architecture topics', () => {
    assert.ok(fs.existsSync(docPath), `${docPath} must exist`);
    const content = fs.readFileSync(docPath, 'utf8');

    // 17-Level Precedence Hierarchy
    assert.ok(content.includes('17-Level Precedence Hierarchy') || content.includes('Precedence Hierarchy'), 'Must cover precedence hierarchy');
    assert.ok(content.includes('CommandLinePropertySource') || content.includes('Command-Line Arguments'), 'Must cover CLI args');
    assert.ok(content.includes('SPRING_APPLICATION_JSON'), 'Must cover SPRING_APPLICATION_JSON');
    assert.ok(content.includes('System.getProperties()') || content.includes('Java System Properties'), 'Must cover Java System properties');
    assert.ok(content.includes('OS Environment Variables') || content.includes('System.getenv()'), 'Must cover OS environment variables');

    // Precedence Trap (-D vs export)
    assert.ok(content.includes('Precedence Trap') || content.includes('override OS Environment Variables'), 'Must highlight -D vs env var precedence trap');

    // Relaxed Binding Mechanics
    assert.ok(content.includes('Relaxed Binding'), 'Must explain relaxed binding');
    assert.ok(content.includes('SPRING_DATASOURCE_URL'), 'Must provide canonical SPRING_DATASOURCE_URL relaxed binding example');

    // Default variable values & fallbacks
    assert.ok(content.includes('@Value'), 'Must explain @Value default value syntax');
    assert.ok(content.includes('ConversionService') || content.includes('Duration'), 'Must explain rich type coercion like Duration and DataSize');

    // Profile Overrides
    assert.ok(content.includes('spring.profiles.active'), 'Must explain spring.profiles.active');
    assert.ok(content.includes('spring.config.activate.on-profile'), 'Must explain Spring Boot 2.4+ multi-document on-profile');
    assert.ok(content.includes('Profile Groups') || content.includes('profiles.group'), 'Must cover profile groups');

    // @ConfigurationProperties vs @Value
    assert.ok(content.includes('@ConfigurationProperties'), 'Must explain @ConfigurationProperties');
    assert.ok(content.includes('record PaymentProperties') || content.includes('Java Record'), 'Must showcase immutable Java records pattern');
    assert.ok(content.includes('@Validated'), 'Must highlight fail-fast @Validated on configuration records');

    // Production Gotchas
    assert.ok(content.includes('Silent Localhost Fallback') || content.includes('localhost'), 'Must alert about silent localhost fallback trap');
    assert.ok(content.includes('/actuator/env') || content.includes('actuator'), 'Must explain actuator environment secret sanitization');
    assert.ok(content.includes('@RefreshScope'), 'Must explain @RefreshScope dynamic reload race conditions');
  });

  it('sidebars.ts must register the new spring-boot-configuration-properties page', () => {
    assert.ok(fs.existsSync(sidebarPath), `${sidebarPath} must exist`);
    const content = fs.readFileSync(sidebarPath, 'utf8');
    assert.ok(
      content.includes('technical-knowledge/spring/spring-boot-configuration-properties'),
      'sidebars.ts must include technical-knowledge/spring/spring-boot-configuration-properties'
    );
  });

  it('SpringBootConfigPropertiesDiagram.tsx should transpile cleanly and have 0 undeclared variables', () => {
    assert.ok(fs.existsSync(diagramPath), `${diagramPath} must exist`);

    const code = transpileCode(diagramPath);
    assert.ok(code && code.length > 100, 'Transpiled code must not be empty');

    const undeclared = getUndeclaredIdentifiers(diagramPath);
    assert.deepStrictEqual(
      undeclared,
      [],
      `Diagram must have 0 undeclared identifiers, found: ${undeclared.join(', ')}`
    );

    const invalidEntities = validateJsxEntities(diagramPath);
    assert.deepStrictEqual(
      invalidEntities,
      [],
      `Diagram has unescaped raw entities: ${invalidEntities.map(e => e.text).join(', ')}`
    );

    const rawContent = fs.readFileSync(diagramPath, 'utf8');
    assert.ok(rawContent.includes('precedence'), 'Diagram must include precedence tab');
    assert.ok(rawContent.includes('relaxed_binding'), 'Diagram must include relaxed_binding tab');
    assert.ok(rawContent.includes('profile_cascade'), 'Diagram must include profile_cascade tab');
    assert.ok(rawContent.includes('type_safe_props'), 'Diagram must include type_safe_props tab');
  });
});
