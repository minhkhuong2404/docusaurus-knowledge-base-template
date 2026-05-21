export interface QuizQuestion {
  id: string;
  topic: string;
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export const javaQuestions: QuizQuestion[] = [
  {
    id: "java-core-1",
    topic: "Multithreading",
    questionText: "Which of the following methods must be implemented by all threads created by implementing the Runnable interface?",
    options: [
      "start()",
      "run()",
      "main()",
      "execute()"
    ],
    correctOptionIndex: 1,
    explanation: "The `Runnable` interface is a functional interface that requires the implementation of a single method: `run()`. The `start()` method belongs to the `Thread` class, which internally calls the `run()` method of the passed `Runnable`."
  },
  {
    id: "java-core-2",
    topic: "Memory Management",
    questionText: "What is the primary purpose of the Garbage Collector in Java?",
    options: [
      "To delete files that are no longer needed from the hard drive.",
      "To free up memory by deleting objects that are no longer reachable by any active thread.",
      "To optimize the bytecode for faster execution.",
      "To prevent memory leaks by killing unresponsive threads."
    ],
    correctOptionIndex: 1,
    explanation: "The Garbage Collector (GC) runs in the background and looks for objects on the Heap that no longer have any active references pointing to them. It reclaims the memory occupied by these unreachable objects."
  },
  {
    id: "java-core-3",
    topic: "Collections",
    questionText: "Which Collection class allows you to associate its elements with key values, and prevents duplicate keys?",
    options: [
      "java.util.List",
      "java.util.Set",
      "java.util.Map",
      "java.util.Queue"
    ],
    correctOptionIndex: 2,
    explanation: "A `Map` (like `HashMap` or `TreeMap`) stores data in Key-Value pairs. Keys must be unique; if you insert a duplicate key, the old value is overwritten by the new value."
  },
  {
    id: "java-core-4",
    topic: "Object-Oriented Programming",
    questionText: "Which access modifier restricts access to members within the same class only?",
    options: [
      "public",
      "protected",
      "private",
      "default (package-private)"
    ],
    correctOptionIndex: 2,
    explanation: "The `private` modifier is the most restrictive access level. Methods and variables marked as private can only be accessed within the exact same class where they are declared."
  },
  {
    id: "java-core-5",
    topic: "Exceptions",
    questionText: "What is the difference between a Checked Exception and an Unchecked Exception?",
    options: [
      "Checked exceptions extend RuntimeException, while unchecked exceptions extend Exception.",
      "Checked exceptions are verified at compile-time and must be declared or caught, while unchecked exceptions occur at runtime and do not strictly require handling.",
      "Checked exceptions can only be thrown by the JVM, while unchecked exceptions are thrown by the application code.",
      "There is no difference in Java; both are handled identically by the compiler."
    ],
    correctOptionIndex: 1,
    explanation: "Checked exceptions (e.g., `IOException`) inherit from `Exception` but not `RuntimeException`, forcing the developer to handle them via a try-catch block or a `throws` declaration. Unchecked exceptions (e.g., `NullPointerException`) extend `RuntimeException` and represent programming errors."
  },
  {
    id: "java-core-6",
    topic: "JVM Basics",
    questionText: "What is the role of the JIT (Just-In-Time) compiler in the JVM?",
    options: [
      "To compile Java source code (.java) into bytecode (.class).",
      "To interpret bytecode instruction by instruction.",
      "To compile frequently executed bytecode (hotspots) into native machine code at runtime for better performance.",
      "To manage the allocation of memory in the Metaspace."
    ],
    correctOptionIndex: 2,
    explanation: "The JIT compiler monitors the application as it runs. When it detects a heavily used method (a hotspot), it compiles the bytecode for that method directly into highly optimized native machine code, drastically improving execution speed."
  },
  {
    id: "java-core-7",
    topic: "Strings",
    questionText: "Why are String objects immutable in Java?",
    options: [
      "To prevent NullPointerExceptions.",
      "Because they are stored in the Stack memory.",
      "To allow caching via the String Pool, ensure thread-safety, and provide security for class loading.",
      "They are not immutable; their values can be changed using setter methods."
    ],
    correctOptionIndex: 2,
    explanation: "String immutability is a core design choice in Java. It allows the JVM to safely share identical String literals in the String Pool to save memory. Because they cannot change, Strings are inherently thread-safe and secure when used as parameters for network connections or file paths."
  },
  {
    id: "java-core-8",
    topic: "Concurrency",
    questionText: "What does the `volatile` keyword guarantee when applied to a variable?",
    options: [
      "It guarantees that operations on the variable are atomic.",
      "It ensures that a thread always reads the most recent value from main memory rather than a local CPU cache.",
      "It prevents deadlocks when multiple threads access the variable.",
      "It locks the variable so only one thread can access it at a time."
    ],
    correctOptionIndex: 1,
    explanation: "The `volatile` keyword provides 'visibility' guarantees. It forces threads to read the variable directly from main memory and write changes straight back to main memory, preventing threads from reading stale data from their local CPU caches. However, it does *not* guarantee atomicity (e.g., `count++` is still not safe with just `volatile`)."
  },
  {
    id: "java-core-9",
    topic: "Generics",
    questionText: "What is Type Erasure in Java Generics?",
    options: [
      "The process where the JVM deletes unused generic classes at runtime to save memory.",
      "A compiler process that replaces generic type parameters with their bounds (or Object) and inserts casts, meaning generic type information is not available at runtime.",
      "A feature that allows you to erase the contents of a generic collection efficiently.",
      "A bug in early Java versions where generic types were accidentally deleted."
    ],
    correctOptionIndex: 1,
    explanation: "To maintain backward compatibility with older Java versions, the compiler performs Type Erasure. It removes all generic type information during compilation. For example, a `List<String>` becomes just a `List` of `Object` in the generated bytecode."
  },
  {
    id: "java-core-10",
    topic: "Streams API",
    questionText: "Which of the following is an intermediate operation in the Java Streams API?",
    options: [
      "collect()",
      "reduce()",
      "filter()",
      "forEach()"
    ],
    correctOptionIndex: 2,
    explanation: "`filter()` is an intermediate operation because it returns a new Stream, allowing you to chain further operations. Intermediate operations are lazy and are not executed until a terminal operation is invoked. `collect()`, `reduce()`, and `forEach()` are terminal operations."
  }
,
  {
    "id": "java-basic-1",
    "topic": "Java Basics",
    "questionText": "Which of the following components is responsible for executing the Java bytecode?",
    "options": [
      "JDK",
      "JRE",
      "JVM",
      "JIT"
    ],
    "correctOptionIndex": 2,
    "explanation": "The Java Virtual Machine (JVM) is responsible for executing Java bytecode."
  },
  {
    "id": "java-basic-2",
    "topic": "Java Basics",
    "questionText": "What is the size of the 'int' primitive data type in Java?",
    "options": [
      "8 bits",
      "16 bits",
      "32 bits",
      "64 bits"
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, the 'int' primitive data type is always 32 bits (4 bytes) regardless of the platform."
  },
  {
    "id": "java-basic-3",
    "topic": "Java Basics",
    "questionText": "What is the correct signature of the main method in Java?",
    "options": [
      "public void main(String args[])",
      "public static void main(String[] args)",
      "static public void main(String args)",
      "public static int main(String[] args)"
    ],
    "correctOptionIndex": 1,
    "explanation": "The main method must be public, static, return void, and accept an array of Strings."
  },
  {
    "id": "java-basic-4",
    "topic": "Java Basics",
    "questionText": "What is the default value of a local variable in Java?",
    "options": [
      "null",
      "0",
      "false",
      "No default value"
    ],
    "correctOptionIndex": 3,
    "explanation": "Local variables do not have default values in Java. They must be explicitly initialized before use."
  },
  {
    "id": "java-basic-5",
    "topic": "Java Basics",
    "questionText": "Which access modifier is NOT allowed for a top-level Java class?",
    "options": [
      "public",
      "protected",
      "abstract",
      "final"
    ],
    "correctOptionIndex": 1,
    "explanation": "A top-level class can only be public or package-private (default). Protected and private are not allowed."
  },
  {
    "id": "java-basic-6",
    "topic": "Java Basics",
    "questionText": "Which of the following will result in a compile-time error?",
    "options": [
      "int a = (int) 5.5;",
      "double b = 5;",
      "float c = 5.5;",
      "long d = 100L;"
    ],
    "correctOptionIndex": 2,
    "explanation": "By default, decimal literals are of type double. Assigning a double to a float without casting or the 'f' suffix causes a compile-time error."
  },
  {
    "id": "java-basic-7",
    "topic": "Java Basics",
    "questionText": "What is the result of '5 / 2' in Java?",
    "options": [
      "2.5",
      "2",
      "3",
      "Error"
    ],
    "correctOptionIndex": 1,
    "explanation": "Integer division truncates the decimal part, so 5 / 2 results in 2."
  },
  {
    "id": "java-basic-8",
    "topic": "Java Basics",
    "questionText": "Which statement is used to exit a loop immediately?",
    "options": [
      "continue",
      "exit",
      "break",
      "return"
    ],
    "correctOptionIndex": 2,
    "explanation": "The 'break' statement is used to exit a loop prematurely."
  },
  {
    "id": "java-basic-9",
    "topic": "Java Basics",
    "questionText": "Which data type is NOT supported in a switch statement (prior to Java 12)?",
    "options": [
      "byte",
      "String",
      "Enum",
      "long"
    ],
    "correctOptionIndex": 3,
    "explanation": "Prior to newer Java versions, 'long', 'float', 'double', and 'boolean' are not supported in switch statements."
  },
  {
    "id": "java-basic-10",
    "topic": "Java Basics",
    "questionText": "How do you declare an array of 5 integers in Java?",
    "options": [
      "int[] arr = new int[5];",
      "int arr[5];",
      "int arr = new int[5];",
      "int[] arr = int[5];"
    ],
    "correctOptionIndex": 0,
    "explanation": "The correct syntax is 'type[] name = new type[size];'."
  },
  {
    "id": "java-basic-11",
    "topic": "Java Basics",
    "questionText": "What does the 'final' keyword do when applied to a variable?",
    "options": [
      "Makes the variable accessible from any package",
      "Prevents the variable from being reassigned",
      "Allows the variable to be overridden",
      "Initializes the variable to 0"
    ],
    "correctOptionIndex": 1,
    "explanation": "The 'final' keyword makes a variable a constant, preventing it from being reassigned once initialized."
  },
  {
    "id": "java-basic-12",
    "topic": "Java Basics",
    "questionText": "What is autoboxing in Java?",
    "options": [
      "Automatic conversion of a wrapper class to its primitive type",
      "Automatic conversion of a primitive type to its corresponding wrapper class",
      "Automatic garbage collection",
      "Automatic type casting"
    ],
    "correctOptionIndex": 1,
    "explanation": "Autoboxing is the automatic conversion that the Java compiler makes between the primitive types and their corresponding object wrapper classes."
  },
  {
    "id": "java-basic-13",
    "topic": "Java Basics",
    "questionText": "Which package is imported by default in all Java programs?",
    "options": [
      "java.util",
      "java.io",
      "java.lang",
      "java.net"
    ],
    "correctOptionIndex": 2,
    "explanation": "The java.lang package is implicitly imported into every Java program."
  },
  {
    "id": "java-basic-14",
    "topic": "Java Basics",
    "questionText": "What is a characteristic of a static variable?",
    "options": [
      "It is unique to each instance of a class.",
      "It belongs to the class, not to any specific instance.",
      "It cannot be modified.",
      "It is accessible only within the method it is declared."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static variables belong to the class itself and are shared among all instances of that class."
  },
  {
    "id": "java-oop-15",
    "topic": "OOP",
    "questionText": "Which OOP concept is demonstrated by having multiple methods with the same name but different parameters?",
    "options": [
      "Method Overriding",
      "Method Overloading",
      "Encapsulation",
      "Inheritance"
    ],
    "correctOptionIndex": 1,
    "explanation": "Method overloading allows multiple methods in the same class to have the same name as long as their parameter lists are different."
  },
  {
    "id": "java-oop-16",
    "topic": "OOP",
    "questionText": "What keyword is used in Java to inherit a class?",
    "options": [
      "implements",
      "inherits",
      "extends",
      "super"
    ],
    "correctOptionIndex": 2,
    "explanation": "The 'extends' keyword is used to inherit from a class in Java."
  },
  {
    "id": "java-oop-17",
    "topic": "OOP",
    "questionText": "Can a Java class inherit from multiple classes?",
    "options": [
      "Yes, using the extends keyword.",
      "Yes, using the implements keyword.",
      "No, Java does not support multiple inheritance for classes.",
      "No, Java does not support multiple inheritance for interfaces."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java classes can only extend one superclass, thus not supporting multiple inheritance to avoid the diamond problem."
  },
  {
    "id": "java-oop-18",
    "topic": "OOP",
    "questionText": "What is Encapsulation?",
    "options": [
      "Hiding implementation details and exposing only the necessary parts",
      "Creating objects from classes",
      "Acquiring properties from a parent class",
      "Defining multiple methods with the same name"
    ],
    "correctOptionIndex": 0,
    "explanation": "Encapsulation is the bundling of data and methods that operate on that data within a single unit, and hiding the internal state."
  },
  {
    "id": "java-oop-19",
    "topic": "OOP",
    "questionText": "Which of the following is true about abstract classes?",
    "options": [
      "They can be instantiated directly.",
      "They must contain at least one abstract method.",
      "They can have both abstract and non-abstract methods.",
      "They cannot have constructors."
    ],
    "correctOptionIndex": 2,
    "explanation": "Abstract classes can contain a mix of abstract and concrete methods, but they cannot be instantiated directly."
  },
  {
    "id": "java-oop-20",
    "topic": "OOP",
    "questionText": "What is the purpose of the 'super' keyword?",
    "options": [
      "To call the superclass constructor or method.",
      "To create an instance of a class.",
      "To restrict access to variables.",
      "To define an abstract method."
    ],
    "correctOptionIndex": 0,
    "explanation": "The 'super' keyword is a reference variable used to refer to immediate parent class objects, methods, or constructors."
  },
  {
    "id": "java-oop-21",
    "topic": "OOP",
    "questionText": "In Java, what is an Interface?",
    "options": [
      "A class that cannot be inherited.",
      "A contract specifying methods a class must implement.",
      "A special method used for initialization.",
      "A block of code that handles exceptions."
    ],
    "correctOptionIndex": 1,
    "explanation": "An interface in Java is a blueprint of a class that contains static constants and abstract methods (prior to Java 8)."
  },
  {
    "id": "java-oop-22",
    "topic": "OOP",
    "questionText": "What is Method Overriding?",
    "options": [
      "Defining multiple methods with the same name but different parameters.",
      "Providing a specific implementation in a subclass for a method defined in its superclass.",
      "Hiding the data of a class.",
      "Calling a method from itself."
    ],
    "correctOptionIndex": 1,
    "explanation": "Method overriding occurs when a subclass provides a specific implementation for a method already provided by its parent class."
  },
  {
    "id": "java-oop-23",
    "topic": "OOP",
    "questionText": "Which access modifier makes a member accessible only within its own class?",
    "options": [
      "public",
      "protected",
      "private",
      "default"
    ],
    "correctOptionIndex": 2,
    "explanation": "The 'private' access modifier restricts access to members only within the class they are defined."
  },
  {
    "id": "java-oop-24",
    "topic": "OOP",
    "questionText": "What is 'this' keyword in Java?",
    "options": [
      "A reference to the current object.",
      "A reference to the parent object.",
      "A keyword used to start a thread.",
      "A keyword used to inherit a class."
    ],
    "correctOptionIndex": 0,
    "explanation": "The 'this' keyword refers to the current instance of the class in which it is used."
  },
  {
    "id": "java-oop-25",
    "topic": "OOP",
    "questionText": "Can we override a static method in Java?",
    "options": [
      "Yes, always.",
      "No, static methods are hidden, not overridden.",
      "Yes, if the subclass is in the same package.",
      "Yes, if the static method is public."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods cannot be overridden. If a subclass defines a static method with the same signature, it hides the superclass method."
  },
  {
    "id": "java-oop-26",
    "topic": "OOP",
    "questionText": "Which class is the root of the Java class hierarchy?",
    "options": [
      "Class",
      "Object",
      "System",
      "String"
    ],
    "correctOptionIndex": 1,
    "explanation": "The Object class is the parent class of all classes in Java by default."
  },
  {
    "id": "java-oop-27",
    "topic": "OOP",
    "questionText": "What does the 'instanceof' operator do?",
    "options": [
      "Creates a new instance of an object.",
      "Checks if an object is of a specific type (class or interface).",
      "Compares two objects for equality.",
      "Converts one type to another."
    ],
    "correctOptionIndex": 1,
    "explanation": "The 'instanceof' operator is used to test whether the object is an instance of the specified type."
  },
  {
    "id": "java-oop-28",
    "topic": "OOP",
    "questionText": "Can a final class be subclassed?",
    "options": [
      "Yes",
      "No",
      "Only by abstract classes",
      "Only if it has a default constructor"
    ],
    "correctOptionIndex": 1,
    "explanation": "A class declared with the 'final' keyword cannot be extended (subclassed)."
  },
  {
    "id": "java-oop-29",
    "topic": "OOP",
    "questionText": "What is Polymorphism?",
    "options": [
      "The ability of an object to take on many forms.",
      "The process of wrapping code and data together.",
      "Creating a child class from a parent class.",
      "Hiding internal data."
    ],
    "correctOptionIndex": 0,
    "explanation": "Polymorphism allows objects of different classes to be treated as objects of a common superclass."
  },
  {
    "id": "java-oop-30",
    "topic": "OOP",
    "questionText": "Are constructors inherited in Java?",
    "options": [
      "Yes, always.",
      "No, constructors are not inherited.",
      "Yes, only default constructors.",
      "Yes, if they are public."
    ],
    "correctOptionIndex": 1,
    "explanation": "Constructors are not inherited by subclasses, but a subclass can call the superclass's constructor using 'super()'."
  },
  {
    "id": "java-eh-31",
    "topic": "Exception Handling",
    "questionText": "What is the base class for all exceptions in Java?",
    "options": [
      "Error",
      "Exception",
      "Throwable",
      "RuntimeException"
    ],
    "correctOptionIndex": 2,
    "explanation": "The Throwable class is the superclass of all errors and exceptions in the Java language."
  },
  {
    "id": "java-eh-32",
    "topic": "Exception Handling",
    "questionText": "Which block is always executed regardless of whether an exception occurs or not?",
    "options": [
      "try",
      "catch",
      "finally",
      "throws"
    ],
    "correctOptionIndex": 2,
    "explanation": "The finally block always executes when the try block exits, making it ideal for cleanup code."
  },
  {
    "id": "java-eh-33",
    "topic": "Exception Handling",
    "questionText": "What is the difference between checked and unchecked exceptions?",
    "options": [
      "Checked exceptions are checked at compile-time, unchecked at runtime.",
      "Checked exceptions extend RuntimeException.",
      "Unchecked exceptions must be handled explicitly.",
      "There is no difference."
    ],
    "correctOptionIndex": 0,
    "explanation": "Checked exceptions are verified by the compiler, meaning they must be declared or caught. Unchecked exceptions occur at runtime."
  },
  {
    "id": "java-eh-34",
    "topic": "Exception Handling",
    "questionText": "Which keyword is used to explicitly throw an exception?",
    "options": [
      "try",
      "catch",
      "throw",
      "throws"
    ],
    "correctOptionIndex": 2,
    "explanation": "The 'throw' keyword is used to explicitly throw a single exception."
  },
  {
    "id": "java-eh-35",
    "topic": "Exception Handling",
    "questionText": "Which keyword is used in a method signature to declare that it might throw an exception?",
    "options": [
      "throw",
      "throws",
      "catch",
      "finally"
    ],
    "correctOptionIndex": 1,
    "explanation": "The 'throws' keyword is used in method signatures to indicate that this method might throw one or more exceptions."
  },
  {
    "id": "java-eh-36",
    "topic": "Exception Handling",
    "questionText": "What happens if a System.exit(0) is called in the try block?",
    "options": [
      "The finally block is executed.",
      "The finally block is NOT executed.",
      "A compile-time error occurs.",
      "An Exception is thrown."
    ],
    "correctOptionIndex": 1,
    "explanation": "If System.exit(0) is called, the JVM shuts down immediately, so the finally block will not be executed."
  },
  {
    "id": "java-eh-37",
    "topic": "Exception Handling",
    "questionText": "When using multiple catch blocks, what is the correct order of exception classes?",
    "options": [
      "From most general (superclass) to most specific (subclass).",
      "From most specific (subclass) to most general (superclass).",
      "Alphabetical order.",
      "Order does not matter."
    ],
    "correctOptionIndex": 1,
    "explanation": "Catch blocks must be ordered from subclass (most specific) to superclass (most general) to avoid unreachable code errors."
  },
  {
    "id": "java-eh-38",
    "topic": "Exception Handling",
    "questionText": "What is 'try-with-resources' introduced in Java 7?",
    "options": [
      "A way to catch multiple exceptions in one block.",
      "A try statement that declares one or more resources that will be closed automatically.",
      "A block that never throws exceptions.",
      "A replacement for the catch block."
    ],
    "correctOptionIndex": 1,
    "explanation": "Try-with-resources ensures that each resource is closed at the end of the statement, provided the resource implements AutoCloseable."
  },
  {
    "id": "java-eh-39",
    "topic": "Exception Handling",
    "questionText": "Can a catch block exist without a try block?",
    "options": [
      "Yes",
      "No",
      "Only for unchecked exceptions",
      "Only if followed by finally"
    ],
    "correctOptionIndex": 1,
    "explanation": "A catch block must always be associated with a preceding try block."
  },
  {
    "id": "java-eh-40",
    "topic": "Exception Handling",
    "questionText": "Which of the following is an Unchecked Exception?",
    "options": [
      "IOException",
      "SQLException",
      "NullPointerException",
      "ClassNotFoundException"
    ],
    "correctOptionIndex": 2,
    "explanation": "NullPointerException extends RuntimeException, making it an unchecked exception."
  },
  {
    "id": "java-str-41",
    "topic": "Strings",
    "questionText": "Why are Strings immutable in Java?",
    "options": [
      "To save memory.",
      "For security, synchronization, and caching.",
      "Because they are primitive types.",
      "Because they cannot be reassigned."
    ],
    "correctOptionIndex": 1,
    "explanation": "String immutability provides security (class loading), concurrency (thread-safety), and memory efficiency (String pool)."
  },
  {
    "id": "java-str-42",
    "topic": "Strings",
    "questionText": "Where are string literals stored in Java memory?",
    "options": [
      "Heap memory",
      "Stack memory",
      "String Constant Pool",
      "Method Area"
    ],
    "correctOptionIndex": 2,
    "explanation": "String literals are stored in a special memory area within the Heap known as the String Constant Pool."
  },
  {
    "id": "java-str-43",
    "topic": "Strings",
    "questionText": "What is the difference between StringBuffer and StringBuilder?",
    "options": [
      "StringBuffer is immutable, StringBuilder is mutable.",
      "StringBuffer is thread-safe (synchronized), StringBuilder is not.",
      "StringBuilder is thread-safe, StringBuffer is not.",
      "There is no difference."
    ],
    "correctOptionIndex": 1,
    "explanation": "StringBuffer's methods are synchronized, making it thread-safe, while StringBuilder is faster but not thread-safe."
  },
  {
    "id": "java-str-44",
    "topic": "Strings",
    "questionText": "What does the '==' operator check when used with two String objects?",
    "options": [
      "If their characters are the same.",
      "If they point to the same memory location (reference equality).",
      "If their lengths are the same.",
      "If they are both non-null."
    ],
    "correctOptionIndex": 1,
    "explanation": "The '==' operator checks for reference equality, meaning it checks if both references point to the exact same object in memory."
  },
  {
    "id": "java-str-45",
    "topic": "Strings",
    "questionText": "Which method is used to compare the content of two Strings for equality?",
    "options": [
      "==",
      "compareTo()",
      "equals()",
      "isEqual()"
    ],
    "correctOptionIndex": 2,
    "explanation": "The equals() method compares the actual characters inside the String objects."
  },
  {
    "id": "java-str-46",
    "topic": "Strings",
    "questionText": "What does the String.intern() method do?",
    "options": [
      "Converts a String to lowercase.",
      "Returns a canonical representation for the string object from the string pool.",
      "Reverses the String.",
      "Checks if the string is empty."
    ],
    "correctOptionIndex": 1,
    "explanation": "intern() checks if the string is in the pool. If so, it returns the pool's reference; if not, it adds it to the pool and returns the reference."
  },
  {
    "id": "java-str-47",
    "topic": "Strings",
    "questionText": "What is the output of '\"Java\".substring(1, 3)'?",
    "options": [
      "Jav",
      "av",
      "va",
      "Java"
    ],
    "correctOptionIndex": 1,
    "explanation": "substring(1, 3) starts at index 1 ('a') and ends at index 3-1=2 ('v'), returning 'av'."
  },
  {
    "id": "java-str-48",
    "topic": "Strings",
    "questionText": "Which interface is implemented by String, StringBuffer, and StringBuilder to represent a sequence of characters?",
    "options": [
      "Serializable",
      "Cloneable",
      "CharSequence",
      "Iterable"
    ],
    "correctOptionIndex": 2,
    "explanation": "All three classes implement the CharSequence interface."
  },
  {
    "id": "java-str-49",
    "topic": "Strings",
    "questionText": "How can you get the length of a String named 'str'?",
    "options": [
      "str.length",
      "str.size()",
      "str.length()",
      "str.getSize()"
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, length() is a method of the String class used to find the number of characters in the string."
  },
  {
    "id": "java-str-50",
    "topic": "Strings",
    "questionText": "Which operator is heavily overloaded in Java for String concatenation?",
    "options": [
      "&",
      ".",
      "+",
      "->"
    ],
    "correctOptionIndex": 2,
    "explanation": "The '+' operator is overloaded for Strings in Java to allow easy string concatenation."
  },
  {
    "id": "java-col-1",
    "topic": "Collections",
    "questionText": "Which of these interfaces does not extend Collection?",
    "options": [
      "List",
      "Set",
      "Map",
      "Queue"
    ],
    "correctOptionIndex": 2,
    "explanation": "Map does not extend the Collection interface; it is a separate branch in the Java Collections Framework."
  },
  {
    "id": "java-col-2",
    "topic": "Collections",
    "questionText": "What is the default initial capacity of an ArrayList in Java?",
    "options": [
      "0",
      "10",
      "16",
      "20"
    ],
    "correctOptionIndex": 1,
    "explanation": "The default initial capacity of an ArrayList is 10."
  },
  {
    "id": "java-col-3",
    "topic": "Maps",
    "questionText": "Which Map implementation maintains the insertion order of its elements?",
    "options": [
      "HashMap",
      "TreeMap",
      "LinkedHashMap",
      "ConcurrentHashMap"
    ],
    "correctOptionIndex": 2,
    "explanation": "LinkedHashMap maintains a doubly-linked list running through all of its entries, preserving the insertion order."
  },
  {
    "id": "java-col-4",
    "topic": "Maps",
    "questionText": "What is the worst-case time complexity for retrieving an element from a HashMap (assuming no collisions/proper hash)?",
    "options": [
      "O(1)",
      "O(log n)",
      "O(n)",
      "O(n log n)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In an ideal case with proper hashing, the time complexity for retrieving an element from a HashMap is O(1)."
  },
  {
    "id": "java-col-5",
    "topic": "Generics",
    "questionText": "What is type erasure in Java Generics?",
    "options": [
      "Removing unused types at compile time",
      "Replacing generic types with raw types or bounds at compile time",
      "Deleting objects of unknown types at runtime",
      "A garbage collection mechanism for generic classes"
    ],
    "correctOptionIndex": 1,
    "explanation": "Type erasure is a process where the compiler replaces generic types with raw types or their bounds to ensure backward compatibility."
  },
  {
    "id": "java-col-6",
    "topic": "Generics",
    "questionText": "Which wildcard is used to denote an upper bound in Generics?",
    "options": [
      "? extends T",
      "? super T",
      "? generic T",
      "? bound T"
    ],
    "correctOptionIndex": 0,
    "explanation": "The '? extends T' wildcard specifies an upper bound, meaning the type can be T or any subclass of T."
  },
  {
    "id": "java-col-7",
    "topic": "Data Structures",
    "questionText": "Which data structure is internally used by a HashSet?",
    "options": [
      "Array",
      "LinkedList",
      "HashMap",
      "TreeMap"
    ],
    "correctOptionIndex": 2,
    "explanation": "HashSet is internally backed by a HashMap where the elements are stored as keys and a dummy object is used as the value."
  },
  {
    "id": "java-col-8",
    "topic": "Data Structures",
    "questionText": "Which collection is most suitable for a Last-In-First-Out (LIFO) queue?",
    "options": [
      "PriorityQueue",
      "ArrayDeque",
      "LinkedList",
      "TreeSet"
    ],
    "correctOptionIndex": 1,
    "explanation": "ArrayDeque provides an efficient implementation for a LIFO stack/queue, being faster than Stack."
  },
  {
    "id": "java-col-9",
    "topic": "Collections",
    "questionText": "How does PriorityQueue order its elements by default?",
    "options": [
      "Insertion order",
      "Reverse insertion order",
      "Natural ordering",
      "Random order"
    ],
    "correctOptionIndex": 2,
    "explanation": "By default, PriorityQueue orders its elements according to their natural ordering using Comparable."
  },
  {
    "id": "java-col-10",
    "topic": "Maps",
    "questionText": "What happens if you put a key-value pair in a HashMap where the key already exists?",
    "options": [
      "An exception is thrown",
      "The new value is ignored",
      "The new value replaces the old value",
      "Both values are stored in a list"
    ],
    "correctOptionIndex": 2,
    "explanation": "If the key already exists in the HashMap, the old value is replaced with the new value."
  },
  {
    "id": "java-col-11",
    "topic": "Generics",
    "questionText": "Can you use primitive types as type parameters in Java Generics (e.g., List<int>)?",
    "options": [
      "Yes",
      "No",
      "Only in Java 8 and later",
      "Only if the primitive is final"
    ],
    "correctOptionIndex": 1,
    "explanation": "Java Generics do not support primitive types directly. Wrapper classes like Integer must be used instead."
  },
  {
    "id": "java-col-12",
    "topic": "Collections",
    "questionText": "Which method is used to convert an array to a fixed-size list?",
    "options": [
      "Collections.toList()",
      "Arrays.asList()",
      "List.of()",
      "Array.toList()"
    ],
    "correctOptionIndex": 1,
    "explanation": "Arrays.asList() returns a fixed-size list backed by the specified array."
  },
  {
    "id": "java-col-13",
    "topic": "Data Structures",
    "questionText": "What is the underlying data structure of a TreeMap?",
    "options": [
      "Hash Table",
      "Red-Black Tree",
      "B-Tree",
      "Linked List"
    ],
    "correctOptionIndex": 1,
    "explanation": "TreeMap is implemented based on a Red-Black tree structure, providing O(log n) time cost for standard operations."
  },
  {
    "id": "java-col-14",
    "topic": "Generics",
    "questionText": "What does the wildcard <? super Integer> signify?",
    "options": [
      "Any class that is a subclass of Integer",
      "Any class that is a superclass of Integer",
      "Exactly the Integer class",
      "Any class that implements Integer"
    ],
    "correctOptionIndex": 1,
    "explanation": "The ? super Integer wildcard specifies a lower bound, matching Integer or any of its superclasses (like Number or Object)."
  },
  {
    "id": "java-col-15",
    "topic": "Collections",
    "questionText": "Which interface should a class implement so its instances can be sorted automatically in a TreeSet?",
    "options": [
      "Serializable",
      "Comparable",
      "Cloneable",
      "Comparator"
    ],
    "correctOptionIndex": 1,
    "explanation": "The elements must implement the Comparable interface (or a Comparator must be provided) to be sorted in a TreeSet."
  },
  {
    "id": "java-col-16",
    "topic": "Maps",
    "questionText": "In Java 8, how are hash collisions handled in a HashMap when the number of items in a bucket exceeds the threshold?",
    "options": [
      "By doubling the array size",
      "By replacing the linked list with a balanced tree",
      "By using linear probing",
      "By ignoring new elements"
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 8, when a bucket has more than 8 elements, the linked list is converted into a balanced tree (Red-Black tree) to improve worst-case performance."
  },
  {
    "id": "java-col-17",
    "topic": "Generics",
    "questionText": "At what stage does type erasure occur?",
    "options": [
      "Runtime",
      "Compile time",
      "Class loading time",
      "Garbage collection time"
    ],
    "correctOptionIndex": 1,
    "explanation": "Type erasure is performed by the Java compiler at compile time."
  },
  {
    "id": "java-col-18",
    "topic": "Collections",
    "questionText": "Which of these collections is synchronized by default?",
    "options": [
      "ArrayList",
      "LinkedList",
      "Vector",
      "HashSet"
    ],
    "correctOptionIndex": 2,
    "explanation": "Vector is a legacy class and its methods are synchronized, making it thread-safe."
  },
  {
    "id": "java-col-19",
    "topic": "Data Structures",
    "questionText": "Why is iteration over a LinkedList generally slower than an ArrayList?",
    "options": [
      "LinkedList uses more memory",
      "LinkedList has poor cache locality",
      "ArrayList is synchronized",
      "LinkedList elements are smaller"
    ],
    "correctOptionIndex": 1,
    "explanation": "ArrayList elements are stored contiguously in memory, providing excellent cache locality, whereas LinkedList nodes are scattered, leading to frequent cache misses."
  },
  {
    "id": "java-col-20",
    "topic": "Maps",
    "questionText": "Does ConcurrentHashMap allow null keys or null values?",
    "options": [
      "Yes, both",
      "No, neither",
      "Only null keys",
      "Only null values"
    ],
    "correctOptionIndex": 1,
    "explanation": "ConcurrentHashMap does not allow null keys or null values, as ambiguity can arise in concurrent environments."
  },
  {
    "id": "java-col-21",
    "topic": "Generics",
    "questionText": "What happens if you add a generic type element into a raw collection?",
    "options": [
      "Compilation error",
      "Runtime exception",
      "It compiles but issues a warning",
      "It works perfectly with no warnings"
    ],
    "correctOptionIndex": 2,
    "explanation": "Mixing generic types with raw types results in an unchecked warning at compile time, but it will compile."
  },
  {
    "id": "java-col-22",
    "topic": "Data Structures",
    "questionText": "Which data structure is primarily used to implement a LRU (Least Recently Used) cache?",
    "options": [
      "ArrayList",
      "TreeMap",
      "LinkedHashMap",
      "PriorityQueue"
    ],
    "correctOptionIndex": 2,
    "explanation": "LinkedHashMap has a special constructor and `removeEldestEntry` method specifically designed to implement LRU caches."
  },
  {
    "id": "java-col-23",
    "topic": "Collections",
    "questionText": "What is the purpose of the Collections.unmodifiableList() method?",
    "options": [
      "To sort a list in reverse",
      "To return a read-only view of a list",
      "To remove nulls from a list",
      "To synchronize a list"
    ],
    "correctOptionIndex": 1,
    "explanation": "It returns an unmodifiable (read-only) view of the specified list. Any attempt to modify it throws UnsupportedOperationException."
  },
  {
    "id": "java-col-24",
    "topic": "Maps",
    "questionText": "How does IdentityHashMap compare its keys?",
    "options": [
      "Using the equals() method",
      "Using reference equality (==)",
      "Using hashCode()",
      "Using the compareTo() method"
    ],
    "correctOptionIndex": 1,
    "explanation": "IdentityHashMap uses reference equality (==) instead of object equality (equals()) when comparing keys."
  },
  {
    "id": "java-col-25",
    "topic": "Generics",
    "questionText": "Can you instantiate a generic type array like `new T[10]`?",
    "options": [
      "Yes, always",
      "No, it causes a generic array creation error",
      "Yes, if T extends Object",
      "Only in Java 11+"
    ],
    "correctOptionIndex": 1,
    "explanation": "You cannot create arrays of parameterized types or type variables because of type erasure."
  },
  {
    "id": "java-col-26",
    "topic": "Collections",
    "questionText": "Which set implementation maintains elements in ascending order?",
    "options": [
      "HashSet",
      "LinkedHashSet",
      "TreeSet",
      "EnumSet"
    ],
    "correctOptionIndex": 2,
    "explanation": "TreeSet stores its elements in a Red-Black tree, which maintains the elements in ascending (natural) order."
  },
  {
    "id": "java-col-27",
    "topic": "Data Structures",
    "questionText": "What is the capacity increment of an ArrayList when it becomes full?",
    "options": [
      "Doubles its size",
      "Increases by 50%",
      "Increases by 10",
      "Stays the same"
    ],
    "correctOptionIndex": 1,
    "explanation": "When an ArrayList is full, it typically grows by 50% of its current size (e.g., from 10 to 15)."
  },
  {
    "id": "java-col-28",
    "topic": "Maps",
    "questionText": "Which interface provides a map partitioned into concurrent segments for thread-safe access (prior to Java 8)?",
    "options": [
      "Hashtable",
      "HashMap",
      "ConcurrentHashMap",
      "SynchronizedMap"
    ],
    "correctOptionIndex": 2,
    "explanation": "ConcurrentHashMap historically used segment-based locking (lock striping) to allow concurrent access without locking the whole map."
  },
  {
    "id": "java-col-29",
    "topic": "Generics",
    "questionText": "Is List<String> a subtype of List<Object>?",
    "options": [
      "Yes",
      "No",
      "Only if String extends Object",
      "Sometimes"
    ],
    "correctOptionIndex": 1,
    "explanation": "Generics are invariant. List<String> is not a subtype of List<Object>, preventing runtime type errors."
  },
  {
    "id": "java-col-30",
    "topic": "Collections",
    "questionText": "What exception is thrown if you modify a collection structurally while iterating over it with a fail-fast iterator?",
    "options": [
      "IllegalStateException",
      "ConcurrentModificationException",
      "UnsupportedOperationException",
      "NullPointerException"
    ],
    "correctOptionIndex": 1,
    "explanation": "Fail-fast iterators throw ConcurrentModificationException if the underlying collection is modified structurally during iteration."
  },
  {
    "id": "java-col-31",
    "topic": "Data Structures",
    "questionText": "Which queue implementation allows blocking operations for a producer-consumer pattern?",
    "options": [
      "PriorityQueue",
      "ArrayDeque",
      "LinkedList",
      "ArrayBlockingQueue"
    ],
    "correctOptionIndex": 3,
    "explanation": "ArrayBlockingQueue implements BlockingQueue and supports operations that wait for the queue to become non-empty or for space to become available."
  },
  {
    "id": "java-col-32",
    "topic": "Maps",
    "questionText": "What does a load factor of 0.75 mean in a HashMap?",
    "options": [
      "The map is 75% full by default",
      "The map capacity increases when 75% of the buckets are filled",
      "The map uses 75% of available memory",
      "The hash function is 75% efficient"
    ],
    "correctOptionIndex": 1,
    "explanation": "The load factor is a measure of how full the hash table is allowed to get before its capacity is automatically increased."
  },
  {
    "id": "java-col-33",
    "topic": "Generics",
    "questionText": "Which signature is correctly defining a generic method?",
    "options": [
      "public void print(T item) <T>",
      "public <T> void print(T item)",
      "public void <T> print(T item)",
      "public void print(<T> item)"
    ],
    "correctOptionIndex": 1,
    "explanation": "In generic methods, the type parameter `<T>` must precede the return type."
  },
  {
    "id": "java-col-34",
    "topic": "Collections",
    "questionText": "Which Set implementation uses an enum array internally and is highly efficient?",
    "options": [
      "HashSet",
      "TreeSet",
      "EnumSet",
      "LinkedHashSet"
    ],
    "correctOptionIndex": 2,
    "explanation": "EnumSet is a specialized Set for use with enum types, typically implemented as a highly efficient bit-vector."
  },
  {
    "id": "java-col-35",
    "topic": "Data Structures",
    "questionText": "What happens if a custom object used as a key in a HashMap does not override hashCode()?",
    "options": [
      "Compilation error",
      "It functions perfectly",
      "Different objects with the same logical state will have different hashes, causing lookup failures",
      "It defaults to 0"
    ],
    "correctOptionIndex": 2,
    "explanation": "If hashCode is not overridden, Object's default hashCode is used, which typically derives from the memory address, meaning logically equal objects will hash differently."
  },
  {
    "id": "java-col-36",
    "topic": "Maps",
    "questionText": "What is the primary difference between HashMap and Hashtable?",
    "options": [
      "HashMap is synchronized, Hashtable is not",
      "Hashtable is synchronized, HashMap is not",
      "HashMap allows only String keys",
      "Hashtable allows null keys"
    ],
    "correctOptionIndex": 1,
    "explanation": "Hashtable is a legacy class that is synchronized and does not allow null keys/values, whereas HashMap is not synchronized and allows one null key and multiple null values."
  },
  {
    "id": "java-col-37",
    "topic": "Generics",
    "questionText": "Can a generic class extend Throwable?",
    "options": [
      "Yes, any class can",
      "No, generic classes cannot extend Throwable",
      "Only if the type parameter is Exception",
      "Yes, but it cannot be caught"
    ],
    "correctOptionIndex": 1,
    "explanation": "Java compiler does not allow generic classes to extend Throwable directly or indirectly, because exceptions are resolved at runtime and type erasure removes generic type information."
  },
  {
    "id": "java-col-38",
    "topic": "Collections",
    "questionText": "Which method of the Iterator interface removes the last element returned by the iterator?",
    "options": [
      "delete()",
      "remove()",
      "pop()",
      "poll()"
    ],
    "correctOptionIndex": 1,
    "explanation": "The remove() method safely removes from the underlying collection the last element returned by the iterator."
  },
  {
    "id": "java-col-39",
    "topic": "Data Structures",
    "questionText": "Which of the following implements a doubly-linked list?",
    "options": [
      "ArrayList",
      "LinkedList",
      "Vector",
      "HashSet"
    ],
    "correctOptionIndex": 1,
    "explanation": "LinkedList in Java is implemented as a doubly-linked list, allowing fast insertions and deletions."
  },
  {
    "id": "java-col-40",
    "topic": "Maps",
    "questionText": "In NavigableMap, which method returns a key-value mapping associated with the greatest key strictly less than the given key?",
    "options": [
      "lowerEntry()",
      "floorEntry()",
      "ceilingEntry()",
      "higherEntry()"
    ],
    "correctOptionIndex": 0,
    "explanation": "lowerEntry() returns the greatest key strictly less than the given key, while floorEntry() returns the greatest key less than or equal to the given key."
  },
  {
    "id": "java-col-41",
    "topic": "Generics",
    "questionText": "What does it mean for a wildcard to be unbounded?",
    "options": [
      "It uses the keyword 'unbound'",
      "It is specified as <?>",
      "It extends Object explicitly",
      "It implements Serializable"
    ],
    "correctOptionIndex": 1,
    "explanation": "An unbounded wildcard is specified using simply <?> and stands for any type."
  },
  {
    "id": "java-col-42",
    "topic": "Collections",
    "questionText": "Which interface represents a collection that does not allow duplicate elements?",
    "options": [
      "List",
      "Queue",
      "Set",
      "Map"
    ],
    "correctOptionIndex": 2,
    "explanation": "The Set interface is part of the Collection framework and models the mathematical set abstraction, which strictly prohibits duplicate elements."
  },
  {
    "id": "java-col-43",
    "topic": "Data Structures",
    "questionText": "What happens in a PriorityQueue if two elements have the same priority?",
    "options": [
      "An exception is thrown",
      "The tie is broken arbitrarily",
      "The most recently added is placed first",
      "The first added is placed first"
    ],
    "correctOptionIndex": 1,
    "explanation": "If elements have the same priority, the PriorityQueue does not guarantee any specific ordering among them (ties are broken arbitrarily)."
  },
  {
    "id": "java-col-44",
    "topic": "Maps",
    "questionText": "Which Map implementation is optimized for enum keys?",
    "options": [
      "EnumMap",
      "HashMap",
      "TreeMap",
      "WeakHashMap"
    ],
    "correctOptionIndex": 0,
    "explanation": "EnumMap is a highly optimized Map implementation designed specifically for use with enum keys, typically using arrays internally."
  },
  {
    "id": "java-col-45",
    "topic": "Generics",
    "questionText": "Can generic types be used in static fields or static methods of a generic class?",
    "options": [
      "Yes, they can",
      "No, static members cannot access class-level type parameters",
      "Only in Java 14+",
      "Only for static methods, not fields"
    ],
    "correctOptionIndex": 1,
    "explanation": "Static members belong to the class, not the instance. Because type erasure removes the generic type at runtime, there is only one class shared by all instances, so static members cannot use the class's type parameters."
  },
  {
    "id": "java-col-46",
    "topic": "Collections",
    "questionText": "What is the difference between poll() and remove() in the Queue interface?",
    "options": [
      "They do exactly the same thing",
      "poll() throws an exception on an empty queue, remove() returns null",
      "remove() throws an exception on an empty queue, poll() returns null",
      "poll() retrieves but does not remove the element"
    ],
    "correctOptionIndex": 2,
    "explanation": "If the queue is empty, remove() throws a NoSuchElementException, whereas poll() simply returns null."
  },
  {
    "id": "java-col-47",
    "topic": "Data Structures",
    "questionText": "In Java's CopyOnWriteArrayList, how is thread safety achieved?",
    "options": [
      "By synchronizing all read and write methods",
      "By using a read-write lock",
      "By creating a fresh copy of the underlying array upon every structural modification",
      "By throwing an exception on concurrent access"
    ],
    "correctOptionIndex": 2,
    "explanation": "CopyOnWriteArrayList achieves thread safety by copying the entire underlying array whenever a modification (add, set, remove) occurs, allowing concurrent reads without locking."
  },
  {
    "id": "java-col-48",
    "topic": "Maps",
    "questionText": "What does WeakHashMap do?",
    "options": [
      "It uses weak references for values",
      "It uses weak references for keys, allowing keys to be garbage collected if no strong references exist",
      "It is an unmodifiable map",
      "It encrypts its keys weakly"
    ],
    "correctOptionIndex": 1,
    "explanation": "WeakHashMap uses weak references for keys. If a key is no longer strongly referenced elsewhere, it becomes eligible for garbage collection, and the entry is removed from the map."
  },
  {
    "id": "java-col-49",
    "topic": "Generics",
    "questionText": "Which type of wildcard is best used when you only intend to read items from a collection?",
    "options": [
      "Upper bounded wildcard (? extends T)",
      "Lower bounded wildcard (? super T)",
      "Unbounded wildcard (?)",
      "Raw type"
    ],
    "correctOptionIndex": 0,
    "explanation": "Using an upper bounded wildcard (? extends T) guarantees that you can safely read items of type T, conforming to the PECS (Producer Extends, Consumer Super) principle."
  },
  {
    "id": "java-col-50",
    "topic": "Collections",
    "questionText": "Which method can be used to efficiently randomize the order of elements in a List?",
    "options": [
      "Collections.randomize()",
      "List.shuffle()",
      "Collections.shuffle()",
      "Arrays.shuffle()"
    ],
    "correctOptionIndex": 2,
    "explanation": "Collections.shuffle() uses an efficient algorithm (Fisher-Yates shuffle) to randomly permute the specified list."
  },
  {
    "id": "java-con-1",
    "topic": "Multithreading",
    "questionText": "What is the correct way to start a new thread using a Runnable in Java?",
    "options": [
      "new Runnable().start();",
      "new Thread(new Runnable()).run();",
      "new Thread(new Runnable()).start();",
      "Thread.start(new Runnable());"
    ],
    "correctOptionIndex": 2,
    "explanation": "To start a new thread, you must wrap the Runnable in a Thread object and call its start() method."
  },
  {
    "id": "java-con-2",
    "topic": "Multithreading",
    "questionText": "What happens if you call the run() method of a Thread directly instead of calling start()?",
    "options": [
      "A new thread is created and executes the run method.",
      "An IllegalThreadStateException is thrown.",
      "The run method executes in the context of the current thread.",
      "A compilation error occurs."
    ],
    "correctOptionIndex": 2,
    "explanation": "Calling run() directly does not start a new thread; it executes synchronously in the caller's thread."
  },
  {
    "id": "java-con-3",
    "topic": "Multithreading",
    "questionText": "Which method is used to pause the execution of the current thread for a specified amount of time?",
    "options": [
      "Thread.pause()",
      "Thread.sleep()",
      "Thread.wait()",
      "Thread.yield()"
    ],
    "correctOptionIndex": 1,
    "explanation": "Thread.sleep() pauses the execution of the currently executing thread."
  },
  {
    "id": "java-con-4",
    "topic": "Multithreading",
    "questionText": "What is the purpose of the Thread.yield() method?",
    "options": [
      "It permanently stops the execution of the current thread.",
      "It tells the thread scheduler that the current thread is willing to yield its current use of a processor.",
      "It forces another specific thread to execute immediately.",
      "It causes the current thread to wait until another thread wakes it up."
    ],
    "correctOptionIndex": 1,
    "explanation": "yield() is a hint to the scheduler that the current thread is willing to yield its current use of a processor."
  },
  {
    "id": "java-con-5",
    "topic": "Multithreading",
    "questionText": "How can a thread be forcefully stopped in modern Java?",
    "options": [
      "By using Thread.stop() method.",
      "By using Thread.destroy() method.",
      "By interrupting the thread and periodically checking Thread.currentThread().isInterrupted().",
      "By throwing an InterruptedException manually."
    ],
    "correctOptionIndex": 2,
    "explanation": "Thread.stop() is deprecated because it is inherently unsafe. The recommended way is to use interruptions and cooperative cancellation."
  },
  {
    "id": "java-con-6",
    "topic": "Multithreading",
    "questionText": "What does the join() method do in Java Multithreading?",
    "options": [
      "It joins two threads so they execute concurrently.",
      "It causes the current thread to wait until the thread on which join() is called dies.",
      "It merges the variables of two threads.",
      "It starts a thread immediately after the current one finishes."
    ],
    "correctOptionIndex": 1,
    "explanation": "t.join() causes the currently executing thread to pause execution until thread t completes its execution."
  },
  {
    "id": "java-con-7",
    "topic": "Multithreading",
    "questionText": "Which exception is thrown when a thread is waiting, sleeping, or otherwise occupied, and the thread is interrupted, either before or during the activity?",
    "options": [
      "IllegalThreadStateException",
      "InterruptedException",
      "ThreadDeath",
      "IllegalMonitorStateException"
    ],
    "correctOptionIndex": 1,
    "explanation": "InterruptedException is thrown when a thread is interrupted while it is waiting, sleeping, or otherwise blocked."
  },
  {
    "id": "java-con-8",
    "topic": "Multithreading",
    "questionText": "What is a daemon thread in Java?",
    "options": [
      "A thread that runs with maximum priority.",
      "A low priority thread that runs in the background to perform tasks such as garbage collection.",
      "A thread that can never be terminated.",
      "A thread used exclusively for networking tasks."
    ],
    "correctOptionIndex": 1,
    "explanation": "Daemon threads are background threads (like garbage collectors) that do not prevent the JVM from exiting when all user threads finish."
  },
  {
    "id": "java-con-9",
    "topic": "Multithreading",
    "questionText": "How do you make a thread a daemon thread?",
    "options": [
      "By implementing the Daemon interface.",
      "By overriding the daemonize() method.",
      "By calling setDaemon(true) before the thread is started.",
      "By calling setDaemon(true) after the thread is started."
    ],
    "correctOptionIndex": 2,
    "explanation": "setDaemon(true) must be called on a Thread instance before its start() method is invoked."
  },
  {
    "id": "java-con-10",
    "topic": "Multithreading",
    "questionText": "What is thread priority in Java?",
    "options": [
      "A guarantee of the order in which threads will execute.",
      "An integer from 1 to 10 that provides a hint to the thread scheduler about scheduling preference.",
      "A float value from 0.0 to 1.0 indicating relative execution time.",
      "A strict rule that forces higher priority threads to finish before lower priority threads start."
    ],
    "correctOptionIndex": 1,
    "explanation": "Thread priority is an integer from 1 (MIN_PRIORITY) to 10 (MAX_PRIORITY), acting as a hint to the OS thread scheduler."
  },
  {
    "id": "java-con-11",
    "topic": "Concurrency",
    "questionText": "What is the primary purpose of the 'volatile' keyword in Java?",
    "options": [
      "To make a variable immutable.",
      "To ensure that changes to a variable are always visible to other threads.",
      "To prevent multiple threads from accessing a method simultaneously.",
      "To serialize objects automatically."
    ],
    "correctOptionIndex": 1,
    "explanation": "The volatile keyword ensures that reads and writes to a variable are done directly to main memory, guaranteeing visibility across threads."
  },
  {
    "id": "java-con-12",
    "topic": "Concurrency",
    "questionText": "Does the 'volatile' keyword guarantee atomicity for operations like 'count++'?",
    "options": [
      "Yes, all operations on volatile variables are atomic.",
      "No, volatile guarantees visibility but not atomicity for compound operations.",
      "Yes, but only if the variable is an integer.",
      "No, volatile only works for reference types, not primitives."
    ],
    "correctOptionIndex": 1,
    "explanation": "volatile does not provide atomicity for compound operations like incrementing (read-modify-write). For atomicity, use Atomic variables or synchronization."
  },
  {
    "id": "java-con-13",
    "topic": "Concurrency",
    "questionText": "What does the 'synchronized' keyword do?",
    "options": [
      "It prevents a method from being overridden.",
      "It ensures that a method or block can be executed by only one thread at a time for a given object's monitor.",
      "It makes all variables inside the method thread-local.",
      "It starts a new thread automatically."
    ],
    "correctOptionIndex": 1,
    "explanation": "synchronized enforces mutual exclusion, ensuring only one thread holds the monitor lock for the specified object at a time."
  },
  {
    "id": "java-con-14",
    "topic": "Concurrency",
    "questionText": "Where can the 'synchronized' keyword be applied?",
    "options": [
      "Only to methods.",
      "Only to variables.",
      "To methods and blocks of code.",
      "To classes and interfaces."
    ],
    "correctOptionIndex": 2,
    "explanation": "synchronized can be used as a modifier for methods or as a block statement within methods."
  },
  {
    "id": "java-con-15",
    "topic": "Concurrency",
    "questionText": "Which exception is thrown if you call wait() or notify() on an object without holding its monitor lock?",
    "options": [
      "InterruptedException",
      "IllegalMonitorStateException",
      "IllegalThreadStateException",
      "LockNotHeldException"
    ],
    "correctOptionIndex": 1,
    "explanation": "IllegalMonitorStateException is thrown to indicate that a thread has attempted to wait on an object's monitor or to notify other threads waiting on an object's monitor without owning the specified monitor."
  },
  {
    "id": "java-con-16",
    "topic": "Concurrency",
    "questionText": "What is the difference between wait() and sleep()?",
    "options": [
      "wait() is a static method in Thread, while sleep() is in Object.",
      "wait() releases the monitor lock, whereas sleep() does not.",
      "wait() must be called with a timeout, while sleep() can wait indefinitely.",
      "There is no difference; they are interchangeable."
    ],
    "correctOptionIndex": 1,
    "explanation": "wait() is called on an Object and releases the lock, allowing other threads to enter synchronized blocks. Thread.sleep() holds onto the lock while sleeping."
  },
  {
    "id": "java-con-17",
    "topic": "Concurrency",
    "questionText": "What is a deadlock in Java concurrency?",
    "options": [
      "When a thread spins infinitely in a while loop.",
      "When two or more threads are blocked forever, waiting for each other to release locks.",
      "When a thread throws an uncaught exception.",
      "When too many threads are created, causing OutOfMemoryError."
    ],
    "correctOptionIndex": 1,
    "explanation": "Deadlock occurs when two or more threads are waiting on locks held by each other, causing a cycle of dependencies where none can proceed."
  },
  {
    "id": "java-con-18",
    "topic": "Concurrency",
    "questionText": "Which of the following is NOT a necessary condition for a deadlock to occur?",
    "options": [
      "Mutual exclusion",
      "Hold and wait",
      "No preemption",
      "High priority execution"
    ],
    "correctOptionIndex": 3,
    "explanation": "The four Coffman conditions for deadlock are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Priority is not a condition."
  },
  {
    "id": "java-con-19",
    "topic": "Concurrency",
    "questionText": "What does ThreadLocal provide?",
    "options": [
      "A mechanism to create local variables within a method.",
      "A way to store thread-specific data that is independently initialized for each thread.",
      "A global registry for all active threads.",
      "A way to synchronize access to a single variable."
    ],
    "correctOptionIndex": 1,
    "explanation": "ThreadLocal provides thread-local variables. Each thread that accesses one has its own, independently initialized copy of the variable."
  },
  {
    "id": "java-con-20",
    "topic": "Concurrency",
    "questionText": "What is a 'race condition'?",
    "options": [
      "A condition where threads try to finish their execution as fast as possible.",
      "A situation where the outcome of an execution depends on the unpredictable sequence of execution of multiple threads.",
      "An algorithm used to optimize thread scheduling.",
      "A memory leak caused by threads holding references."
    ],
    "correctOptionIndex": 1,
    "explanation": "A race condition occurs when the behavior of a program depends on the relative timing or interleaving of multiple threads."
  },
  {
    "id": "java-con-21",
    "topic": "Locks",
    "questionText": "Which interface does ReentrantLock implement?",
    "options": [
      "ReadWriteLock",
      "Lock",
      "SynchronizedLock",
      "Condition"
    ],
    "correctOptionIndex": 1,
    "explanation": "ReentrantLock implements the java.util.concurrent.locks.Lock interface."
  },
  {
    "id": "java-con-22",
    "topic": "Locks",
    "questionText": "What is an advantage of using ReentrantLock over the 'synchronized' keyword?",
    "options": [
      "ReentrantLock automatically releases the lock if an exception occurs.",
      "ReentrantLock provides features like tryLock() and lockInterruptibly().",
      "ReentrantLock is generally much slower but more secure.",
      "ReentrantLock can only be used by one thread in the entire application lifecycle."
    ],
    "correctOptionIndex": 1,
    "explanation": "ReentrantLock offers advanced features like interruptible lock acquisition, timeout-based lock attempts (tryLock), and fairness configurations."
  },
  {
    "id": "java-con-23",
    "topic": "Locks",
    "questionText": "Why is it crucial to release a Lock in a finally block?",
    "options": [
      "To improve execution speed.",
      "Because the compiler requires it.",
      "To ensure the lock is always released even if an exception is thrown in the critical section.",
      "To notify other waiting threads."
    ],
    "correctOptionIndex": 2,
    "explanation": "Unlike synchronized blocks, Lock implementations don't release automatically when an exception is thrown. Using a finally block guarantees the lock is released."
  },
  {
    "id": "java-con-24",
    "topic": "Locks",
    "questionText": "What does a ReadWriteLock allow?",
    "options": [
      "It allows multiple threads to read data simultaneously, as long as no thread is writing data.",
      "It allows one thread to read and write at the exact same time.",
      "It allows multiple threads to write simultaneously.",
      "It prevents all read and write operations until a specific condition is met."
    ],
    "correctOptionIndex": 0,
    "explanation": "ReadWriteLock maintains a pair of locks. The read lock may be held simultaneously by multiple reader threads, while the write lock is exclusive."
  },
  {
    "id": "java-con-25",
    "topic": "Locks",
    "questionText": "In StampedLock, what does optimistic reading provide?",
    "options": [
      "A guarantee that no other thread will write while reading.",
      "A very fast, non-blocking read operation that must be validated afterwards to check if a write occurred.",
      "An automatic upgrade to a write lock.",
      "A blocking read that waits for all writes to complete."
    ],
    "correctOptionIndex": 1,
    "explanation": "Optimistic reading in StampedLock returns a stamp without blocking or acquiring a lock. The caller must validate the stamp after reading to ensure data wasn't modified."
  },
  {
    "id": "java-con-26",
    "topic": "Locks",
    "questionText": "What is a 'fair lock' in java.util.concurrent.locks?",
    "options": [
      "A lock that ensures equal CPU time for all threads.",
      "A lock that grants access to the longest-waiting thread.",
      "A lock that randomly chooses the next thread.",
      "A lock that prioritizes reader threads over writer threads."
    ],
    "correctOptionIndex": 1,
    "explanation": "A fair lock, like new ReentrantLock(true), favors granting access to the thread that has been waiting the longest."
  },
  {
    "id": "java-con-27",
    "topic": "Locks",
    "questionText": "What is the equivalent of Object.wait() and Object.notify() when using the Lock interface?",
    "options": [
      "Lock.wait() and Lock.notify()",
      "Condition.await() and Condition.signal()",
      "Lock.sleep() and Lock.wake()",
      "Condition.wait() and Condition.signal()"
    ],
    "correctOptionIndex": 1,
    "explanation": "The Condition interface provides await() and signal()/signalAll() which act as replacements for Object.wait() and notify()."
  },
  {
    "id": "java-con-28",
    "topic": "Locks",
    "questionText": "Can a thread acquire a ReentrantLock multiple times without releasing it first?",
    "options": [
      "No, it will cause a deadlock.",
      "Yes, because it is reentrant, but it must release it the same number of times.",
      "Yes, and one release() call will unlock it completely.",
      "No, an IllegalMonitorStateException will be thrown."
    ],
    "correctOptionIndex": 1,
    "explanation": "A reentrant lock allows the thread that currently holds the lock to acquire it again without blocking. It maintains a hold count, so unlock() must be called an equal number of times."
  },
  {
    "id": "java-con-29",
    "topic": "Locks",
    "questionText": "What happens if a thread calls lockInterruptibly() and is interrupted before it acquires the lock?",
    "options": [
      "It acquires the lock anyway and sets the interrupt flag.",
      "It throws an InterruptedException and stops waiting for the lock.",
      "It ignores the interrupt and continues waiting.",
      "It throws a LockInterruptException."
    ],
    "correctOptionIndex": 1,
    "explanation": "lockInterruptibly() acquires the lock unless the current thread is interrupted, in which case it throws InterruptedException."
  },
  {
    "id": "java-con-30",
    "topic": "Locks",
    "questionText": "Which of the following is true about StampedLock compared to ReentrantReadWriteLock?",
    "options": [
      "StampedLock is reentrant.",
      "StampedLock provides optimistic reading, which can be much faster under high contention.",
      "StampedLock implements the Lock interface.",
      "StampedLock does not support write locks."
    ],
    "correctOptionIndex": 1,
    "explanation": "StampedLock is not reentrant and does not implement the Lock interface, but it provides optimistic reads that significantly improve performance in read-heavy scenarios."
  },
  {
    "id": "java-con-31",
    "topic": "Atomics",
    "questionText": "What does CAS stand for in the context of Java atomic variables?",
    "options": [
      "Compare And Swap",
      "Compute And Save",
      "Concurrent Atomic Synchronization",
      "Compare And Synchronize"
    ],
    "correctOptionIndex": 0,
    "explanation": "CAS stands for Compare-And-Swap (or Compare-And-Set). It's a low-level atomic instruction used to achieve lock-free synchronization."
  },
  {
    "id": "java-con-32",
    "topic": "Atomics",
    "questionText": "How do classes in java.util.concurrent.atomic achieve thread safety?",
    "options": [
      "By using the 'synchronized' keyword internally.",
      "By using ReentrantLocks.",
      "By using non-blocking CAS (Compare-And-Swap) operations.",
      "By executing in a single thread only."
    ],
    "correctOptionIndex": 2,
    "explanation": "Atomic classes like AtomicInteger use hardware-level CAS instructions (via Unsafe) to perform lock-free, atomic operations."
  },
  {
    "id": "java-con-33",
    "topic": "Atomics",
    "questionText": "What is the ABA problem in CAS operations?",
    "options": [
      "A memory leak caused by atomic variables.",
      "A situation where a value is changed from A to B and back to A, making CAS falsely assume no change occurred.",
      "A thread starvation issue where thread A and B block each other.",
      "An exception thrown when atomic variables exceed their maximum value."
    ],
    "correctOptionIndex": 1,
    "explanation": "The ABA problem occurs when a value is changed from A to B and back to A. A basic CAS will see 'A' and succeed, ignoring the intermediate state changes which might be significant."
  },
  {
    "id": "java-con-34",
    "topic": "Atomics",
    "questionText": "Which class is designed to solve the ABA problem in Java?",
    "options": [
      "AtomicInteger",
      "AtomicStampedReference",
      "AtomicReference",
      "LongAdder"
    ],
    "correctOptionIndex": 1,
    "explanation": "AtomicStampedReference pairs a reference with an integer 'stamp' (version number). CAS operations check both the reference and the stamp to prevent ABA issues."
  },
  {
    "id": "java-con-35",
    "topic": "Atomics",
    "questionText": "Why might you choose LongAdder over AtomicLong under high contention?",
    "options": [
      "LongAdder is smaller in memory.",
      "LongAdder provides methods for multiplication.",
      "LongAdder scales better under high contention by maintaining multiple counters and aggregating them.",
      "AtomicLong throws exceptions under high contention."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under high contention, AtomicLong CAS operations can fail repeatedly and spin. LongAdder mitigates this by maintaining a set of variables that grow dynamically and are summed when needed."
  },
  {
    "id": "java-con-36",
    "topic": "Atomics",
    "questionText": "What is the return value of AtomicInteger.incrementAndGet()?",
    "options": [
      "The previous value before incrementing.",
      "The new value after incrementing.",
      "A boolean indicating success.",
      "void"
    ],
    "correctOptionIndex": 1,
    "explanation": "incrementAndGet() atomically increments by one the current value and returns the updated value (like ++i)."
  },
  {
    "id": "java-con-37",
    "topic": "Atomics",
    "questionText": "Which method on AtomicReference sets the value only if the current value equals the expected value?",
    "options": [
      "setIfEqual()",
      "compareAndSet()",
      "swap()",
      "testAndSet()"
    ],
    "correctOptionIndex": 1,
    "explanation": "compareAndSet(expectedValue, newValue) atomically sets the value to the given updated value if the current value == the expected value."
  },
  {
    "id": "java-con-38",
    "topic": "Atomics",
    "questionText": "Is AtomicBoolean functionally equivalent to a volatile boolean?",
    "options": [
      "Yes, they are completely identical.",
      "No, AtomicBoolean allows for atomic read-modify-write operations like compareAndSet.",
      "Yes, but AtomicBoolean uses less memory.",
      "No, volatile boolean can only be read, never written."
    ],
    "correctOptionIndex": 1,
    "explanation": "While both guarantee visibility, AtomicBoolean provides atomic compound operations (like compareAndSet) that a simple volatile boolean cannot."
  },
  {
    "id": "java-con-39",
    "topic": "Atomics",
    "questionText": "What does the DoubleAccumulator class do?",
    "options": [
      "It multiplies double values atomically.",
      "It allows atomic accumulation of double values using a supplied function.",
      "It stores exactly two Double values.",
      "It provides double the precision of a standard double."
    ],
    "correctOptionIndex": 1,
    "explanation": "DoubleAccumulator (like LongAccumulator) maintains a running accumulated value updated with a supplied function, scaling well under contention."
  },
  {
    "id": "java-con-40",
    "topic": "Atomics",
    "questionText": "Can AtomicInteger be used as a drop-in replacement for Integer in Java Collections?",
    "options": [
      "Yes, it implements Comparable and overrides equals/hashCode.",
      "No, it does not override equals and hashCode, so it behaves based on object identity.",
      "Yes, it extends Integer.",
      "No, because it does not autobox."
    ],
    "correctOptionIndex": 1,
    "explanation": "Atomic variables like AtomicInteger do not override equals() or hashCode(), making them unsuitable as keys in HashMaps or sets."
  },
  {
    "id": "java-con-41",
    "topic": "Executors",
    "questionText": "Which interface represents an executor that provides methods to manage termination and track progress of asynchronous tasks?",
    "options": [
      "Executor",
      "ExecutorService",
      "ScheduledExecutorService",
      "ThreadPoolExecutor"
    ],
    "correctOptionIndex": 1,
    "explanation": "ExecutorService extends Executor and provides methods to manage termination (shutdown, awaitTermination) and methods that can produce a Future for tracking progress."
  },
  {
    "id": "java-con-42",
    "topic": "Executors",
    "questionText": "What is the key difference between Runnable and Callable interfaces?",
    "options": [
      "Runnable can be executed by a Thread, Callable cannot.",
      "Callable can return a result and throw a checked exception, while Runnable cannot.",
      "Runnable is in java.util.concurrent, Callable is in java.lang.",
      "Callable is used for daemon threads, Runnable for user threads."
    ],
    "correctOptionIndex": 1,
    "explanation": "Callable's call() method can return a value (generics) and is declared to throw Exception, unlike Runnable's void run()."
  },
  {
    "id": "java-con-43",
    "topic": "Executors",
    "questionText": "What does a Future object represent in Java?",
    "options": [
      "A thread that will start executing in the future.",
      "The result of an asynchronous computation.",
      "A scheduled task that repeats at a fixed rate.",
      "An exception thrown during task execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "A Future represents the result of an asynchronous computation. Methods are provided to check if the computation is complete, wait for its completion, and retrieve the result."
  },
  {
    "id": "java-con-44",
    "topic": "Executors",
    "questionText": "Which class from Executors utility is used to create a thread pool that reuses a fixed number of threads?",
    "options": [
      "Executors.newCachedThreadPool()",
      "Executors.newSingleThreadExecutor()",
      "Executors.newFixedThreadPool(int nThreads)",
      "Executors.newScheduledThreadPool(int corePoolSize)"
    ],
    "correctOptionIndex": 2,
    "explanation": "Executors.newFixedThreadPool(n) creates a thread pool that reuses a fixed number of threads operating off a shared unbounded queue."
  },
  {
    "id": "java-con-45",
    "topic": "Executors",
    "questionText": "What is the behavior of Executors.newCachedThreadPool()?",
    "options": [
      "It caches tasks in memory and never executes them.",
      "It creates a pool with a fixed size and caches the rest in a queue.",
      "It creates new threads as needed, but reuses previously constructed threads when they are available, and terminates idle threads after 60 seconds.",
      "It executes tasks continuously using exactly one thread."
    ],
    "correctOptionIndex": 2,
    "explanation": "A cached thread pool expands as needed and shrinks when threads are idle for 60 seconds, making it suitable for many short-lived asynchronous tasks."
  },
  {
    "id": "java-con-46",
    "topic": "Executors",
    "questionText": "What happens when you call shutdown() on an ExecutorService?",
    "options": [
      "It forcefully stops all currently executing tasks immediately.",
      "It blocks until all previously submitted tasks finish executing.",
      "It initiates an orderly shutdown in which previously submitted tasks are executed, but no new tasks will be accepted.",
      "It destroys the JVM instance."
    ],
    "correctOptionIndex": 2,
    "explanation": "shutdown() allows previously submitted tasks to execute but rejects new tasks. To stop immediately, shutdownNow() is used."
  },
  {
    "id": "java-con-47",
    "topic": "Executors",
    "questionText": "What does Future.get() do if the computation has not yet completed?",
    "options": [
      "It returns null immediately.",
      "It throws an IllegalStateException.",
      "It blocks the calling thread until the computation is complete.",
      "It cancels the task."
    ],
    "correctOptionIndex": 2,
    "explanation": "Future.get() is a blocking call; it waits if necessary for the computation to complete, and then retrieves its result."
  },
  {
    "id": "java-con-48",
    "topic": "Executors",
    "questionText": "Which class allows you to write non-blocking, reactive, and chainable asynchronous logic in Java?",
    "options": [
      "FutureTask",
      "CompletableFuture",
      "ExecutorCompletionService",
      "CountDownLatch"
    ],
    "correctOptionIndex": 1,
    "explanation": "CompletableFuture (introduced in Java 8) provides a large API for composing, chaining, and combining asynchronous steps in a non-blocking manner."
  },
  {
    "id": "java-con-49",
    "topic": "Executors",
    "questionText": "What is the core difference between execute() and submit() methods in an ExecutorService?",
    "options": [
      "execute() accepts Callable, submit() accepts Runnable.",
      "execute() returns a Future, submit() returns void.",
      "submit() can return a Future to track the task, while execute() returns void and cannot return a result.",
      "execute() throws checked exceptions, submit() does not."
    ],
    "correctOptionIndex": 2,
    "explanation": "submit() can take either a Runnable or Callable and returns a Future. execute() takes a Runnable and returns void."
  },
  {
    "id": "java-con-50",
    "topic": "Executors",
    "questionText": "Which queue is typically used internally by Executors.newFixedThreadPool()?",
    "options": [
      "SynchronousQueue",
      "LinkedBlockingQueue",
      "ArrayBlockingQueue",
      "PriorityBlockingQueue"
    ],
    "correctOptionIndex": 1,
    "explanation": "newFixedThreadPool uses an unbounded LinkedBlockingQueue to hold submitted tasks before they are executed."
  },
  {
    "id": "java-jvm-1",
    "topic": "JVM & Modern Java",
    "questionText": "In the Java Virtual Machine, what is the primary responsibility of the Bootstrap ClassLoader?",
    "options": [
      "To load application-level classes found in the classpath.",
      "To load core Java APIs like java.lang.* and java.util.* from the rt.jar or jmods.",
      "To load classes downloaded from a remote network location.",
      "To load extension classes placed in the jre/lib/ext directory."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Bootstrap ClassLoader is the parent of all classloaders and is responsible for loading the core Java classes provided by the JDK."
  },
  {
    "id": "java-jvm-2",
    "topic": "JVM & Modern Java",
    "questionText": "What does the JIT compiler's 'Escape Analysis' optimization primarily achieve?",
    "options": [
      "It prevents deadlocks by analyzing lock acquisitions.",
      "It allows objects to be allocated on the stack instead of the heap if they do not escape the method.",
      "It identifies memory leaks by tracking objects that escape garbage collection.",
      "It speeds up garbage collection by escaping the stop-the-world phase."
    ],
    "correctOptionIndex": 1,
    "explanation": "Escape Analysis determines if an object's scope is confined to the method where it was created. If so, it can be allocated on the stack, reducing heap allocation and GC overhead."
  },
  {
    "id": "java-jvm-3",
    "topic": "JVM & Modern Java",
    "questionText": "Which JVM component is responsible for storing per-thread execution information such as local variables and method calls?",
    "options": [
      "Metaspace",
      "Heap",
      "Java Virtual Machine Stack",
      "Native Method Stack"
    ],
    "correctOptionIndex": 2,
    "explanation": "The Java Virtual Machine Stack stores frames. Each frame contains local variables, operand stacks, and dynamic linking information for a specific thread."
  },
  {
    "id": "java-jvm-4",
    "topic": "JVM & Modern Java",
    "questionText": "In Java 8, where was the Method Area (PermGen) moved to?",
    "options": [
      "It was moved to the Young Generation.",
      "It was replaced by Metaspace, which uses native memory.",
      "It was merged entirely into the Old Generation.",
      "It was removed entirely; classes are now stored in the JVM Stack."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 8, PermGen was removed and replaced by Metaspace. Metaspace stores class metadata and is allocated out of native memory rather than JVM heap memory."
  },
  {
    "id": "java-jvm-5",
    "topic": "JVM & Modern Java",
    "questionText": "What is the purpose of the Program Counter (PC) Register in the JVM?",
    "options": [
      "To count the number of live objects in the heap.",
      "To keep track of the current instruction executing for a specific thread.",
      "To count the number of active threads in the JVM.",
      "To track the number of garbage collection cycles completed."
    ],
    "correctOptionIndex": 1,
    "explanation": "Each thread has its own PC register, which holds the address of the currently executing JVM instruction (if the method is not native)."
  },
  {
    "id": "java-jvm-6",
    "topic": "JVM & Modern Java",
    "questionText": "Which statement correctly describes Tiered Compilation in the JVM?",
    "options": [
      "It strictly compiles everything ahead of time before running the application.",
      "It combines the fast startup of the C1 compiler with the peak performance optimizations of the C2 compiler.",
      "It only compiles code when the garbage collector is paused.",
      "It compiles native methods into Java bytecodes."
    ],
    "correctOptionIndex": 1,
    "explanation": "Tiered compilation uses the C1 client compiler for quick compilation with profiling, and later uses the C2 server compiler for heavily optimized compilation of hot methods."
  },
  {
    "id": "java-jvm-7",
    "topic": "JVM & Modern Java",
    "questionText": "What are the first four bytes (magic number) of every valid compiled Java class file?",
    "options": [
      "0xCAFEBABE",
      "0xDEADBEEF",
      "0xFEEDFACE",
      "0xBAADF00D"
    ],
    "correctOptionIndex": 0,
    "explanation": "The JVM specification requires that every valid class file starts with the magic number 0xCAFEBABE."
  },
  {
    "id": "java-jvm-8",
    "topic": "JVM & Modern Java",
    "questionText": "Which JVM flag is typically used to set the initial heap size?",
    "options": [
      "-Xmx",
      "-Xss",
      "-Xms",
      "-Xmn"
    ],
    "correctOptionIndex": 2,
    "explanation": "-Xms sets the initial heap size, while -Xmx sets the maximum heap size."
  },
  {
    "id": "java-jvm-9",
    "topic": "JVM & Modern Java",
    "questionText": "What does a JVM safepoint signify?",
    "options": [
      "A backup point where the heap is dumped to disk.",
      "A state where all application threads are suspended so the JVM can perform critical operations like GC.",
      "A specific memory address where the garbage collector starts scanning.",
      "A security feature that prevents malicious bytecode execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "A safepoint is a state during which all application threads are halted, allowing the JVM to safely perform operations like garbage collection pauses."
  },
  {
    "id": "java-jvm-10",
    "topic": "JVM & Modern Java",
    "questionText": "What is the primary function of the Execution Engine in the JVM architecture?",
    "options": [
      "To load class files from the filesystem.",
      "To manage memory allocation in the heap.",
      "To execute bytecode instructions assigned to the runtime data areas.",
      "To perform garbage collection natively."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Execution Engine executes the bytecode. It contains the interpreter and the JIT compiler to run the instructions."
  },
  {
    "id": "java-jvm-11",
    "topic": "JVM & Modern Java",
    "questionText": "Which Garbage Collector was introduced as the default starting in Java 9?",
    "options": [
      "Parallel GC",
      "CMS GC",
      "G1 GC",
      "ZGC"
    ],
    "correctOptionIndex": 2,
    "explanation": "Garbage-First (G1) GC became the default garbage collector in Java 9, replacing Parallel GC."
  },
  {
    "id": "java-jvm-12",
    "topic": "JVM & Modern Java",
    "questionText": "What is a distinguishing feature of the Z Garbage Collector (ZGC)?",
    "options": [
      "It requires a minimum heap size of 16 GB.",
      "It performs all garbage collection phases completely synchronously.",
      "It aims for sub-millisecond pause times regardless of heap size.",
      "It only collects the young generation."
    ],
    "correctOptionIndex": 2,
    "explanation": "ZGC is a scalable, low-latency garbage collector designed to keep pause times strictly under a millisecond (in recent Java versions), even with multi-terabyte heaps."
  },
  {
    "id": "java-jvm-13",
    "topic": "JVM & Modern Java",
    "questionText": "In GC terminology, what is a 'GC Root'?",
    "options": [
      "An object in the Old generation that references an object in the Young generation.",
      "An object that is guaranteed to be collected in the next GC cycle.",
      "A starting point for the garbage collector to trace object reachability.",
      "The first object allocated in a given thread."
    ],
    "correctOptionIndex": 2,
    "explanation": "GC Roots are special objects (like active threads, local variables, and static variables) that serve as the starting point for reachability analysis during garbage collection."
  },
  {
    "id": "java-jvm-14",
    "topic": "JVM & Modern Java",
    "questionText": "How does the G1 Garbage Collector divide the heap?",
    "options": [
      "Into two contiguous regions: Eden and Old.",
      "Into a set of equal-sized regions, which can each independently act as Eden, Survivor, or Old generation.",
      "Into strict, fixed-size Young and Old generations.",
      "It does not divide the heap at all; it treats the heap as a single continuous block."
    ],
    "correctOptionIndex": 1,
    "explanation": "G1 partitions the heap into equal-sized regions. Regions can dynamically be assigned as Eden, Survivor, or Old areas."
  },
  {
    "id": "java-jvm-15",
    "topic": "JVM & Modern Java",
    "questionText": "What is the primary cause of a 'Stop-the-World' event in Java?",
    "options": [
      "A thread deadlocking.",
      "A network timeout waiting for a database.",
      "The Garbage Collector pausing all application threads to safely manipulate object references.",
      "The JIT compiler heavily optimizing a method."
    ],
    "correctOptionIndex": 2,
    "explanation": "A stop-the-world (STW) event occurs when the GC pauses all application threads to safely perform tasks like compacting memory or marking roots."
  },
  {
    "id": "java-jvm-16",
    "topic": "JVM & Modern Java",
    "questionText": "Which type of reference is used to schedule post-mortem cleanup actions as a safer alternative to finalization?",
    "options": [
      "StrongReference",
      "SoftReference",
      "WeakReference",
      "PhantomReference"
    ],
    "correctOptionIndex": 3,
    "explanation": "PhantomReferences are enqueued only after the object has been physically finalized/collected. They are used with a ReferenceQueue to perform post-mortem cleanup."
  },
  {
    "id": "java-jvm-17",
    "topic": "JVM & Modern Java",
    "questionText": "In generational garbage collection, what is the role of a 'Card Table'?",
    "options": [
      "To map class names to their memory addresses.",
      "To track references from the Old Generation to the Young Generation.",
      "To keep track of which threads are currently running.",
      "To count the number of allocations in a TLAB."
    ],
    "correctOptionIndex": 1,
    "explanation": "Card tables keep track of mutations in the Old Generation. If an Old object references a Young object, the card is marked dirty, allowing the GC to scan only dirty cards during a Minor GC instead of the entire Old Generation."
  },
  {
    "id": "java-jvm-18",
    "topic": "JVM & Modern Java",
    "questionText": "Which garbage collector was deprecated in Java 9 and removed in Java 14?",
    "options": [
      "Serial GC",
      "Parallel GC",
      "CMS (Concurrent Mark Sweep) GC",
      "Epsilon GC"
    ],
    "correctOptionIndex": 2,
    "explanation": "CMS GC was deprecated in Java 9 and fully removed in Java 14, largely replaced by G1 GC and ZGC."
  },
  {
    "id": "java-jvm-19",
    "topic": "JVM & Modern Java",
    "questionText": "What is the primary use case for the Epsilon Garbage Collector?",
    "options": [
      "For applications requiring minimal pause times under heavy load.",
      "For performance testing, short-lived jobs, and memory pressure testing, as it handles allocation but does not actually collect garbage.",
      "For devices with extremely constrained memory limits.",
      "For distributed applications needing synchronized GC pauses."
    ],
    "correctOptionIndex": 1,
    "explanation": "Epsilon is a 'no-op' garbage collector. It handles memory allocation but does not implement any memory reclamation mechanism."
  },
  {
    "id": "java-jvm-20",
    "topic": "JVM & Modern Java",
    "questionText": "When an object survives multiple garbage collections in the Young Generation, what happens to it?",
    "options": [
      "It is deallocated immediately.",
      "It is moved to the Metaspace.",
      "It is promoted (tenured) to the Old Generation.",
      "It is pinned in the Survivor space indefinitely."
    ],
    "correctOptionIndex": 2,
    "explanation": "Objects that survive a certain number of GC cycles (tenuring threshold) in the Young generation are promoted to the Old generation."
  },
  {
    "id": "java-jvm-21",
    "topic": "JVM & Modern Java",
    "questionText": "What does TLAB stand for in Java Memory Management?",
    "options": [
      "Thread-Local Allocation Buffer",
      "Total Logical Allocation Bytes",
      "Temporary Linked Application Block",
      "Thread-Level Array Buffer"
    ],
    "correctOptionIndex": 0,
    "explanation": "TLAB (Thread-Local Allocation Buffer) allows each thread to allocate objects in its own dedicated memory area in Eden, avoiding lock contention during allocation."
  },
  {
    "id": "java-jvm-22",
    "topic": "JVM & Modern Java",
    "questionText": "Which of the following will most likely cause a java.lang.OutOfMemoryError: Metaspace?",
    "options": [
      "Creating too many large String objects.",
      "Infinite recursion.",
      "Dynamically generating and loading a massive number of classes at runtime.",
      "Failing to close database connections."
    ],
    "correctOptionIndex": 2,
    "explanation": "Metaspace stores class metadata. Dynamically generating and loading many classes (e.g., using CGLib or dynamic proxies) without unloading them fills up Metaspace."
  },
  {
    "id": "java-jvm-23",
    "topic": "JVM & Modern Java",
    "questionText": "In modern Java (8+), where is the String Pool located?",
    "options": [
      "In the Metaspace.",
      "In the Native Method Stack.",
      "In the main Heap memory.",
      "In the Thread-Local Allocation Buffer."
    ],
    "correctOptionIndex": 2,
    "explanation": "Starting from Java 7, the String Pool was moved from the PermGen to the main Heap to allow for better garbage collection of unused interned strings."
  },
  {
    "id": "java-jvm-24",
    "topic": "JVM & Modern Java",
    "questionText": "What is the difference between a SoftReference and a WeakReference?",
    "options": [
      "WeakReferences prevent garbage collection, while SoftReferences do not.",
      "SoftReferences are cleared before an OutOfMemoryError is thrown, while WeakReferences are cleared on any GC cycle if softly reachable.",
      "WeakReferences are used only for primitives, SoftReferences for objects.",
      "There is no difference; they are aliases for the same concept."
    ],
    "correctOptionIndex": 1,
    "explanation": "WeakReferences are cleared aggressively during GC if the object has no strong references. SoftReferences are cleared only when the JVM is running low on memory, making them ideal for caches."
  },
  {
    "id": "java-jvm-25",
    "topic": "JVM & Modern Java",
    "questionText": "What does 'Compressed Oops' refer to in the JVM?",
    "options": [
      "An algorithm that compresses class files on disk.",
      "A JVM feature that uses 32-bit object references instead of 64-bit on 64-bit architectures to save memory.",
      "A garbage collection technique that compresses the heap.",
      "An optimization for small arrays."
    ],
    "correctOptionIndex": 1,
    "explanation": "Compressed Oops (Ordinary Object Pointers) allows a 64-bit JVM to use 32-bit references, saving memory as long as the heap size is under ~32GB."
  },
  {
    "id": "java-jvm-26",
    "topic": "JVM & Modern Java",
    "questionText": "How can off-heap memory be allocated in Java?",
    "options": [
      "Using the `new` keyword with a special `@OffHeap` annotation.",
      "By using `ByteBuffer.allocateDirect()` or the `Unsafe` class.",
      "By overriding the `finalize()` method.",
      "Off-heap memory allocation is impossible in Java."
    ],
    "correctOptionIndex": 1,
    "explanation": "Direct ByteBuffers (`ByteBuffer.allocateDirect()`) allocate memory outside the standard Java Heap (off-heap memory), avoiding garbage collection overhead."
  },
  {
    "id": "java-jvm-27",
    "topic": "JVM & Modern Java",
    "questionText": "What is the recommended replacement for the deprecated `finalize()` method in modern Java?",
    "options": [
      "System.gc()",
      "The `Cleaner` API (java.lang.ref.Cleaner)",
      "Runtime.getRuntime().addShutdownHook()",
      "PhantomReference without a ReferenceQueue"
    ],
    "correctOptionIndex": 1,
    "explanation": "The `Cleaner` API, introduced in Java 9, provides a safer and more efficient mechanism for object cleanup compared to the notoriously problematic `finalize()` method."
  },
  {
    "id": "java-jvm-28",
    "topic": "JVM & Modern Java",
    "questionText": "Which scenario represents a common cause of a memory leak in Java?",
    "options": [
      "Creating short-lived objects inside a tight loop.",
      "Adding objects to a static Collection (like a HashMap) and never removing them.",
      "Calling System.gc() too frequently.",
      "Using too many WeakReferences."
    ],
    "correctOptionIndex": 1,
    "explanation": "Storing objects in a static collection prevents them from being garbage collected because the static reference acts as a GC Root, keeping them alive indefinitely."
  },
  {
    "id": "java-jvm-29",
    "topic": "JVM & Modern Java",
    "questionText": "What happens if a Java thread throws a `StackOverflowError`?",
    "options": [
      "The entire JVM instantly crashes.",
      "The JVM expands the stack dynamically to accommodate the thread.",
      "The thread terminates abnormally, but the JVM and other threads can continue running.",
      "The garbage collector cleans up the stack."
    ],
    "correctOptionIndex": 2,
    "explanation": "A StackOverflowError is thrown for the specific thread that exhausted its stack (usually due to deep/infinite recursion). Other threads and the JVM itself can continue running."
  },
  {
    "id": "java-jvm-30",
    "topic": "JVM & Modern Java",
    "questionText": "Which memory space in the JVM stores static variables in Java 8 and above?",
    "options": [
      "Metaspace",
      "Heap",
      "Native Method Stack",
      "PC Register"
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 8+, static variables are stored in the Heap memory (associated with the `java.lang.Class` object for the corresponding class), not in Metaspace."
  },
  {
    "id": "java-jvm-31",
    "topic": "JVM & Modern Java",
    "questionText": "In the Java Stream API, what is the difference between an intermediate and a terminal operation?",
    "options": [
      "Intermediate operations execute immediately, while terminal operations are lazy.",
      "Intermediate operations return a new Stream and are lazy, while terminal operations produce a result or side-effect and trigger execution.",
      "Intermediate operations run in parallel, terminal operations run sequentially.",
      "There is no functional difference."
    ],
    "correctOptionIndex": 1,
    "explanation": "Streams are lazy. Intermediate operations (like filter, map) simply return another Stream without processing data. A terminal operation (like collect, count) triggers the pipeline execution."
  },
  {
    "id": "java-jvm-32",
    "topic": "JVM & Modern Java",
    "questionText": "What does the `flatMap` operation do in a Java Stream?",
    "options": [
      "It flattens a nested data structure by mapping each element to a Stream and then merging all resulting Streams into one.",
      "It maps elements to a flattened 2D array.",
      "It sorts the elements based on a flat comparator.",
      "It immediately evaluates the stream and removes duplicates."
    ],
    "correctOptionIndex": 0,
    "explanation": "`flatMap` transforms each element into a Stream of elements, and then flattens all those streams into a single seamless Stream."
  },
  {
    "id": "java-jvm-33",
    "topic": "JVM & Modern Java",
    "questionText": "Which thread pool is used by default when executing a parallel stream via `stream.parallel()`?",
    "options": [
      "A cached thread pool.",
      "The main thread only.",
      "The common ForkJoinPool.",
      "A fixed thread pool with a size of 10."
    ],
    "correctOptionIndex": 2,
    "explanation": "Parallel streams utilize the `ForkJoinPool.commonPool()` by default for parallel execution."
  },
  {
    "id": "java-jvm-34",
    "topic": "JVM & Modern Java",
    "questionText": "Which of the following is a short-circuiting terminal operation in the Stream API?",
    "options": [
      "forEach",
      "reduce",
      "findFirst",
      "collect"
    ],
    "correctOptionIndex": 2,
    "explanation": "Short-circuiting terminal operations, like `findFirst` or `anyMatch`, can terminate the stream processing early without examining all elements."
  },
  {
    "id": "java-jvm-35",
    "topic": "JVM & Modern Java",
    "questionText": "Which statement about the `Stream.reduce` operation is true?",
    "options": [
      "It is an intermediate operation.",
      "It requires a mutable accumulator object.",
      "It combines elements of a stream into a single result by repeatedly applying a binary operator.",
      "It is typically used to collect stream elements into a List or Set."
    ],
    "correctOptionIndex": 2,
    "explanation": "`reduce` is a terminal operation that takes an identity and a BinaryOperator accumulator to fold elements into a single immutable result."
  },
  {
    "id": "java-jvm-36",
    "topic": "JVM & Modern Java",
    "questionText": "What distinguishes a stateful intermediate operation (like `sorted` or `distinct`) from a stateless one (like `filter` or `map`)?",
    "options": [
      "Stateful operations cannot be used in parallel streams.",
      "Stateful operations may need to buffer elements from the stream to compute their result.",
      "Stateless operations return void.",
      "Stateful operations modify the underlying data source."
    ],
    "correctOptionIndex": 1,
    "explanation": "Stateful operations, such as `sorted()`, must see all elements (and thus buffer them) before emitting the first sorted element. Stateless operations process elements independently."
  },
  {
    "id": "java-jvm-37",
    "topic": "JVM & Modern Java",
    "questionText": "How does `Stream.generate(Supplier s)` behave?",
    "options": [
      "It creates a finite stream of elements based on a Collection.",
      "It creates an infinite sequential unordered stream where each element is generated by the provided Supplier.",
      "It iteratively generates elements based on a seed and a UnaryOperator.",
      "It reads lines from a file sequentially."
    ],
    "correctOptionIndex": 1,
    "explanation": "`Stream.generate` produces an infinite stream by repeatedly invoking the Supplier. It is usually combined with `limit()` to make it finite."
  },
  {
    "id": "java-jvm-38",
    "topic": "JVM & Modern Java",
    "questionText": "What is the role of a `Spliterator` in the Stream API?",
    "options": [
      "To concatenate multiple streams together.",
      "To split an Iterator into two separate Iterators.",
      "To traverse and optionally partition elements of a source for parallel processing.",
      "To split a string into a stream of characters."
    ],
    "correctOptionIndex": 2,
    "explanation": "A `Spliterator` (Splitable Iterator) is designed to traverse elements and can partition some of its elements (via `trySplit`) to be processed by other threads in parallel streams."
  },
  {
    "id": "java-jvm-39",
    "topic": "JVM & Modern Java",
    "questionText": "What does `Collectors.partitioningBy(Predicate)` return when applied to a stream?",
    "options": [
      "A List containing all elements that match the predicate.",
      "A Map<Boolean, List<T>> separating the elements into two lists based on the predicate.",
      "A Map<T, Boolean> mapping each element to the predicate's result.",
      "An Array of arrays split evenly."
    ],
    "correctOptionIndex": 1,
    "explanation": "`partitioningBy` evaluates elements against a predicate and groups them into a Map with two keys (true and false), containing lists of matching and non-matching elements respectively."
  },
  {
    "id": "java-jvm-40",
    "topic": "JVM & Modern Java",
    "questionText": "Can a Java Stream be reused after a terminal operation has been executed on it?",
    "options": [
      "Yes, if it is a sequential stream.",
      "Yes, but only if no elements were modified.",
      "No, Streams are single-use and will throw an IllegalStateException if reused.",
      "No, it throws a NullPointerException."
    ],
    "correctOptionIndex": 2,
    "explanation": "A Stream pipeline is considered consumed once a terminal operation executes. Attempting to use the stream again will throw an `IllegalStateException`."
  },
  {
    "id": "java-jvm-41",
    "topic": "JVM & Modern Java",
    "questionText": "Introduced in Java 14 as a preview and finalized in Java 16, what is a `record` in Java?",
    "options": [
      "A new keyword to record application logs natively.",
      "A transparent data carrier class that automatically generates boilerplate code like constructors, getters, equals, hashCode, and toString.",
      "A special interface used exclusively for database ORM mapping.",
      "A mutable class structure designed for performance."
    ],
    "correctOptionIndex": 1,
    "explanation": "Records are a concise way to create immutable data carrier classes, drastically reducing boilerplate code."
  },
  {
    "id": "java-jvm-42",
    "topic": "JVM & Modern Java",
    "questionText": "What does Pattern Matching for `instanceof` (Java 16) allow you to do?",
    "options": [
      "Use regular expressions inside an `instanceof` check.",
      "Combine an `instanceof` check and a cast into a single expression by binding a target variable.",
      "Perform `instanceof` checks on primitive types.",
      "Check if an object is an instance of multiple classes simultaneously."
    ],
    "correctOptionIndex": 1,
    "explanation": "Pattern Matching for `instanceof` allows you to declare a variable right inside the condition (e.g., `if (obj instanceof String s)`), eliminating the need for an explicit cast."
  },
  {
    "id": "java-jvm-43",
    "topic": "JVM & Modern Java",
    "questionText": "What is the primary purpose of a 'Sealed Class' (Java 17)?",
    "options": [
      "To prevent a class from being garbage collected.",
      "To make all fields inside a class immutable automatically.",
      "To restrict which other classes or interfaces may extend or implement it.",
      "To hide the class from reflection APIs."
    ],
    "correctOptionIndex": 2,
    "explanation": "Sealed classes (using `sealed` and `permits` modifiers) restrict class hierarchies by specifying exactly which subclasses are allowed to extend them."
  },
  {
    "id": "java-jvm-44",
    "topic": "JVM & Modern Java",
    "questionText": "How are Text Blocks represented in Java 15+?",
    "options": [
      "Enclosed in single quotes.",
      "Enclosed in triple double-quotes (\"\"\").",
      "Prefixed with the `@TextBlock` annotation.",
      "Enclosed in backticks (`)."
    ],
    "correctOptionIndex": 1,
    "explanation": "Text Blocks use triple double-quotes (\"\"\") to define multi-line strings, avoiding the need for manual escape sequences for newlines and nested quotes."
  },
  {
    "id": "java-jvm-45",
    "topic": "JVM & Modern Java",
    "questionText": "Which of the following is a feature of Switch Expressions introduced in Java 14?",
    "options": [
      "They completely replace `if-else` statements.",
      "They can yield a value, and multiple case labels can be comma-separated.",
      "They require the use of the `break` statement to prevent fall-through.",
      "They only work with Enums and Strings."
    ],
    "correctOptionIndex": 1,
    "explanation": "Switch Expressions can evaluate to a value, support the arrow `->` syntax which avoids fall-through without `break`, and allow multiple comma-separated labels per case."
  },
  {
    "id": "java-jvm-46",
    "topic": "JVM & Modern Java",
    "questionText": "What problem do Virtual Threads (Project Loom, Java 21) primarily aim to solve?",
    "options": [
      "To replace the JVM's Garbage Collector with a threading model.",
      "To allow the creation of millions of lightweight threads, improving throughput for blocking I/O operations.",
      "To execute JavaScript code concurrently within the JVM.",
      "To force all Java applications to use asynchronous reactive programming."
    ],
    "correctOptionIndex": 1,
    "explanation": "Virtual Threads are cheap, lightweight threads managed by the JVM rather than the OS, allowing a thread-per-request model that scales massively for blocking I/O."
  },
  {
    "id": "java-jvm-47",
    "topic": "JVM & Modern Java",
    "questionText": "What does the `var` keyword (Java 10) do?",
    "options": [
      "It declares a mutable variable whose type can change at runtime.",
      "It instructs the compiler to infer the type of a local variable from its initializer.",
      "It declares a variable globally accessible across all classes.",
      "It is a shorthand for defining a `Variant` object type."
    ],
    "correctOptionIndex": 1,
    "explanation": "`var` provides local-variable type inference. The compiler infers the static type at compile time based on the assigned value; Java remains strongly typed."
  },
  {
    "id": "java-jvm-48",
    "topic": "JVM & Modern Java",
    "questionText": "What is the primary reason 'Default Methods' were added to interfaces in Java 8?",
    "options": [
      "To support multiple inheritance of state.",
      "To allow developers to write private helper methods in interfaces.",
      "To enable backward compatibility by allowing new methods to be added to existing interfaces without breaking implementing classes.",
      "To replace abstract classes entirely."
    ],
    "correctOptionIndex": 2,
    "explanation": "Default methods allow library designers to evolve interfaces (like adding `stream()` to `Collection`) without breaking existing legacy implementations."
  },
  {
    "id": "java-jvm-49",
    "topic": "JVM & Modern Java",
    "questionText": "In the Java Module System (Project Jigsaw, Java 9), what is the purpose of the `module-info.java` file?",
    "options": [
      "To list all maven dependencies.",
      "To declare the module's dependencies (`requires`) and specify which packages it exposes (`exports`) to other modules.",
      "To define the main class for the executable jar.",
      "To configure the JVM garbage collection settings for the application."
    ],
    "correctOptionIndex": 1,
    "explanation": "The `module-info.java` file defines the module descriptor, establishing strict encapsulation by specifying what the module requires and what it exports."
  },
  {
    "id": "java-jvm-50",
    "topic": "JVM & Modern Java",
    "questionText": "Which new method was added to `java.util.Optional` in Java 9 to execute an action if a value is present, or a different action if it is empty?",
    "options": [
      "isPresentOrElse",
      "ifPresentOrElse",
      "orElseGet",
      "mapOrElse"
    ],
    "correctOptionIndex": 1,
    "explanation": "`ifPresentOrElse(Consumer<? super T> action, Runnable emptyAction)` allows you to provide callbacks for both the present and empty cases in a functional style."
  }
];
