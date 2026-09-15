# OCA Java SE 8 - Chapter 4: Methods and Encapsulation (29 Questions)

ch4_questions = [
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "easy",
        "questionText": "Which modifier can fill in the blank in this code to make it compile?",
        "codeSnippet": """public class Ant {
  _____ void method() { }
}""",
        "optionA": "default",
        "optionB": "private",
        "optionC": "Public",
        "optionD": "String",
        "correctOption": "B",
        "explanation": "In Java, access modifiers can be public, protected, private, or omitted for default package-private access (there is no 'default' access modifier keyword in classes). 'private' is a valid access modifier. 'Public' is capitalized and invalid; 'String' is a type and cannot precede void."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "Which of the following method declarations compiles successfully?",
        "codeSnippet": "",
        "optionA": "public final int void method() { }",
        "optionB": "static final void method3() { }",
        "optionC": "private void int method() { }",
        "optionD": "void public method() { }",
        "correctOption": "B",
        "explanation": "Optional specifiers such as static and final can be listed in any order, but they must appear BEFORE the return type. In Option B, 'static final void method3() { }' correctly places the specifiers before void. In Option A and C, two return types are given; in Option D, the access modifier 'public' appears after the return type 'void'."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "easy",
        "questionText": "Which of the following methods compiles without a compiler error?",
        "codeSnippet": "",
        "optionA": "public void methodA() { return null; }",
        "optionB": "public int methodD() { return 9; }",
        "optionC": "public int methodE() { return 9.0; }",
        "optionD": "public int methodF() { return; }",
        "correctOption": "B",
        "explanation": "Option B returns an int literal matching the int return type. Option A fails because void methods cannot return a value (even null). Option C fails because 9.0 is a double and cannot be returned as an int without casting. Option D fails because non-void methods must return a value."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "easy",
        "questionText": "Which of the following vararg method signatures compiles successfully?",
        "codeSnippet": "",
        "optionA": "public void moreC(int... nums, String values) {}",
        "optionB": "public void moreD(String... values, int... nums) {}",
        "optionC": "public void moreB(String values, int... nums) {}",
        "optionD": "public void moreE(String[] values, ...int nums) {}",
        "correctOption": "C",
        "explanation": "A varargs parameter must be the last parameter in the method's parameter list, and a method can have at most one vararg parameter. In Option C, 'int... nums' is correctly placed at the end."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "Given the method 'public int howMany(boolean b, boolean... b2) { return b2.length; }', which call returns 2?",
        "codeSnippet": "",
        "optionA": "howMany(true, true);",
        "optionB": "howMany(true, true, true);",
        "optionC": "howMany(true);",
        "optionD": "howMany();",
        "correctOption": "B",
        "explanation": "The first argument 'true' is bound to parameter 'b'. The remaining arguments are gathered into the varargs array 'b2'. In 'howMany(true, true, true)', b2 receives two booleans, so b2.length is 2."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "easy",
        "questionText": "Which of the following can be achieved using Java access modifiers alone?",
        "codeSnippet": "",
        "optionA": "Allow read access to all methods, but not any instance variables (by making variables private and methods public)",
        "optionB": "Make a package-private class visible to only selected classes in the same package",
        "optionC": "Restrict access to only classes that start with the prefix 'Test'",
        "optionD": "Allow external classes to read instance variables directly without method access",
        "correctOption": "A",
        "explanation": "By declaring instance variables private and getter/setter methods public, a class encapsulates its state, preventing direct field access while granting method access. Access modifiers apply at class, package, and subclass levels, not on naming conventions or selective package subsets."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "hard",
        "questionText": "Given Classroom in 'my.school' and School in 'my.city', which line in School's main() compiles without error?",
        "codeSnippet": """package my.school;
public class Classroom {
  private int roomNumber;
  protected String teacherName;
  static int globalKey = 54321;
  public int floor = 3;
  Classroom(int r, String t) {
    roomNumber = r;
    teacherName = t;
  }
}

package my.city;
import my.school.*;
public class School {
  public static void main(String[] args) {
    // Line 5: System.out.println(Classroom.globalKey);
    // Line 6: Classroom room = new Classroom(101, "Mrs. Anderson");
    // Line 7: System.out.println(room.roomNumber);
    // Line 8: System.out.println(room.floor);
    // Line 9: System.out.println(room.teacherName);
  }
}""",
        "optionA": "Line 5",
        "optionB": "Line 6",
        "optionC": "Line 8",
        "optionD": "Line 9",
        "correctOption": "C",
        "explanation": "Classroom and School are in different packages. Line 5 fails because globalKey has default package-private access. Line 6 fails because Classroom's constructor has package-private access. Line 7 fails because roomNumber is private. Line 9 fails because teacherName is protected and School does not inherit from Classroom. Only line 8 accesses 'public int floor', which is public and accessible anywhere."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "easy",
        "questionText": "What is the primary difference between data encapsulation and immutability?",
        "codeSnippet": "",
        "optionA": "Encapsulation uses public variables; immutability uses private variables",
        "optionB": "Encapsulation restricts direct field access using private variables and public getters/setters, whereas immutability forbids modifying state after instantiation (no setters)",
        "optionC": "Encapsulation requires classes to be final; immutability allows subclassing",
        "optionD": "Encapsulation and immutability are identical concepts in Java",
        "correctOption": "B",
        "explanation": "Encapsulation protects class invariants by making fields private and controlling mutations via accessors/mutators. Immutability goes a step further by ensuring that once an object is constructed, its state can never be altered (omitting setters and protecting mutable references)."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "easy",
        "questionText": "Which method signature follows JavaBeans naming conventions for a boolean property named 'canSwim'?",
        "codeSnippet": "",
        "optionA": "public boolean getCanSwim() { return canSwim; }",
        "optionB": "public boolean isCanSwim() { return canSwim; }",
        "optionC": "public boolean canSwim() { return canSwim; }",
        "optionD": "public boolean isSwim() { return canSwim; }",
        "correctOption": "B",
        "explanation": "According to JavaBeans naming conventions, boolean accessor methods must begin with the prefix 'is' followed by the capitalized property name: 'isCanSwim()'."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "What is the output of running class Chimp?",
        "codeSnippet": """package rope;
public class Rope {
  public static int LENGTH = 5;
  static { LENGTH = 10; }
  public static void swing() { System.out.print("swing "); }
}

package chimp;
import rope.*;
import static rope.Rope.*;
public class Chimp {
  public static void main(String[] args) {
    Rope.swing();
    new Rope().swing();
    System.out.println(LENGTH);
  }
}""",
        "optionA": "swing swing 5",
        "optionB": "swing swing 10",
        "optionC": "swing 10",
        "optionD": "Compiler error on line 2 (static import)",
        "correctOption": "B",
        "explanation": "Rope.swing() outputs 'swing '. new Rope().swing() calls the static method via an instance reference, outputting 'swing '. During class initialization of Rope, LENGTH is initialized to 5, then the static initializer immediately sets LENGTH to 10. Chimp imports static members of Rope and prints LENGTH (10). Output: 'swing swing 10'."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "What happens when attempting to compile the following class?",
        "codeSnippet": """public class Rope {
  public static void swing() { System.out.print("swing "); }
  public void climb() { System.out.println("climb "); }
  public static void play() {
    swing();
    climb(); // LINE 10
  }
  public static void main(String[] args) {
    Rope.play();
  }
}""",
        "optionA": "Compiles and prints 'swing climb '",
        "optionB": "Compilation error on line 10 because a static method cannot directly call an instance method",
        "optionC": "Throws NullPointerException at runtime",
        "optionD": "Compilation error on line 12",
        "correctOption": "B",
        "explanation": "Static methods belong to the class and do not have an associated 'this' instance context. Therefore, the static method play() cannot directly invoke the non-static instance method climb() without an explicit object reference."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "hard",
        "questionText": "What is the output of the following program?",
        "codeSnippet": """public class RopeSwing {
  private static Rope rope1 = new Rope();
  private static Rope rope2 = new Rope();
  {
    System.out.println(rope1.length);
  }
  public static void main(String[] args) {
    rope1.length = 2;
    rope2.length = 8;
    System.out.println(rope1.length);
  }
}
class Rope {
  public static int length = 0;
}""",
        "optionA": "02",
        "optionB": "08",
        "optionC": "2",
        "optionD": "8",
        "correctOption": "D",
        "explanation": "Notice that RopeSwing has an instance initializer '{ System.out.println(rope1.length); }', but RopeSwing is never instantiated with new RopeSwing() in main()! Thus the instance block never executes. In main(), 'length' is a static variable in Rope. Assigning rope2.length = 8 updates the shared static variable. System.out.println(rope1.length) reads this shared static variable, printing 8."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "hard",
        "questionText": "How many compiler errors are present in the following class definition?",
        "codeSnippet": """1: public class RopeSwing {
2:   private static final String leftRope;
3:   private static final String rightRope;
4:   private static final String bench;
5:   private static final String name = "name";
6:   static {
7:     leftRope = "left";
8:     rightRope = "right";
9:   }
10:  static {
11:    name = "name";
12:    rightRope = "right";
13:  }
14:  public static void main(String[] args) {
15:    bench = "bench";
16:  }
17: }""",
        "optionA": "2",
        "optionB": "3",
        "optionC": "4",
        "optionD": "5",
        "correctOption": "C",
        "explanation": "There are 4 compiler errors: (1) line 4: static final bench is never initialized in a static initializer; (2) line 11: name is already initialized on line 5 and cannot be reassigned; (3) line 12: rightRope is already initialized on line 8 and cannot be reassigned in a second static block; (4) line 15: static final bench cannot be assigned inside main()."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "Which line can replace line 2 to allow sort(list) to compile in class Imports?",
        "codeSnippet": """import java.util.*;
// INSERT CODE HERE
public class Imports {
  public void method(ArrayList<String> list) {
    sort(list);
  }
}""",
        "optionA": "import static java.util.Collections;",
        "optionB": "import static java.util.Collections.*;",
        "optionC": "static import java.util.Collections.*;",
        "optionD": "import static java.util.Collections.sort(ArrayList<String>);",
        "correctOption": "B",
        "explanation": "Static imports must use the keyword order 'import static' followed by the fully qualified class name and static member name or wildcard ('import static java.util.Collections.*;' or 'import static java.util.Collections.sort;'). You cannot include method parameter signatures in import statements."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "What does the following overloaded method execution print?",
        "codeSnippet": """public class Test {
  public void print(byte x) { System.out.print("byte"); }
  public void print(int x) { System.out.print("int"); }
  public void print(float x) { System.out.print("float"); }
  public void print(Object x) { System.out.print("Object"); }
  public static void main(String[] args) {
    Test t = new Test();
    short s = 123;
    t.print(s);
    t.print(true);
    t.print(6.789);
  }
}""",
        "optionA": "bytefloatObject",
        "optionB": "intfloatObject",
        "optionC": "intObjectObject",
        "optionD": "byteObjectObject",
        "correctOption": "C",
        "explanation": "For t.print(s): 's' is a short; Java promotes short to int (wider primitive), matching print(int). For t.print(true): boolean autoboxes to Boolean, which matches print(Object). For t.print(6.789): 6.789 is a double; Java autoboxes double to Double, which matches print(Object). Result: 'intObjectObject'."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "easy",
        "questionText": "What is the output of the following program?",
        "codeSnippet": """public class Squares {
  public static long square(int x) {
    long y = x * (long) x;
    x = -1;
    return y;
  }
  public static void main(String[] args) {
    int value = 9;
    long result = square(value);
    System.out.println(value);
  }
}""",
        "optionA": "-1",
        "optionB": "9",
        "optionC": "81",
        "optionD": "Compiler error on line 9",
        "correctOption": "B",
        "explanation": "In Java, primitive arguments are passed by value. Reassigning x = -1 inside the square() method only changes the local copy 'x'. The caller's variable 'value' remains 9."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "What is printed for s1, s2, and s3 after executing the following code?",
        "codeSnippet": """public class StringBuilders {
  public static StringBuilder work(StringBuilder a, StringBuilder b) {
    a = new StringBuilder("a");
    b.append("b");
    return a;
  }
  public static void main(String[] args) {
    StringBuilder s1 = new StringBuilder("s1");
    StringBuilder s2 = new StringBuilder("s2");
    StringBuilder s3 = work(s1, s2);
    System.out.println("s1 = " + s1);
    System.out.println("s2 = " + s2);
    System.out.println("s3 = " + s3);
  }
}""",
        "optionA": "s1 = a, s2 = s2b, s3 = a",
        "optionB": "s1 = s1, s2 = s2b, s3 = a",
        "optionC": "s1 = s1, s2 = s2, s3 = a",
        "optionD": "s1 = a, s2 = s2, s3 = s1",
        "correctOption": "B",
        "explanation": "In work(s1, s2), 'a' is reassigned to point to a new StringBuilder(\"a\"), which does not affect the caller's reference s1 (s1 stays \"s1\"). b.append(\"b\") mutates the underlying object referred to by s2, so s2 becomes \"s2b\". The returned reference 'a' is assigned to s3, so s3 is \"a\"."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "Which statement regarding constructor rules and 'this' is TRUE in Java?",
        "codeSnippet": "",
        "optionA": "this() can be called from anywhere inside any method",
        "optionB": "this.variableName can be called from any static method in the class",
        "optionC": "A call to this() can only appear as the first statement in a constructor",
        "optionD": "The compiler automatically supplies a default constructor even if an explicit constructor is defined",
        "correctOption": "C",
        "explanation": "A constructor can invoke another overloaded constructor in the same class using this(...), and this call MUST strictly be the first non-comment statement in that constructor."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "Which class definition compiles AND has a compiler-supplied default no-argument constructor?",
        "codeSnippet": "",
        "optionA": "public class Bird { public bird() {} }",
        "optionB": "public class Bird { public Bird(String name) {} }",
        "optionC": "public class Bird { void Bird() { } }",
        "optionD": "public class Bird { private Bird(int age) {} }",
        "correctOption": "C",
        "explanation": "In Option C, 'void Bird() { }' has a return type (void), which means it is a regular method that happens to share the class name, NOT a constructor! Because no constructors were explicitly defined in Option C, the compiler generates a default no-argument constructor. In Option A, 'bird()' has no return type and case does not match (fails compilation). In B and D, user constructors are defined, suppressing the default constructor."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "Which code can be inserted at LINE 1 to allow class BirdSeed to print 2?",
        "codeSnippet": """public class BirdSeed {
  private int numberBags;
  boolean call;
  public BirdSeed() {
    // LINE 1
    call = false;
  }
  public BirdSeed(int numberBags) {
    this.numberBags = numberBags;
  }
  public static void main(String[] args) {
    BirdSeed seed = new BirdSeed();
    System.out.println(seed.numberBags);
  }
}""",
        "optionA": "BirdSeed(2);",
        "optionB": "new BirdSeed(2);",
        "optionC": "this(2);",
        "optionD": "this.numberBags = 2;",
        "correctOption": "C",
        "explanation": "To invoke an overloaded constructor from another constructor, the syntax is 'this(arguments);'. It must be placed on the very first line of the constructor."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "easy",
        "questionText": "Which statement correctly assigns constructor parameter 'numSpots' to the instance field of the same name?",
        "codeSnippet": """public class Cheetah {
  int numSpots;
  public Cheetah(int numSpots) {
    // INSERT CODE HERE
  }
}""",
        "optionA": "numSpots = numSpots;",
        "optionB": "this.numSpots = numSpots;",
        "optionC": "numSpots = this.numSpots;",
        "optionD": "super.numSpots = numSpots;",
        "correctOption": "B",
        "explanation": "Because the parameter name shadows the instance field, 'this.numSpots' explicitly references the instance variable, assigning it the parameter value."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "hard",
        "questionText": "What is the output when class OrderDriver is executed?",
        "codeSnippet": """public class Order {
  static String result = "";
  { result += "c"; }
  static
  { result += "u"; }
  { result += "r"; }
}
public class OrderDriver {
  public static void main(String[] args) {
    System.out.print(Order.result + " ");
    System.out.print(Order.result + " ");
    new Order();
    new Order();
    System.out.print(Order.result + " ");
  }
}""",
        "optionA": "curur",
        "optionB": "u ucrcr",
        "optionC": "u u ucrcr",
        "optionD": "u u curcur",
        "correctOption": "C",
        "explanation": "First access to Order (Order.result) triggers static initialization: static block adds 'u' -> result=\"u\". Lines 3 & 4 print \"u \" twice: \"u u \". Next, 'new Order()' runs instance initializers in order: 'c' then 'r' -> result=\"ucr\". Second 'new Order()' runs instance initializers again: 'c' then 'r' -> result=\"ucrcr\". Line 7 prints Order.result. Total output: 'u u ucrcr'."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "hard",
        "questionText": "What is the output of the following class?",
        "codeSnippet": """public class Order {
  String value = "t";
  { value += "a"; }
  { value += "c"; }
  public Order() {
    value += "b";
  }
  public Order(String s) {
    value += s;
  }
  public static void main(String[] args) {
    Order order = new Order("f");
    order = new Order();
    System.out.println(order.value);
  }
}""",
        "optionA": "tacb",
        "optionB": "tacf",
        "optionC": "tacbf",
        "optionD": "tacftacb",
        "correctOption": "A",
        "explanation": "When new Order() is instantiated on line 13: fields and instance initializers execute in source order: value starts as \"t\", first block appends \"a\" (\"ta\"), second block appends \"c\" (\"tac\"). Then the no-arg constructor runs and appends \"b\" (\"tacb\"). Printing order.value outputs 'tacb'."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "Given the class Order3, which assignment compiles inside CODE SNIPPET 1 (an instance block)?",
        "codeSnippet": """public class Order3 {
  final String value1 = "1";
  static String value2 = "2";
  String value3 = "3";
  {
    // CODE SNIPPET 1
  }
}""",
        "optionA": "value1 = \"d\";",
        "optionB": "value2 = \"e\";",
        "optionC": "value1 = null;",
        "optionD": "None of the above",
        "correctOption": "B",
        "explanation": "value1 is a 'final' instance variable already initialized on its declaration line; it cannot be reassigned anywhere else. value2 is a static non-final variable; instance blocks can access and modify static variables without issue. Therefore, 'value2 = \"e\";' compiles."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "hard",
        "questionText": "What does the following program print?",
        "codeSnippet": """public class Create {
  Create() { System.out.print("1 "); }
  Create(int num) { System.out.print("2 "); }
  Create(Integer num) { System.out.print("3 "); }
  Create(Object num) { System.out.print("4 "); }
  Create(int... nums) { System.out.print("5 "); }
  public static void main(String[] args) {
    new Create(100);
    new Create(1000L);
  }
}""",
        "optionA": "2 4",
        "optionB": "3 4",
        "optionC": "4 2",
        "optionD": "2 5",
        "correctOption": "A",
        "explanation": "For new Create(100): 100 is an int literal; it matches Create(int) directly (exact primitive match), printing '2 '. For new Create(1000L): 1000L is a long literal. Java cannot widen long to int. Java will autobox long to Long; Long does not match Integer, but Long is a subclass of Object! Therefore it matches Create(Object num), printing '4 '. Total output: '2 4'."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "easy",
        "questionText": "What is the output of the following class using java.util.function.Predicate?",
        "codeSnippet": """import java.util.function.*;
public class Panda {
  int age;
  public static void main(String[] args) {
    Panda p1 = new Panda();
    p1.age = 1;
    check(p1, p -> p.age < 5);
  }
  private static void check(Panda panda, Predicate<Panda> pred) {
    String result = pred.test(panda) ? "match" : "not match";
    System.out.print(result);
  }
}""",
        "optionA": "match",
        "optionB": "not match",
        "optionC": "Compiler error on line 8",
        "optionD": "NullPointerException at runtime",
        "correctOption": "A",
        "explanation": "The lambda expression 'p -> p.age < 5' implements the single abstract method 'boolean test(T t)' of Predicate<Panda>. Since p1.age is 1, which is less than 5, pred.test(p1) returns true, outputting 'match'."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "What is the result of attempting to compile and run the following code?",
        "codeSnippet": """interface Climb {
  boolean isTooHigh(int height, int limit);
}
public class Climber {
  public static void main(String[] args) {
    check((h, l) -> h.append(l).isEmpty(), 5);
  }
  private static void check(Climb climb, int height) {
    if (climb.isTooHigh(height, 10))
      System.out.println("too high");
    else
      System.out.println("ok");
  }
}""",
        "optionA": "ok",
        "optionB": "too high",
        "optionC": "Compiler error on line 7 because h and l are inferred as primitive ints",
        "optionD": "Throws ClassCastException",
        "correctOption": "C",
        "explanation": "The interface Climb specifies 'boolean isTooHigh(int height, int limit);'. Therefore, the compiler infers parameters 'h' and 'l' as primitive ints. Primitive types do not have an append() method, so line 7 fails compilation."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "Which of the following lambda expressions can correctly fill the blank in 'list.removeIf(______);' where list is 'List<String>'?",
        "codeSnippet": "",
        "optionA": "s -> { return s.isEmpty(); }",
        "optionB": "s -> { s.isEmpty(); }",
        "optionC": "String s -> s.isEmpty()",
        "optionD": "(s) -> { s.isEmpty(); }",
        "correctOption": "A",
        "explanation": "When braces '{}' are used in a lambda body, a 'return' statement is mandatory if a value must be returned. Option A correctly includes 'return s.isEmpty();'. Option B and D omit 'return'. Option C fails because parameter lists with explicit types require parentheses: '(String s) -> ...'."
    },
    {
        "topic": "Methods and Encapsulation",
        "difficulty": "medium",
        "questionText": "Given 'interface Secret { String magic(double d); }', which lambda expression is valid?",
        "codeSnippet": "",
        "optionA": "(e) -> \"Poof\"",
        "optionB": "(e) -> { \"Poof\" }",
        "optionC": "(e) -> { String e = \"\"; return \"Poof\"; }",
        "optionD": "(e) -> { return \"Poof\" }",
        "correctOption": "A",
        "explanation": "Option A is a valid single-expression lambda returning String '\"Poof\"'. Option B and D fail because block bodies require semicolons and return keywords. Option C fails because declaring 'String e' redeclares lambda parameter 'e' within the same scope."
    }
]
