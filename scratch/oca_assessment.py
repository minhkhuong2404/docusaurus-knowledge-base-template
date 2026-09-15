# OCA Java SE 8 - Assessment Test Questions (Questions 1 - 20)

assessment_questions = [
    {
        "topic": "Java Building Blocks",
        "difficulty": "medium",
        "questionText": "What is the result of attempting to compile and run the following class?",
        "codeSnippet": """1: public class _C {
2:   private static int $;
3:   public static void main(String[] main) {
4:     String a_b;
5:     System.out.print($);
6:     System.out.print(a_b);
7:   }
8: }""",
        "optionA": "Outputs 0null",
        "optionB": "Compiler error on line 1 and line 2",
        "optionC": "Compiler error on line 6",
        "optionD": "Compiler error on line 4",
        "correctOption": "C",
        "explanation": "Option C is correct because local variables (such as a_b on line 4) do not get default values and must be explicitly assigned before being referenced. Since a_b is read on line 6 without initialization, line 6 fails compilation. Line 1 and 2 are completely legal because Java identifiers can begin with an underscore (_) or a dollar sign ($). Static and instance variables like $ get default values (0 for int)."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the result of the following code snippet?",
        "codeSnippet": """String s1 = "Java";
String s2 = "Java";
StringBuilder sb1 = new StringBuilder();
sb1.append("Ja").append("va");
System.out.println(s1 == s2);
System.out.println(s1.equals(s2));
System.out.println(sb1.toString() == s1);
System.out.println(sb1.toString().equals(s1));""",
        "optionA": "true is printed out exactly once",
        "optionB": "true is printed out exactly twice",
        "optionC": "true is printed out exactly three times",
        "optionD": "true is printed out exactly four times",
        "correctOption": "C",
        "explanation": "String literals s1 and s2 both point to the same string in the string pool, so s1 == s2 and s1.equals(s2) are both true (2 times). sb1.toString() creates a new String object at runtime on the heap, so sb1.toString() == s1 is false. However, sb1.toString().equals(s1) checks logical character sequence equality, which evaluates to true. Therefore, true is printed out exactly 3 times."
    },
    {
        "topic": "Class Design",
        "difficulty": "hard",
        "questionText": "What happens when attempting to compile and run the following code?",
        "codeSnippet": """1: interface HasTail { int getTailLength(); }
2: abstract class Puma implements HasTail {
3:   protected int getTailLength() { return 4; }
4: }
5: public class Cougar extends Puma {
6:   public static void main(String[] args) {
7:     Puma puma = new Puma();
8:     System.out.println(puma.getTailLength());
9:   }
10:  public int getTailLength(int length) { return 2; }
11: }""",
        "optionA": "It compiles and outputs 4",
        "optionB": "It compiles and outputs 2",
        "optionC": "Compilation fails due to multiple errors: invalid method override on line 3 and attempting to instantiate an abstract class on line 7",
        "optionD": "Compilation fails only because getTailLength(int length) on line 10 does not match the interface signature",
        "correctOption": "C",
        "explanation": "First, all interface methods are implicitly public. On line 3, Puma attempts to implement getTailLength() with protected access, which reduces visibility and causes a compiler error. Second, on line 7, Puma is an abstract class and cannot be instantiated with 'new Puma()'. Line 10 is merely an overload (different parameter list), not an override."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "medium",
        "questionText": "What is the output of the following program?",
        "codeSnippet": """public class FeedingSchedule {
  public static void main(String[] args) {
    boolean keepGoing = true;
    int count = 0;
    int x = 3;
    while(count++ < 3) {
      int y = (1 + 2 * count) % 3;
      switch(y) {
        default:
        case 0: x -= 1; break;
        case 1: x += 5;
      }
    }
    System.out.println(x);
  }
}""",
        "optionA": "4",
        "optionB": "5",
        "optionC": "6",
        "optionD": "7",
        "correctOption": "C",
        "explanation": "Let's trace iteration by iteration: Iteration 1: count was 0, count++ < 3 is true, count becomes 1. y = (1 + 2*1) % 3 = 3 % 3 = 0. Hits case 0: x = 3 - 1 = 2 (break). Iteration 2: count is 1, count++ < 3 is true, count becomes 2. y = (1 + 2*2) % 3 = 5 % 3 = 2. Hits default: falls through to case 0 because no break on default: x = 2 - 1 = 1 (break). Iteration 3: count is 2, count++ < 3 is true, count becomes 3. y = (1 + 2*3) % 3 = 7 % 3 = 1. Hits case 1: x = 1 + 5 = 6. Iteration 4: count is 3, 3 < 3 is false, loop terminates. Final x is 6."
    },
    {
        "topic": "Exceptions",
        "difficulty": "easy",
        "questionText": "What is the output of the following code snippet?",
        "codeSnippet": """System.out.print("a");
try {
  System.out.print("b");
  throw new IllegalArgumentException();
} catch (RuntimeException e) {
  System.out.print("c");
} finally {
  System.out.print("d");
}
System.out.print("e");""",
        "optionA": "abce",
        "optionB": "abde",
        "optionC": "abcde",
        "optionD": "Compilation error",
        "correctOption": "C",
        "explanation": "Prints 'a', enters try, prints 'b', throws IllegalArgumentException. Since IllegalArgumentException extends RuntimeException, the catch block catches it and prints 'c'. Then the finally block runs unconditionally and prints 'd'. Execution resumes normally after try-catch-finally, printing 'e'. Result is 'abcde'."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "easy",
        "questionText": "What is the result of the following program?",
        "codeSnippet": """public class MathFunctions {
  public static void addToInt(int x, int amountToAdd) {
    x = x + amountToAdd;
  }
  public static void main(String[] args) {
    int a = 15;
    int b = 10;
    MathFunctions.addToInt(a, b);
    System.out.println(a);
  }
}""",
        "optionA": "10",
        "optionB": "15",
        "optionC": "25",
        "optionD": "Compiler error",
        "correctOption": "B",
        "explanation": "Java is strictly pass-by-value. When 'a' is passed into addToInt(int x, int amountToAdd), a copy of its primitive value 15 is passed into parameter x. Reassigning x inside addToInt has zero effect on the caller variable 'a'. Therefore, 'a' remains 15."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the result of the following code?",
        "codeSnippet": """int[] array = {6, 9, 8};
List<Integer> list = new ArrayList<>();
list.add(array[0]);
list.add(array[2]);
list.set(1, array[1]);
list.remove(0);
System.out.println(list);""",
        "optionA": "[8]",
        "optionB": "[9]",
        "optionC": "[6, 9]",
        "optionD": "IndexOutOfBoundsException is thrown",
        "correctOption": "B",
        "explanation": "Initial array is {6, 9, 8}. list.add(6) -> [6]. list.add(8) -> [6, 8]. list.set(1, 9) replaces element at index 1 with 9 -> [6, 9]. list.remove(0) removes the element at index 0 (value 6) -> leaving [9]. Printing list outputs [9]."
    },
    {
        "topic": "Class Design",
        "difficulty": "hard",
        "questionText": "What is the output of the following code?",
        "codeSnippet": """public class Deer {
  public Deer() { System.out.print("Deer"); }
  public Deer(int age) { System.out.print("DeerAge"); }
  private boolean hasHorns() { return false; }
  public static void main(String[] args) {
    Deer deer = new Reindeer(5);
    System.out.println("," + deer.hasHorns());
  }
}
class Reindeer extends Deer {
  public Reindeer(int age) { System.out.print("Reindeer"); }
  public boolean hasHorns() { return true; }
}""",
        "optionA": "DeerReindeer,false",
        "optionB": "DeerReindeer,true",
        "optionC": "DeerAgeReindeer,false",
        "optionD": "DeerAgeReindeer,true",
        "correctOption": "A",
        "explanation": "When new Reindeer(5) is executed, Reindeer(int age) does not explicitly invoke a parent constructor, so the compiler automatically inserts super() on line 1. Deer() runs first, printing 'Deer', then Reindeer's constructor prints 'Reindeer'. Next, hasHorns() in Deer is declared private. Private methods cannot be overridden, only hidden. Because the reference variable 'deer' has compile-time type Deer, deer.hasHorns() calls Deer's private method, which returns false. Output is 'DeerReindeer,false'."
    },
    {
        "topic": "Exceptions",
        "difficulty": "easy",
        "questionText": "Which of the following statements correctly distinguishes checked exceptions, runtime exceptions, and Errors in Java?",
        "codeSnippet": "",
        "optionA": "Checked exceptions are required to be handled or declared; Errors and RuntimeExceptions are unchecked and do not require handling or declaration.",
        "optionB": "Runtime exceptions are required to be caught or declared, whereas Checked exceptions are optional.",
        "optionC": "Errors are checked exceptions that must be handled by application code.",
        "optionD": "Only Exception subclasses that extend RuntimeException are required to be declared in throws clauses.",
        "correctOption": "A",
        "explanation": "In Java, checked exceptions (subclasses of Exception excluding RuntimeException) are subject to the handle-or-declare rule. RuntimeException and its subclasses, as well as Error and its subclasses, are unchecked and are not required to be handled or declared."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "medium",
        "questionText": "Consider the following code. Immediately after line 6 executes, which grasshopper objects are eligible for garbage collection?",
        "codeSnippet": """1: public class Grasshopper {
2:   public Grasshopper(String n) { name = n; }
3:   public static void main(String[] args) {
4:     Grasshopper one = new Grasshopper("g1");
5:     Grasshopper two = new Grasshopper("g2");
6:     one = two;
7:     two = null;
8:     one = null;
9:   }
10:  private String name;
11: }""",
        "optionA": "Neither object is eligible for garbage collection",
        "optionB": "Only the g1 object is eligible for garbage collection",
        "optionC": "Only the g2 object is eligible for garbage collection",
        "optionD": "Both g1 and g2 objects are eligible for garbage collection",
        "correctOption": "B",
        "explanation": "On line 4, 'one' points to g1. On line 5, 'two' points to g2. On line 6, 'one' is reassigned to point to g2. At this exact point, no reference points to the g1 object anymore, making only g1 eligible for garbage collection."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "hard",
        "questionText": "What is the output of the following program?",
        "codeSnippet": """public class FeedingSchedule {
  public static void main(String[] args) {
    int x = 5, j = 0;
    OUTER: for(int i=0; i<3; )
    INNER: do {
      i++; x++;
      if(x > 10) break INNER;
      x += 4;
      j++;
    } while(j <= 2);
    System.out.println(x);
  }
}""",
        "optionA": "10",
        "optionB": "12",
        "optionC": "13",
        "optionD": "17",
        "correctOption": "B",
        "explanation": "Trace: Outer loop i=0. Inner loop (do-while): 1st iteration: i=1, x=6. x > 10 is false. x += 4 -> x=10. j++ -> j=1. Condition j <= 2 is true. 2nd iteration: i=2, x=11. x > 10 (11 > 10) is true! break INNER triggers. j remains 1. Now back to OUTER loop condition: i < 3 (2 < 3) is true. Next iteration of OUTER: executes INNER: i becomes 3, x becomes 12. x > 10 is true, break INNER immediately. Now OUTER checks i < 3 (3 < 3), which is false! Loop terminates. Final x is 12."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "What is the result of the following program?",
        "codeSnippet": """public class Egret {
  private String color;
  public Egret() {
    this("white");
  }
  public Egret(String color) {
    color = color;
  }
  public static void main(String[] args) {
    Egret e = new Egret();
    System.out.println("Color:" + e.color);
  }
}""",
        "optionA": "Color:white",
        "optionB": "Color:null",
        "optionC": "Color:",
        "optionD": "Compiler error on line 4",
        "correctOption": "B",
        "explanation": "In Egret(String color), the assignment 'color = color;' assigns the parameter to itself! It does NOT assign to the instance variable this.color. Therefore, the instance variable 'color' remains initialized to its default value, which is null. The output is 'Color:null'."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "medium",
        "questionText": "What is the output of the following program?",
        "codeSnippet": """public class BearOrShark {
  public static void main(String[] args) {
    int luck = 10;
    if((luck > 10 ? luck++ : --luck) < 10) {
      System.out.print("Bear");
    }
    if(luck < 10) System.out.print("Shark");
  }
}""",
        "optionA": "Bear",
        "optionB": "Shark",
        "optionC": "BearShark",
        "optionD": "Does not print anything",
        "correctOption": "C",
        "explanation": "In the ternary expression (luck > 10 ? luck++ : --luck), luck is 10, so luck > 10 is false. Only the false branch --luck is evaluated. --luck decrements luck from 10 to 9 and returns 9. 9 < 10 is true, so 'Bear' is printed. Then the second if evaluates (luck < 10); since luck is now 9, 9 < 10 is true and 'Shark' is printed. Total output: 'BearShark'."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "medium",
        "questionText": "Assuming we have a valid, non-null HenHouse object, which of the following is NOT a possible outcome when this program runs?",
        "codeSnippet": """Chicken chicken = house.getChickens().get(0);
for(int i=0; i < house.getChickens().size();
    chicken = house.getChickens().get(i++)) {
  System.out.println("Cluck");
}""",
        "optionA": "The application will output Cluck exactly once",
        "optionB": "The application will output Cluck more than once",
        "optionC": "The application will compile but produce an exception at runtime",
        "optionD": "The application will compile and exit without producing any output or exception",
        "correctOption": "D",
        "explanation": "If house.getChickens() has 0 elements, the initial call get(0) throws IndexOutOfBoundsException. If it has 1 element, line 1 succeeds, loop runs once and prints Cluck. If it has >1 elements, loop runs multiple times. If getChickens() returns null, line 1 throws NullPointerException. Therefore, the code will ALWAYS either print 'Cluck' at least once or throw an exception at runtime. It can never exit cleanly without printing or throwing."
    },
    {
        "topic": "Class Design",
        "difficulty": "medium",
        "questionText": "Given the following classes, which type can be placed in the blank so that the code compiles successfully?",
        "codeSnippet": """public interface CanSwim {}
public class Amphibian implements CanSwim {}
class Tadpole extends Amphibian {}
public class FindAllTadPole {
  public static void main(String[] args) {
    List<Tadpole> tadpoles = new ArrayList<Tadpole>();
    for(Amphibian amphibian : tadpoles) {
      ___________ tadpole = amphibian;
    }
  }
}""",
        "optionA": "Tadpole",
        "optionB": "CanSwim",
        "optionC": "Long",
        "optionD": "All of the above",
        "correctOption": "B",
        "explanation": "The loop variable 'amphibian' has reference type Amphibian. Since Amphibian implements CanSwim, an Amphibian reference can be assigned directly to a CanSwim, Amphibian, or Object variable without casting. Assigning to Tadpole (Option A) would fail because Tadpole is a subclass of Amphibian and requires an explicit downcast."
    },
    {
        "topic": "Class Design",
        "difficulty": "hard",
        "questionText": "What change allows the following code to compile?",
        "codeSnippet": """1: public interface Animal { public default String getName() { return null; } }
2: interface Mammal { public default String getName() { return null; } }
3: abstract class Otter implements Mammal, Animal {}""",
        "optionA": "Remove the default modifier from Mammal only",
        "optionB": "Override getName() in class Otter",
        "optionC": "Change the return type of getName() in Animal to Object",
        "optionD": "Change the access modifier of Otter to public",
        "correctOption": "B",
        "explanation": "When a class implements two interfaces that provide duplicate default methods with the exact same signature, a compiler error occurs due to multiple inheritance ambiguity. The implementing class (even if abstract) must resolve the conflict by explicitly overriding the default method."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "Which line can be inserted at line 11 to compile and print true?",
        "codeSnippet": """10: public static void main(String[] args) {
11:   // INSERT CODE HERE
12: }
13: private static boolean test(Predicate<Integer> p) {
14:   return p.test(5);
15: }""",
        "optionA": "System.out.println(test(i -> i == 5));",
        "optionB": "System.out.println(test(i -> { i == 5; }));",
        "optionC": "System.out.println(test((int i) -> i == 5));",
        "optionD": "System.out.println(test((int i) -> { return i == 5; }));",
        "correctOption": "A",
        "explanation": "Option A is a valid lambda expression with a single inferred parameter and an expression body. Option B fails because braces require a 'return' statement. Options C and D fail because the parameter type must match Integer (autoboxing works for values, not type inference in lambda parameter declarations)."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "easy",
        "questionText": "Which of the following lines correctly outputs a date representing April 1, 2015 using the java.time API?",
        "codeSnippet": "",
        "optionA": "System.out.println(LocalDate.of(2015, Calendar.APRIL, 1));",
        "optionB": "System.out.println(LocalDate.of(2015, Month.APRIL, 1));",
        "optionC": "System.out.println(new LocalDate(2015, 4, 1));",
        "optionD": "System.out.println(LocalDate.of(2015, 3, 1));",
        "correctOption": "B",
        "explanation": "LocalDate uses private constructors, so 'new LocalDate()' does not compile. In java.time, months are 1-indexed (April is 4, not 3 as in old Calendar). LocalDate.of(2015, Month.APRIL, 1) and LocalDate.of(2015, 4, 1) are the correct factory methods."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "Java bytecode is stored in files with which file extension?",
        "codeSnippet": "",
        "optionA": ".java",
        "optionB": ".bytecode",
        "optionC": ".class",
        "optionD": ".jar",
        "correctOption": "C",
        "explanation": "Java source code is saved in files ending with .java, which are compiled by javac into platform-independent bytecode saved in .class files."
    },
    {
        "topic": "Exceptions",
        "difficulty": "easy",
        "questionText": "Which of the following exceptions is a checked exception in Java?",
        "codeSnippet": "",
        "optionA": "java.io.IOException",
        "optionB": "java.lang.IllegalArgumentException",
        "optionC": "java.lang.NullPointerException",
        "optionD": "java.lang.NumberFormatException",
        "correctOption": "A",
        "explanation": "IOException extends java.lang.Exception directly and does not extend RuntimeException, making it a checked exception. IllegalArgumentException, NullPointerException, and NumberFormatException are all unchecked (Runtime) exceptions."
    }
]
