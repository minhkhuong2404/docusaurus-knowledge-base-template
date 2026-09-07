import type { QuizQuestion } from '../../../components/DailyQuiz';
import type { ChapterFlashcard } from '../types';

/** One flashcard per learning ### in chapter-02.md (excludes Rules Summary & Exam Vignettes). */
export const chapter02Flashcards: ChapterFlashcard[] = [
  {
    id: 'c2-terms',
    section: 'Operator Terminology & Types',
    front: 'Unary vs binary vs ternary operators — operand counts?',
    back: 'An operator applies to operands and yields a result. Unary takes one (`-x`, `!y`). Binary takes two (`a + b`) — most Java operators. Ternary takes three (`? :`).',
    notes: 'Exam language: “operand” = the value the operator acts on.',
  },
  {
    id: 'c2-precedence',
    section: 'Operator Precedence (Highest → Lowest)',
    front: 'Rough precedence order from post-unary to assignment?',
    back: 'Post-unary → pre-unary → other unary/cast → * / % → + - → shifts → relational/instanceof → equality → & → ^ → | → && → || → ternary → assignment → ->. Same level usually left-to-right; assignment and ternary are right-to-left.',
    notes: '`3 + 2 * --cookies` does `--` first, then multiply, then add.',
  },
  {
    id: 'c2-unary',
    section: 'Unary Operators',
    front: '!, ~, -, ++/-- — key rules and mismatches?',
    back: '`!` flips booleans only. `~` flips bits on integrals (`~n = -n - 1`). `-` negates numbers. Pre-increment changes then returns; post returns then changes. You cannot `!` a number or `-`/`~` a boolean.',
    notes: '`!0` and `-true` do not compile — Java has no C-style truthy ints.',
  },
  {
    id: 'c2-binary-arith',
    section: 'Binary Arithmetic Operators',
    front: 'Integer division, modulus sign, and grouping syntax?',
    back: 'Integer `/` truncates toward zero. For `a % b`, the result’s sign matches the dividend `a`. Parentheses override precedence and must balance; `[]`/`{}` cannot group math.',
    notes: '`-7 % 5` → -2; `7 % -5` → 2.',
  },
  {
    id: 'c2-promo',
    section: 'Primitive Numeric Promotion Rules',
    front: 'Four promotion rules before binary arithmetic?',
    back: 'Widen smaller to larger when types differ. Promote integral to floating when mixed. byte/short/char always promote to int with binary arithmetic. The result type matches the promoted operands.',
    notes: '`short z = x * y;` fails even if both are short — need `(short)(x * y)`.',
  },
  {
    id: 'c2-assign-cast',
    section: 'Assigning Values & Casting',
    front: 'Widening, narrowing, compound assignment, assignment as expression?',
    back: 'Widening is implicit; narrowing needs a cast (truncation/overflow possible). Oversized int literals need `L` for long. Compound ops implicitly cast back to the left type. An assignment expression yields the assigned value.',
    notes: '`sheep *= goat` compiles when `sheep = sheep * goat` does not.',
  },
  {
    id: 'c2-compare',
    section: 'Comparing Values',
    front: '==, relational ops, and instanceof traps?',
    back: '`==`/`!=` work on compatible primitives/booleans/references; incompatible mixes fail to compile. Reference `==` is identity (null == null is true). Relational ops promote mixed numerics. instanceof fails to compile for impossible types and is false for null.',
    notes: '`null instanceof Object` is false, not NPE. Primitives cannot use instanceof.',
  },
  {
    id: 'c2-logical',
    section: 'Logical and Conditional Operators',
    front: '& | ^ vs && || — evaluation and side effects?',
    back: 'Non-short-circuit `&` `|` `^` always evaluate both sides. `&&`/`||` skip the right side when the left already decides. Use short-circuit to guard null calls; right-hand increments may never run.',
    notes: '`(rabbit >= 6) || (++rabbit <= 7)` leaves rabbit unchanged.',
  },
  {
    id: 'c2-ternary',
    section: 'Ternary Operator (`? :`)',
    front: 'Which branch runs, and what about assignment types?',
    back: 'Only one branch executes (unperformed side effects on the other). When assigning to a typed variable, both branch types must be compatible with that variable; printing Object can accept mixed int/String.',
    notes: '`int animal = cond ? 3 : "Horse";` does not compile.',
  },
  {
    id: 'c2-bitwise',
    section: 'Bitwise Operators — Under the Hood',
    front: 'What do & | ^ do on numeric operands?',
    back: 'On integrals they operate bit by bit. For any n, `n & ~n` is 0, while `n | ~n` and `n ^ ~n` are all bits set (-1 in two’s complement).',
    notes: 'Same symbols as logical ops — context (boolean vs integral) picks the meaning.',
  },
  {
    id: 'c2-shifts',
    section: 'Bit Shift Operators',
    front: '<< vs >> vs >>> ?',
    back: '`<<` left shift fills with 0s (≈ ×2^n). `>>` arithmetic right shift fills with the sign bit. `>>>` logical right shift fills with 0s, so negatives become large positives.',
    notes: '`-8 >> 1` → -4; `-8 >>> 1` → a large positive int.',
  },
  {
    id: 'c2-double-div',
    section: 'Double Division Edge Cases',
    front: 'Floating division by zero and the NaN equality rule?',
    back: 'float/double division by zero does not throw: ±Infinity or NaN. NaN equals nothing, not even itself — use Double.isNaN.',
    notes: '`val == val` is false when val is NaN.',
  },
];

export const chapter02Easy: QuizQuestion[] = [
  {
    id: 'ocp-ch02-e1',
    topic: 'Operators',
    difficulty: 'easy',
    questionText: 'How many operands does the ternary operator take?',
    options: ['1', '2', '3', '4'],
    correctOptionIndex: 2,
    explanation:
      'The conditional operator `? :` is ternary: condition, then-expression, else-expression. Unary takes one; binary takes two. There is no four-operand Java operator in this chapter.',
  },
  {
    id: 'ocp-ch02-e2',
    topic: 'Operators',
    difficulty: 'easy',
    questionText: 'Which operator has higher precedence?',
    options: ['+', '*', '=', '&&'],
    correctOptionIndex: 1,
    explanation:
      'Multiplicative `*` binds tighter than additive `+`, assignment, and conditional AND. That is why `3 + 2 * 4` is 11, not 20.',
  },
  {
    id: 'ocp-ch02-e3',
    topic: 'Operators',
    difficulty: 'easy',
    questionText: 'What does ! do?',
    options: [
      'Negates a number',
      'Flips a boolean',
      'Flips all bits of an int',
      'Divides by -1',
    ],
    correctOptionIndex: 1,
    explanation:
      'Logical complement `!` applies only to booleans. Numeric negation is `-`; bitwise complement is `~`. Applying `!` to an int does not compile.',
  },
  {
    id: 'ocp-ch02-e4',
    topic: 'Operators',
    difficulty: 'easy',
    questionText: 'What is 10 / 3 for ints?',
    options: ['3.333', '3', '4', '1'],
    correctOptionIndex: 1,
    explanation:
      'Integer division truncates the fractional part toward zero, so 10/3 is 3. 3.333 would require floating operands. The remainder 1 comes from `%`, not `/`.',
  },
  {
    id: 'ocp-ch02-e5',
    topic: 'Operators',
    difficulty: 'easy',
    questionText: 'null instanceof String evaluates to…',
    options: ['true', 'false', 'NullPointerException', 'Does not compile'],
    correctOptionIndex: 1,
    explanation:
      'instanceof on null is always false and does not throw. It compiles for reference types. true would mean a null were a String instance.',
  },
  {
    id: 'ocp-ch02-e6',
    topic: 'Operators',
    difficulty: 'easy',
    questionText: 'Which pair short-circuits?',
    options: ['& and |', '&& and ||', '^ and &', '| and ^'],
    correctOptionIndex: 1,
    explanation:
      '`&&` and `||` may skip the right operand. `&`, `|`, and `^` always evaluate both sides — a classic side-effect trap.',
  },
  {
    id: 'ocp-ch02-e7',
    topic: 'Operators',
    difficulty: 'easy',
    questionText: 'What is ~70?',
    options: ['70', '-70', '-71', '71'],
    correctOptionIndex: 2,
    explanation:
      'Bitwise complement follows `~n = -n - 1`, so ~70 is -71. Negation alone would be -70; that is a different operator.',
  },
  {
    id: 'ocp-ch02-e8',
    topic: 'Operators',
    difficulty: 'easy',
    questionText: '1.0 / 0.0 yields…',
    options: [
      'ArithmeticException',
      '0.0',
      'Double.POSITIVE_INFINITY',
      'null',
    ],
    correctOptionIndex: 2,
    explanation:
      'Floating division by zero produces Infinity (or NaN for 0.0/0.0), not an exception. Integer `/ 0` would throw; that rule does not apply to doubles.',
  },
];

export const chapter02Medium: QuizQuestion[] = [
  {
    id: 'ocp-ch02-m1',
    topic: 'Operators',
    difficulty: 'medium',
    questionText: 'What prints?',
    codeSnippet: `int count = 0;
System.out.print(++count);
System.out.print(count--);
System.out.print(count);`,
    options: ['010', '110', '100', '111'],
    correctOptionIndex: 1,
    explanation:
      '++count prints 1 (count is 1). count-- prints 1 then sets count to 0. Final print is 0 → 110. Choosing 010 would reverse pre/post behavior.',
  },
  {
    id: 'ocp-ch02-m2',
    topic: 'Operators',
    difficulty: 'medium',
    questionText: 'What is -7 % 5?',
    options: ['2', '-2', '1', '-1'],
    correctOptionIndex: 1,
    explanation:
      'The remainder’s sign follows the dividend. -7 % 5 is -2. 7 % -5 would be +2 because the dividend is positive.',
  },
  {
    id: 'ocp-ch02-m3',
    topic: 'Operators',
    difficulty: 'medium',
    questionText: 'Why does sheep = sheep * goat fail while sheep *= goat works?',
    codeSnippet: `long goat = 10;
int sheep = 5;`,
    options: [
      '*= is not valid Java',
      '*= applies an implicit cast to int',
      'goat must be int',
      'sheep promotes to long permanently',
    ],
    correctOptionIndex: 1,
    explanation:
      '`sheep * goat` is long, which cannot assign to int. Compound assignment casts back to the left-hand type, so *= compiles. *= is legal; sheep’s declared type stays int.',
  },
  {
    id: 'ocp-ch02-m4',
    topic: 'Operators',
    difficulty: 'medium',
    questionText: 'Does this compile?',
    codeSnippet: `Number n = 10;
if (n instanceof String) { }`,
    options: [
      'Yes — runtime false',
      'No — incompatible types',
      'Yes — true because Number is Object',
      'No — instanceof needs a class literal only',
    ],
    correctOptionIndex: 1,
    explanation:
      'The compiler knows Number cannot be a String, so instanceof fails at compile time. Runtime false applies when the cast is possible (e.g., Object). String is a valid class operand; compatibility is the issue.',
  },
  {
    id: 'ocp-ch02-m5',
    topic: 'Operators',
    difficulty: 'medium',
    questionText: 'What is rabbit after this?',
    codeSnippet: `int rabbit = 6;
boolean bunny = (rabbit >= 6) || (++rabbit <= 7);`,
    options: ['6', '7', '5', 'Does not compile'],
    correctOptionIndex: 0,
    explanation:
      'Left side of || is true, so ++rabbit never runs and rabbit stays 6. With a single `&`/`|`, both sides would run. The expression compiles.',
  },
  {
    id: 'ocp-ch02-m6',
    topic: 'Operators',
    difficulty: 'medium',
    questionText: 'What prints?',
    codeSnippet: `int sheep = 1, zzz = 1;
int sleep = zzz < 10 ? sheep++ : zzz++;
System.out.println(sheep + "," + zzz);`,
    options: ['1,1', '2,1', '1,2', '2,2'],
    correctOptionIndex: 1,
    explanation:
      'The true branch runs: sheep++ yields 1 for sleep then sheep becomes 2. zzz++ is skipped, so zzz stays 1 → "2,1". Both increments would only happen if both branches ran.',
  },
  {
    id: 'ocp-ch02-m7',
    topic: 'Operators',
    difficulty: 'medium',
    questionText: 'What does -8 >>> 1 produce relative to -8 >> 1?',
    options: [
      'Same value -4',
      '>>> yields a large positive; >> yields -4',
      'Both throw',
      '>>> yields -4; >> yields positive',
    ],
    correctOptionIndex: 1,
    explanation:
      '`>>` preserves the sign bit (−4). `>>>` fills with zeros, turning the former sign bit off and producing a large positive. They are not the same for negatives.',
  },
  {
    id: 'ocp-ch02-m8',
    topic: 'Operators',
    difficulty: 'medium',
    questionText: 'What does Double.NaN == Double.NaN return?',
    options: ['true', 'false', 'Does not compile', 'Throws'],
    correctOptionIndex: 1,
    explanation:
      'NaN is unequal to every value, including itself. Use Double.isNaN to test. The comparison compiles and does not throw.',
  },
];

export const chapter02Hard: QuizQuestion[] = [
  {
    id: 'ocp-ch02-h1',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'What are cookies and reward?',
    codeSnippet: `int cookies = 4;
double reward = 3 + 2 * --cookies;`,
    options: [
      'cookies=4, reward=11.0',
      'cookies=3, reward=9.0',
      'cookies=3, reward=14.0',
      'cookies=4, reward=9.0',
    ],
    correctOptionIndex: 1,
    explanation:
      'Pre-decrement makes cookies 3 and contributes 3. Then 2*3=6, plus 3 → reward 9.0. Doing add before multiply would wrongly yield 14.',
  },
  {
    id: 'ocp-ch02-h2',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'Why does this fail?',
    codeSnippet: `short mouse = 10;
short hamster = 3;
short capybara = (short)mouse * hamster;`,
    options: [
      'Cast applies only to mouse; product is still int',
      'short cannot multiply',
      'Need long cast',
      'hamster must be int',
    ],
    correctOptionIndex: 0,
    explanation:
      'Cast binds tighter than `*`, so only mouse is narrowed; multiplying by hamster still promotes to int. Correct form: `(short)(mouse * hamster)`. The operands are not forbidden types.',
  },
  {
    id: 'ocp-ch02-h3',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'What prints?',
    codeSnippet: `int a = 5;
a = a++;
System.out.println(a);`,
    options: ['5', '6', '4', 'Does not compile'],
    correctOptionIndex: 0,
    explanation:
      'Post-increment returns 5, then increments a to 6, then the assignment writes the old 5 back. Final value is 5, not 6 — a classic trap.',
  },
  {
    id: 'ocp-ch02-h4',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'What is y, and what is x?',
    codeSnippet: `int x = 2;
int y = 3 * x++ + ++x;`,
    options: [
      'y=10, x=4',
      'y=9, x=4',
      'y=10, x=3',
      'y=12, x=4',
    ],
    correctOptionIndex: 0,
    explanation:
      '3 * x++ uses 2 then x becomes 3. ++x then makes x 4 and contributes 4. y = 6 + 4 = 10 with x at 4. Treating both increments as applying before the multiply yields the wrong 12.',
  },
  {
    id: 'ocp-ch02-h5',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'Difference between these if conditions for x starting at 10?',
    codeSnippet: `if (x > 20 && ++x > 0) {}
if (x > 20 & ++x > 0) {}`,
    options: [
      'Both leave x at 10',
      'First leaves 10; second makes 11',
      'Both make 11',
      'Neither compiles',
    ],
    correctOptionIndex: 1,
    explanation:
      'With &&, false left skips ++x. With &, both sides run, so x becomes 11. Both forms compile; only evaluation differs.',
  },
  {
    id: 'ocp-ch02-h6',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'What is 70 & ~70?',
    options: ['70', '-71', '0', '-1'],
    correctOptionIndex: 2,
    explanation:
      'A value AND its complement clears every bit → 0. OR/XOR with the complement yield -1. ~70 alone is -71, which is a different expression.',
  },
  {
    id: 'ocp-ch02-h7',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'Does this compile?',
    codeSnippet: `int a = 5;
if (a instanceof Integer) {}`,
    options: [
      'Yes — autoboxes then tests',
      'No — instanceof needs a reference type operand',
      'Yes — always true',
      'No — Integer is final',
    ],
    correctOptionIndex: 1,
    explanation:
      'instanceof requires an object reference, not a primitive. There is no autoboxing for the instanceof left operand. Integer being final is irrelevant here.',
  },
  {
    id: 'ocp-ch02-h8',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'What prints?',
    codeSnippet: `boolean flag = false;
if (flag = true) {
  System.out.print("True!");
}`,
    options: [
      'Nothing',
      'True!',
      'Does not compile',
      'False!',
    ],
    correctOptionIndex: 1,
    explanation:
      '`=` assigns true to flag and the assignment expression is true, so the body runs. `==` would compare; a compile error would require a non-boolean assignment in the if.',
  },
];

export const chapter02Final: QuizQuestion[] = [
  {
    id: 'ocp-ch02-f1',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'Why is short z = x * y illegal when x and y are short?',
    options: [
      'short cannot store products',
      'x * y promotes to int',
      '* is only for int',
      'Need BigInteger',
    ],
    correctOptionIndex: 1,
    explanation:
      'Review focus: smaller integrals promote to int in binary arithmetic. Cast the product if you need short. The * operator works; the assignment type is the problem.',
  },
  {
    id: 'ocp-ch02-f2',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'What is x after this short-circuit expression?',
    codeSnippet: `int x = 10;
boolean b = (x > 5) || (++x == 11);`,
    options: ['10', '11', '5', 'Does not compile'],
    correctOptionIndex: 0,
    explanation:
      'Left of || is true, so ++x is skipped and x stays 10. If the left were false, the right would run and x would become 11. Unperformed side effects are a top Chapter 2 trap.',
  },
  {
    id: 'ocp-ch02-f3',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'Why can long goat use goat -= 1.0 without an explicit cast?',
    options: [
      '1.0 is really a long',
      'Compound assignment casts back to long',
      '-= forbids floating operands',
      'long widens permanently to double',
    ],
    correctOptionIndex: 1,
    explanation:
      'Compound operators evaluate the right-hand math then cast to the left variable’s type. Plain `goat = goat - 1.0` would be double and fail without a cast. goat remains a long variable.',
  },
  {
    id: 'ocp-ch02-f4',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'Why does this fail?',
    codeSnippet: `int price = 10;
String type = price > 5 ? 20 : "Zebra";`,
    options: [
      'Ternary cannot use ints',
      'Branch types are incompatible with String',
      'Need parentheses',
      'price > 5 is not boolean',
    ],
    correctOptionIndex: 1,
    explanation:
      'Assigned to String, both branches must be String-compatible; 20 is int. Printing the same ternary can work because println accepts Object. The condition itself is a valid boolean.',
  },
  {
    id: 'ocp-ch02-f5',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'Why is Number n; n instanceof String a compile error?',
    options: [
      'instanceof never compiles',
      'Number cannot possibly be a String',
      'String is not a type',
      'Must use getClass()',
    ],
    correctOptionIndex: 1,
    explanation:
      'Relational/compiler focus: impossible casts are rejected at compile time. Object instanceof String is allowed (runtime false/true). String is a normal type; getClass is unrelated.',
  },
  {
    id: 'ocp-ch02-f6',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'What is 70 | ~70?',
    options: ['0', '70', '-1', '-71'],
    correctOptionIndex: 2,
    explanation:
      'OR with the bitwise complement sets every bit → -1 in two’s complement. AND would be 0; ~70 alone is -71.',
  },
  {
    id: 'ocp-ch02-f7',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'Compare 7 % -5 and -7 % 5.',
    options: [
      'Both 2',
      'Both -2',
      '2 and -2',
      '-2 and 2',
    ],
    correctOptionIndex: 2,
    explanation:
      'Remainder sign follows the dividend: 7 % -5 is 2; -7 % 5 is -2. Ignoring the left operand’s sign is the common mistake.',
  },
  {
    id: 'ocp-ch02-f8',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'Which expression fails to compile?',
    options: [
      '1 + ((3 * 5) / 3)',
      '3 + [(4 * 2) + 4]',
      '(2 + 3) * 4',
      '5 % 2',
    ],
    correctOptionIndex: 1,
    explanation:
      'Java groups with parentheses only; square brackets are illegal for math grouping. Balanced parentheses and % are fine.',
  },
  {
    id: 'ocp-ch02-f9',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'What are 1 + 2 + "3" and "3" + 1 + 2?',
    options: [
      'Both "123"',
      '"33" and "312"',
      '"33" and "33"',
      '6 and "312"',
    ],
    correctOptionIndex: 1,
    explanation:
      'Left-to-right: 1+2 is 3 then +"3" → "33". Starting with "3" concatenates: "31" then "312". Treating both as pure string "123" skips the early numeric add.',
  },
  {
    id: 'ocp-ch02-f10',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'Integer a = 200; Integer b = 200; a == b is often…',
    options: [
      'true because equals',
      'false — outside the cache range',
      'a compile error',
      'true for all Integers',
    ],
    correctOptionIndex: 1,
    explanation:
      'Caching covers -128..127. 200 creates distinct objects, so == is typically false while equals is true. == is not a compile error for two Integers.',
  },
  {
    id: 'ocp-ch02-f11',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'What is 2 * 5 / 3 for ints?',
    options: ['3.333', '2', '3', '10'],
    correctOptionIndex: 2,
    explanation:
      '* and / share precedence and associate left-to-right: (2*5)/3 = 10/3 = 3. Floating division would be needed for 3.333; stopping at 2*5 alone yields 10.',
  },
  {
    id: 'ocp-ch02-f12',
    topic: 'Operators',
    difficulty: 'hard',
    questionText: 'What is Integer.MAX_VALUE + 1?',
    options: [
      'Throws ArithmeticException',
      'Integer.MIN_VALUE (wrap)',
      'Does not compile',
      'Long.MAX_VALUE',
    ],
    correctOptionIndex: 1,
    explanation:
      'int overflow wraps silently in two’s complement to MIN_VALUE. It does not throw or promote to long unless you write a long expression.',
  },
];
