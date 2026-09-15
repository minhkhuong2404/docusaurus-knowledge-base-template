# OCA Java SE 8 - Chapter 5: Class Design (20 Questions)

ch5_questions = [
    {
        "topic": "Class Design",
        "difficulty": "easy",
        "questionText": "In Java 8, which modifier is implicitly applied by the compiler to ALL interface methods (abstract, default, and static)?",
        "codeSnippet": "",
        "optionA": "abstract",
        "optionB": "public",
        "optionC": "static",
        "optionD": "default",
        "correctOption": "B",
        "explanation": "In Java 8, ALL interface methods (whether abstract, default, or static) are implicitly public. Prior to Java 8, all methods were also assumed abstract, but since Java 8 allows concrete default and static methods in interfaces, abstract is no longer implicitly applied to all methods."
    },
    {
        "topic": "Class Design",
        "difficulty": "medium",
        "questionText": "What is the result of attempting to compile and run the following code?",
        "codeSnippet": """1: class Mammal {
2:   public Mammal(int age) {
3:     System.out.print("Mammal");
4:   }
5: }
6: public class Platypus extends Mammal {
7:   public Platypus() {
8:     System.out.print("Platypus");
9:   }
10:  public static void main(String[] args) {
11:    new Mammal(5);
12:  }
13: }""",
        "optionA": "Mammal",
        "optionB": "PlatypusMammal",
        "optionC": "The code fails to compile because Platypus does not explicitly call super(int age)",
        "optionD": "The code fails to compile because Mammal is not public",
        "correctOption": "C",
        "explanation": "The parent class Mammal defines an explicit constructor taking an int, so the compiler does NOT insert a default no-argument constructor into Mammal. In Platypus(), the compiler attempts to insert super() on line 8, but no matching no-arg constructor exists in Mammal. Therefore, line 8 generates a compiler error."
    },
    {
        "topic": "Class Design",
        "difficulty": "easy",
        "questionText": "Given the following declarations, which reference type can declare 'frog' so that 'frog = new TurtleFrog();' compiles?",
        "codeSnippet": """public interface CanHop {}
public class Frog implements CanHop {}
public class TurtleFrog extends Frog {}""",
        "optionA": "Frog, TurtleFrog, CanHop, or Object",
        "optionB": "TurtleFrog only",
        "optionC": "Frog or TurtleFrog only",
        "optionD": "CanHop only",
        "correctOption": "A",
        "explanation": "TurtleFrog is a subclass of Frog, which implements CanHop, and all classes inherit from Object. Due to polymorphism, an instance of TurtleFrog can be assigned to reference variables of type TurtleFrog, Frog, CanHop, or Object without an explicit cast."
    },
    {
        "topic": "Class Design",
        "difficulty": "hard",
        "questionText": "What happens when attempting to compile the following class Beaver extending Rodent?",
        "codeSnippet": """public class Rodent {
  protected static Integer chew() throws Exception {
    System.out.println("Rodent is chewing");
    return 1;
  }
}
public class Beaver extends Rodent {
  public Number chew() throws RuntimeException {
    System.out.println("Beaver is chewing on wood");
    return 2;
  }
}""",
        "optionA": "It compiles without issue",
        "optionB": "It fails to compile because of static modifier mismatch and non-covariant return types",
        "optionC": "It fails to compile because Beaver's method throws RuntimeException",
        "optionD": "It fails to compile because Beaver cannot increase method visibility to public",
        "correctOption": "B",
        "explanation": "Two rules are violated: (1) Static modifier mismatch: Rodent.chew() is static, so Beaver.chew() must also be static (for method hiding). A non-static method cannot override/hide a static parent method. (2) Return type: Number is a superclass of Integer, not a subclass (return types must be covariant). Both cause compilation errors."
    },
    {
        "topic": "Class Design",
        "difficulty": "easy",
        "questionText": "Which of the following members in a subclass can ONLY be hidden and CANNOT be overridden?",
        "codeSnippet": "",
        "optionA": "Static methods and instance variables",
        "optionB": "Public instance methods",
        "optionC": "Protected instance methods",
        "optionD": "Abstract methods",
        "correctOption": "A",
        "explanation": "In Java, instance variables (fields) and static methods cannot be overridden; they can only be hidden. Instance methods that are public or protected can be overridden polymorphically."
    },
    {
        "topic": "Class Design",
        "difficulty": "medium",
        "questionText": "Why does the following code fail to compile?",
        "codeSnippet": """interface HasExoskeleton {
  abstract int getNumberOfSections();
}
abstract class Insect implements HasExoskeleton {
  abstract int getNumberOfLegs();
}
public class Beetle extends Insect {
  int getNumberOfLegs() { return 6; }
}""",
        "optionA": "Insect is abstract and cannot implement an interface",
        "optionB": "Beetle, as the first concrete subclass, does not implement the inherited abstract method getNumberOfSections()",
        "optionC": "HasExoskeleton cannot contain abstract methods",
        "optionD": "Beetle cannot extend an abstract class",
        "correctOption": "B",
        "explanation": "An abstract class (Insect) can inherit interface abstract methods without implementing them. However, the first concrete subclass (Beetle) must implement ALL inherited abstract methods: both getNumberOfLegs() and getNumberOfSections(). Because Beetle does not implement getNumberOfSections(), it fails compilation."
    },
    {
        "topic": "Class Design",
        "difficulty": "easy",
        "questionText": "Which statement regarding polymorphism in Java is TRUE?",
        "codeSnippet": "",
        "optionA": "If a method takes a superclass parameter type, instances of any subclass may be passed to that method without an explicit cast",
        "optionB": "A reference to an object may be cast to a subclass without an explicit cast",
        "optionC": "All ClassCastExceptions can be detected at compile time",
        "optionD": "Overridden methods in child classes are ignored when invoked through a parent reference",
        "correctOption": "A",
        "explanation": "Polymorphic parameter passing allows any subclass instance to be passed wherever a superclass (or implemented interface) is expected, without an explicit cast. Downcasting to a subclass requires an explicit cast, and runtime ClassCastExceptions cannot all be caught at compile time."
    },
    {
        "topic": "Class Design",
        "difficulty": "medium",
        "questionText": "What compile-time errors exist in the following interface definition?",
        "codeSnippet": """public interface Herbivore {
  int amount = 10;
  public static void eatGrass(); // LINE 3
  public int chew() { return 13; } // LINE 4
}""",
        "optionA": "Line 2 fails because interface variables cannot be initialized inline",
        "optionB": "Line 3 fails because static interface methods must provide a body, and Line 4 fails because non-static methods with bodies must be marked with the default keyword",
        "optionC": "Line 3 only",
        "optionD": "Line 4 only",
        "correctOption": "B",
        "explanation": "In Java 8 interfaces: (1) Static interface methods must have a method body (line 3 is missing a body). (2) An interface method that has a body and is not static must be explicitly marked with the 'default' keyword (line 4 has a body but lacks the default keyword). Both lines 3 and 4 fail compilation."
    },
    {
        "topic": "Class Design",
        "difficulty": "easy",
        "questionText": "What is the result of compiling the following interface and abstract class declarations?",
        "codeSnippet": """public interface CanFly {
  void fly();
}
interface HasWings {
  public abstract Object getWindSpan();
}
abstract class Falcon implements CanFly, HasWings {}""",
        "optionA": "The code compiles without issue",
        "optionB": "Compilation fails because an abstract class must implement all interface methods immediately",
        "optionC": "Compilation fails because an interface cannot have default package visibility",
        "optionD": "Compilation fails because CanFly and HasWings cannot be implemented simultaneously",
        "correctOption": "A",
        "explanation": "Abstract classes are permitted to implement interfaces without implementing any of the inherited abstract methods; the responsibility is deferred to the first concrete subclass."
    },
    {
        "topic": "Class Design",
        "difficulty": "medium",
        "questionText": "Which statement is true for BOTH abstract classes and interfaces in Java 8?",
        "codeSnippet": "",
        "optionA": "Both can contain instance variables",
        "optionB": "Neither can be instantiated directly using 'new'",
        "optionC": "Both can contain default methods",
        "optionD": "Both support multiple class inheritance",
        "correctOption": "B",
        "explanation": "Neither abstract classes nor interfaces can be instantiated directly using the 'new' keyword. Interfaces cannot declare non-static, non-final instance fields (only public static final constants), and only interfaces can declare 'default' methods."
    },
    {
        "topic": "Class Design",
        "difficulty": "easy",
        "questionText": "Which modifiers are implicitly assumed by the compiler for all interface variables?",
        "codeSnippet": "",
        "optionA": "public static final",
        "optionB": "protected static final",
        "optionC": "private final",
        "optionD": "public abstract",
        "correctOption": "A",
        "explanation": "Every variable declared in a Java interface is implicitly public, static, and final (a constant)."
    },
    {
        "topic": "Class Design",
        "difficulty": "medium",
        "questionText": "What is the output of the following program?",
        "codeSnippet": """interface Nocturnal {
  default boolean isBlind() { return true; }
}
public class Owl implements Nocturnal {
  public boolean isBlind() { return false; }
  public static void main(String[] args) {
    Nocturnal nocturnal = (Nocturnal) new Owl();
    System.out.println(nocturnal.isBlind());
  }
}""",
        "optionA": "true",
        "optionB": "false",
        "optionC": "Compilation error",
        "optionD": "ClassCastException at runtime",
        "correctOption": "B",
        "explanation": "Default interface methods are virtual methods. When a class (Owl) overrides a default method, the overridden implementation in the class takes precedence at runtime, even when invoked through the interface reference. Output is false."
    },
    {
        "topic": "Class Design",
        "difficulty": "medium",
        "questionText": "What is the output of the following code snippet?",
        "codeSnippet": """class Arthropod {
  public void printName(double input) { System.out.print("Arthropod"); }
}
public class Spider extends Arthropod {
  public void printName(int input) { System.out.print("Spider"); }
  public static void main(String[] args) {
    Spider spider = new Spider();
    spider.printName(4);
    spider.printName(9.0);
  }
}""",
        "optionA": "SpiderArthropod",
        "optionB": "ArthropodSpider",
        "optionC": "SpiderSpider",
        "optionD": "ArthropodArthropod",
        "correctOption": "A",
        "explanation": "Spider.printName(int) overloads (does not override) Arthropod.printName(double). When spider.printName(4) is called, 4 is an int, exactly matching Spider's method -> prints 'Spider'. When spider.printName(9.0) is called, 9.0 is a double, matching the inherited method in Arthropod -> prints 'Arthropod'. Result: 'SpiderArthropod'."
    },
    {
        "topic": "Class Design",
        "difficulty": "easy",
        "questionText": "Which statement is true regarding interface inheritance with the extends keyword?",
        "codeSnippet": """interface HasVocalCords {
  public abstract void makeSound();
}
public interface CanBark extends HasVocalCords {
  public void bark();
}""",
        "optionA": "An interface cannot extend another interface",
        "optionB": "CanBark inherits both makeSound() and bark() methods",
        "optionC": "CanBark must implement makeSound() with a default method body",
        "optionD": "Classes implementing CanBark are only required to implement bark()",
        "correctOption": "B",
        "explanation": "In Java, an interface extends another interface using the 'extends' keyword and inherits all methods of the parent interface. Any concrete class implementing CanBark must implement both makeSound() and bark()."
    },
    {
        "topic": "Class Design",
        "difficulty": "easy",
        "questionText": "Which of the following is a mandatory requirement for a concrete class extending an abstract class?",
        "codeSnippet": "",
        "optionA": "It must be marked with the final keyword",
        "optionB": "It must implement all inherited abstract methods",
        "optionC": "It cannot implement any interfaces",
        "optionD": "It must declare a default no-argument constructor",
        "correctOption": "B",
        "explanation": "A concrete class is a non-abstract class. By definition, a concrete class must provide implementations for all inherited abstract methods that have not already been implemented by an intermediate class."
    },
    {
        "topic": "Class Design",
        "difficulty": "easy",
        "questionText": "What is the result of attempting to compile the following code?",
        "codeSnippet": """abstract class Reptile {
  public final void layEggs() { System.out.println("Reptile laying eggs"); }
}
public class Lizard extends Reptile {
  public void layEggs() { System.out.println("Lizard laying eggs"); }
}""",
        "optionA": "Compiles and prints 'Reptile laying eggs'",
        "optionB": "Compiles and prints 'Lizard laying eggs'",
        "optionC": "Compilation fails because final methods in a superclass cannot be overridden by a subclass",
        "optionD": "Throws an UnsupportedOperationException",
        "correctOption": "C",
        "explanation": "In Java, methods marked with the 'final' keyword cannot be overridden by any subclass. Attempting to override layEggs() in Lizard causes a compiler error."
    },
    {
        "topic": "Class Design",
        "difficulty": "medium",
        "questionText": "What happens when attempting to compile and run class Whale and Orca?",
        "codeSnippet": """public abstract class Whale {
  public abstract void dive() {}; // LINE 2
}
class Orca extends Whale {
  public void dive(int depth) { System.out.println("Orca diving"); } // LINE 9
}""",
        "optionA": "Outputs Orca diving",
        "optionB": "Fails compilation on line 2 because abstract methods cannot have a body {}",
        "optionC": "Fails compilation on line 9 because Orca cannot overload dive",
        "optionD": "Fails compilation only because Whale must be public",
        "correctOption": "B",
        "explanation": "Line 2 contains an abstract method declaration that provides an empty body '{}'. Abstract methods in Java are terminated with a semicolon ';' and must never have a method body. Thus line 2 generates a compiler error."
    },
    {
        "topic": "Class Design",
        "difficulty": "hard",
        "questionText": "Why does class ClownFish fail to compile?",
        "codeSnippet": """interface Aquatic {
  public default int getNumberOfGills(int input) { return 2; }
}
public class ClownFish implements Aquatic {
  public String getNumberOfGills() { return "4"; }
  public String getNumberOfGills(int input) { return "6"; } // LINE 6
}""",
        "optionA": "getNumberOfGills() on line 5 conflicts with the interface",
        "optionB": "Line 6 fails compilation because the return type String is not covariant with the interface method's return type int",
        "optionC": "Interfaces cannot contain default methods in Java",
        "optionD": "ClownFish must explicitly call super.getNumberOfGills()",
        "correctOption": "B",
        "explanation": "The interface declares 'int getNumberOfGills(int input)'. On line 6, ClownFish declares a method with the exact same signature 'getNumberOfGills(int input)' but returns String. In method overriding, return types must be covariant (same type or subtype). String is not a subtype of int, causing a compiler error."
    },
    {
        "topic": "Class Design",
        "difficulty": "medium",
        "questionText": "Given 'public class Cobra extends Snake {}' and 'public class GardenSnake {}' (where GardenSnake does NOT extend Snake), which call to 'setSnake(Snake s)' compiles?",
        "codeSnippet": "",
        "optionA": "setSnake(new GardenSnake());",
        "optionB": "setSnake(new Cobra());",
        "optionC": "setSnake(new Object());",
        "optionD": "setSnake(\"Snake\");",
        "correctOption": "B",
        "explanation": "Cobra is a subclass of Snake, so an instance of Cobra can be passed to setSnake(Snake snake) without an explicit cast. GardenSnake does not extend Snake, so it cannot be passed."
    },
    {
        "topic": "Class Design",
        "difficulty": "hard",
        "questionText": "What is the output of the following code snippet?",
        "codeSnippet": """public abstract class Bird {
  private void fly() { System.out.println("Bird is flying"); }
  public static void main(String[] args) {
    Bird bird = new Pelican();
    bird.fly();
  }
}
class Pelican extends Bird {
  protected void fly() { System.out.println("Pelican is flying"); }
}""",
        "optionA": "Bird is flying",
        "optionB": "Pelican is flying",
        "optionC": "Compilation error on line 4",
        "optionD": "Compilation error on line 5",
        "correctOption": "A",
        "explanation": "In Bird, fly() is marked private. Private methods cannot be overridden by subclasses; they are only hidden. When bird.fly() is called from within Bird's main() method on a reference of type Bird, it invokes Bird's private fly() method, printing 'Bird is flying'."
    }
]
