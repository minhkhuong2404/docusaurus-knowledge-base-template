# OCA Java SE 8 - Chapter 3: Core Java APIs (33 Questions)

ch3_questions = [
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the result of attempting to compile and run the following code?",
        "codeSnippet": """public class Fish {
  public static void main(String[] args) {
    int numFish = 4;
    String fishType = "tuna";
    String anotherFish = numFish + 1;
    System.out.println(anotherFish + " " + fishType);
    System.out.println(numFish + " " + 1);
  }
}""",
        "optionA": "5 tuna followed by 4 1",
        "optionB": "41 tuna followed by 4 1",
        "optionC": "The code does not compile because of line 5",
        "optionD": "The code does not compile because of line 7",
        "correctOption": "C",
        "explanation": "Line 5 fails compilation: numFish + 1 evaluates to an int (4 + 1 = 5). Java does not automatically convert an int into a String unless one of the operands is already a String. Assigning an int to a String variable without String concatenation or String.valueOf() is a compile error."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "Which of the following lines will be printed by this code?",
        "codeSnippet": """String s = "Hello";
String t = new String(s);
if ("Hello".equals(s)) System.out.println("one");
if (t == s) System.out.println("two");
if (t.equals(s)) System.out.println("three");
if ("Hello" == s) System.out.println("four");
if ("Hello" == t) System.out.println("five");""",
        "optionA": "one, two, three",
        "optionB": "one, three, four",
        "optionC": "one, three, five",
        "optionD": "All five lines are printed",
        "correctOption": "B",
        "explanation": "'s' points to the string pool literal 'Hello'. 't' is explicitly constructed with 'new String(s)', creating a distinct object on the heap outside the pool. Therefore, '\"Hello\".equals(s)' is true ('one'), 't == s' is false, 't.equals(s)' is true ('three'), '\"Hello\" == s' is true because both refer to the pool literal ('four'), and '\"Hello\" == t' is false because t is a separate heap object."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "easy",
        "questionText": "Which of the following statements regarding immutability in Java is TRUE?",
        "codeSnippet": "",
        "optionA": "An immutable object's internal state can be changed via setter methods",
        "optionB": "An immutable object cannot be modified after creation and can be garbage collected when unreachable",
        "optionC": "StringBuilder and StringBuffer are immutable classes in Java",
        "optionD": "Immutable objects are permanently stored in memory and can never be garbage collected",
        "correctOption": "B",
        "explanation": "An immutable object cannot have its state modified once created. String is immutable; StringBuilder and StringBuffer are mutable. Immutable objects are stored on the heap and are subject to normal garbage collection when no longer reachable."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the result of the following StringBuilder operations?",
        "codeSnippet": """StringBuilder sb = new StringBuilder();
sb.append("aaa").insert(1, "bb").insert(4, "ccc");
System.out.println(sb);""",
        "optionA": "abbaaccc",
        "optionB": "abbaccca",
        "optionC": "bbaaaccc",
        "optionD": "bbaaccca",
        "correctOption": "B",
        "explanation": "sb.append('aaa') gives 'aaa'. insert(1, 'bb') inserts 'bb' at index 1: 'a' + 'bb' + 'aa' = 'abbaa'. Next, insert(4, 'ccc') inserts 'ccc' at index 4 (between the two 'a's at the end): 'abba' + 'ccc' + 'a' = 'abbaccca'."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the result of the following code snippet?",
        "codeSnippet": """String s1 = "java";
StringBuilder s2 = new StringBuilder("java");
if (s1 == s2)
  System.out.print("1");
if (s1.equals(s2))
  System.out.print("2");""",
        "optionA": "1",
        "optionB": "2",
        "optionC": "12",
        "optionD": "The code does not compile because == cannot compare String and StringBuilder",
        "correctOption": "D",
        "explanation": "In Java, the equality operator == requires that the two operand types have an inheritance relationship (or both be primitives, etc.). Since String and StringBuilder are in completely separate class hierarchies with neither inheriting from the other, 's1 == s2' is a compile-time error."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the result of the following program?",
        "codeSnippet": """public class Lion {
  public void roar(String roar1, StringBuilder roar2) {
    roar1.concat("!!!");
    roar2.append("!!!");
  }
  public static void main(String[] args) {
    String roar1 = "roar";
    StringBuilder roar2 = new StringBuilder("roar");
    new Lion().roar(roar1, roar2);
    System.out.println(roar1 + " " + roar2);
  }
}""",
        "optionA": "roar roar",
        "optionB": "roar roar!!!",
        "optionC": "roar!!! roar",
        "optionD": "roar!!! roar!!!",
        "correctOption": "B",
        "explanation": "String is immutable. Calling roar1.concat('!!!') produces a new String object whose reference is ignored and not assigned, leaving roar1 unchanged ('roar'). StringBuilder is mutable; roar2.append('!!!') mutates the existing buffer in place. Therefore, roar2 becomes 'roar!!!'."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "easy",
        "questionText": "What is the result of attempting to run the following code?",
        "codeSnippet": """String letters = "abcdef";
System.out.println(letters.length());
System.out.println(letters.charAt(3));
System.out.println(letters.charAt(6));""",
        "optionA": "Prints 6, d, and throws StringIndexOutOfBoundsException",
        "optionB": "Prints 6, c, and null",
        "optionC": "Prints 5, d, and throws ArrayIndexOutOfBoundsException",
        "optionD": "The code does not compile",
        "correctOption": "A",
        "explanation": "letters.length() is 6. Characters are zero-indexed: charAt(3) is 'd' (0:a, 1:b, 2:c, 3:d). Because valid indices are 0 through 5, charAt(6) is out of bounds and throws StringIndexOutOfBoundsException."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is printed by the following substring calls?",
        "codeSnippet": """String numbers = "012345678";
System.out.println(numbers.substring(1, 3));
System.out.println(numbers.substring(7, 7));
System.out.println(numbers.substring(7));""",
        "optionA": "12, followed by a blank line, followed by 78",
        "optionB": "123, followed by 7, followed by 78",
        "optionC": "12, followed by 7, followed by 8",
        "optionD": "Throws StringIndexOutOfBoundsException on numbers.substring(7, 7)",
        "correctOption": "A",
        "explanation": "substring(1, 3) takes index 1 up to index 3 (exclusive): characters at index 1 and 2 -> '12'. substring(7, 7) has start == end, returning an empty string \"\" (printed as a blank line). substring(7) returns characters from index 7 to the end -> '78'."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the result of the following code snippet?",
        "codeSnippet": """String s = "purr";
s.toUpperCase();
s.trim();
s.substring(1, 3);
s += " two";
System.out.println(s.length());""",
        "optionA": "2",
        "optionB": "4",
        "optionC": "8",
        "optionD": "10",
        "correctOption": "C",
        "explanation": "Because String is immutable and the return values of toUpperCase(), trim(), and substring(1, 3) are completely ignored, 's' remains 'purr' (length 4). Then s += ' two' concatenates ' two' to 'purr', producing 'purr two' which has 8 characters (including the space)."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the output of the following code snippet?",
        "codeSnippet": """String a = "";
a += 2;
a += 'c';
a += false;
if (a == "2cfalse") System.out.println("==");
if (a.equals("2cfalse")) System.out.println("equals");""",
        "optionA": "==",
        "optionB": "equals",
        "optionC": "== followed by equals",
        "optionD": "Compiler error on line 2",
        "correctOption": "B",
        "explanation": "The += operator on String converts the operands and concatenates them, so 'a' becomes the String \"2cfalse\". However, because 'a' was constructed at runtime via dynamic concatenation, it is a new heap object and not the interned string literal \"2cfalse\". Thus 'a == \"2cfalse\"' is false, while 'a.equals(\"2cfalse\")' is true."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "easy",
        "questionText": "What occurs when the following code is executed?",
        "codeSnippet": """StringBuilder letters = new StringBuilder("abcdefg");
letters.substring(6, 5);""",
        "optionA": "Returns empty string",
        "optionB": "Throws StringIndexOutOfBoundsException",
        "optionC": "Returns \"f\"",
        "optionD": "Compiler error",
        "correctOption": "B",
        "explanation": "In Java's String and StringBuilder substring(start, end) methods, if start > end, the method throws a StringIndexOutOfBoundsException."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the output of the following StringBuilder operations?",
        "codeSnippet": """StringBuilder numbers = new StringBuilder("0123456789");
numbers.delete(2, 8);
numbers.append("-").insert(2, "+");
System.out.println(numbers);""",
        "optionA": "01+89-",
        "optionB": "012+9-",
        "optionC": "012+-9",
        "optionD": "0123456789",
        "correctOption": "A",
        "explanation": "delete(2, 8) deletes characters from index 2 up to 8 (exclusive, indices 2 through 7: '234567'), leaving '0189'. append('-') appends '-' to the end: '0189-'. insert(2, '+') inserts '+' at index 2: '01' + '+' + '89-' = '01+89-'."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "easy",
        "questionText": "What is the result of attempting to compile and run the following code?",
        "codeSnippet": """StringBuilder b = "rumble";
b.append(4).deleteCharAt(3).delete(3, b.length() - 1);
System.out.println(b);""",
        "optionA": "rum4",
        "optionB": "rum",
        "optionC": "The code does not compile on line 1",
        "optionD": "Throws StringIndexOutOfBoundsException",
        "correctOption": "C",
        "explanation": "A String literal (\"rumble\") cannot be directly assigned to a StringBuilder variable. It must be instantiated with 'new StringBuilder(\"rumble\")'. Line 1 fails compilation."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "Which statement correctly modifies 'puzzle' to print 'avaJ'?",
        "codeSnippet": """StringBuilder puzzle = new StringBuilder("Java");
// INSERT CODE HERE
System.out.println(puzzle);""",
        "optionA": "puzzle.reverse();",
        "optionB": "puzzle.append(\"vaJ$\").substring(0, 4);",
        "optionC": "puzzle.reverse().toString();",
        "optionD": "Both A and C",
        "correctOption": "D",
        "explanation": "puzzle.reverse() reverses the characters of the StringBuilder in place, mutating 'Java' to 'avaJ'. In Option C, reverse() mutates puzzle and then toString() returns a String (the returned String is ignored, but puzzle remains reversed). Both A and C leave puzzle containing 'avaJ'."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "Which of the following array declarations is NOT legal in Java?",
        "codeSnippet": "",
        "optionA": "int[][] scores = new int[5][];",
        "optionB": "Object[][][] cubbies = new Object[3][0][5];",
        "optionC": "int[][] types = new int[];",
        "optionD": "java.util.Date[] dates[] = new java.util.Date[2][];",
        "correctOption": "C",
        "explanation": "When creating a multidimensional array with new, the size of at least the first dimension must be specified. 'new int[]' without a dimension size or initializer is illegal for declaring an array, and fails compilation."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "easy",
        "questionText": "How is the number of elements obtained for a standard Java array 'char[] c' versus an 'ArrayList l'?",
        "codeSnippet": "",
        "optionA": "c.length() and l.length",
        "optionB": "c.length and l.size()",
        "optionC": "c.size() and l.size()",
        "optionD": "c.capacity and l.length()",
        "correctOption": "B",
        "explanation": "In Java, an array has a public final field named 'length' (no parentheses). An ArrayList has a method named 'size()' (with parentheses)."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "easy",
        "questionText": "Which statement is true regarding the size of a Java array compared to an ArrayList?",
        "codeSnippet": "",
        "optionA": "Both arrays and ArrayLists can dynamically resize at runtime",
        "optionB": "An array has a fixed size determined upon creation, whereas an ArrayList can dynamically grow and shrink",
        "optionC": "An array is immutable, whereas an ArrayList is mutable",
        "optionD": "An ArrayList has a fixed size and cannot contain duplicate elements",
        "correctOption": "B",
        "explanation": "Arrays in Java have a fixed size once instantiated on the heap. In contrast, an ArrayList is backed by a dynamic array that automatically resizes as elements are added or removed."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "Which of the following statements about ArrayList equality is TRUE?",
        "codeSnippet": "",
        "optionA": "Two ArrayList instances are equal via equals() only if they refer to the exact same object reference",
        "optionB": "Two ArrayList instances are equal via equals() if they contain the same elements in the exact same order",
        "optionC": "Calling remove(0) on an empty ArrayList throws a compile-time error",
        "optionD": "Two arrays with identical elements in the same order return true when compared with equals()",
        "correctOption": "B",
        "explanation": "ArrayList overrides equals() to compare content: two lists are equal if they contain the same number of elements and corresponding elements are equal in the same order. By contrast, arrays do NOT override equals() (they use Object reference equality)."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "easy",
        "questionText": "What is the result of attempting to compile and run the following code?",
        "codeSnippet": """List<String> list = new ArrayList<String>();
list.add("one");
list.add("two");
list.add(7);
for(String s : list) System.out.print(s);""",
        "optionA": "onetwo7",
        "optionB": "onetwo",
        "optionC": "Compiler error on line 4 (list.add(7))",
        "optionD": "ClassCastException at runtime",
        "correctOption": "C",
        "explanation": "Because 'list' is parameterized with the generic type <String>, the compiler restricts the add method to accept only String objects. Passing an int literal (7) causes a compile error on line 4."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the output of the following ArrayList operations?",
        "codeSnippet": """ArrayList<Integer> values = new ArrayList<>();
values.add(4);
values.add(5);
values.set(1, 6);
values.remove(0);
for (Integer v : values) System.out.print(v);""",
        "optionA": "4",
        "optionB": "5",
        "optionC": "6",
        "optionD": "46",
        "correctOption": "C",
        "explanation": "values.add(4) -> [4]. values.add(5) -> [4, 5]. values.set(1, 6) replaces the element at index 1 with 6 -> [4, 6]. values.remove(0) removes element at index 0 (value 4) -> leaving [6]. Printing the list outputs 6."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the result of performing Arrays.binarySearch on an unsorted array?",
        "codeSnippet": """int[] random = { 6, -4, 12, 0, -10 };
int x = 12;
int y = Arrays.binarySearch(random, x);
System.out.println(y);""",
        "optionA": "2",
        "optionB": "4",
        "optionC": "The result is undefined and unpredictable",
        "optionD": "Throws IllegalArgumentException",
        "correctOption": "C",
        "explanation": "The contract of Arrays.binarySearch states that the array MUST be sorted prior to making the call. If the array is unsorted, the return value is undefined."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the output of the following code snippet?",
        "codeSnippet": """List<Integer> list = Arrays.asList(10, 4, -1, 5);
Collections.sort(list);
Integer array[] = list.toArray(new Integer[4]);
System.out.println(array[0]);""",
        "optionA": "-1",
        "optionB": "10",
        "optionC": "4",
        "optionD": "UnsupportedOperationException is thrown",
        "correctOption": "A",
        "explanation": "Arrays.asList produces a fixed-size list that allows element mutation (such as reordering). Collections.sort(list) sorts the list in ascending order: [-1, 4, 5, 10]. list.toArray populates the array, and array[0] is -1."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "easy",
        "questionText": "What is the result of attempting to compile the following code?",
        "codeSnippet": """String[] names = {"Tom", "Dick", "Harry"};
List<String> list = names.asList();
list.set(0, "Sue");
System.out.println(names[0]);""",
        "optionA": "Outputs Sue",
        "optionB": "Outputs Tom",
        "optionC": "Compiler error on line 2 because arrays do not have an asList() method",
        "optionD": "Throws UnsupportedOperationException",
        "correctOption": "C",
        "explanation": "An array in Java does not have an instance method named 'asList()'. To convert an array into a List, one must invoke the static utility method: 'Arrays.asList(names)'."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "hard",
        "questionText": "What does the following code output?",
        "codeSnippet": """List<String> hex = Arrays.asList("30", "8", "3A", "FF");
Collections.sort(hex);
int x = Collections.binarySearch(hex, "8");
int y = Collections.binarySearch(hex, "3A");
int z = Collections.binarySearch(hex, "4F");
System.out.println(x + " " + y + " " + z);""",
        "optionA": "0 1 -2",
        "optionB": "0 1 -3",
        "optionC": "2 1 -3",
        "optionD": "1 2 -3",
        "correctOption": "C",
        "explanation": "Natural String sorting is alphabetical (ASCII order): \"30\", \"3A\", \"8\", \"FF\". '8' is at index 2 (x=2). '3A' is at index 1 (y=1). '4F' is not found; it belongs between \"3A\" (index 1) and \"8\" (index 2), so its insertion point is index 2. Rule for element not found: -(insertion_index + 1) = -(2 + 1) = -3 (z=-3). Output: '2 1 -3'."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What happens when the following loop attempts to iterate over the List?",
        "codeSnippet": """List<Integer> ages = new ArrayList<>();
ages.add(Integer.parseInt("5"));
ages.add(Integer.valueOf("6"));
ages.add(7);
ages.add(null);
for (int age : ages) System.out.print(age);""",
        "optionA": "Prints 567null",
        "optionB": "Prints 567, then throws NullPointerException",
        "optionC": "Compiler error on line 5 (ages.add(null))",
        "optionD": "Compiler error in the for-each loop header",
        "correctOption": "B",
        "explanation": "Adding null to List<Integer> is completely legal. However, the enhanced for loop declares the loop variable as primitive 'int age'. When Java attempts to unbox the null Integer element into primitive int (by calling intValue() on null), a NullPointerException is thrown."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "easy",
        "questionText": "What is the result of comparing two independent ArrayList instances containing the same string?",
        "codeSnippet": """List<String> one = new ArrayList<String>();
one.add("abc");
List<String> two = new ArrayList<>();
two.add("abc");
if (one == two)
  System.out.println("A");
else if (one.equals(two))
  System.out.println("B");
else
  System.out.println("C");""",
        "optionA": "A",
        "optionB": "B",
        "optionC": "C",
        "optionD": "Throws ClassCastException",
        "correctOption": "B",
        "explanation": "'one' and 'two' are two separate objects allocated on the heap, so one == two evaluates to false. However, ArrayList overrides equals() to compare content. Since both lists have 1 element and \"abc\".equals(\"abc\"), one.equals(two) is true and prints 'B'."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "easy",
        "questionText": "Which line can be inserted to instantiate a LocalDate representing June 21, 2014?",
        "codeSnippet": """import java.time.*;
public class StartOfSummer {
  public static void main(String[] args) {
    LocalDate date = ____________________________
  }
}""",
        "optionA": "new LocalDate(2014, 6, 21);",
        "optionB": "LocalDate.of(2014, Month.JUNE, 21);",
        "optionC": "LocalDate.of(2014, 5, 21);",
        "optionD": "new LocalDate(2014, Month.JUNE, 21);",
        "correctOption": "B",
        "explanation": "LocalDate has private constructors and must be created via static factory methods such as LocalDate.of(year, month, day). Months in java.time are 1-indexed (June is 6, or Month.JUNE)."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the result of attempting to compile and run the following code?",
        "codeSnippet": """LocalDate date = LocalDate.parse("2018-04-30", DateTimeFormatter.ISO_LOCAL_DATE);
date.plusDays(2);
date.plusHours(3);
System.out.println(date.getYear() + " " + date.getMonth() + " " + date.getDayOfMonth());""",
        "optionA": "2018 APRIL 30",
        "optionB": "2018 MAY 2",
        "optionC": "The code does not compile because LocalDate has no plusHours() method",
        "optionD": "Throws DateTimeParseException",
        "correctOption": "C",
        "explanation": "LocalDate represents a date without time components. Methods such as plusHours(), plusMinutes(), and plusSeconds() do NOT exist in LocalDate and cause a compile error."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the result of attempting to create the following LocalDate?",
        "codeSnippet": """LocalDate date = LocalDate.of(2018, Month.APRIL, 40);
System.out.println(date);""",
        "optionA": "Outputs 2018-04-30",
        "optionB": "Outputs 2018-05-10",
        "optionC": "Throws java.time.DateTimeException at runtime",
        "optionD": "Compilation error",
        "correctOption": "C",
        "explanation": "The factory method LocalDate.of validates input date components. Because April only has 30 days, passing 40 as the day of the month throws a runtime java.time.DateTimeException."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "easy",
        "questionText": "What is the output of the following code?",
        "codeSnippet": """LocalDate date = LocalDate.of(2018, Month.APRIL, 30);
date.plusDays(2);
date.plusYears(3);
System.out.println(date.getYear() + " " + date.getMonth() + " " + date.getDayOfMonth());""",
        "optionA": "2018 APRIL 2",
        "optionB": "2018 APRIL 30",
        "optionC": "2021 MAY 2",
        "optionD": "2021 APRIL 30",
        "correctOption": "B",
        "explanation": "LocalDate instances are immutable! Methods like plusDays() and plusYears() return a new LocalDate instance and do not modify the original object. Because the return values were not reassigned, 'date' remains April 30, 2018."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "What is the output of the following code snippet?",
        "codeSnippet": """LocalDateTime d = LocalDateTime.of(2015, 5, 10, 11, 22, 33);
Period p = Period.of(1, 2, 3);
d = d.minus(p);
DateTimeFormatter f = DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT);
System.out.println(d.format(f));""",
        "optionA": "3/7/14 11:22 AM",
        "optionB": "5/10/15 11:22 AM",
        "optionC": "11:22 AM",
        "optionD": "UnsupportedTemporalTypeException is thrown",
        "correctOption": "C",
        "explanation": "Subtracting period (1 year, 2 months, 3 days) modifies the date component of 'd'. However, formatter 'f' is created with ofLocalizedTime, which formats only the time component. The time remains 11:22:33, so d.format(f) outputs '11:22 AM'."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "hard",
        "questionText": "What is the output of the following code with chained Period factory methods?",
        "codeSnippet": """LocalDateTime d = LocalDateTime.of(2015, 5, 10, 11, 22, 33);
Period p = Period.ofDays(1).ofYears(2);
d = d.minus(p);
DateTimeFormatter f = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.SHORT);
System.out.println(f.format(d));""",
        "optionA": "5/9/13 11:22 AM",
        "optionB": "5/10/13 11:22 AM",
        "optionC": "5/9/14 11:22 AM",
        "optionD": "Compilation error on Period chaining",
        "correctOption": "B",
        "explanation": "Period factory methods (ofDays, ofYears, ofMonths) are static methods! In Java, chaining static methods does NOT combine their values; instead, 'Period.ofDays(1).ofYears(2)' simply invokes the static method Period.ofYears(2), discarding the 1-day period entirely. Subtracting 2 years from 2015-05-10 yields 2013-05-10, printing '5/10/13 11:22 AM'."
    },
    {
        "topic": "Core Java APIs",
        "difficulty": "medium",
        "questionText": "Given the following string conversion methods, which one returns a primitive int?",
        "codeSnippet": "",
        "optionA": "Integer.valueOf(\"123\");",
        "optionB": "Integer.parseInt(\"123\");",
        "optionC": "Integer.getInteger(\"123\");",
        "optionD": "Integer.decode(\"123\");",
        "correctOption": "B",
        "explanation": "In Java's wrapper classes, methods named parseXxx() (like Integer.parseInt) return the corresponding primitive type, whereas valueOf() returns the wrapper object (Integer)."
    }
]
