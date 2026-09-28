# OCA Java SE 8 - Chapter 6: Exceptions (20 Questions)

ch6_questions = [
    {
        "topic": "Exceptions",
        "difficulty": "easy",
        "questionText": "Which of the following statements about Java exceptions is TRUE?",
        "codeSnippet": "",
        "optionA": "Runtime exceptions are the same thing as checked exceptions",
        "optionB": "Runtime exceptions are the same thing as unchecked exceptions",
        "optionC": "You can declare only checked exceptions in a throws clause",
        "optionD": "You can handle only Error subclasses with a try-catch statement",
        "correctOption": "B",
        "explanation": "In Java, 'runtime exceptions' and 'unchecked exceptions' are synonymous. They represent RuntimeException and its subclasses, which are not subject to the handle-or-declare rule."
    },
    {
        "topic": "Exceptions",
        "difficulty": "easy",
        "questionText": "Which pair of keywords fills in the blanks to make this method compile?",
        "codeSnippet": """7: public void ohNo() _____ Exception {
8:   _____________ Exception();
9: }""",
        "optionA": "On line 7: throw; On line 8: throws",
        "optionB": "On line 7: throws; On line 8: throw new",
        "optionC": "On line 7: throws; On line 8: throw",
        "optionD": "On line 7: throws; On line 8: throws new",
        "correctOption": "B",
        "explanation": "In a method signature, the keyword 'throws' is used to declare exceptions that may be thrown by the method. Inside a method body, 'throw new' is used to instantiate and throw an exception instance."
    },
    {
        "topic": "Exceptions",
        "difficulty": "easy",
        "questionText": "When are you required to include a finally block in a regular Java try statement?",
        "codeSnippet": "",
        "optionA": "Never (a try statement requires at least one catch block OR a finally block)",
        "optionB": "When the program code doesn't terminate on its own",
        "optionC": "Whenever there is more than one catch block",
        "optionD": "Whenever an unchecked exception is thrown",
        "correctOption": "A",
        "explanation": "A regular try statement requires either one or more catch blocks, or a finally block, or both. A finally block is never strictly required as long as at least one catch block is present."
    },
    {
        "topic": "Exceptions",
        "difficulty": "easy",
        "questionText": "Which exception is thrown when attempting to execute the following code?",
        "codeSnippet": """Object obj = new Integer(3);
String str = (String) obj;
System.out.println(str);""",
        "optionA": "ArrayIndexOutOfBoundsException",
        "optionB": "ClassCastException",
        "optionC": "IllegalArgumentException",
        "optionD": "NumberFormatException",
        "correctOption": "B",
        "explanation": "At runtime, 'obj' references an Integer instance. Attempting to cast an Integer to String causes the JVM to throw a java.lang.ClassCastException."
    },
    {
        "topic": "Exceptions",
        "difficulty": "medium",
        "questionText": "Which of the following exceptions is typically thrown directly by the JVM rather than by application programmer code?",
        "codeSnippet": "",
        "optionA": "java.lang.NullPointerException",
        "optionB": "java.lang.IllegalArgumentException",
        "optionC": "java.lang.NumberFormatException",
        "optionD": "java.io.FileNotFoundException",
        "correctOption": "A",
        "explanation": "NullPointerException is thrown by the JVM when code attempts to dereference or access a member on a null reference. In contrast, IllegalArgumentException and NumberFormatException are programmatically thrown by code when validating arguments."
    },
    {
        "topic": "Exceptions",
        "difficulty": "easy",
        "questionText": "What occurs when the statement 'System.out.println(5 / 0);' is executed in a main method?",
        "codeSnippet": "",
        "optionA": "It will not compile",
        "optionB": "It prints Infinity",
        "optionC": "It runs and throws an ArithmeticException (/ by zero)",
        "optionD": "It runs and throws an IllegalArgumentException",
        "correctOption": "C",
        "explanation": "In Java, integer division by zero is not detected at compile time and throws a runtime java.lang.ArithmeticException: / by zero."
    },
    {
        "topic": "Exceptions",
        "difficulty": "medium",
        "questionText": "What is printed before the stack trace when running class DoSomething?",
        "codeSnippet": """public class DoSomething {
  public void go() {
    System.out.print("A");
    try {
      stop();
    } catch (ArithmeticException e) {
      System.out.print("B");
    } finally {
      System.out.print("C");
    }
    System.out.print("D");
  }
  public void stop() {
    System.out.print("E");
    Object x = null;
    x.toString(); // throws NullPointerException
    System.out.print("F");
  }
  public static void main(String[] args) {
    new DoSomething().go();
  }
}""",
        "optionA": "AE",
        "optionB": "AEBCD",
        "optionC": "AEC",
        "optionD": "AECD",
        "correctOption": "C",
        "explanation": "go() prints 'A', enters try, calls stop(). stop() prints 'E', then x.toString() throws NullPointerException. Execution returns to go(). The catch block only catches ArithmeticException, so NullPointerException is NOT caught. However, the finally block ALWAYS executes, printing 'C'. The method abruptly terminates with the uncaught NullPointerException, so 'D' is never reached. Output: 'AEC'."
    },
    {
        "topic": "Exceptions",
        "difficulty": "hard",
        "questionText": "Why does the following try-catch structure fail to compile?",
        "codeSnippet": """try {
  return a / b;
} catch (RuntimeException e) {
  return -1;
} catch (ArithmeticException e) { // LINE 7
  return 0;
} finally {
  System.out.print("done");
}""",
        "optionA": "ArithmeticException cannot be caught after division",
        "optionB": "Line 7 is unreachable because ArithmeticException is a subclass of RuntimeException and is already handled by line 4",
        "optionC": "A try block cannot have both catch and finally",
        "optionD": "return cannot appear inside a catch block",
        "correctOption": "B",
        "explanation": "Catch blocks must be ordered from most specific subclass to most general superclass. Because ArithmeticException is a subclass of RuntimeException, any ArithmeticException thrown would already be caught by the first catch block. Line 7 is unreachable code, causing a compiler error."
    },
    {
        "topic": "Exceptions",
        "difficulty": "medium",
        "questionText": "What is the output of the following program containing System.exit(0)?",
        "codeSnippet": """public class Laptop {
  public void start() {
    try {
      System.out.print("Starting up ");
      throw new Exception();
    } catch (Exception e) {
      System.out.print("Problem ");
      System.exit(0);
    } finally {
      System.out.print("Shutting down ");
    }
  }
  public static void main(String[] args) {
    new Laptop().start();
  }
}""",
        "optionA": "Starting up ",
        "optionB": "Starting up Problem ",
        "optionC": "Starting up Problem Shutting down ",
        "optionD": "Starting up Shutting down ",
        "correctOption": "B",
        "explanation": "The try block prints 'Starting up ' and throws an Exception. The catch block catches it, prints 'Problem ', and calls System.exit(0). System.exit immediately halts the JVM. In this scenario, the finally block does NOT execute. Output: 'Starting up Problem '."
    },
    {
        "topic": "Exceptions",
        "difficulty": "medium",
        "questionText": "What is the output of running class Dog?",
        "codeSnippet": """public class Dog {
  public String name;
  public void parseName() {
    System.out.print("1");
    try {
      System.out.print("2");
      int x = Integer.parseInt(name);
      System.out.print("3");
    } catch (NumberFormatException e) {
      System.out.print("4");
    }
  }
  public static void main(String[] args) {
    Dog leroy = new Dog();
    leroy.name = "Leroy";
    leroy.parseName();
    System.out.print("5");
  }
}""",
        "optionA": "12",
        "optionB": "1235",
        "optionC": "1245",
        "optionD": "124",
        "correctOption": "C",
        "explanation": "parseName() prints '1', enters try, prints '2'. Integer.parseInt(\"Leroy\") throws NumberFormatException, skipping line '3'. The catch block catches NumberFormatException and prints '4'. Execution resumes after try-catch and completes parseName(). Then main() prints '5'. Total output: '1245'."
    },
    {
        "topic": "Exceptions",
        "difficulty": "medium",
        "questionText": "What occurs when running class Cat where the exception is NOT caught?",
        "codeSnippet": """public class Cat {
  public String name;
  public void parseName() {
    System.out.print("1");
    try {
      System.out.print("2");
      int x = Integer.parseInt(name);
      System.out.print("3");
    } catch (NullPointerException e) {
      System.out.print("4");
    }
    System.out.print("5");
  }
  public static void main(String[] args) {
    Cat leo = new Cat();
    leo.name = "Leo";
    leo.parseName();
    System.out.print("6");
  }
}""",
        "optionA": "Prints 12, followed by a stack trace for NumberFormatException",
        "optionB": "Prints 12456",
        "optionC": "Prints 1256, followed by a stack trace",
        "optionD": "Prints 124, followed by a stack trace",
        "correctOption": "A",
        "explanation": "parseName() prints '1', enters try, prints '2'. Integer.parseInt(\"Leo\") throws NumberFormatException. The catch block only handles NullPointerException, so the exception is unhandled. parseName() abruptly terminates without printing '5' or '6', and the uncaught exception terminates the main thread, outputting '12' followed by the stack trace."
    },
    {
        "topic": "Exceptions",
        "difficulty": "medium",
        "questionText": "What is printed before the exception stack trace in the following code?",
        "codeSnippet": """public class Mouse {
  public String name;
  public void run() {
    System.out.print("1");
    try {
      System.out.print("2");
      name.toString();
      System.out.print("3");
    } catch (NullPointerException e) {
      System.out.print("4");
      throw e;
    }
    System.out.print("5");
  }
  public static void main(String[] args) {
    Mouse jerry = new Mouse();
    jerry.run();
    System.out.print("6");
  }
}""",
        "optionA": "123",
        "optionB": "124",
        "optionC": "1245",
        "optionD": "1246",
        "correctOption": "B",
        "explanation": "run() prints '1', enters try, prints '2'. name is null, so name.toString() throws NullPointerException. The catch block catches it, prints '4', and re-throws 'throw e;'. Because it is re-thrown and not caught by main(), lines '5' and '6' never execute. The output before the stack trace is '124'."
    },
    {
        "topic": "Exceptions",
        "difficulty": "easy",
        "questionText": "Which types are allowed to appear in the 'throws' clause of a Java method declaration?",
        "codeSnippet": "",
        "optionA": "Only checked exceptions",
        "optionB": "Only RuntimeException subclasses",
        "optionC": "Any class that extends java.lang.Throwable (including Error, Exception, and RuntimeException)",
        "optionD": "Any Java class or interface",
        "correctOption": "C",
        "explanation": "Any class that extends java.lang.Throwable may be declared in a throws clause, including checked exceptions, unchecked exceptions (RuntimeException), and Errors."
    },
    {
        "topic": "Exceptions",
        "difficulty": "medium",
        "questionText": "Given 'public void ohNo() throws IOException {}', which statement will NOT compile inside ohNo()?",
        "codeSnippet": "",
        "optionA": "throw new java.io.IOException();",
        "optionB": "throw new IllegalArgumentException();",
        "optionC": "throw new Exception();",
        "optionD": "throw new RuntimeException();",
        "correctOption": "C",
        "explanation": "The method declares 'throws IOException'. 'throw new Exception();' throws a checked exception that is BROADER than IOException. Because the method does not declare 'throws Exception', line C fails compilation. In contrast, unchecked exceptions (IllegalArgumentException, RuntimeException) can be thrown without being declared."
    },
    {
        "topic": "Exceptions",
        "difficulty": "easy",
        "questionText": "Which of the following is an unchecked (Runtime) exception in Java?",
        "codeSnippet": "",
        "optionA": "java.io.IOException",
        "optionB": "java.io.FileNotFoundException",
        "optionC": "java.lang.NumberFormatException",
        "optionD": "java.lang.Exception",
        "correctOption": "C",
        "explanation": "NumberFormatException extends IllegalArgumentException, which extends RuntimeException, making it an unchecked exception. IOException and FileNotFoundException are checked exceptions."
    },
    {
        "topic": "Exceptions",
        "difficulty": "easy",
        "questionText": "Which of the following scenarios represents the most appropriate use of throwing an exception in Java?",
        "codeSnippet": "",
        "optionA": "An unexpected or illegal parameter is passed into a method that violates its preconditions",
        "optionB": "An element is not found when searching an array",
        "optionC": "As standard flow control to exit a loop prematurely",
        "optionD": "To return a negative integer status code",
        "correctOption": "A",
        "explanation": "Exceptions are designed for exceptional, unexpected circumstances such as illegal method arguments (throwing IllegalArgumentException). Standard search misses should return null, -1, or Optional, not throw exceptions."
    },
    {
        "topic": "Exceptions",
        "difficulty": "hard",
        "questionText": "Given 'interface Roar { void roar() throws HasSoreThroatException; }' (where HasSoreThroatException is a checked exception), which overriding method in class Lion will FAIL to compile?",
        "codeSnippet": "",
        "optionA": "public void roar() {}",
        "optionB": "public void roar() throws HasSoreThroatException {}",
        "optionC": "public void roar() throws Exception {}",
        "optionD": "public void roar() throws RuntimeException {}",
        "correctOption": "C",
        "explanation": "When overriding a method, the subclass method cannot declare new or broader checked exceptions than those declared in the parent method. Since Exception is broader than HasSoreThroatException, Option C fails compilation. A subclass method may declare fewer exceptions, identical exceptions, or any unchecked exceptions."
    },
    {
        "topic": "Exceptions",
        "difficulty": "easy",
        "questionText": "Which statement correctly describes the requirement for handling or declaring exceptions?",
        "codeSnippet": "",
        "optionA": "Checked exceptions are required to be handled or declared; runtime exceptions and errors are optional",
        "optionB": "Runtime exceptions are required to be handled or declared",
        "optionC": "Errors must be caught in a try-catch block",
        "optionD": "No exceptions are required to be declared if using Java 8",
        "correctOption": "A",
        "explanation": "Java enforces the handle-or-declare rule strictly for checked exceptions. Runtime exceptions and Errors are unchecked and do not require handling or declaration."
    },
    {
        "topic": "Exceptions",
        "difficulty": "medium",
        "questionText": "Which exception type can be inserted in the first catch block so that both catch blocks compile?",
        "codeSnippet": """try {
  System.out.println("work real hard");
} catch ( _____ e) {
} catch (RuntimeException e) {
}""",
        "optionA": "Exception",
        "optionB": "IOException",
        "optionC": "IllegalArgumentException",
        "optionD": "NullPointerException",
        "correctOption": "C",
        "explanation": "IllegalArgumentException is a subclass of RuntimeException, so catching it BEFORE RuntimeException is valid. Catching Exception before RuntimeException causes an unreachable code error. Catching IOException fails because the try block throws no checked exceptions."
    },
    {
        "topic": "Exceptions",
        "difficulty": "hard",
        "questionText": "What does the following method output and throw?",
        "codeSnippet": """System.out.print("a");
try {
  System.out.print("b");
  throw new IllegalArgumentException();
} catch (IllegalArgumentException e) {
  System.out.print("c");
  throw new RuntimeException("1");
} catch (RuntimeException e) {
  System.out.print("d");
  throw new RuntimeException("2");
} finally {
  System.out.print("e");
  throw new RuntimeException("3");
}""",
        "optionA": "Outputs 'abce' and throws RuntimeException with message '3'",
        "optionB": "Outputs 'abce' and throws RuntimeException with message '1'",
        "optionC": "Outputs 'abcde' and throws RuntimeException with message '2'",
        "optionD": "The code does not compile",
        "correctOption": "A",
        "explanation": "1. Prints 'a', enters try, prints 'b', throws IllegalArgumentException. 2. First catch block runs, prints 'c', and throws RuntimeException(\"1\"). 3. The finally block ALWAYS executes before an exception is propagated. It prints 'e' and throws RuntimeException(\"3\"). 4. An exception thrown from a finally block suppresses and masks any exception thrown earlier in try/catch! Therefore, output is 'abce' and the exception thrown has message '3'."
    }
]
