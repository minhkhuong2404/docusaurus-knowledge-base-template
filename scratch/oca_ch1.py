# OCA Java SE 8 - Chapter 1: Java Building Blocks (23 Questions)

ch1_questions = [
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "Which of the following is a valid Java identifier?",
        "codeSnippet": "",
        "optionA": "1980_s",
        "optionB": "_helloWorld",
        "optionC": "true",
        "optionD": "java.lang",
        "correctOption": "B",
        "explanation": "Option B (_helloWorld) is valid because identifiers in Java may begin with a letter, underscore (_), or dollar sign ($). Option A is invalid because identifiers cannot begin with a number. Option C is invalid because 'true' is a reserved boolean literal. Option D is invalid because dots (.) are package separators and not allowed in identifiers."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "What is the output of the following program?",
        "codeSnippet": """public class WaterBottle {
  private String brand;
  private boolean empty;
  public static void main(String[] args) {
    WaterBottle wb = new WaterBottle();
    System.out.print("Empty = " + wb.empty);
    System.out.print(", Brand = " + wb.brand);
  }
}""",
        "optionA": "Empty = false, Brand = null",
        "optionB": "Empty = false, Brand =",
        "optionC": "Empty = null, Brand = null",
        "optionD": "Line 6 generates a compiler error",
        "correctOption": "A",
        "explanation": "Instance variables (fields) receive default values upon object instantiation. For primitive boolean types, the default value is false. For reference types such as String, the default value is null. Therefore, the program outputs 'Empty = false, Brand = null'."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "medium",
        "questionText": "Given the following lines of code inside a method, which statement correctly identifies the compiler errors?",
        "codeSnippet": """4: short numPets = 5;
5: int numGrains = 5.6;
6: String name = "Scruffy";
7: numPets.length();
8: numGrains.length();
9: name.length();""",
        "optionA": "Lines 5, 7, and 8 generate compiler errors",
        "optionB": "Only line 5 generates a compiler error",
        "optionC": "Only lines 7 and 8 generate compiler errors",
        "optionD": "All lines compile except line 9",
        "correctOption": "A",
        "explanation": "Line 5 fails because 5.6 is a double literal and cannot be assigned to an int without an explicit cast. Lines 7 and 8 fail because numPets (short) and numGrains (int) are primitive types; primitives do not have methods. Line 9 compiles because length() is a valid method on String."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "medium",
        "questionText": "Given the following class, where can 'String result = \"done\";' be inserted so that line 8 compiles without error?",
        "codeSnippet": """1: public class Snake {
2:   // INSERTION POINT 1
3:   public void shed(boolean time) {
4:     // INSERTION POINT 2
5:     if (time) {
6:       // INSERTION POINT 3
7:     }
8:     System.out.println(result);
9:   }
10: }""",
        "optionA": "At line 2 or line 4 only",
        "optionB": "At line 6 only",
        "optionC": "At line 2, line 4, or line 6",
        "optionD": "At line 2 only",
        "correctOption": "A",
        "explanation": "Inserting at line 2 makes result an instance variable, in scope throughout the class. Inserting at line 4 makes result a local variable scoped to the whole method. Inserting at line 6 scopes result to the if-block, so it is out of scope on line 8."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "Given classes in packages 'aquarium' and 'aquarium.jellies', which import allows AquariumVisitor to compile?",
        "codeSnippet": """package aquarium;
public class Tank { }

package aquarium.jellies;
public class Jelly { }

package visitor;
// INSERT IMPORTS HERE
public class AquariumVisitor {
  public void admire(Jelly jelly) { }
}""",
        "optionA": "import aquarium.*;",
        "optionB": "import aquarium.*.Jelly;",
        "optionC": "import aquarium.jellies.Jelly;",
        "optionD": "import aquarium.jellies.Jelly.*;",
        "correctOption": "C",
        "explanation": "Jelly is located in package aquarium.jellies. Either 'import aquarium.jellies.Jelly;' or 'import aquarium.jellies.*;' works. Wildcards cannot appear in the middle of an import (eliminating Option B) and wildcard on package aquarium does not import classes in subpackages (eliminating Option A)."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "medium",
        "questionText": "Given the following class definitions, what is the maximum number of import statements that can be removed while still allowing Tank to compile?",
        "codeSnippet": """package aquarium; public class Water { }

package aquarium;
import java.lang.*;
import java.lang.System;
import aquarium.Water;
import aquarium.*;
public class Tank {
  public void print(Water water) {
    System.out.println(water);
  }
}""",
        "optionA": "1",
        "optionB": "2",
        "optionC": "3",
        "optionD": "4",
        "correctOption": "D",
        "explanation": "All 4 imports can be removed! java.lang.* and java.lang.System are automatically imported by the compiler in every Java file. aquarium.Water and aquarium.* are redundant because Tank and Water are already in the exact same package (aquarium)."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "medium",
        "questionText": "Given two Water classes in different packages, which snippet correctly resolves the naming conflict in WaterFiller?",
        "codeSnippet": """package aquarium;
public class Water { boolean salty = false; }

package aquarium.jellies;
public class Water { boolean salty = true; }

package employee;
// INSERT IMPORTS HERE
public class WaterFiller {
  Water water;
}""",
        "optionA": "import aquarium.*; import aquarium.jellies.*;",
        "optionB": "import aquarium.Water; import aquarium.jellies.*;",
        "optionC": "import aquarium.Water; import aquarium.jellies.Water;",
        "optionD": "None of these imports can make the code compile without full qualification",
        "correctOption": "B",
        "explanation": "In Java, an explicit class import takes precedence over a wildcard import. 'import aquarium.Water; import aquarium.jellies.*;' causes the compiler to resolve Water unambiguously to aquarium.Water. Option A causes an ambiguous type error; Option C causes a direct import collision error."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "Given the following class, which command-line invocation prints 'Blue Jay'?",
        "codeSnippet": """public class BirdDisplay {
  public static void main(String[] name) {
    System.out.println(name[1]);
  }
}""",
        "optionA": "java BirdDisplay Sparrow Blue Jay",
        "optionB": "java BirdDisplay Sparrow \"Blue Jay\"",
        "optionC": "java BirdDisplay.class Sparrow \"Blue Jay\"",
        "optionD": "java BirdDisplay \"Blue Jay\" Sparrow",
        "correctOption": "B",
        "explanation": "Command-line arguments are zero-indexed: name[0] is the first argument, and name[1] is the second. In Option B, 'Sparrow' is at index 0 and '\"Blue Jay\"' (quotes preserve the space as a single string) is at index 1. Option C fails because .class must not be appended when running java."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "Which parameter declaration is valid for a standard executable main method entry point?",
        "codeSnippet": "public static void main( _______ )",
        "optionA": "String[] 123",
        "optionB": "String names",
        "optionC": "String... $n",
        "optionD": "String args",
        "correctOption": "C",
        "explanation": "The main method parameter must be an array of Strings or a String vararg. The identifier can begin with a dollar sign ($n), letter, or underscore. Option A starts with digits (invalid identifier); Options B and D are single Strings rather than arrays or varargs."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "Which of the following is a legal main entry point method that can be run from the command line by the JVM?",
        "codeSnippet": "",
        "optionA": "public void main(String[] args)",
        "optionB": "public static void main(String[] args)",
        "optionC": "public static final main(String[] args)",
        "optionD": "private static void main(String[] args)",
        "correctOption": "B",
        "explanation": "The required entry point signature must be 'public static void main(String[] args)'. Option A is non-static; Option C is missing the void return type; Option D is private."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "What are the default values of an uninitialized instance variable of type double and an uninitialized instance variable of type String?",
        "codeSnippet": "",
        "optionA": "0.0 and \"\"",
        "optionB": "null and null",
        "optionC": "0.0 and null",
        "optionD": "0 and null",
        "correctOption": "C",
        "explanation": "Instance variables for floating-point primitive types (float and double) default to 0.0 (or 0.0f). All object reference types, including String, default to null."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "What default value does Java assign to an uninitialized local variable of type boolean?",
        "codeSnippet": "",
        "optionA": "false",
        "optionB": "null",
        "optionC": "0",
        "optionD": "Local variables do not receive default values; using an uninitialized local variable causes a compiler error.",
        "correctOption": "D",
        "explanation": "Local variables defined inside method bodies do NOT receive default values. Attempting to read an uninitialized local variable triggers a compiler error."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "Which default values are correctly assigned to instance variables in a class?",
        "codeSnippet": "",
        "optionA": "boolean defaults to false; int defaults to 0",
        "optionB": "boolean defaults to true; int defaults to 0",
        "optionC": "boolean defaults to null; int defaults to null",
        "optionD": "boolean defaults to false; int defaults to 0.0",
        "correctOption": "A",
        "explanation": "Primitive boolean instance variables default to false, and primitive int instance variables default to 0."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "medium",
        "questionText": "Given a class located in '/my/directory/named/A/Bird.java', if compiled from '/my/directory', what must the package declaration be?",
        "codeSnippet": "",
        "optionA": "package my.directory.named.a;",
        "optionB": "package named.a;",
        "optionC": "package named.A;",
        "optionD": "package A;",
        "correctOption": "C",
        "explanation": "Package names reflect the directory hierarchy below the classpath root. Package names are case sensitive in Java, matching directory 'named/A', so 'package named.A;' is required."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "medium",
        "questionText": "Which of the following numeric literal declarations with underscores compiles without error?",
        "codeSnippet": "",
        "optionA": "double d1 = 1_234_.0;",
        "optionB": "double d2 = 1_234._0;",
        "optionC": "double d3 = 1_234.0_;",
        "optionD": "double d4 = 1_234.0;",
        "correctOption": "D",
        "explanation": "Underscores in numeric literals are allowed only strictly between two digits. They cannot be adjacent to a decimal point (as in A and B), and cannot appear at the very beginning or end of a literal (as in C)."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "medium",
        "questionText": "Which of the following lines will compile when inserted into admission()?",
        "codeSnippet": """public class Price {
  public void admission() {
    // INSERT CODE HERE
    System.out.println(amount);
  }
}""",
        "optionA": "int amount = 9L;",
        "optionB": "int amount = 0b101;",
        "optionC": "int amount = 1_2_;",
        "optionD": "double amount = 1_2_.0_0;",
        "correctOption": "B",
        "explanation": "0b101 is a binary integer literal (value 5) and assigns cleanly to an int. Option A fails because a long literal (9L) cannot be assigned to an int without casting. Options C and D fail because underscores cannot end a literal or be adjacent to a decimal point."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "In the statement 'Bunny bun = new Bunny();', what are Bunny and bun?",
        "codeSnippet": "",
        "optionA": "Bunny is a reference and bun is a class",
        "optionB": "Bunny is a class and bun is a reference to an object",
        "optionC": "Both Bunny and bun are classes",
        "optionD": "Both Bunny and bun are object references",
        "correctOption": "B",
        "explanation": "Bunny is the class name (the type), and 'bun' is a reference variable that points to an instance of Bunny in heap memory."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "Which of the following represents the required order of elements in a standard Java source file?",
        "codeSnippet": "",
        "optionA": "class declaration, package statement, import statements",
        "optionB": "import statements, package statement, class declaration",
        "optionC": "package statement, import statements, class declaration",
        "optionD": "package statement, class declaration, import statements",
        "correctOption": "C",
        "explanation": "The order of elements in a Java file is PIC: Package declaration first (if present), followed by Import statements (if present), followed by Class declarations."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "hard",
        "questionText": "When is the Rabbit object instantiated on line 3 first eligible for garbage collection?",
        "codeSnippet": """1: public class Rabbit {
2:   public static void main(String[] args) {
3:     Rabbit one = new Rabbit();
4:     Rabbit two = new Rabbit();
5:     Rabbit three = one;
6:     one = null;
7:     Rabbit four = one;
8:     three = null;
9:     two = null;
10:    two = new Rabbit();
11:    System.gc();
12:  }
13: }""",
        "optionA": "Immediately following line 6",
        "optionB": "Immediately following line 8",
        "optionC": "Immediately following line 9",
        "optionD": "Immediately following line 12",
        "correctOption": "B",
        "explanation": "The Rabbit created on line 3 initially has reference 'one' pointing to it. On line 5, 'three' also points to it. Setting 'one = null' on line 6 still leaves 'three' pointing to it. On line 8, 'three = null' removes the last reference to this object, making it eligible for GC immediately after line 8."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "What is guaranteed when System.gc() is called in a Java program?",
        "codeSnippet": """Bear bear = new Bear();
bear = null;
System.gc();""",
        "optionA": "Garbage collection is guaranteed to run immediately",
        "optionB": "The finalize() method of the Bear instance is guaranteed to run before the next line",
        "optionC": "System.gc() merely suggests to the JVM to run garbage collection, but execution is not guaranteed",
        "optionD": "All unreferenced objects are immediately removed from heap memory",
        "correctOption": "C",
        "explanation": "System.gc() is merely a suggestion to the Java Virtual Machine that it might be an opportune moment to run GC; the JVM is completely free to ignore the suggestion or defer it."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "medium",
        "questionText": "What does the following code output when run?",
        "codeSnippet": """public class Salmon {
  int count;
  public void Salmon() {
    count = 4;
  }
  public static void main(String[] args) {
    Salmon s = new Salmon();
    System.out.println(s.count);
  }
}""",
        "optionA": "0",
        "optionB": "4",
        "optionC": "Compilation fails because constructors cannot have a return type",
        "optionD": "Compilation fails because of duplicate method name",
        "correctOption": "A",
        "explanation": "Because 'public void Salmon()' has a return type (void), it is a regular method, NOT a constructor! When 'new Salmon()' executes, the default compiler-generated no-argument constructor is invoked. The method Salmon() is never called, so instance variable count remains at its default value 0."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "Which of the following is a core characteristic of the Java platform?",
        "codeSnippet": "",
        "optionA": "Java allows operator overloading on all primitive types and objects",
        "optionB": "Java bytecode compiled on Windows can run on any platform with a compatible JVM",
        "optionC": "Java provides direct memory pointers that allow manual memory deallocation",
        "optionD": "Java source code is compiled directly to native OS machine code",
        "correctOption": "B",
        "explanation": "Java is platform-independent at the binary level ('write once, run everywhere') because source code compiles into bytecode (.class), which runs on any JVM implementation. Java does not support operator overloading or pointer arithmetic."
    },
    {
        "topic": "Java Building Blocks",
        "difficulty": "easy",
        "questionText": "Which statement correctly describes javac and java command-line tools?",
        "codeSnippet": "",
        "optionA": "javac compiles a .java file into a .class bytecode file, while java takes the class name (without extension) to run it",
        "optionB": "javac compiles a .class file into a .java file",
        "optionC": "java takes the .class file name with extension as a parameter to execute",
        "optionD": "javac compiles source code directly into executable .exe files",
        "correctOption": "A",
        "explanation": "javac takes the source filename (e.g. javac Test.java) and produces a .class bytecode file. The java launcher takes the fully qualified class name without the .class extension (e.g. java Test)."
    }
]
