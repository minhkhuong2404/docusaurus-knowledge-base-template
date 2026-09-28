# OCA Java SE 8 - Chapter 2: Operators and Statements (20 Questions)

ch2_questions = [
    {
        "topic": "Operators and Statements",
        "difficulty": "easy",
        "questionText": "Which of the following Java operators can be used with boolean variables?",
        "codeSnippet": "",
        "optionA": "== and !",
        "optionB": "+ and -",
        "optionC": "% and <=",
        "optionD": "++ and --",
        "correctOption": "A",
        "explanation": "The equality operators (==, !=) and the logical complement operator (!) can be used with boolean variables. Arithmetic operators (+, -, %, ++, --) and relational comparison operators (<=, >=, <, >) cannot be applied to boolean types in Java."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "medium",
        "questionText": "What data type will allow the following code snippet to compile without explicit casting?",
        "codeSnippet": """byte x = 5;
byte y = 10;
_____ z = x + y;""",
        "optionA": "byte",
        "optionB": "short",
        "optionC": "int",
        "optionD": "boolean",
        "correctOption": "C",
        "explanation": "According to Java's binary numeric promotion rules, smaller integral types (byte, short, char) are automatically promoted to int whenever a binary arithmetic operator (+, -, *, /, %) is applied. Thus, x + y produces an int, which can be assigned to int, long, float, or double, but not to byte or short without an explicit cast."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "medium",
        "questionText": "What is the result of attempting to compile and run the following application?",
        "codeSnippet": """public class CompareValues {
  public static void main(String[] args) {
    int x = 0;
    while(x++ < 10) {}
    String message = x > 10 ? "Greater than" : false;
    System.out.println(message + "," + x);
  }
}""",
        "optionA": "Greater than,10",
        "optionB": "Greater than,11",
        "optionC": "The code will not compile because of line 4",
        "optionD": "The code will not compile because of line 5",
        "correctOption": "D",
        "explanation": "Line 5 fails compilation. Although the two result expressions of a ternary operator (? :) do not strictly have to match in every context, when assigning to a variable (String message = ...), both branches must be assignable to the target type. 'false' is a boolean literal and cannot be assigned to a String variable."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "medium",
        "questionText": "What change allows the following code snippet to compile successfully?",
        "codeSnippet": """long x = 10;
int y = 2 * x;""",
        "optionA": "Change '2 * x' to '2 * (int)x'",
        "optionB": "Cast the result of '2 * x' using '(int)(2 * x)' or change y's type to long",
        "optionC": "Change the type of x to short without changing line 2",
        "optionD": "No change needed, Java automatically downcasts long to int",
        "correctOption": "B",
        "explanation": "Because x is a long, 2 * x promotes 2 to long and produces a long. Assigning a long to an int requires an explicit cast on the resulting expression: '(int)(2 * x)' or casting x '(int)x', or changing the type of y to long."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "easy",
        "questionText": "What is the output of the following code snippet?",
        "codeSnippet": """List<Integer> list = new ArrayList<>();
list.add(10);
list.add(14);
for(int x : list) {
  System.out.print(x + ", ");
  break;
}""",
        "optionA": "10, 14,",
        "optionB": "10, 14",
        "optionC": "10, ",
        "optionD": "The code contains an infinite loop",
        "correctOption": "C",
        "explanation": "The enhanced for-each loop retrieves the first element (10), prints '10, ', and immediately hits the 'break;' statement, terminating the loop after the first iteration. The output is '10, '."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "easy",
        "questionText": "What is the result of attempting to compile and run the following code?",
        "codeSnippet": """int x = 4;
long y = x * 4 - x++;
if(y < 10) System.out.println("Too Low");
else System.out.println("Just right");
else System.out.println("Too High");""",
        "optionA": "Too Low",
        "optionB": "Just right",
        "optionC": "Too High",
        "optionD": "Compilation error on the second else statement",
        "correctOption": "D",
        "explanation": "An if-then-else construct can have only one 'else' block per 'if'. Having two consecutive 'else' blocks without an intervening 'if' (as in 'else ... else ...') is a syntax error."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "medium",
        "questionText": "What is the output of the following nested ternary expression when x = 5?",
        "codeSnippet": """int x = 5;
System.out.println(x > 2 ? x < 4 ? 10 : 8 : 7);""",
        "optionA": "5",
        "optionB": "10",
        "optionC": "8",
        "optionD": "7",
        "correctOption": "C",
        "explanation": "With parentheses showing precedence: x > 2 ? (x < 4 ? 10 : 8) : 7. Since x = 5, x > 2 is true. We evaluate the inner ternary (x < 4 ? 10 : 8). Since 5 < 4 is false, the expression evaluates to 8."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "hard",
        "questionText": "What is the output of the following code snippet?",
        "codeSnippet": """boolean x = true, z = true;
int y = 20;
x = (y != 10) ^ (z = false);
System.out.println(x + ", " + y + ", " + z);""",
        "optionA": "true, 10, true",
        "optionB": "true, 20, false",
        "optionC": "false, 20, true",
        "optionD": "false, 20, false",
        "correctOption": "B",
        "explanation": "First, (y != 10) evaluates to true (20 != 10). Next, (z = false) is an assignment that sets z to false and evaluates to false. Now we have true ^ false. The XOR operator (^) returns true when the operands are different. So x becomes true. Variable y remains 20 and z is false. Output: 'true, 20, false'."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "medium",
        "questionText": "How many times will the following loop print 'Hello World'?",
        "codeSnippet": """for(int i=0; i<10 ; ) {
  i = i++;
  System.out.println("Hello World");
}""",
        "optionA": "9 times",
        "optionB": "10 times",
        "optionC": "11 times",
        "optionD": "The loop is infinite and does not terminate",
        "correctOption": "D",
        "explanation": "In 'i = i++', the post-increment operator evaluates: the current value of i (0) is temporarily saved, i is incremented to 1, and then the saved value 0 is assigned back into i! Therefore, i resets to 0 after every iteration and never reaches 10, resulting in an infinite loop."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "medium",
        "questionText": "What is the result of attempting to compile the following code?",
        "codeSnippet": """byte a = 40, b = 50;
byte sum = (byte) a + b;
System.out.println(sum);""",
        "optionA": "Outputs 90",
        "optionB": "Compilation error on line 2 because the cast (byte) applies only to 'a', and the resulting sum (a + b) promotes to int",
        "optionC": "Outputs 40",
        "optionD": "Runtime overflow exception",
        "correctOption": "B",
        "explanation": "Type cast operators have higher precedence than the addition (+) operator. Thus, '(byte) a + b' casts only 'a' to byte, and then adds 'b'. Due to numeric promotion, byte + byte promotes both to int, resulting in an int sum. Assigning that int sum to 'byte sum' fails compilation. The fix is 'byte sum = (byte)(a + b);'."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "easy",
        "questionText": "What is the output of the following code?",
        "codeSnippet": """int x = 5 * 4 % 3;
System.out.println(x);""",
        "optionA": "2",
        "optionB": "3",
        "optionC": "5",
        "optionD": "6",
        "correctOption": "A",
        "explanation": "* and % have equal operator precedence and evaluate left to right. 5 * 4 = 20. 20 % 3 = 2 (since 3 * 6 = 18 with a remainder of 2). Output is 2."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "easy",
        "questionText": "What is the result of attempting to compile the following code snippet?",
        "codeSnippet": """int x = 0;
String s = null;
if(x == s) System.out.println("Success");
else System.out.println("Failure");""",
        "optionA": "Outputs Success",
        "optionB": "Outputs Failure",
        "optionC": "The code fails to compile because int and String are incomparable types for ==",
        "optionD": "Throws NullPointerException at runtime",
        "correctOption": "C",
        "explanation": "In Java, the equality operator (==) cannot be used to compare a primitive numeric type (int) with an object reference type (String) when there is no inheritance relationship or unboxing possible. The compiler throws an incomparable types error."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "medium",
        "questionText": "What is the output of the following code snippet?",
        "codeSnippet": """int x1 = 50, x2 = 75;
boolean b = x1 >= x2;
if(b = true) System.out.println("Success");
else System.out.println("Failure");""",
        "optionA": "Success",
        "optionB": "Failure",
        "optionC": "Compiler error inside the if condition",
        "optionD": "None of the above",
        "correctOption": "A",
        "explanation": "Notice that 'if(b = true)' uses the assignment operator (=), NOT the comparison operator (==)! The assignment sets b to true and returns the assigned value (true). Therefore, the if condition evaluates to true and 'Success' is printed."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "easy",
        "questionText": "What is the output of the following code snippet?",
        "codeSnippet": """int c = 7;
int result = 4;
result += ++c;
System.out.println(result);""",
        "optionA": "11",
        "optionB": "12",
        "optionC": "15",
        "optionD": "16",
        "correctOption": "B",
        "explanation": "++c is a pre-increment: c is incremented from 7 to 8 first, and the value 8 is returned. Then result += 8 adds 8 to 4, making result = 12."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "easy",
        "questionText": "What is the result of attempting to compile the following code snippet?",
        "codeSnippet": """int x = 1, y = 15;
while x < 10
  y--;
x++;
System.out.println(x + ", " + y);""",
        "optionA": "10, 5",
        "optionB": "11, 5",
        "optionC": "The code does not compile because while condition must be enclosed in parentheses",
        "optionD": "The code contains an infinite loop",
        "correctOption": "C",
        "explanation": "In Java, the conditional boolean expression in a while loop must strictly be enclosed in parentheses: 'while (x < 10)'. Omitting parentheses is a syntax error."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "medium",
        "questionText": "What is the result of attempting to compile the following code snippet?",
        "codeSnippet": """do {
  int y = 1;
  System.out.print(y++ + " ");
} while(y <= 10);""",
        "optionA": "Prints 1 2 3 4 5 6 7 8 9 10",
        "optionB": "Infinite loop",
        "optionC": "The code does not compile because 'y' is declared inside the do block and is out of scope in the while condition",
        "optionD": "Throws a runtime exception",
        "correctOption": "C",
        "explanation": "The variable 'y' is declared inside the braces of the do-while body. Its scope ends at the closing curly brace '}'. Therefore, 'y' is out of scope and cannot be referenced in the while(y <= 10) condition."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "medium",
        "questionText": "What is the output of the following code snippet?",
        "codeSnippet": """boolean keepGoing = true;
int result = 15, i = 10;
do {
  i--;
  if(i == 8) keepGoing = false;
  result -= 2;
} while(keepGoing);
System.out.println(result);""",
        "optionA": "7",
        "optionB": "9",
        "optionC": "11",
        "optionD": "13",
        "correctOption": "C",
        "explanation": "Iteration 1: i decrements from 10 to 9. i==8 is false. result -= 2 -> result=13. keepGoing is true. Iteration 2: i decrements from 9 to 8. i==8 is true -> keepGoing becomes false. result -= 2 -> result=11. Loop checks while(keepGoing), which is false! Loop terminates. Final result is 11."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "hard",
        "questionText": "What is the output of the following code snippet with labeled loops?",
        "codeSnippet": """int count = 0;
ROW_LOOP: for(int row = 1; row <= 3; row++)
  for(int col = 1; col <= 2 ; col++) {
    if(row * col % 2 == 0) continue ROW_LOOP;
    count++;
  }
System.out.println(count);""",
        "optionA": "1",
        "optionB": "2",
        "optionC": "3",
        "optionD": "4",
        "correctOption": "B",
        "explanation": "row=1: col=1: 1*1%2 != 0 -> count becomes 1. col=2: 1*2%2 == 0 -> continue ROW_LOOP breaks to row=2. row=2: col=1: 2*1%2 == 0 -> continue ROW_LOOP immediately breaks to row=3. row=3: col=1: 3*1%2 != 0 -> count becomes 2. col=2: 3*2%2 == 0 -> continue ROW_LOOP. Total count is 2."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "medium",
        "questionText": "What is the result of the following code snippet?",
        "codeSnippet": """int m = 9, n = 1, x = 0;
while(m > n) {
  m--;
  n += 2;
  x += m + n;
}
System.out.println(x);""",
        "optionA": "11",
        "optionB": "23",
        "optionC": "36",
        "optionD": "50",
        "correctOption": "C",
        "explanation": "Start: m=9, n=1, x=0. Iteration 1: 9 > 1 -> m=8, n=3 -> x = 0 + (8+3) = 11. Iteration 2: 8 > 3 -> m=7, n=5 -> x = 11 + (7+5) = 23. Iteration 3: 7 > 5 -> m=6, n=7 -> x = 23 + (6+7) = 36. Check: 6 > 7 is false. Loop ends. Final x is 36."
    },
    {
        "topic": "Operators and Statements",
        "difficulty": "medium",
        "questionText": "What is the result of the following switch statement?",
        "codeSnippet": """final char a = 'A', d = 'D';
char grade = 'B';
switch(grade) {
  case a:
  case 'B': System.out.print("great");
  case 'C': System.out.print("good"); break;
  case d:
  case 'F': System.out.print("not good");
}""",
        "optionA": "great",
        "optionB": "greatgood",
        "optionC": "good",
        "optionD": "Compiler error because case labels use variables",
        "correctOption": "B",
        "explanation": "Variables 'a' and 'd' are declared 'final' and initialized with compile-time constant character literals, so they are legal case labels. When grade is 'B', execution matches 'case 'B':', printing 'great'. Because there is no break statement on case 'B', execution falls through into 'case 'C':' and prints 'good', where the 'break;' terminates the switch. Output is 'greatgood'."
    }
]
