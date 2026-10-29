const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers, loadTsModule } = require('./helpers/transpileHelper');

describe('Arcade Games Runtime Safety Suite', () => {
  const games = [
    {
      name: 'Spot The Bug Duel (SpotTheBugDuelGame.tsx)',
      path: 'src/components/gamification/games/SpotTheBugDuelGame.tsx',
    },
    {
      name: 'Outage Boss Battle (OutageBossBattleGame.tsx)',
      path: 'src/components/gamification/games/OutageBossBattleGame.tsx',
    },
    {
      name: 'Architecture Pipe Puzzle (ArchitecturePuzzleGame.tsx)',
      path: 'src/components/gamification/games/ArchitecturePuzzleGame.tsx',
    },
    {
      name: 'SQL Index & Query Crusher (SqlIndexOptimizerGame.tsx)',
      path: 'src/components/gamification/games/SqlIndexOptimizerGame.tsx',
    },
    {
      name: 'Flashcard Arena (FlashcardArenaGame.tsx)',
      path: 'src/components/gamification/games/FlashcardArenaGame.tsx',
    },
    {
      name: 'Arcade Hub Main Page (src/pages/arcade/index.tsx)',
      path: 'src/pages/arcade/index.tsx',
    },
  ];

  for (const game of games) {
    it(`should transpile ${game.name} cleanly without syntax errors`, () => {
      assert.ok(fs.existsSync(game.path), `File ${game.path} must exist`);
      const jsCode = transpileCode(game.path);
      assert.ok(jsCode && jsCode.length > 100, `Transpiled code for ${game.name} must not be empty`);
    });

    it(`should have 0 undeclared runtime identifiers in ${game.name}`, () => {
      const undeclared = getUndeclaredIdentifiers(game.path);
      assert.deepStrictEqual(
        undeclared,
        [],
        `Found undeclared runtime identifier(s) in ${game.name}: ${undeclared.join(', ')}. This will crash in production!`
      );
    });
  }

  it('SpotTheBugDuelGame.tsx must contain required handlers and state guards', () => {
    const content = fs.readFileSync('src/components/gamification/games/SpotTheBugDuelGame.tsx', 'utf8');
    assert.ok(content.includes('currentChallengeIndex'), 'Must declare currentChallengeIndex');
    assert.ok(content.includes('handleUseTimeWarp'), 'Must define handleUseTimeWarp');
    assert.ok(content.includes('handleUseAnalyzer'), 'Must define handleUseAnalyzer');
    assert.ok(content.includes('handleUseBreakpoint'), 'Must define handleUseBreakpoint');
    assert.ok(content.includes('handleNextChallenge'), 'Must define handleNextChallenge');
    assert.ok(content.includes('handleSelectOption'), 'Must define handleSelectOption');
    assert.ok(content.includes('sanitizeBugCode'), 'Must export sanitizeBugCode');
  });

  it('arcadeRandomizer must pick random non-repeating items and batches across full cycles', () => {
    const { pickRandomUnseenItem, pickRandomUnseenBatch } = loadTsModule('src/utils/arcadeRandomizer.ts');
    const pool = [
      { id: 'q1' },
      { id: 'q2' },
      { id: 'q3' },
      { id: 'q4' },
      { id: 'q5' },
    ];

    let seenIds = [];
    let currentId = undefined;
    const pickedOrder = [];

    for (let i = 0; i < pool.length; i++) {
      const res = pickRandomUnseenItem(pool, seenIds, currentId);
      assert.ok(!pickedOrder.includes(res.item.id), `Item ${res.item.id} was repeated before exhausting pool`);
      pickedOrder.push(res.item.id);
      seenIds = res.nextSeenIds;
      currentId = res.item.id;
    }

    assert.strictEqual(pickedOrder.length, pool.length, 'All items in pool must be visited once before repeating');

    // Next pick after exhausting pool must reset cycle and not repeat the immediately previous item
    const nextAfterReset = pickRandomUnseenItem(pool, seenIds, currentId);
    assert.notStrictEqual(nextAfterReset.item.id, currentId, 'Must not immediately repeat the last item when cycle resets');
    assert.strictEqual(nextAfterReset.nextSeenIds.length, 1, 'Seen list should reset to the newly picked item');

    // Batch test
    const b1 = pickRandomUnseenBatch(pool, 3, []);
    assert.strictEqual(b1.batch.length, 3);
    const b2 = pickRandomUnseenBatch(pool, 2, b1.nextSeenIds);
    assert.strictEqual(b2.batch.length, 2);
    const overlap = b2.batch.filter((x) => b1.batch.some((y) => y.id === x.id));
    assert.strictEqual(overlap.length, 0, 'Second batch must only pick remaining unseen items');
  });

  it('All 4 core Arcade games must use arcadeRandomizer for random non-repeating questions and Skip/Random actions', () => {
    const coreGameFiles = [
      'src/components/gamification/games/SpotTheBugDuelGame.tsx',
      'src/components/gamification/games/OutageBossBattleGame.tsx',
      'src/components/gamification/games/ArchitecturePuzzleGame.tsx',
      'src/components/gamification/games/SqlIndexOptimizerGame.tsx',
    ];
    for (const file of coreGameFiles) {
      const content = fs.readFileSync(file, 'utf8');
      assert.ok(
        content.includes('arcadeRandomizer'),
        `${file} must import and use arcadeRandomizer for random non-repeating question selection`
      );
      assert.ok(
        content.includes('🎲 Random'),
        `${file} must provide a 🎲 Random button to jump to a random unseen question`
      );
    }
  });

  it('ArchitecturePuzzleGame.tsx must implement GonnaCrash drag-and-drop canvas, port wiring, replica scaling, budget HUD, and CRASHED stamp', () => {
    const file = 'src/components/gamification/games/ArchitecturePuzzleGame.tsx';
    const content = fs.readFileSync(file, 'utf8');

    assert.ok(content.includes('gonnacrash-blueprint-canvas'), 'Must render interactive 2D whiteboard canvas');
    assert.ok(content.includes('onDragStart') && content.includes('onDrop'), 'Must support HTML5 drag-and-drop onto canvas');
    assert.ok(content.includes('handleConnectWire') && content.includes('buildWireBezierPath'), 'Must support port-to-port SVG Bezier wire connections');
    assert.ok(content.includes('handleScaleNode'), 'Must support replica scaling (-/+) on placed nodes');
    assert.ok(content.includes('MONTHLY BUDGET'), 'Must display FinOps monthly budget HUD meter');
    assert.ok(content.includes('💥 CRASHED'), 'Must render 💥 CRASHED stamp on failing bottleneck nodes');
    assert.ok(content.includes('shuffledPaletteNodes.map'), 'Must render randomized component palette instead of sorted availableNodes list');
    assert.ok(!content.includes('activeScenario.availableNodes.map((node)'), 'Must not render unshuffled availableNodes directly in palette');

    const { getNodeUnitCost, resolveWiredSequence, shuffleScenarioNodes, buildStageFlowExplanations, buildScenarioRequirements, getScenarioDistractors, DISTRACTOR_COMPONENT_POOL, SYSTEM_DESIGN_PUZZLES } = loadTsModule(file);
    assert.strictEqual(typeof getNodeUnitCost, 'function');
    assert.strictEqual(typeof resolveWiredSequence, 'function');
    assert.strictEqual(typeof shuffleScenarioNodes, 'function');
    assert.strictEqual(typeof buildStageFlowExplanations, 'function');
    assert.strictEqual(typeof buildScenarioRequirements, 'function');
    assert.strictEqual(typeof getScenarioDistractors, 'function');
    assert.ok(Array.isArray(DISTRACTOR_COMPONENT_POOL) && DISTRACTOR_COMPONENT_POOL.length >= 10);

    // Verify every scenario produces complete stage-by-stage flow explanations, FR / NFR / What-To-Do-First specs, and 3 distractor components
    for (const scenario of SYSTEM_DESIGN_PUZZLES) {
      assert.ok(scenario.explanation && scenario.explanation.length > 20, `Scenario ${scenario.id} must have a detailed explanation`);
      const stageSteps = buildStageFlowExplanations(scenario);
      assert.strictEqual(stageSteps.length, scenario.correctSequence.length);
      stageSteps.forEach((step, idx) => {
        assert.strictEqual(step.stageNumber, idx + 1);
        assert.ok(step.whyThisPosition.length > 20, `Stage ${idx + 1} of ${scenario.id} must explain why it sits at this position`);
        assert.ok(step.failureIfMisplaced.length > 20, `Stage ${idx + 1} of ${scenario.id} must explain failure mode if misplaced`);
      });

      const reqs = buildScenarioRequirements(scenario, 2000);
      assert.strictEqual(reqs.functionalRequirements.length, 4, `Scenario ${scenario.id} must have 4 Functional Requirements`);
      assert.strictEqual(reqs.nonFunctionalRequirements.length, 4, `Scenario ${scenario.id} must have 4 Non-Functional Requirements`);
      assert.strictEqual(reqs.whatToDoFirst.length, 3, `Scenario ${scenario.id} must have 3 What-To-Do-First action steps`);
      assert.strictEqual(reqs.whatToDoFirst[0].targetNodeId, scenario.correctSequence[0], 'Step 1 must point to the Stage #1 entrypoint');

      const distractors = getScenarioDistractors(scenario, 3);
      assert.strictEqual(distractors.length, 3, `Scenario ${scenario.id} must include 3 unnecessary distractor components`);
      distractors.forEach((d) => {
        assert.strictEqual(d.isDistractor, true);
        assert.ok(!scenario.correctSequence.includes(d.id), 'Distractor component must not be part of correctSequence');
        assert.ok(d.whyUnnecessary.length > 20, 'Distractor component must explain why it is unnecessary');
      });
    }

    // Verify shuffleScenarioNodes never returns the exact sorted correctSequence order
    const sampleScenario = SYSTEM_DESIGN_PUZZLES[0];
    for (let i = 0; i < 20; i++) {
      const shuffled = shuffleScenarioNodes(sampleScenario.availableNodes, sampleScenario.correctSequence);
      assert.strictEqual(shuffled.length, sampleScenario.availableNodes.length);
      const isExactSameOrder = shuffled.every((n, idx) => n.id === sampleScenario.correctSequence[idx]);
      assert.strictEqual(isExactSameOrder, false, 'Shuffled palette components must never be in the exact sorted solution order');
    }

    const clientCost = getNodeUnitCost('client', 'User Browser');
    assert.strictEqual(clientCost.unitCost, 0);
    assert.strictEqual(clientCost.isClient, true);

    const dbCost = getNodeUnitCost('postgres_db', 'PostgreSQL Primary');
    assert.ok(dbCost.unitCost > 0);
    assert.strictEqual(dbCost.isClient, false);

    // Verify wire graph resolution
    const nodes = [
      { id: 'client', x: 20, y: 20, replicas: 1 },
      { id: 'db', x: 240, y: 20, replicas: 1 },
      { id: 'redis', x: 460, y: 20, replicas: 1 },
    ];
    const wires = [
      { id: 'client->redis', from: 'client', to: 'redis' },
      { id: 'redis->db', from: 'redis', to: 'db' },
    ];
    const resolved = resolveWiredSequence(nodes, wires, 'client');
    assert.deepStrictEqual(resolved.sequence, ['client', 'redis', 'db']);
    assert.deepStrictEqual(resolved.disconnectedIds, []);
  });
});
