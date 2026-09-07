import type { QuizQuestion } from '../../../components/DailyQuiz';
import type { ChapterFlashcard } from '../types';

/** One flashcard per learning ### in chapter-03.md (excludes Rules Summary & Exam Vignettes). */
export const chapter03Flashcards: ChapterFlashcard[] = [
  {
    id: 'c3-blocks',
    section: 'Statements and Blocks',
    front: 'Statement vs block, and the no-braces if trap?',
    back: 'A statement ends with `;`. A block `{ }` groups zero or more statements anywhere a single statement is allowed. Indentation is ignored. Without braces, only the first statement after `if` is conditional.',
    notes: 'A second indented line after a bare if still always runs.',
  },
  {
    id: 'c3-if-else',
    section: 'The `if` / `else` Statements',
    front: 'What type must an if condition be?',
    back: 'The condition must be a boolean expression. Integers and other types are not coerced to boolean the way they are in C or JavaScript, so `if (hour)` does not compile.',
    notes: '`if (hour = 1)` also fails — assignment yields int, not boolean.',
  },
  {
    id: 'c3-pattern-instanceof',
    section: 'Pattern Matching with `instanceof`',
    front: 'What does pattern instanceof buy you, including null?',
    back: 'Java 16+ combines the type test and cast: `obj instanceof Integer data` binds a pattern variable. Mark it `final` to forbid reassignment. null fails the test, so the pattern block is skipped without NPE.',
    notes: '`instanceof final Integer data` then `data = 10` does not compile.',
  },
  {
    id: 'c3-classic-switch',
    section: 'Classic `switch` Statements',
    front: 'Allowed selector types, case constants, arrow vs colon?',
    back: 'Selectors: byte/short/char/int and wrappers, String, enum, var resolving to those; not boolean/long/float/double. Cases need compile-time constants. Do not mix `->` and `:`. Colon cases fall through without break; arrows do not.',
    notes: '`case apples` fails if apples is not final; method-init finals are not constant enough.',
  },
  {
    id: 'c3-switch-expr',
    section: '`switch` Expressions',
    front: 'How do switch expressions return values with yield?',
    back: 'A switch expression produces a value (assignment needs a trailing `;`). Arrow cases can yield a value directly; blocks use `yield`. `return` inside a switch expression tries to leave the enclosing method and is usually wrong.',
    notes: '`yield` needs a semicolon; confuse it with `return` on the exam.',
  },
  {
    id: 'c3-loops',
    section: 'Loop Structures',
    front: 'while vs do-while vs for vs for-each pitfalls?',
    back: '`while` may run zero times; `do-while` runs at least once. `while(false){...}` is unreachable. Traditional for parts are optional (`for(;;)`). for-each needs array/Iterable; assigning the loop variable does not mutate the underlying array/list.',
    notes: '`for (int i=0, long j=10; ...)` fails — same declared type only.',
  },
  {
    id: 'c3-branch-labels',
    section: 'Branching and Labeled Statements',
    front: 'break vs continue, and what labels change?',
    back: '`break` leaves the innermost loop; `continue` skips to that loop’s next iteration. A label before a loop lets `break`/`continue` target an outer loop.',
    notes: 'Unlabeled break never jumps past the outer loop by itself.',
  },
  {
    id: 'c3-flow-scope',
    section: 'Flow Scoping',
    front: 'When is a pattern variable in scope after instanceof?',
    back: 'Scope follows paths where the match is proven. `instanceof T data && ...` can use data on the right; `||` cannot. After `if (!(obj instanceof T data)) return;`, data is in scope for the rest of the method.',
    notes: 'Using the pattern variable in the failing branch does not compile.',
  },
  {
    id: 'c3-switch-patterns',
    section: 'Switch Pattern Matching & Guard Clauses (Java 21)',
    front: 'Patterns, when guards, and case null?',
    back: 'Java 21 can switch on any object with type patterns. `when` adds a guard on the pattern variable. `case null` handles null; without it, a null selector throws NPE.',
    notes: 'Put guarded Integer cases before a plain `case Integer i` or dominance bites.',
  },
  {
    id: 'c3-exhaustiveness',
    section: 'Exhaustiveness in Switch Statements',
    front: 'When must a switch cover all paths?',
    back: 'Switch expressions and pattern-matching switches must be exhaustive (default or full coverage). A classic statement switch need not be. Enum expressions covering every constant need no default.',
    notes: 'Pattern switch on Object with only `case String` fails without default.',
  },
  {
    id: 'c3-dominance',
    section: 'Dominance (Pattern Ordering)',
    front: 'What makes a case dominated / unreachable?',
    back: 'Cases are checked top-down. A broader or identical earlier case dominates a later one (e.g., Number before Integer). An unguarded pattern dominates a later guarded pattern of the same type.',
    notes: 'Narrow/guarded patterns must appear before wider/unguarded ones.',
  },
];

export const chapter03Easy: QuizQuestion[] = [
  {
    id: 'ocp-ch03-e1',
    topic: 'Making Decisions',
    difficulty: 'easy',
    questionText: 'Without braces, how many statements does an if control?',
    options: [
      'All indented lines',
      'Only the next statement',
      'The whole method',
      'None',
    ],
    correctOptionIndex: 1,
    explanation:
      'Only the immediately following statement is conditional. Later lines run regardless of indentation. Braces are required to guard multiple statements.',
  },
  {
    id: 'ocp-ch03-e2',
    topic: 'Making Decisions',
    difficulty: 'easy',
    questionText: 'Does if (hour) compile when hour is int?',
    options: [
      'Yes — nonzero is true',
      'No — condition must be boolean',
      'Yes — always false',
      'Only in Java 21',
    ],
    correctOptionIndex: 1,
    explanation:
      'Java requires a boolean condition. Unlike C/JS, ints are not truthy. Assigning inside if also fails unless the assigned type is boolean.',
  },
  {
    id: 'ocp-ch03-e3',
    topic: 'Making Decisions',
    difficulty: 'easy',
    questionText: 'Which type cannot be a classic switch selector?',
    options: ['String', 'int', 'long', 'enum'],
    correctOptionIndex: 2,
    explanation:
      'long (and boolean/float/double) are not classic switch selectors. String, int, and enums are allowed. Pattern switches still do not revive long as a primitive selector.',
  },
  {
    id: 'ocp-ch03-e4',
    topic: 'Making Decisions',
    difficulty: 'easy',
    questionText: 'do-while vs while when the condition starts false?',
    options: [
      'Both run zero times',
      'do-while runs once; while runs zero',
      'while runs once; do-while runs zero',
      'Both infinite',
    ],
    correctOptionIndex: 1,
    explanation:
      'do-while checks after the body, so it runs once. while checks first and skips entirely. Infinite loops need a forever-true condition.',
  },
  {
    id: 'ocp-ch03-e5',
    topic: 'Making Decisions',
    difficulty: 'easy',
    questionText: 'What does unlabeled break do in nested loops?',
    options: [
      'Exits all loops',
      'Exits only the innermost loop',
      'Skips one iteration',
      'Exits the method',
    ],
    correctOptionIndex: 1,
    explanation:
      'Unlabeled break leaves the innermost loop only. continue skips an iteration. Exiting an outer loop needs a label (or return).',
  },
  {
    id: 'ocp-ch03-e6',
    topic: 'Making Decisions',
    difficulty: 'easy',
    questionText: 'Pattern matching: if (obj instanceof String s) — what is s?',
    options: [
      'Still needs an explicit cast',
      'A pattern variable already cast to String',
      'Always null',
      'A compile error in Java 21',
    ],
    correctOptionIndex: 1,
    explanation:
      'The pattern variable is bound and cast when the test succeeds. You do not write a second cast. null fails the test so the block is skipped.',
  },
  {
    id: 'ocp-ch03-e7',
    topic: 'Making Decisions',
    difficulty: 'easy',
    questionText: 'In a switch expression, which keyword returns a value from a case block?',
    options: ['return', 'yield', 'break', 'continue'],
    correctOptionIndex: 1,
    explanation:
      '`yield` supplies the switch expression’s result from a block. `return` targets the enclosing method. break/continue are for loops/statement switches, not expression results.',
  },
  {
    id: 'ocp-ch03-e8',
    topic: 'Making Decisions',
    difficulty: 'easy',
    questionText: 'for ( ; ; ) { } is…',
    options: [
      'A compile error',
      'A valid infinite loop',
      'Same as while(false)',
      'Illegal empty header',
    ],
    correctOptionIndex: 1,
    explanation:
      'All three for-header parts are optional, so empty headers are an infinite loop like while(true). while(false) with a body is unreachable and fails to compile.',
  },
];

export const chapter03Medium: QuizQuestion[] = [
  {
    id: 'ocp-ch03-m1',
    topic: 'Making Decisions',
    difficulty: 'medium',
    questionText: 'Does this compile?',
    codeSnippet: `switch (x) {
  case 1 -> System.out.print("One");
  case 2 : System.out.print("Two");
}`,
    options: [
      'Yes — mixed styles are fine',
      'No — cannot mix -> and :',
      'Yes if default is added',
      'No — arrows need yield',
    ],
    correctOptionIndex: 1,
    explanation:
      'A single switch cannot mix arrow and colon case labels. Adding default does not fix that. Arrow statements that only print do not need yield.',
  },
  {
    id: 'ocp-ch03-m2',
    topic: 'Making Decisions',
    difficulty: 'medium',
    questionText: 'Which case label is illegal?',
    codeSnippet: `final int bananas = 1;
int apples = 2;
final int cookies = getCookies();
switch (items) { /* cases */ }`,
    options: [
      'case bananas',
      'case apples',
      'case 15',
      'case 3 * 5',
    ],
    correctOptionIndex: 1,
    explanation:
      'apples is not final, so it is not a compile-time constant. bananas and constant expressions like 3*5 are valid. cookies (method init) would also fail, but apples is the listed illegal option.',
  },
  {
    id: 'ocp-ch03-m3',
    topic: 'Making Decisions',
    difficulty: 'medium',
    questionText: 'What prints for numbers = {1,2,3}?',
    codeSnippet: `for (int num : numbers) {
  num = num * 2;
}
System.out.println(numbers[0]);`,
    options: ['1', '2', '0', 'Does not compile'],
    correctOptionIndex: 0,
    explanation:
      'for-each’s loop variable is a local copy. Doubling num does not write back into the array, so numbers[0] stays 1. The loop compiles.',
  },
  {
    id: 'ocp-ch03-m4',
    topic: 'Making Decisions',
    difficulty: 'medium',
    questionText: 'Does while (false) { System.out.println("x"); } compile?',
    options: [
      'Yes — runs zero times',
      'No — unreachable code',
      'Yes — runs once',
      'No — false is not boolean',
    ],
    correctOptionIndex: 1,
    explanation:
      'The compiler flags the body as unreachable. do-while(false) compiles because the body is reachable once. false is a boolean; that is not the issue.',
  },
  {
    id: 'ocp-ch03-m5',
    topic: 'Making Decisions',
    difficulty: 'medium',
    questionText: 'Does this compile?',
    codeSnippet: `if (number instanceof Integer data || data.compareTo(5) > 0) {}`,
    options: [
      'Yes — data is always in scope',
      'No — flow scoping: data may be undefined',
      'Yes — || guarantees the match',
      'No — compareTo is private',
    ],
    correctOptionIndex: 1,
    explanation:
      'With ||, the right side can run when the instanceof failed, so data is not safely in scope. && works because the right side only runs after a successful match.',
  },
  {
    id: 'ocp-ch03-m6',
    topic: 'Making Decisions',
    difficulty: 'medium',
    questionText: 'After if (!(number instanceof Integer data)) return; can you use data?',
    options: [
      'No — pattern vars never leave the if',
      'Yes — remaining code knows the match succeeded',
      'Only inside a switch',
      'Only if data is static',
    ],
    correctOptionIndex: 1,
    explanation:
      'Flow scoping: after early return on failure, the rest of the method treats data as in scope. Pattern variables are not limited to switch, nor must they be static.',
  },
  {
    id: 'ocp-ch03-m7',
    topic: 'Making Decisions',
    difficulty: 'medium',
    questionText: 'Enum switch expression covering every constant — is default required?',
    options: [
      'Always required',
      'Not required — exhaustive without default',
      'Required only for Spring',
      'Enums cannot be switched',
    ],
    correctOptionIndex: 1,
    explanation:
      'Covering all enum constants makes the expression exhaustive, so default is optional. Classic incomplete statement switches may omit default, but expressions need exhaustiveness somehow.',
  },
  {
    id: 'ocp-ch03-m8',
    topic: 'Making Decisions',
    difficulty: 'medium',
    questionText: 'What happens for (var item : list) when list is null?',
    options: [
      'Does not compile',
      'Runs zero times',
      'Throws NullPointerException at runtime',
      'Treats null as empty',
    ],
    correctOptionIndex: 2,
    explanation:
      'Enhanced for compiles against Iterable/array types but throws NPE if the reference is null. It does not silently skip like an empty collection.',
  },
];

export const chapter03Hard: QuizQuestion[] = [
  {
    id: 'ocp-ch03-h1',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'Why does this fail?',
    codeSnippet: `switch (obj) {
  case Number n -> System.out.println("Number");
  case Integer i -> System.out.println("Int");
}`,
    options: [
      'Integer is not a pattern type',
      'Integer case is dominated by Number',
      'Need yield',
      'obj must be int',
    ],
    correctOptionIndex: 1,
    explanation:
      'Number matches every Integer first, so the Integer case is unreachable (dominance). Narrower patterns must come first. yield is for expression blocks, not the root cause here.',
  },
  {
    id: 'ocp-ch03-h2',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'Why does this fail?',
    codeSnippet: `switch (obj) {
  case Integer i -> System.out.println("Any");
  case Integer i when i > 10 -> System.out.println("Big");
}`,
    options: [
      'when is illegal',
      'Unguarded Integer dominates the guarded case',
      'Need default only',
      'i cannot be compared',
    ],
    correctOptionIndex: 1,
    explanation:
      'An unguarded pattern matches all Integers, so a later guarded Integer is dominated. Put the when-guarded case first. when itself is legal in Java 21.',
  },
  {
    id: 'ocp-ch03-h3',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'What is count?',
    codeSnippet: `int count = 0;
ROW_LOOP: for (int i = 1; i <= 3; i++) {
  for (int j = 1; j <= 3; j++) {
    if (i * j > 3) break ROW_LOOP;
    count++;
  }
}`,
    options: ['3', '4', '6', '9'],
    correctOptionIndex: 1,
    explanation:
      'Increments for (1,1)(1,2)(1,3)(2,1) then (2,2) breaks the outer loop — count is 4. An unlabeled break would only exit the inner loop and count higher.',
  },
  {
    id: 'ocp-ch03-h4',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'Does this compile?',
    codeSnippet: `for (int i = 0, long j = 10; i < j; i++) {}`,
    options: [
      'Yes',
      'No — initialization vars must share one type',
      'Yes if j is final',
      'No — i < j is illegal',
    ],
    correctOptionIndex: 1,
    explanation:
      'The for init clause may declare multiple variables only of the same type (e.g., int i=0, j=10). Mixing int and long in one declaration fails. Comparing i < j would be fine if both were int.',
  },
  {
    id: 'ocp-ch03-h5',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'Null selector, no case null, pattern switch — result?',
    options: [
      'Matches default quietly',
      'NullPointerException',
      'Matches case Object',
      'Does not compile',
    ],
    correctOptionIndex: 1,
    explanation:
      'Without `case null`, switching on null throws NPE. default does not absorb null in this model. Explicit `case null` is how you handle it in Java 21.',
  },
  {
    id: 'ocp-ch03-h6',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'What is wrong?',
    codeSnippet: `int val = switch (x) {
  default -> { return 5; }
};`,
    options: [
      'default illegal in expressions',
      'return cannot provide the switch value — use yield',
      'Need break',
      'switch expressions cannot assign',
    ],
    correctOptionIndex: 1,
    explanation:
      'Inside a switch expression block, use yield to produce the value. return targets the enclosing method and fails here. default is allowed; assignment of switch expressions is normal.',
  },
  {
    id: 'ocp-ch03-h7',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'Which case syntax is illegal?',
    options: [
      'case 1, 2:',
      'case 1: 2:',
      'case 1 ->',
      'case 3 * 5:',
    ],
    correctOptionIndex: 1,
    explanation:
      'Multiple labels use commas (`case 1, 2`), not colon-separated `1: 2:`. Arrow form and constant expressions like 3*5 are valid.',
  },
  {
    id: 'ocp-ch03-h8',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'Does this compile?',
    codeSnippet: `if (!(obj instanceof String s)) {
  System.out.println(s);
}`,
    options: [
      'Yes — s is null',
      'No — s is not in scope on the failure path',
      'Yes — s is always bound',
      'No — instanceof forbids negation',
    ],
    correctOptionIndex: 1,
    explanation:
      'On the negated path the match failed, so s is not in scope. Negating instanceof is legal; the bug is using the pattern variable afterward.',
  },
];

export const chapter03Final: QuizQuestion[] = [
  {
    id: 'ocp-ch03-f1',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'When is default mandatory for exhaustiveness?',
    options: [
      'Every classic switch statement',
      'Switch expressions / pattern switches that do not cover all cases',
      'Only while loops',
      'Never in Java 21',
    ],
    correctOptionIndex: 1,
    explanation:
      'Review focus: expressions and pattern-matching switches must be exhaustive — via default or full coverage (e.g., all enum constants). Classic statement switches may omit default.',
  },
  {
    id: 'ocp-ch03-f2',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'Which ordering compiles for Object obj?',
    options: [
      'case Object o then case String s',
      'case String s then case Object o',
      'Either order',
      'Neither — Object cannot be a pattern',
    ],
    correctOptionIndex: 1,
    explanation:
      'Dominance: String must appear before Object. Object first makes String unreachable. Object is a valid pattern type.',
  },
  {
    id: 'ocp-ch03-f3',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'When is yield required?',
    options: [
      'Every arrow case with a single expression',
      'When a switch expression case uses a block to produce a value',
      'Only in statement switches',
      'Instead of break in for-each',
    ],
    correctOptionIndex: 1,
    explanation:
      'Arrow `case X -> value` needs no yield. A `{ ... }` case in a switch expression must yield the result. Statement switches use break, not yield, for control flow.',
  },
  {
    id: 'ocp-ch03-f4',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'Which if condition fails to compile?',
    options: [
      'if (flag)',
      'if (a > b)',
      'if (list.size())',
      'if (a == b)',
    ],
    correctOptionIndex: 2,
    explanation:
      'size() returns int, not boolean. flag and comparisons already boolean. This is the “numbers are not booleans” review trap.',
  },
  {
    id: 'ocp-ch03-f5',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'In while (x < 5 && ++x < 10), when is ++x skipped?',
    options: [
      'Never',
      'When x < 5 is already false',
      'When x is even',
      'Always — && ignores the right',
    ],
    correctOptionIndex: 1,
    explanation:
      'Short-circuit: false left means the right (with ++x) does not run. && does not always skip the right — only when the left is false.',
  },
  {
    id: 'ocp-ch03-f6',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'Why is for (int i = 0, long j = 10; i < j; i++) illegal?',
    options: [
      'i < j mixes widths',
      'Init declarations must share one type',
      'long forbidden in for',
      'Need semicolon after j',
    ],
    correctOptionIndex: 1,
    explanation:
      'Initialization limitations: one type declaration for all init vars. Separate statements outside the for can use different types. long itself is allowed in a for loop.',
  },
  {
    id: 'ocp-ch03-f7',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'Java 21 switch on null with case null -> "x" returns…',
    options: [
      'Always NPE',
      '"x"',
      'default’s value only',
      'Does not compile',
    ],
    correctOptionIndex: 1,
    explanation:
      'Explicit `case null` handles null without throwing. Omitting it causes NPE. default does not substitute for case null.',
  },
  {
    id: 'ocp-ch03-f8',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'continue OUTER in a nested loop jumps to…',
    options: [
      'The method return',
      'OUTER’s next iteration (update/check)',
      'INNER’s break only',
      'The previous case label',
    ],
    correctOptionIndex: 1,
    explanation:
      'Labeled continue targets the named outer loop’s next iteration. It does not return from the method or act like a switch case jump.',
  },
  {
    id: 'ocp-ch03-f9',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'Where is data visible?',
    codeSnippet: `if (number instanceof Integer data && data > 0) {
  /* A */
}
/* B */`,
    options: [
      'A and B',
      'Only A',
      'Only B',
      'Neither',
    ],
    correctOptionIndex: 1,
    explanation:
      'Inside the if (A), the match and && guarantee data. Outside (B), the pattern variable is out of scope. Flow scoping is a review focus item.',
  },
  {
    id: 'ocp-ch03-f10',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'Why doesn’t for-each mutation persist on an int[]?',
    options: [
      'Arrays are immutable',
      'Loop variable is a copy of each element',
      'for-each is read-only syntax',
      'Need Parallel streams',
    ],
    correctOptionIndex: 1,
    explanation:
      'The enhanced-for variable holds a copy of the primitive/reference. Reassigning it does not write the array slot. Arrays are mutable via index assignment; for-each is not a special read-only mode beyond that copy semantics.',
  },
  {
    id: 'ocp-ch03-f11',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'switch (5L) { } — result?',
    options: [
      'Runs default',
      'Does not compile — long unsupported',
      'Autoboxes to Long and works',
      'Runs case 5',
    ],
    correctOptionIndex: 1,
    explanation:
      'Top trap: long/float/double/boolean are not switch selectors. There is no autobox rescue for a long primitive selector.',
  },
  {
    id: 'ocp-ch03-f12',
    topic: 'Making Decisions',
    difficulty: 'hard',
    questionText: 'Missing semicolon after switch expression assignment — effect?',
    codeSnippet: `String result = switch (x) {
  default -> "Value"
}`,
    options: [
      'Compiles — newline ends it',
      'Does not compile — need ; on arrow value and after switch',
      'Runtime error only',
      'Treats default as void',
    ],
    correctOptionIndex: 1,
    explanation:
      'Arrow expression cases need a terminating `;`, and the assignment statement needs `;` after the switch. Newlines do not end Java statements. This is Extra Exam Tips trap territory.',
  },
];
