export interface QuizQuestion {
  id: string;
  topic: string;
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export const systemDesignQuestions: QuizQuestion[] = [
  {
    "id": "sys-quiz-db-1",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 101; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 101; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-2",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 102; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 102; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-3",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Dirty Reads only.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 103; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 103; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-4",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 104; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 104; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-5",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 105; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 105; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-6",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 106; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 106; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-7",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "No anomalies (transaction is fully isolated from concurrent updates)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 107; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 107; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-8",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 108; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 108; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-9",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 109; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 109; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-10",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 110; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 110; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-11",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 111; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 111; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-12",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 112; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 112; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-13",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 113; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 113; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-14",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 114; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 114; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-15",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "No anomalies (transaction is fully isolated from concurrent updates)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 115; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 115; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-16",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 116; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 116; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-17",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 117; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 117; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-18",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 118; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 118; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-19",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 119; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 119; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-20",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 120; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 120; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-21",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 121; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 121; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-22",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 122; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 122; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-23",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Dirty Reads only.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 123; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 123; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-24",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 124; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 124; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-25",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 125; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 125; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-26",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 126; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 126; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-27",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 127; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 127; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-28",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 128; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 128; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-29",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 129; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 129; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-30",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 130; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 130; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-31",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "No anomalies (transaction is fully isolated from concurrent updates)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 131; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 131; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-32",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 132; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 132; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-33",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 133; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 133; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-34",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 134; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 134; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-35",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 135; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 135; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-36",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 136; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 136; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-37",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 137; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 137; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-38",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 138; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 138; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-39",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "No anomalies (transaction is fully isolated from concurrent updates)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 139; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 139; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-40",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 140; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 140; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-41",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 141; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 141; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-42",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 142; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 142; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-43",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 143; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 143; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-44",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 144; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 144; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-45",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 145; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 145; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-46",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 146; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 146; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-47",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "No anomalies (transaction is fully isolated from concurrent updates)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 147; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 147; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-48",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 148; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 148; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-49",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 149; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 149; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-50",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 150; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 150; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-51",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 151; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 151; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-52",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 152; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 152; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-53",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 153; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 153; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-54",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 154; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 154; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-55",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Dirty Reads only.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 155; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 155; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-56",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 156; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 156; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-57",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 157; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 157; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-58",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 158; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 158; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-59",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 159; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 159; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-60",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 160; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 160; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-61",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 161; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 161; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-62",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 162; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 162; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-63",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "No anomalies (transaction is fully isolated from concurrent updates)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 163; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 163; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-64",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 164; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 164; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-65",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 165; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 165; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-66",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 166; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 166; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-67",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 167; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 167; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-68",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 168; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 168; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-69",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 169; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 169; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-70",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 170; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 170; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-71",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Dirty Reads only.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 171; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 171; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-72",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 172; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 172; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-73",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 173; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 173; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-74",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 174; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 174; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-75",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 175; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 175; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-76",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 176; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 176; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-77",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 177; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 177; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-78",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 178; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 178; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-79",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 179; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 179; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-80",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 180; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 180; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-81",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 181; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 181; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-82",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 182; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 182; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-83",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Dirty Reads only.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 183; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 183; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-84",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 184; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 184; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-85",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 185; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 185; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-86",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 186; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 186; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-87",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 187; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 187; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-88",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 188; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 188; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-89",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 189; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 189; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-90",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 190; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 190; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-91",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 191; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 191; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-92",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 192; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 192; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-93",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 193; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 193; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-94",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 194; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 194; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-95",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 195; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 195; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-96",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 196; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 196; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-97",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 197; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 197; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-98",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 198; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 198; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-99",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "No anomalies (transaction is fully isolated from concurrent updates)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 199; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 199; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-100",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 200; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 200; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-101",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 201; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 201; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-102",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 202; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 202; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-103",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 203; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 203; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-104",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 204; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 204; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-105",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 205; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 205; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-106",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 206; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 206; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-107",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 207; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 207; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-108",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 208; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 208; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-109",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 209; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 209; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-110",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 210; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 210; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-111",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 211; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 211; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-112",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 212; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 212; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-113",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 213; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 213; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-114",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 214; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 214; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-115",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 215; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 215; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-116",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 216; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 216; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-117",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 217; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 217; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-118",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 218; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 218; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-119",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "No anomalies (transaction is fully isolated from concurrent updates)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 219; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 219; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-120",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 220; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 220; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-121",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 221; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 221; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-122",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in Oracle under isolation level REPEATABLE READ. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Potential anomalies include: Phantom Reads.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under the SQL standard, REPEATABLE READ isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM accounts WHERE id = 222; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 222; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-123",
    "topic": "Database SQL/NoSQL",
    "difficulty": "hard",
    "questionText": "A transaction T1 is executed in SQL Server under isolation level SERIALIZABLE. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "Dirty Reads only.",
      "No anomalies (transaction is fully isolated from concurrent updates).",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, SERIALIZABLE isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT balance FROM accounts WHERE id = 223; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 223; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-124",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in PostgreSQL under isolation level READ UNCOMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Potential anomalies include: Dirty Reads and Non-Repeatable Reads and Phantom Reads.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under the SQL standard, READ UNCOMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\nSELECT balance FROM accounts WHERE id = 224; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 224; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-db-125",
    "topic": "Database SQL/NoSQL",
    "difficulty": "medium",
    "questionText": "A transaction T1 is executed in MySQL under isolation level READ COMMITTED. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?",
    "options": [
      "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query.",
      "Potential anomalies include: Non-Repeatable Reads and Phantom Reads."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under the SQL standard, READ COMMITTED isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.",
    "codeSnippet": "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 225; -- T1 reads\n-- Meanwhile T2 updates balance to balance - 100 and commits\nSELECT balance FROM accounts WHERE id = 225; -- T1 reads again\nCOMMIT;"
  },
  {
    "id": "sys-quiz-ms-1",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_1 and OrderService_1 is currently in the CLOSED state. The failure rate threshold is set to 41%. What happens when the failure rate reaches 42% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (41%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 41\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-2",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_2 and OrderService_2 is currently in the CLOSED state. The failure rate threshold is set to 42%. What happens when the failure rate reaches 43% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (42%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 42\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-3",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_3 and OrderService_3 is currently in the CLOSED state. The failure rate threshold is set to 43%. What happens when the failure rate reaches 44% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (43%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 43\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-4",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_4 and OrderService_4 is currently in the CLOSED state. The failure rate threshold is set to 44%. What happens when the failure rate reaches 45% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (44%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 44\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-5",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_5 and OrderService_5 is currently in the CLOSED state. The failure rate threshold is set to 45%. What happens when the failure rate reaches 46% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (45%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 45\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-6",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_6 and OrderService_6 is currently in the CLOSED state. The failure rate threshold is set to 46%. What happens when the failure rate reaches 47% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (46%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 46\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-7",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_7 and OrderService_7 is currently in the CLOSED state. The failure rate threshold is set to 47%. What happens when the failure rate reaches 48% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (47%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 47\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-8",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_8 and OrderService_8 is currently in the CLOSED state. The failure rate threshold is set to 48%. What happens when the failure rate reaches 49% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (48%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 48\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-9",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_9 and OrderService_9 is currently in the CLOSED state. The failure rate threshold is set to 49%. What happens when the failure rate reaches 50% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (49%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 49\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-10",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_10 and OrderService_10 is currently in the CLOSED state. The failure rate threshold is set to 50%. What happens when the failure rate reaches 51% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (50%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 50\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-11",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_11 and OrderService_11 is currently in the CLOSED state. The failure rate threshold is set to 51%. What happens when the failure rate reaches 52% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (51%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 51\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-12",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_12 and OrderService_12 is currently in the CLOSED state. The failure rate threshold is set to 52%. What happens when the failure rate reaches 53% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (52%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 52\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-13",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_13 and OrderService_13 is currently in the CLOSED state. The failure rate threshold is set to 53%. What happens when the failure rate reaches 54% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (53%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 53\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-14",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_14 and OrderService_14 is currently in the CLOSED state. The failure rate threshold is set to 54%. What happens when the failure rate reaches 55% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (54%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 54\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-15",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_15 and OrderService_15 is currently in the CLOSED state. The failure rate threshold is set to 55%. What happens when the failure rate reaches 56% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (55%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 55\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-16",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_16 and OrderService_16 is currently in the CLOSED state. The failure rate threshold is set to 56%. What happens when the failure rate reaches 57% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (56%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 56\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-17",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_17 and OrderService_17 is currently in the CLOSED state. The failure rate threshold is set to 57%. What happens when the failure rate reaches 58% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (57%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 57\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-18",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_18 and OrderService_18 is currently in the CLOSED state. The failure rate threshold is set to 58%. What happens when the failure rate reaches 59% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (58%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 58\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-19",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_19 and OrderService_19 is currently in the CLOSED state. The failure rate threshold is set to 59%. What happens when the failure rate reaches 60% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (59%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 59\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-20",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_20 and OrderService_20 is currently in the CLOSED state. The failure rate threshold is set to 40%. What happens when the failure rate reaches 41% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (40%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 40\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-21",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_21 and OrderService_21 is currently in the CLOSED state. The failure rate threshold is set to 41%. What happens when the failure rate reaches 42% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (41%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 41\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-22",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_22 and OrderService_22 is currently in the CLOSED state. The failure rate threshold is set to 42%. What happens when the failure rate reaches 43% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (42%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 42\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-23",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_23 and OrderService_23 is currently in the CLOSED state. The failure rate threshold is set to 43%. What happens when the failure rate reaches 44% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (43%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 43\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-24",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_24 and OrderService_24 is currently in the CLOSED state. The failure rate threshold is set to 44%. What happens when the failure rate reaches 45% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (44%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 44\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-25",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_25 and OrderService_25 is currently in the CLOSED state. The failure rate threshold is set to 45%. What happens when the failure rate reaches 46% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (45%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 45\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-26",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_26 and OrderService_26 is currently in the CLOSED state. The failure rate threshold is set to 46%. What happens when the failure rate reaches 47% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (46%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 46\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-27",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_27 and OrderService_27 is currently in the CLOSED state. The failure rate threshold is set to 47%. What happens when the failure rate reaches 48% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (47%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 47\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-28",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_28 and OrderService_28 is currently in the CLOSED state. The failure rate threshold is set to 48%. What happens when the failure rate reaches 49% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (48%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 48\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-29",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_29 and OrderService_29 is currently in the CLOSED state. The failure rate threshold is set to 49%. What happens when the failure rate reaches 50% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (49%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 49\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-30",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_30 and OrderService_30 is currently in the CLOSED state. The failure rate threshold is set to 50%. What happens when the failure rate reaches 51% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (50%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 50\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-31",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_31 and OrderService_31 is currently in the CLOSED state. The failure rate threshold is set to 51%. What happens when the failure rate reaches 52% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (51%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 51\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-32",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_32 and OrderService_32 is currently in the CLOSED state. The failure rate threshold is set to 52%. What happens when the failure rate reaches 53% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (52%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 52\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-33",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_33 and OrderService_33 is currently in the CLOSED state. The failure rate threshold is set to 53%. What happens when the failure rate reaches 54% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (53%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 53\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-34",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_34 and OrderService_34 is currently in the CLOSED state. The failure rate threshold is set to 54%. What happens when the failure rate reaches 55% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (54%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 54\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-35",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_35 and OrderService_35 is currently in the CLOSED state. The failure rate threshold is set to 55%. What happens when the failure rate reaches 56% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (55%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 55\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-36",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_36 and OrderService_36 is currently in the CLOSED state. The failure rate threshold is set to 56%. What happens when the failure rate reaches 57% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (56%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 56\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-37",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_37 and OrderService_37 is currently in the CLOSED state. The failure rate threshold is set to 57%. What happens when the failure rate reaches 58% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (57%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 57\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-38",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_38 and OrderService_38 is currently in the CLOSED state. The failure rate threshold is set to 58%. What happens when the failure rate reaches 59% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (58%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 58\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-39",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_39 and OrderService_39 is currently in the CLOSED state. The failure rate threshold is set to 59%. What happens when the failure rate reaches 60% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (59%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 59\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-40",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_40 and OrderService_40 is currently in the CLOSED state. The failure rate threshold is set to 40%. What happens when the failure rate reaches 41% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (40%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 40\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-41",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_41 and OrderService_41 is currently in the CLOSED state. The failure rate threshold is set to 41%. What happens when the failure rate reaches 42% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (41%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 41\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-42",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_42 and OrderService_42 is currently in the CLOSED state. The failure rate threshold is set to 42%. What happens when the failure rate reaches 43% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (42%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 42\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-43",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_43 and OrderService_43 is currently in the CLOSED state. The failure rate threshold is set to 43%. What happens when the failure rate reaches 44% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (43%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 43\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-44",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_44 and OrderService_44 is currently in the CLOSED state. The failure rate threshold is set to 44%. What happens when the failure rate reaches 45% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (44%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 44\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-45",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_45 and OrderService_45 is currently in the CLOSED state. The failure rate threshold is set to 45%. What happens when the failure rate reaches 46% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (45%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 45\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-46",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_46 and OrderService_46 is currently in the CLOSED state. The failure rate threshold is set to 46%. What happens when the failure rate reaches 47% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (46%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 46\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-47",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_47 and OrderService_47 is currently in the CLOSED state. The failure rate threshold is set to 47%. What happens when the failure rate reaches 48% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (47%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 47\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-48",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_48 and OrderService_48 is currently in the CLOSED state. The failure rate threshold is set to 48%. What happens when the failure rate reaches 49% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (48%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 48\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-49",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_49 and OrderService_49 is currently in the CLOSED state. The failure rate threshold is set to 49%. What happens when the failure rate reaches 50% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (49%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 49\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-50",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_50 and OrderService_50 is currently in the CLOSED state. The failure rate threshold is set to 50%. What happens when the failure rate reaches 51% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (50%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 50\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-51",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_51 and OrderService_51 is currently in the CLOSED state. The failure rate threshold is set to 51%. What happens when the failure rate reaches 52% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (51%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 51\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-52",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_52 and OrderService_52 is currently in the CLOSED state. The failure rate threshold is set to 52%. What happens when the failure rate reaches 53% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (52%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 52\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-53",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_53 and OrderService_53 is currently in the CLOSED state. The failure rate threshold is set to 53%. What happens when the failure rate reaches 54% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (53%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 53\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-54",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_54 and OrderService_54 is currently in the CLOSED state. The failure rate threshold is set to 54%. What happens when the failure rate reaches 55% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (54%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 54\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-55",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_55 and OrderService_55 is currently in the CLOSED state. The failure rate threshold is set to 55%. What happens when the failure rate reaches 56% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (55%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 55\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-56",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_56 and OrderService_56 is currently in the CLOSED state. The failure rate threshold is set to 56%. What happens when the failure rate reaches 57% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (56%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 56\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-57",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_57 and OrderService_57 is currently in the CLOSED state. The failure rate threshold is set to 57%. What happens when the failure rate reaches 58% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (57%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 57\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-58",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_58 and OrderService_58 is currently in the CLOSED state. The failure rate threshold is set to 58%. What happens when the failure rate reaches 59% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (58%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 58\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-59",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_59 and OrderService_59 is currently in the CLOSED state. The failure rate threshold is set to 59%. What happens when the failure rate reaches 60% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (59%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 59\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-60",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_60 and OrderService_60 is currently in the CLOSED state. The failure rate threshold is set to 40%. What happens when the failure rate reaches 41% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (40%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 40\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-61",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_61 and OrderService_61 is currently in the CLOSED state. The failure rate threshold is set to 41%. What happens when the failure rate reaches 42% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (41%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 41\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-62",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_62 and OrderService_62 is currently in the CLOSED state. The failure rate threshold is set to 42%. What happens when the failure rate reaches 43% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (42%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 42\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-63",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_63 and OrderService_63 is currently in the CLOSED state. The failure rate threshold is set to 43%. What happens when the failure rate reaches 44% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (43%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 43\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-64",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_64 and OrderService_64 is currently in the CLOSED state. The failure rate threshold is set to 44%. What happens when the failure rate reaches 45% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (44%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 44\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-65",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_65 and OrderService_65 is currently in the CLOSED state. The failure rate threshold is set to 45%. What happens when the failure rate reaches 46% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (45%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 45\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-66",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_66 and OrderService_66 is currently in the CLOSED state. The failure rate threshold is set to 46%. What happens when the failure rate reaches 47% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (46%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 46\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-67",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_67 and OrderService_67 is currently in the CLOSED state. The failure rate threshold is set to 47%. What happens when the failure rate reaches 48% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (47%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 47\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-68",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_68 and OrderService_68 is currently in the CLOSED state. The failure rate threshold is set to 48%. What happens when the failure rate reaches 49% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (48%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 48\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-69",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_69 and OrderService_69 is currently in the CLOSED state. The failure rate threshold is set to 49%. What happens when the failure rate reaches 50% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (49%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 49\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-70",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_70 and OrderService_70 is currently in the CLOSED state. The failure rate threshold is set to 50%. What happens when the failure rate reaches 51% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (50%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 50\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-71",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_71 and OrderService_71 is currently in the CLOSED state. The failure rate threshold is set to 51%. What happens when the failure rate reaches 52% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (51%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 51\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-72",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_72 and OrderService_72 is currently in the CLOSED state. The failure rate threshold is set to 52%. What happens when the failure rate reaches 53% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (52%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 52\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-73",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_73 and OrderService_73 is currently in the CLOSED state. The failure rate threshold is set to 53%. What happens when the failure rate reaches 54% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (53%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 53\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-74",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_74 and OrderService_74 is currently in the CLOSED state. The failure rate threshold is set to 54%. What happens when the failure rate reaches 55% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (54%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 54\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-75",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_75 and OrderService_75 is currently in the CLOSED state. The failure rate threshold is set to 55%. What happens when the failure rate reaches 56% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (55%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 55\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-76",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_76 and OrderService_76 is currently in the CLOSED state. The failure rate threshold is set to 56%. What happens when the failure rate reaches 57% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (56%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 56\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-77",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_77 and OrderService_77 is currently in the CLOSED state. The failure rate threshold is set to 57%. What happens when the failure rate reaches 58% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (57%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 57\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-78",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_78 and OrderService_78 is currently in the CLOSED state. The failure rate threshold is set to 58%. What happens when the failure rate reaches 59% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (58%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 58\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-79",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_79 and OrderService_79 is currently in the CLOSED state. The failure rate threshold is set to 59%. What happens when the failure rate reaches 60% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (59%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 59\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-80",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_80 and OrderService_80 is currently in the CLOSED state. The failure rate threshold is set to 40%. What happens when the failure rate reaches 41% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (40%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 40\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-81",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_81 and OrderService_81 is currently in the CLOSED state. The failure rate threshold is set to 41%. What happens when the failure rate reaches 42% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (41%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 41\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-82",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_82 and OrderService_82 is currently in the CLOSED state. The failure rate threshold is set to 42%. What happens when the failure rate reaches 43% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (42%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 42\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-83",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_83 and OrderService_83 is currently in the CLOSED state. The failure rate threshold is set to 43%. What happens when the failure rate reaches 44% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (43%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 43\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-84",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_84 and OrderService_84 is currently in the CLOSED state. The failure rate threshold is set to 44%. What happens when the failure rate reaches 45% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (44%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 44\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-85",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_85 and OrderService_85 is currently in the CLOSED state. The failure rate threshold is set to 45%. What happens when the failure rate reaches 46% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (45%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 45\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-86",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_86 and OrderService_86 is currently in the CLOSED state. The failure rate threshold is set to 46%. What happens when the failure rate reaches 47% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (46%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 46\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-87",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_87 and OrderService_87 is currently in the CLOSED state. The failure rate threshold is set to 47%. What happens when the failure rate reaches 48% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (47%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 47\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-88",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_88 and OrderService_88 is currently in the CLOSED state. The failure rate threshold is set to 48%. What happens when the failure rate reaches 49% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (48%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 48\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-89",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_89 and OrderService_89 is currently in the CLOSED state. The failure rate threshold is set to 49%. What happens when the failure rate reaches 50% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (49%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 49\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-90",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_90 and OrderService_90 is currently in the CLOSED state. The failure rate threshold is set to 50%. What happens when the failure rate reaches 51% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (50%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 50\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-91",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_91 and OrderService_91 is currently in the CLOSED state. The failure rate threshold is set to 51%. What happens when the failure rate reaches 52% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (51%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 51\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-92",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_92 and OrderService_92 is currently in the CLOSED state. The failure rate threshold is set to 52%. What happens when the failure rate reaches 53% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (52%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 52\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-93",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_93 and OrderService_93 is currently in the CLOSED state. The failure rate threshold is set to 53%. What happens when the failure rate reaches 54% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (53%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 53\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-94",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_94 and OrderService_94 is currently in the CLOSED state. The failure rate threshold is set to 54%. What happens when the failure rate reaches 55% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (54%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 54\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-95",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_95 and OrderService_95 is currently in the CLOSED state. The failure rate threshold is set to 55%. What happens when the failure rate reaches 56% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (55%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 55\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-96",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_96 and OrderService_96 is currently in the CLOSED state. The failure rate threshold is set to 56%. What happens when the failure rate reaches 57% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (56%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 56\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-97",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_97 and OrderService_97 is currently in the CLOSED state. The failure rate threshold is set to 57%. What happens when the failure rate reaches 58% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (57%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 57\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-98",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_98 and OrderService_98 is currently in the CLOSED state. The failure rate threshold is set to 58%. What happens when the failure rate reaches 59% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (58%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 58\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-99",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_99 and OrderService_99 is currently in the CLOSED state. The failure rate threshold is set to 59%. What happens when the failure rate reaches 60% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (59%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 59\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-100",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_100 and OrderService_100 is currently in the CLOSED state. The failure rate threshold is set to 40%. What happens when the failure rate reaches 41% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (40%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 40\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-101",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_101 and OrderService_101 is currently in the CLOSED state. The failure rate threshold is set to 41%. What happens when the failure rate reaches 42% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (41%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 41\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-102",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_102 and OrderService_102 is currently in the CLOSED state. The failure rate threshold is set to 42%. What happens when the failure rate reaches 43% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (42%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 42\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-103",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_103 and OrderService_103 is currently in the CLOSED state. The failure rate threshold is set to 43%. What happens when the failure rate reaches 44% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (43%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 43\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-104",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_104 and OrderService_104 is currently in the CLOSED state. The failure rate threshold is set to 44%. What happens when the failure rate reaches 45% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (44%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 44\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-105",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_105 and OrderService_105 is currently in the CLOSED state. The failure rate threshold is set to 45%. What happens when the failure rate reaches 46% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (45%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 45\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-106",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_106 and OrderService_106 is currently in the CLOSED state. The failure rate threshold is set to 46%. What happens when the failure rate reaches 47% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (46%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 46\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-107",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_107 and OrderService_107 is currently in the CLOSED state. The failure rate threshold is set to 47%. What happens when the failure rate reaches 48% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (47%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 47\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-108",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_108 and OrderService_108 is currently in the CLOSED state. The failure rate threshold is set to 48%. What happens when the failure rate reaches 49% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (48%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 48\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-109",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_109 and OrderService_109 is currently in the CLOSED state. The failure rate threshold is set to 49%. What happens when the failure rate reaches 50% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (49%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 49\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-110",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_110 and OrderService_110 is currently in the CLOSED state. The failure rate threshold is set to 50%. What happens when the failure rate reaches 51% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (50%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 50\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-111",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_111 and OrderService_111 is currently in the CLOSED state. The failure rate threshold is set to 51%. What happens when the failure rate reaches 52% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (51%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 51\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-112",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_112 and OrderService_112 is currently in the CLOSED state. The failure rate threshold is set to 52%. What happens when the failure rate reaches 53% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (52%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 52\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-113",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_113 and OrderService_113 is currently in the CLOSED state. The failure rate threshold is set to 53%. What happens when the failure rate reaches 54% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (53%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 53\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-114",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_114 and OrderService_114 is currently in the CLOSED state. The failure rate threshold is set to 54%. What happens when the failure rate reaches 55% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (54%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 54\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-115",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_115 and OrderService_115 is currently in the CLOSED state. The failure rate threshold is set to 55%. What happens when the failure rate reaches 56% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (55%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 55\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-116",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_116 and OrderService_116 is currently in the CLOSED state. The failure rate threshold is set to 56%. What happens when the failure rate reaches 57% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (56%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 56\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-117",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_117 and OrderService_117 is currently in the CLOSED state. The failure rate threshold is set to 57%. What happens when the failure rate reaches 58% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (57%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 57\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-118",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_118 and OrderService_118 is currently in the CLOSED state. The failure rate threshold is set to 58%. What happens when the failure rate reaches 59% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException."
    ],
    "correctOptionIndex": 3,
    "explanation": "When the failure rate matches or exceeds the configured threshold (58%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 58\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-119",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_119 and OrderService_119 is currently in the CLOSED state. The failure rate threshold is set to 59%. What happens when the failure rate reaches 60% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (59%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 59\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-120",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_120 and OrderService_120 is currently in the CLOSED state. The failure rate threshold is set to 40%. What happens when the failure rate reaches 41% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (40%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 40\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-121",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_121 and OrderService_121 is currently in the CLOSED state. The failure rate threshold is set to 41%. What happens when the failure rate reaches 42% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "When the failure rate matches or exceeds the configured threshold (41%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 41\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-122",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_122 and OrderService_122 is currently in the CLOSED state. The failure rate threshold is set to 42%. What happens when the failure rate reaches 43% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (42%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 42\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-ms-123",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_123 and OrderService_123 is currently in the CLOSED state. The failure rate threshold is set to 43%. What happens when the failure rate reaches 44% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 2 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (43%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 43\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 2"
  },
  {
    "id": "sys-quiz-ms-124",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_124 and OrderService_124 is currently in the CLOSED state. The failure rate threshold is set to 44%. What happens when the failure rate reaches 45% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the HALF_OPEN state, allowing 3 probe calls.",
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "When the failure rate matches or exceeds the configured threshold (44%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 44\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 3"
  },
  {
    "id": "sys-quiz-ms-125",
    "topic": "Microservices",
    "difficulty": "hard",
    "questionText": "A circuit breaker configured between InventoryService_125 and OrderService_125 is currently in the CLOSED state. The failure rate threshold is set to 45%. What happens when the failure rate reaches 46% during a sliding window execution?",
    "options": [
      "The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.",
      "The circuit breaker transitions to the HALF_OPEN state, allowing 4 probe calls.",
      "The circuit breaker remains CLOSED but starts a background timer to measure network latency.",
      "The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "When the failure rate matches or exceeds the configured threshold (45%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.",
    "codeSnippet": "// Resilience4j Config:\nslidingWindowSize = 100\nfailureRateThreshold = 45\nslowCallRateThreshold = 60\npermittedNumberOfCallsInHalfOpenState = 4"
  },
  {
    "id": "sys-quiz-api-1",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/101' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 12 tokens and refills at a rate of 3 tokens/sec. If a client sends 14 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 14 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 12 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (12 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/101 \\\n  -H \"X-Idempotency-Key: id_key_1\""
  },
  {
    "id": "sys-quiz-api-2",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/102' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 14 tokens and refills at a rate of 4 tokens/sec. If a client sends 16 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 16 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 14 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (14 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/102 \\\n  -H \"X-Idempotency-Key: id_key_2\""
  },
  {
    "id": "sys-quiz-api-3",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/103' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 16 tokens and refills at a rate of 2 tokens/sec. If a client sends 18 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 18 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 16 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (16 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/103 \\\n  -H \"X-Idempotency-Key: id_key_3\""
  },
  {
    "id": "sys-quiz-api-4",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/104' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 18 tokens and refills at a rate of 3 tokens/sec. If a client sends 20 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 20 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 18 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (18 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/104 \\\n  -H \"X-Idempotency-Key: id_key_4\""
  },
  {
    "id": "sys-quiz-api-5",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/105' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 20 tokens and refills at a rate of 4 tokens/sec. If a client sends 22 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 22 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 20 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (20 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/105 \\\n  -H \"X-Idempotency-Key: id_key_5\""
  },
  {
    "id": "sys-quiz-api-6",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/106' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 22 tokens and refills at a rate of 2 tokens/sec. If a client sends 24 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 22 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 24 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (22 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/106 \\\n  -H \"X-Idempotency-Key: id_key_6\""
  },
  {
    "id": "sys-quiz-api-7",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/107' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 24 tokens and refills at a rate of 3 tokens/sec. If a client sends 26 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 26 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 24 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (24 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/107 \\\n  -H \"X-Idempotency-Key: id_key_7\""
  },
  {
    "id": "sys-quiz-api-8",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/108' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 26 tokens and refills at a rate of 4 tokens/sec. If a client sends 28 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 26 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 28 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (26 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/108 \\\n  -H \"X-Idempotency-Key: id_key_8\""
  },
  {
    "id": "sys-quiz-api-9",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/109' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 28 tokens and refills at a rate of 2 tokens/sec. If a client sends 30 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 28 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 30 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (28 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/109 \\\n  -H \"X-Idempotency-Key: id_key_9\""
  },
  {
    "id": "sys-quiz-api-10",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/110' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 30 tokens and refills at a rate of 3 tokens/sec. If a client sends 32 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 30 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 32 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (30 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/110 \\\n  -H \"X-Idempotency-Key: id_key_10\""
  },
  {
    "id": "sys-quiz-api-11",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/111' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 32 tokens and refills at a rate of 4 tokens/sec. If a client sends 34 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 34 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 32 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (32 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/111 \\\n  -H \"X-Idempotency-Key: id_key_11\""
  },
  {
    "id": "sys-quiz-api-12",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/112' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 34 tokens and refills at a rate of 2 tokens/sec. If a client sends 36 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 36 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 34 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (34 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/112 \\\n  -H \"X-Idempotency-Key: id_key_12\""
  },
  {
    "id": "sys-quiz-api-13",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/113' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 36 tokens and refills at a rate of 3 tokens/sec. If a client sends 38 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 38 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 36 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (36 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/113 \\\n  -H \"X-Idempotency-Key: id_key_13\""
  },
  {
    "id": "sys-quiz-api-14",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/114' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 38 tokens and refills at a rate of 4 tokens/sec. If a client sends 40 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 38 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 40 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (38 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/114 \\\n  -H \"X-Idempotency-Key: id_key_14\""
  },
  {
    "id": "sys-quiz-api-15",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/115' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 40 tokens and refills at a rate of 2 tokens/sec. If a client sends 42 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 42 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 40 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (40 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/115 \\\n  -H \"X-Idempotency-Key: id_key_15\""
  },
  {
    "id": "sys-quiz-api-16",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/116' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 42 tokens and refills at a rate of 3 tokens/sec. If a client sends 44 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 44 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 42 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (42 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/116 \\\n  -H \"X-Idempotency-Key: id_key_16\""
  },
  {
    "id": "sys-quiz-api-17",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/117' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 44 tokens and refills at a rate of 4 tokens/sec. If a client sends 46 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 46 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 44 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (44 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/117 \\\n  -H \"X-Idempotency-Key: id_key_17\""
  },
  {
    "id": "sys-quiz-api-18",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/118' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 46 tokens and refills at a rate of 2 tokens/sec. If a client sends 48 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 48 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 46 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (46 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/118 \\\n  -H \"X-Idempotency-Key: id_key_18\""
  },
  {
    "id": "sys-quiz-api-19",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/119' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 48 tokens and refills at a rate of 3 tokens/sec. If a client sends 50 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 50 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 48 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (48 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/119 \\\n  -H \"X-Idempotency-Key: id_key_19\""
  },
  {
    "id": "sys-quiz-api-20",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/120' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 50 tokens and refills at a rate of 4 tokens/sec. If a client sends 52 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 52 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 50 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (50 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/120 \\\n  -H \"X-Idempotency-Key: id_key_20\""
  },
  {
    "id": "sys-quiz-api-21",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/121' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 52 tokens and refills at a rate of 2 tokens/sec. If a client sends 54 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 52 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 54 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (52 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/121 \\\n  -H \"X-Idempotency-Key: id_key_21\""
  },
  {
    "id": "sys-quiz-api-22",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/122' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 54 tokens and refills at a rate of 3 tokens/sec. If a client sends 56 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 56 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 54 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (54 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/122 \\\n  -H \"X-Idempotency-Key: id_key_22\""
  },
  {
    "id": "sys-quiz-api-23",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/123' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 56 tokens and refills at a rate of 4 tokens/sec. If a client sends 58 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 56 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 58 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (56 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/123 \\\n  -H \"X-Idempotency-Key: id_key_23\""
  },
  {
    "id": "sys-quiz-api-24",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/124' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 58 tokens and refills at a rate of 2 tokens/sec. If a client sends 60 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 60 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 58 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (58 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/124 \\\n  -H \"X-Idempotency-Key: id_key_24\""
  },
  {
    "id": "sys-quiz-api-25",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/125' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 60 tokens and refills at a rate of 3 tokens/sec. If a client sends 62 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 62 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 60 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (60 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/125 \\\n  -H \"X-Idempotency-Key: id_key_25\""
  },
  {
    "id": "sys-quiz-api-26",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/126' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 62 tokens and refills at a rate of 4 tokens/sec. If a client sends 64 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 62 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 64 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (62 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/126 \\\n  -H \"X-Idempotency-Key: id_key_26\""
  },
  {
    "id": "sys-quiz-api-27",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/127' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 64 tokens and refills at a rate of 2 tokens/sec. If a client sends 66 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 66 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 64 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (64 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/127 \\\n  -H \"X-Idempotency-Key: id_key_27\""
  },
  {
    "id": "sys-quiz-api-28",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/128' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 66 tokens and refills at a rate of 3 tokens/sec. If a client sends 68 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 68 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 66 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (66 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/128 \\\n  -H \"X-Idempotency-Key: id_key_28\""
  },
  {
    "id": "sys-quiz-api-29",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/129' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 68 tokens and refills at a rate of 4 tokens/sec. If a client sends 70 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 70 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 68 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (68 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/129 \\\n  -H \"X-Idempotency-Key: id_key_29\""
  },
  {
    "id": "sys-quiz-api-30",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/130' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 70 tokens and refills at a rate of 2 tokens/sec. If a client sends 72 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 72 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 70 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (70 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/130 \\\n  -H \"X-Idempotency-Key: id_key_30\""
  },
  {
    "id": "sys-quiz-api-31",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/131' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 72 tokens and refills at a rate of 3 tokens/sec. If a client sends 74 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 72 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 74 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (72 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/131 \\\n  -H \"X-Idempotency-Key: id_key_31\""
  },
  {
    "id": "sys-quiz-api-32",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/132' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 74 tokens and refills at a rate of 4 tokens/sec. If a client sends 76 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 76 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 74 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (74 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/132 \\\n  -H \"X-Idempotency-Key: id_key_32\""
  },
  {
    "id": "sys-quiz-api-33",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/133' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 76 tokens and refills at a rate of 2 tokens/sec. If a client sends 78 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 76 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 78 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (76 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/133 \\\n  -H \"X-Idempotency-Key: id_key_33\""
  },
  {
    "id": "sys-quiz-api-34",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/134' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 78 tokens and refills at a rate of 3 tokens/sec. If a client sends 80 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 80 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 78 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (78 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/134 \\\n  -H \"X-Idempotency-Key: id_key_34\""
  },
  {
    "id": "sys-quiz-api-35",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/135' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 80 tokens and refills at a rate of 4 tokens/sec. If a client sends 82 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 80 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 82 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (80 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/135 \\\n  -H \"X-Idempotency-Key: id_key_35\""
  },
  {
    "id": "sys-quiz-api-36",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/136' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 82 tokens and refills at a rate of 2 tokens/sec. If a client sends 84 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 82 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 84 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (82 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/136 \\\n  -H \"X-Idempotency-Key: id_key_36\""
  },
  {
    "id": "sys-quiz-api-37",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/137' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 84 tokens and refills at a rate of 3 tokens/sec. If a client sends 86 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 86 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 84 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (84 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/137 \\\n  -H \"X-Idempotency-Key: id_key_37\""
  },
  {
    "id": "sys-quiz-api-38",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/138' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 86 tokens and refills at a rate of 4 tokens/sec. If a client sends 88 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 86 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 88 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (86 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/138 \\\n  -H \"X-Idempotency-Key: id_key_38\""
  },
  {
    "id": "sys-quiz-api-39",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/139' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 88 tokens and refills at a rate of 2 tokens/sec. If a client sends 90 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 88 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 90 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (88 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/139 \\\n  -H \"X-Idempotency-Key: id_key_39\""
  },
  {
    "id": "sys-quiz-api-40",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/140' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 90 tokens and refills at a rate of 3 tokens/sec. If a client sends 92 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 92 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 90 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (90 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/140 \\\n  -H \"X-Idempotency-Key: id_key_40\""
  },
  {
    "id": "sys-quiz-api-41",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/141' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 92 tokens and refills at a rate of 4 tokens/sec. If a client sends 94 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 94 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 92 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (92 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/141 \\\n  -H \"X-Idempotency-Key: id_key_41\""
  },
  {
    "id": "sys-quiz-api-42",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/142' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 94 tokens and refills at a rate of 2 tokens/sec. If a client sends 96 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 96 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 94 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (94 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/142 \\\n  -H \"X-Idempotency-Key: id_key_42\""
  },
  {
    "id": "sys-quiz-api-43",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/143' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 96 tokens and refills at a rate of 3 tokens/sec. If a client sends 98 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 98 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 96 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (96 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/143 \\\n  -H \"X-Idempotency-Key: id_key_43\""
  },
  {
    "id": "sys-quiz-api-44",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/144' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 98 tokens and refills at a rate of 4 tokens/sec. If a client sends 100 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 100 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 98 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (98 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/144 \\\n  -H \"X-Idempotency-Key: id_key_44\""
  },
  {
    "id": "sys-quiz-api-45",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/145' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 100 tokens and refills at a rate of 2 tokens/sec. If a client sends 102 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 100 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 102 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (100 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/145 \\\n  -H \"X-Idempotency-Key: id_key_45\""
  },
  {
    "id": "sys-quiz-api-46",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/146' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 102 tokens and refills at a rate of 3 tokens/sec. If a client sends 104 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 104 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 102 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (102 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/146 \\\n  -H \"X-Idempotency-Key: id_key_46\""
  },
  {
    "id": "sys-quiz-api-47",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/147' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 104 tokens and refills at a rate of 4 tokens/sec. If a client sends 106 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 104 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 106 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (104 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/147 \\\n  -H \"X-Idempotency-Key: id_key_47\""
  },
  {
    "id": "sys-quiz-api-48",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/148' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 106 tokens and refills at a rate of 2 tokens/sec. If a client sends 108 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 108 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 106 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (106 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/148 \\\n  -H \"X-Idempotency-Key: id_key_48\""
  },
  {
    "id": "sys-quiz-api-49",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/149' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 108 tokens and refills at a rate of 3 tokens/sec. If a client sends 110 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 110 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 108 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (108 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/149 \\\n  -H \"X-Idempotency-Key: id_key_49\""
  },
  {
    "id": "sys-quiz-api-50",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/150' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 110 tokens and refills at a rate of 4 tokens/sec. If a client sends 112 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 110 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 112 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (110 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/150 \\\n  -H \"X-Idempotency-Key: id_key_50\""
  },
  {
    "id": "sys-quiz-api-51",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/151' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 112 tokens and refills at a rate of 2 tokens/sec. If a client sends 114 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 114 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 112 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (112 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/151 \\\n  -H \"X-Idempotency-Key: id_key_51\""
  },
  {
    "id": "sys-quiz-api-52",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/152' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 114 tokens and refills at a rate of 3 tokens/sec. If a client sends 116 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 114 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 116 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (114 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/152 \\\n  -H \"X-Idempotency-Key: id_key_52\""
  },
  {
    "id": "sys-quiz-api-53",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/153' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 116 tokens and refills at a rate of 4 tokens/sec. If a client sends 118 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 118 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 116 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (116 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/153 \\\n  -H \"X-Idempotency-Key: id_key_53\""
  },
  {
    "id": "sys-quiz-api-54",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/154' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 118 tokens and refills at a rate of 2 tokens/sec. If a client sends 120 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 118 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 120 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (118 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/154 \\\n  -H \"X-Idempotency-Key: id_key_54\""
  },
  {
    "id": "sys-quiz-api-55",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/155' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 120 tokens and refills at a rate of 3 tokens/sec. If a client sends 122 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 122 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 120 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (120 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/155 \\\n  -H \"X-Idempotency-Key: id_key_55\""
  },
  {
    "id": "sys-quiz-api-56",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/156' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 122 tokens and refills at a rate of 4 tokens/sec. If a client sends 124 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 124 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 122 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (122 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/156 \\\n  -H \"X-Idempotency-Key: id_key_56\""
  },
  {
    "id": "sys-quiz-api-57",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/157' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 124 tokens and refills at a rate of 2 tokens/sec. If a client sends 126 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 126 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 124 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (124 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/157 \\\n  -H \"X-Idempotency-Key: id_key_57\""
  },
  {
    "id": "sys-quiz-api-58",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/158' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 126 tokens and refills at a rate of 3 tokens/sec. If a client sends 128 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 128 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 126 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (126 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/158 \\\n  -H \"X-Idempotency-Key: id_key_58\""
  },
  {
    "id": "sys-quiz-api-59",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/159' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 128 tokens and refills at a rate of 4 tokens/sec. If a client sends 130 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 130 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 128 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (128 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/159 \\\n  -H \"X-Idempotency-Key: id_key_59\""
  },
  {
    "id": "sys-quiz-api-60",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/160' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 130 tokens and refills at a rate of 2 tokens/sec. If a client sends 132 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 132 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 130 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (130 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/160 \\\n  -H \"X-Idempotency-Key: id_key_60\""
  },
  {
    "id": "sys-quiz-api-61",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/161' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 132 tokens and refills at a rate of 3 tokens/sec. If a client sends 134 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 134 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 132 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (132 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/161 \\\n  -H \"X-Idempotency-Key: id_key_61\""
  },
  {
    "id": "sys-quiz-api-62",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/162' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 134 tokens and refills at a rate of 4 tokens/sec. If a client sends 136 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 134 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 136 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (134 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/162 \\\n  -H \"X-Idempotency-Key: id_key_62\""
  },
  {
    "id": "sys-quiz-api-63",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/163' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 136 tokens and refills at a rate of 2 tokens/sec. If a client sends 138 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 136 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 138 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (136 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/163 \\\n  -H \"X-Idempotency-Key: id_key_63\""
  },
  {
    "id": "sys-quiz-api-64",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/164' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 138 tokens and refills at a rate of 3 tokens/sec. If a client sends 140 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 140 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 138 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (138 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/164 \\\n  -H \"X-Idempotency-Key: id_key_64\""
  },
  {
    "id": "sys-quiz-api-65",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/165' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 140 tokens and refills at a rate of 4 tokens/sec. If a client sends 142 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 142 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 140 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (140 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/165 \\\n  -H \"X-Idempotency-Key: id_key_65\""
  },
  {
    "id": "sys-quiz-api-66",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/166' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 142 tokens and refills at a rate of 2 tokens/sec. If a client sends 144 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 142 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 144 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (142 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/166 \\\n  -H \"X-Idempotency-Key: id_key_66\""
  },
  {
    "id": "sys-quiz-api-67",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/167' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 144 tokens and refills at a rate of 3 tokens/sec. If a client sends 146 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 146 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 144 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (144 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/167 \\\n  -H \"X-Idempotency-Key: id_key_67\""
  },
  {
    "id": "sys-quiz-api-68",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/168' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 146 tokens and refills at a rate of 4 tokens/sec. If a client sends 148 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 148 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 146 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (146 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/168 \\\n  -H \"X-Idempotency-Key: id_key_68\""
  },
  {
    "id": "sys-quiz-api-69",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/169' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 148 tokens and refills at a rate of 2 tokens/sec. If a client sends 150 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 150 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 148 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (148 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/169 \\\n  -H \"X-Idempotency-Key: id_key_69\""
  },
  {
    "id": "sys-quiz-api-70",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/170' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 150 tokens and refills at a rate of 3 tokens/sec. If a client sends 152 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 152 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 150 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (150 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/170 \\\n  -H \"X-Idempotency-Key: id_key_70\""
  },
  {
    "id": "sys-quiz-api-71",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/171' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 152 tokens and refills at a rate of 4 tokens/sec. If a client sends 154 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 152 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 154 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (152 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/171 \\\n  -H \"X-Idempotency-Key: id_key_71\""
  },
  {
    "id": "sys-quiz-api-72",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/172' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 154 tokens and refills at a rate of 2 tokens/sec. If a client sends 156 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 156 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 154 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (154 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/172 \\\n  -H \"X-Idempotency-Key: id_key_72\""
  },
  {
    "id": "sys-quiz-api-73",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/173' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 156 tokens and refills at a rate of 3 tokens/sec. If a client sends 158 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 158 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 156 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (156 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/173 \\\n  -H \"X-Idempotency-Key: id_key_73\""
  },
  {
    "id": "sys-quiz-api-74",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/174' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 158 tokens and refills at a rate of 4 tokens/sec. If a client sends 160 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 160 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 158 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (158 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/174 \\\n  -H \"X-Idempotency-Key: id_key_74\""
  },
  {
    "id": "sys-quiz-api-75",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/175' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 160 tokens and refills at a rate of 2 tokens/sec. If a client sends 162 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 162 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 160 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (160 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/175 \\\n  -H \"X-Idempotency-Key: id_key_75\""
  },
  {
    "id": "sys-quiz-api-76",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/176' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 162 tokens and refills at a rate of 3 tokens/sec. If a client sends 164 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 164 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 162 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (162 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/176 \\\n  -H \"X-Idempotency-Key: id_key_76\""
  },
  {
    "id": "sys-quiz-api-77",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/177' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 164 tokens and refills at a rate of 4 tokens/sec. If a client sends 166 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 166 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 164 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (164 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/177 \\\n  -H \"X-Idempotency-Key: id_key_77\""
  },
  {
    "id": "sys-quiz-api-78",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/178' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 166 tokens and refills at a rate of 2 tokens/sec. If a client sends 168 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 168 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 166 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (166 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/178 \\\n  -H \"X-Idempotency-Key: id_key_78\""
  },
  {
    "id": "sys-quiz-api-79",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/179' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 168 tokens and refills at a rate of 3 tokens/sec. If a client sends 170 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 170 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 168 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (168 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/179 \\\n  -H \"X-Idempotency-Key: id_key_79\""
  },
  {
    "id": "sys-quiz-api-80",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/180' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 170 tokens and refills at a rate of 4 tokens/sec. If a client sends 172 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 172 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 170 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (170 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/180 \\\n  -H \"X-Idempotency-Key: id_key_80\""
  },
  {
    "id": "sys-quiz-api-81",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/181' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 172 tokens and refills at a rate of 2 tokens/sec. If a client sends 174 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 174 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 172 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (172 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/181 \\\n  -H \"X-Idempotency-Key: id_key_81\""
  },
  {
    "id": "sys-quiz-api-82",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/182' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 174 tokens and refills at a rate of 3 tokens/sec. If a client sends 176 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 174 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 176 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (174 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/182 \\\n  -H \"X-Idempotency-Key: id_key_82\""
  },
  {
    "id": "sys-quiz-api-83",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/183' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 176 tokens and refills at a rate of 4 tokens/sec. If a client sends 178 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 178 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 176 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (176 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/183 \\\n  -H \"X-Idempotency-Key: id_key_83\""
  },
  {
    "id": "sys-quiz-api-84",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/184' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 178 tokens and refills at a rate of 2 tokens/sec. If a client sends 180 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 180 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 178 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (178 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/184 \\\n  -H \"X-Idempotency-Key: id_key_84\""
  },
  {
    "id": "sys-quiz-api-85",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/185' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 180 tokens and refills at a rate of 3 tokens/sec. If a client sends 182 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 182 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 180 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (180 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/185 \\\n  -H \"X-Idempotency-Key: id_key_85\""
  },
  {
    "id": "sys-quiz-api-86",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/186' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 182 tokens and refills at a rate of 4 tokens/sec. If a client sends 184 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 184 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 182 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (182 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/186 \\\n  -H \"X-Idempotency-Key: id_key_86\""
  },
  {
    "id": "sys-quiz-api-87",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/187' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 184 tokens and refills at a rate of 2 tokens/sec. If a client sends 186 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 186 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 184 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (184 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/187 \\\n  -H \"X-Idempotency-Key: id_key_87\""
  },
  {
    "id": "sys-quiz-api-88",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/188' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 186 tokens and refills at a rate of 3 tokens/sec. If a client sends 188 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 188 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 186 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (186 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/188 \\\n  -H \"X-Idempotency-Key: id_key_88\""
  },
  {
    "id": "sys-quiz-api-89",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/189' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 188 tokens and refills at a rate of 4 tokens/sec. If a client sends 190 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 190 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 188 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (188 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/189 \\\n  -H \"X-Idempotency-Key: id_key_89\""
  },
  {
    "id": "sys-quiz-api-90",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/190' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 190 tokens and refills at a rate of 2 tokens/sec. If a client sends 192 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 190 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 192 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (190 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/190 \\\n  -H \"X-Idempotency-Key: id_key_90\""
  },
  {
    "id": "sys-quiz-api-91",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/191' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 192 tokens and refills at a rate of 3 tokens/sec. If a client sends 194 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 194 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 192 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (192 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/191 \\\n  -H \"X-Idempotency-Key: id_key_91\""
  },
  {
    "id": "sys-quiz-api-92",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/192' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 194 tokens and refills at a rate of 4 tokens/sec. If a client sends 196 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 196 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 194 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (194 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/192 \\\n  -H \"X-Idempotency-Key: id_key_92\""
  },
  {
    "id": "sys-quiz-api-93",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/193' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 196 tokens and refills at a rate of 2 tokens/sec. If a client sends 198 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 198 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 196 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (196 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/193 \\\n  -H \"X-Idempotency-Key: id_key_93\""
  },
  {
    "id": "sys-quiz-api-94",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/194' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 198 tokens and refills at a rate of 3 tokens/sec. If a client sends 200 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 198 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 200 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (198 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/194 \\\n  -H \"X-Idempotency-Key: id_key_94\""
  },
  {
    "id": "sys-quiz-api-95",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/195' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 200 tokens and refills at a rate of 4 tokens/sec. If a client sends 202 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 202 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 200 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (200 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/195 \\\n  -H \"X-Idempotency-Key: id_key_95\""
  },
  {
    "id": "sys-quiz-api-96",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/196' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 202 tokens and refills at a rate of 2 tokens/sec. If a client sends 204 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 204 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 202 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (202 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/196 \\\n  -H \"X-Idempotency-Key: id_key_96\""
  },
  {
    "id": "sys-quiz-api-97",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/197' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 204 tokens and refills at a rate of 3 tokens/sec. If a client sends 206 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 206 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 204 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (204 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/197 \\\n  -H \"X-Idempotency-Key: id_key_97\""
  },
  {
    "id": "sys-quiz-api-98",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/198' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 206 tokens and refills at a rate of 4 tokens/sec. If a client sends 208 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 206 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 208 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (206 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/198 \\\n  -H \"X-Idempotency-Key: id_key_98\""
  },
  {
    "id": "sys-quiz-api-99",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/199' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 208 tokens and refills at a rate of 2 tokens/sec. If a client sends 210 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 210 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 208 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (208 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/199 \\\n  -H \"X-Idempotency-Key: id_key_99\""
  },
  {
    "id": "sys-quiz-api-100",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/200' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 210 tokens and refills at a rate of 3 tokens/sec. If a client sends 212 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 212 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 210 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (210 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/200 \\\n  -H \"X-Idempotency-Key: id_key_100\""
  },
  {
    "id": "sys-quiz-api-101",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/201' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 212 tokens and refills at a rate of 4 tokens/sec. If a client sends 214 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 214 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 212 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (212 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/201 \\\n  -H \"X-Idempotency-Key: id_key_101\""
  },
  {
    "id": "sys-quiz-api-102",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/202' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 214 tokens and refills at a rate of 2 tokens/sec. If a client sends 216 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 216 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 214 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (214 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/202 \\\n  -H \"X-Idempotency-Key: id_key_102\""
  },
  {
    "id": "sys-quiz-api-103",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/203' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 216 tokens and refills at a rate of 3 tokens/sec. If a client sends 218 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 218 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 216 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (216 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/203 \\\n  -H \"X-Idempotency-Key: id_key_103\""
  },
  {
    "id": "sys-quiz-api-104",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/204' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 218 tokens and refills at a rate of 4 tokens/sec. If a client sends 220 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 220 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 218 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (218 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/204 \\\n  -H \"X-Idempotency-Key: id_key_104\""
  },
  {
    "id": "sys-quiz-api-105",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/205' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 220 tokens and refills at a rate of 2 tokens/sec. If a client sends 222 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 222 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 220 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (220 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/205 \\\n  -H \"X-Idempotency-Key: id_key_105\""
  },
  {
    "id": "sys-quiz-api-106",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/206' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 222 tokens and refills at a rate of 3 tokens/sec. If a client sends 224 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 224 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 222 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (222 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/206 \\\n  -H \"X-Idempotency-Key: id_key_106\""
  },
  {
    "id": "sys-quiz-api-107",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/207' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 224 tokens and refills at a rate of 4 tokens/sec. If a client sends 226 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 226 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 224 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (224 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/207 \\\n  -H \"X-Idempotency-Key: id_key_107\""
  },
  {
    "id": "sys-quiz-api-108",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/208' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 226 tokens and refills at a rate of 2 tokens/sec. If a client sends 228 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 228 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 226 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (226 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/208 \\\n  -H \"X-Idempotency-Key: id_key_108\""
  },
  {
    "id": "sys-quiz-api-109",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/209' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 228 tokens and refills at a rate of 3 tokens/sec. If a client sends 230 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 230 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 228 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (228 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/209 \\\n  -H \"X-Idempotency-Key: id_key_109\""
  },
  {
    "id": "sys-quiz-api-110",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/210' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 230 tokens and refills at a rate of 4 tokens/sec. If a client sends 232 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 232 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 230 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (230 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/210 \\\n  -H \"X-Idempotency-Key: id_key_110\""
  },
  {
    "id": "sys-quiz-api-111",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/211' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 232 tokens and refills at a rate of 2 tokens/sec. If a client sends 234 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 234 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 232 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (232 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/211 \\\n  -H \"X-Idempotency-Key: id_key_111\""
  },
  {
    "id": "sys-quiz-api-112",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/212' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 234 tokens and refills at a rate of 3 tokens/sec. If a client sends 236 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 236 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 234 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (234 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/212 \\\n  -H \"X-Idempotency-Key: id_key_112\""
  },
  {
    "id": "sys-quiz-api-113",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/213' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 236 tokens and refills at a rate of 4 tokens/sec. If a client sends 238 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 238 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 236 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (236 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/213 \\\n  -H \"X-Idempotency-Key: id_key_113\""
  },
  {
    "id": "sys-quiz-api-114",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/214' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 238 tokens and refills at a rate of 2 tokens/sec. If a client sends 240 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 238 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 240 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (238 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/214 \\\n  -H \"X-Idempotency-Key: id_key_114\""
  },
  {
    "id": "sys-quiz-api-115",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/215' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 240 tokens and refills at a rate of 3 tokens/sec. If a client sends 242 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 242 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 240 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (240 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/215 \\\n  -H \"X-Idempotency-Key: id_key_115\""
  },
  {
    "id": "sys-quiz-api-116",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/216' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 242 tokens and refills at a rate of 4 tokens/sec. If a client sends 244 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 244 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 242 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (242 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/216 \\\n  -H \"X-Idempotency-Key: id_key_116\""
  },
  {
    "id": "sys-quiz-api-117",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/217' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 244 tokens and refills at a rate of 2 tokens/sec. If a client sends 246 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 246 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 244 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (244 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/217 \\\n  -H \"X-Idempotency-Key: id_key_117\""
  },
  {
    "id": "sys-quiz-api-118",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/218' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 246 tokens and refills at a rate of 3 tokens/sec. If a client sends 248 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 248 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 246 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (246 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/218 \\\n  -H \"X-Idempotency-Key: id_key_118\""
  },
  {
    "id": "sys-quiz-api-119",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/219' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 248 tokens and refills at a rate of 4 tokens/sec. If a client sends 250 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 250 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The first 248 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 2,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (248 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/219 \\\n  -H \"X-Idempotency-Key: id_key_119\""
  },
  {
    "id": "sys-quiz-api-120",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/220' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 250 tokens and refills at a rate of 2 tokens/sec. If a client sends 252 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 252 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 250 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (250 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/220 \\\n  -H \"X-Idempotency-Key: id_key_120\""
  },
  {
    "id": "sys-quiz-api-121",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/221' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 252 tokens and refills at a rate of 3 tokens/sec. If a client sends 254 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 252 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 254 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (252 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/221 \\\n  -H \"X-Idempotency-Key: id_key_121\""
  },
  {
    "id": "sys-quiz-api-122",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/222' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 254 tokens and refills at a rate of 4 tokens/sec. If a client sends 256 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "The first 254 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "All 256 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 0,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (254 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/222 \\\n  -H \"X-Idempotency-Key: id_key_122\""
  },
  {
    "id": "sys-quiz-api-123",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/223' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 256 tokens and refills at a rate of 2 tokens/sec. If a client sends 258 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 258 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 256 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (256 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/223 \\\n  -H \"X-Idempotency-Key: id_key_123\""
  },
  {
    "id": "sys-quiz-api-124",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/224' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 258 tokens and refills at a rate of 3 tokens/sec. If a client sends 260 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 260 requests succeed, but the last 2 requests are queued and delayed.",
      "The first 258 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit."
    ],
    "correctOptionIndex": 1,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (258 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/224 \\\n  -H \"X-Idempotency-Key: id_key_124\""
  },
  {
    "id": "sys-quiz-api-125",
    "topic": "APIs",
    "difficulty": "medium",
    "questionText": "A client invokes the API endpoint '/api/v1/orders/225' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of 260 tokens and refills at a rate of 4 tokens/sec. If a client sends 262 requests in a burst, what HTTP headers and response behavior occur?",
    "options": [
      "All 262 requests succeed, but the last 2 requests are queued and delayed.",
      "The entire burst is rejected with HTTP 403 Forbidden due to security concerns.",
      "The requests are processed round-robin across upstream services, ignoring the limit.",
      "The first 260 requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header."
    ],
    "correctOptionIndex": 3,
    "explanation": "The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (260 tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.",
    "codeSnippet": "curl -X POST https://api.service.com/api/v1/orders/225 \\\n  -H \"X-Idempotency-Key: id_key_125\""
  },
  {
    "id": "sys-quiz-sec-1",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-1.com' issues a POST request to 'https://api-gateway-1.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-1.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-1.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-1.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-1.com' to 'https://api-gateway-1.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-1.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-2",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-2.com' issues a POST request to 'https://api-gateway-2.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-2.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-2.com.",
      "Access-Control-Allow-Origin: https://app-client-2.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-2.com' to 'https://api-gateway-2.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-2.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-3",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-3.com' issues a POST request to 'https://api-gateway-3.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-3.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-3.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-3.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-3.com' to 'https://api-gateway-3.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-3.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-4",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-4.com' issues a POST request to 'https://api-gateway-4.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-4.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-4.com.",
      "Access-Control-Allow-Origin: https://app-client-4.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-4.com' to 'https://api-gateway-4.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-4.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-5",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-5.com' issues a POST request to 'https://api-gateway-5.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-5.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-5.com.",
      "Access-Control-Allow-Origin: https://app-client-5.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-5.com' to 'https://api-gateway-5.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-5.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-6",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-6.com' issues a POST request to 'https://api-gateway-6.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-6.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-6.com.",
      "Access-Control-Allow-Origin: https://app-client-6.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-6.com' to 'https://api-gateway-6.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-6.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-7",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-7.com' issues a POST request to 'https://api-gateway-7.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-7.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-7.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-7.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-7.com' to 'https://api-gateway-7.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-7.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-8",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-8.com' issues a POST request to 'https://api-gateway-8.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-8.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-8.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-8.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-8.com' to 'https://api-gateway-8.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-8.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-9",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-9.com' issues a POST request to 'https://api-gateway-9.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-9.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-9.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-9.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-9.com' to 'https://api-gateway-9.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-9.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-10",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-10.com' issues a POST request to 'https://api-gateway-10.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-10.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-10.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-10.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-10.com' to 'https://api-gateway-10.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-10.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-11",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-11.com' issues a POST request to 'https://api-gateway-11.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-11.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-11.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-11.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-11.com' to 'https://api-gateway-11.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-11.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-12",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-12.com' issues a POST request to 'https://api-gateway-12.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-12.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-12.com.",
      "Access-Control-Allow-Origin: https://app-client-12.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-12.com' to 'https://api-gateway-12.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-12.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-13",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-13.com' issues a POST request to 'https://api-gateway-13.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-13.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-13.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-13.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-13.com' to 'https://api-gateway-13.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-13.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-14",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-14.com' issues a POST request to 'https://api-gateway-14.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-14.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-14.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-14.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-14.com' to 'https://api-gateway-14.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-14.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-15",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-15.com' issues a POST request to 'https://api-gateway-15.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-15.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-15.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-15.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-15.com' to 'https://api-gateway-15.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-15.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-16",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-16.com' issues a POST request to 'https://api-gateway-16.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-16.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-16.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-16.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-16.com' to 'https://api-gateway-16.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-16.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-17",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-17.com' issues a POST request to 'https://api-gateway-17.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-17.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-17.com.",
      "Access-Control-Allow-Origin: https://app-client-17.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-17.com' to 'https://api-gateway-17.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-17.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-18",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-18.com' issues a POST request to 'https://api-gateway-18.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-18.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-18.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-18.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-18.com' to 'https://api-gateway-18.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-18.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-19",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-19.com' issues a POST request to 'https://api-gateway-19.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-19.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-19.com.",
      "Access-Control-Allow-Origin: https://app-client-19.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-19.com' to 'https://api-gateway-19.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-19.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-20",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-20.com' issues a POST request to 'https://api-gateway-20.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-20.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-20.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-20.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-20.com' to 'https://api-gateway-20.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-20.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-21",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-21.com' issues a POST request to 'https://api-gateway-21.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-21.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-21.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-21.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-21.com' to 'https://api-gateway-21.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-21.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-22",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-22.com' issues a POST request to 'https://api-gateway-22.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-22.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-22.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-22.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-22.com' to 'https://api-gateway-22.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-22.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-23",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-23.com' issues a POST request to 'https://api-gateway-23.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-23.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-23.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-23.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-23.com' to 'https://api-gateway-23.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-23.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-24",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-24.com' issues a POST request to 'https://api-gateway-24.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-24.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-24.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-24.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-24.com' to 'https://api-gateway-24.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-24.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-25",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-25.com' issues a POST request to 'https://api-gateway-25.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-25.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-25.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-25.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-25.com' to 'https://api-gateway-25.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-25.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-26",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-26.com' issues a POST request to 'https://api-gateway-26.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-26.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-26.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-26.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-26.com' to 'https://api-gateway-26.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-26.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-27",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-27.com' issues a POST request to 'https://api-gateway-27.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-27.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-27.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-27.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-27.com' to 'https://api-gateway-27.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-27.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-28",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-28.com' issues a POST request to 'https://api-gateway-28.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-28.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-28.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-28.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-28.com' to 'https://api-gateway-28.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-28.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-29",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-29.com' issues a POST request to 'https://api-gateway-29.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-29.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-29.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-29.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-29.com' to 'https://api-gateway-29.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-29.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-30",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-30.com' issues a POST request to 'https://api-gateway-30.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-30.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-30.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-30.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-30.com' to 'https://api-gateway-30.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-30.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-31",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-31.com' issues a POST request to 'https://api-gateway-31.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-31.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-31.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-31.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-31.com' to 'https://api-gateway-31.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-31.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-32",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-32.com' issues a POST request to 'https://api-gateway-32.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-32.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-32.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-32.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-32.com' to 'https://api-gateway-32.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-32.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-33",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-33.com' issues a POST request to 'https://api-gateway-33.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-33.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-33.com.",
      "Access-Control-Allow-Origin: https://app-client-33.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-33.com' to 'https://api-gateway-33.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-33.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-34",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-34.com' issues a POST request to 'https://api-gateway-34.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-34.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-34.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-34.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-34.com' to 'https://api-gateway-34.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-34.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-35",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-35.com' issues a POST request to 'https://api-gateway-35.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-35.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-35.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-35.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-35.com' to 'https://api-gateway-35.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-35.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-36",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-36.com' issues a POST request to 'https://api-gateway-36.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-36.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-36.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-36.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-36.com' to 'https://api-gateway-36.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-36.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-37",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-37.com' issues a POST request to 'https://api-gateway-37.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-37.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-37.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-37.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-37.com' to 'https://api-gateway-37.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-37.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-38",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-38.com' issues a POST request to 'https://api-gateway-38.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-38.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-38.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-38.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-38.com' to 'https://api-gateway-38.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-38.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-39",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-39.com' issues a POST request to 'https://api-gateway-39.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-39.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-39.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-39.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-39.com' to 'https://api-gateway-39.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-39.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-40",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-40.com' issues a POST request to 'https://api-gateway-40.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-40.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-40.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-40.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-40.com' to 'https://api-gateway-40.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-40.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-41",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-41.com' issues a POST request to 'https://api-gateway-41.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-41.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-41.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-41.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-41.com' to 'https://api-gateway-41.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-41.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-42",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-42.com' issues a POST request to 'https://api-gateway-42.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-42.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-42.com.",
      "Access-Control-Allow-Origin: https://app-client-42.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-42.com' to 'https://api-gateway-42.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-42.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-43",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-43.com' issues a POST request to 'https://api-gateway-43.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-43.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-43.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-43.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-43.com' to 'https://api-gateway-43.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-43.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-44",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-44.com' issues a POST request to 'https://api-gateway-44.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-44.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-44.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-44.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-44.com' to 'https://api-gateway-44.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-44.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-45",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-45.com' issues a POST request to 'https://api-gateway-45.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-45.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-45.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-45.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-45.com' to 'https://api-gateway-45.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-45.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-46",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-46.com' issues a POST request to 'https://api-gateway-46.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-46.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-46.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-46.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-46.com' to 'https://api-gateway-46.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-46.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-47",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-47.com' issues a POST request to 'https://api-gateway-47.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-47.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-47.com.",
      "Access-Control-Allow-Origin: https://app-client-47.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-47.com' to 'https://api-gateway-47.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-47.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-48",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-48.com' issues a POST request to 'https://api-gateway-48.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-48.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-48.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-48.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-48.com' to 'https://api-gateway-48.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-48.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-49",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-49.com' issues a POST request to 'https://api-gateway-49.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-49.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-49.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-49.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-49.com' to 'https://api-gateway-49.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-49.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-50",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-50.com' issues a POST request to 'https://api-gateway-50.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-50.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-50.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-50.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-50.com' to 'https://api-gateway-50.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-50.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-51",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-51.com' issues a POST request to 'https://api-gateway-51.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-51.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-51.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-51.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-51.com' to 'https://api-gateway-51.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-51.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-52",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-52.com' issues a POST request to 'https://api-gateway-52.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-52.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-52.com.",
      "Access-Control-Allow-Origin: https://app-client-52.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-52.com' to 'https://api-gateway-52.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-52.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-53",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-53.com' issues a POST request to 'https://api-gateway-53.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-53.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-53.com.",
      "Access-Control-Allow-Origin: https://app-client-53.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-53.com' to 'https://api-gateway-53.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-53.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-54",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-54.com' issues a POST request to 'https://api-gateway-54.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-54.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-54.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-54.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-54.com' to 'https://api-gateway-54.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-54.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-55",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-55.com' issues a POST request to 'https://api-gateway-55.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-55.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-55.com.",
      "Access-Control-Allow-Origin: https://app-client-55.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-55.com' to 'https://api-gateway-55.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-55.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-56",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-56.com' issues a POST request to 'https://api-gateway-56.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-56.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-56.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-56.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-56.com' to 'https://api-gateway-56.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-56.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-57",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-57.com' issues a POST request to 'https://api-gateway-57.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-57.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-57.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-57.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-57.com' to 'https://api-gateway-57.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-57.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-58",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-58.com' issues a POST request to 'https://api-gateway-58.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-58.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-58.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-58.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-58.com' to 'https://api-gateway-58.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-58.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-59",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-59.com' issues a POST request to 'https://api-gateway-59.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-59.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-59.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-59.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-59.com' to 'https://api-gateway-59.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-59.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-60",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-60.com' issues a POST request to 'https://api-gateway-60.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-60.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-60.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-60.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-60.com' to 'https://api-gateway-60.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-60.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-61",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-61.com' issues a POST request to 'https://api-gateway-61.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-61.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-61.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-61.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-61.com' to 'https://api-gateway-61.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-61.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-62",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-62.com' issues a POST request to 'https://api-gateway-62.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-62.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-62.com.",
      "Access-Control-Allow-Origin: https://app-client-62.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-62.com' to 'https://api-gateway-62.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-62.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-63",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-63.com' issues a POST request to 'https://api-gateway-63.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-63.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-63.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-63.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-63.com' to 'https://api-gateway-63.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-63.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-64",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-64.com' issues a POST request to 'https://api-gateway-64.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-64.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-64.com.",
      "Access-Control-Allow-Origin: https://app-client-64.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-64.com' to 'https://api-gateway-64.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-64.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-65",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-65.com' issues a POST request to 'https://api-gateway-65.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-65.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-65.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-65.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-65.com' to 'https://api-gateway-65.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-65.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-66",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-66.com' issues a POST request to 'https://api-gateway-66.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-66.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-66.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-66.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-66.com' to 'https://api-gateway-66.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-66.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-67",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-67.com' issues a POST request to 'https://api-gateway-67.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-67.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-67.com.",
      "Access-Control-Allow-Origin: https://app-client-67.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-67.com' to 'https://api-gateway-67.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-67.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-68",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-68.com' issues a POST request to 'https://api-gateway-68.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-68.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-68.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-68.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-68.com' to 'https://api-gateway-68.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-68.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-69",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-69.com' issues a POST request to 'https://api-gateway-69.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-69.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-69.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-69.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-69.com' to 'https://api-gateway-69.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-69.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-70",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-70.com' issues a POST request to 'https://api-gateway-70.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-70.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-70.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-70.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-70.com' to 'https://api-gateway-70.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-70.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-71",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-71.com' issues a POST request to 'https://api-gateway-71.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-71.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-71.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-71.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-71.com' to 'https://api-gateway-71.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-71.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-72",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-72.com' issues a POST request to 'https://api-gateway-72.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-72.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-72.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-72.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-72.com' to 'https://api-gateway-72.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-72.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-73",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-73.com' issues a POST request to 'https://api-gateway-73.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-73.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-73.com.",
      "Access-Control-Allow-Origin: https://app-client-73.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-73.com' to 'https://api-gateway-73.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-73.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-74",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-74.com' issues a POST request to 'https://api-gateway-74.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-74.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-74.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-74.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-74.com' to 'https://api-gateway-74.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-74.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-75",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-75.com' issues a POST request to 'https://api-gateway-75.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-75.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-75.com.",
      "Access-Control-Allow-Origin: https://app-client-75.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-75.com' to 'https://api-gateway-75.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-75.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-76",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-76.com' issues a POST request to 'https://api-gateway-76.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-76.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-76.com.",
      "Access-Control-Allow-Origin: https://app-client-76.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-76.com' to 'https://api-gateway-76.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-76.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-77",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-77.com' issues a POST request to 'https://api-gateway-77.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-77.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-77.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-77.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-77.com' to 'https://api-gateway-77.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-77.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-78",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-78.com' issues a POST request to 'https://api-gateway-78.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-78.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-78.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-78.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-78.com' to 'https://api-gateway-78.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-78.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-79",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-79.com' issues a POST request to 'https://api-gateway-79.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-79.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-79.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-79.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-79.com' to 'https://api-gateway-79.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-79.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-80",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-80.com' issues a POST request to 'https://api-gateway-80.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-80.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-80.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-80.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-80.com' to 'https://api-gateway-80.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-80.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-81",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-81.com' issues a POST request to 'https://api-gateway-81.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-81.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-81.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-81.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-81.com' to 'https://api-gateway-81.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-81.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-82",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-82.com' issues a POST request to 'https://api-gateway-82.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-82.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-82.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-82.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-82.com' to 'https://api-gateway-82.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-82.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-83",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-83.com' issues a POST request to 'https://api-gateway-83.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-83.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-83.com.",
      "Access-Control-Allow-Origin: https://app-client-83.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-83.com' to 'https://api-gateway-83.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-83.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-84",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-84.com' issues a POST request to 'https://api-gateway-84.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-84.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-84.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-84.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-84.com' to 'https://api-gateway-84.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-84.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-85",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-85.com' issues a POST request to 'https://api-gateway-85.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-85.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-85.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-85.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-85.com' to 'https://api-gateway-85.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-85.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-86",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-86.com' issues a POST request to 'https://api-gateway-86.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-86.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-86.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-86.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-86.com' to 'https://api-gateway-86.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-86.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-87",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-87.com' issues a POST request to 'https://api-gateway-87.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-87.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-87.com.",
      "Access-Control-Allow-Origin: https://app-client-87.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-87.com' to 'https://api-gateway-87.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-87.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-88",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-88.com' issues a POST request to 'https://api-gateway-88.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-88.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-88.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-88.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-88.com' to 'https://api-gateway-88.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-88.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-89",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-89.com' issues a POST request to 'https://api-gateway-89.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-89.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-89.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-89.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-89.com' to 'https://api-gateway-89.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-89.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-90",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-90.com' issues a POST request to 'https://api-gateway-90.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-90.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-90.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-90.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-90.com' to 'https://api-gateway-90.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-90.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-91",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-91.com' issues a POST request to 'https://api-gateway-91.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-91.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-91.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-91.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-91.com' to 'https://api-gateway-91.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-91.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-92",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-92.com' issues a POST request to 'https://api-gateway-92.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-92.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-92.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-92.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-92.com' to 'https://api-gateway-92.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-92.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-93",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-93.com' issues a POST request to 'https://api-gateway-93.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-93.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-93.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-93.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-93.com' to 'https://api-gateway-93.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-93.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-94",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-94.com' issues a POST request to 'https://api-gateway-94.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-94.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-94.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-94.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-94.com' to 'https://api-gateway-94.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-94.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-95",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-95.com' issues a POST request to 'https://api-gateway-95.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-95.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-95.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-95.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-95.com' to 'https://api-gateway-95.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-95.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-96",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-96.com' issues a POST request to 'https://api-gateway-96.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-96.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-96.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-96.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-96.com' to 'https://api-gateway-96.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-96.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-97",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-97.com' issues a POST request to 'https://api-gateway-97.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-97.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-97.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-97.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-97.com' to 'https://api-gateway-97.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-97.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-98",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-98.com' issues a POST request to 'https://api-gateway-98.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-98.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-98.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-98.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-98.com' to 'https://api-gateway-98.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-98.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-99",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-99.com' issues a POST request to 'https://api-gateway-99.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-99.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-99.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-99.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-99.com' to 'https://api-gateway-99.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-99.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-100",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-100.com' issues a POST request to 'https://api-gateway-100.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-100.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-100.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-100.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-100.com' to 'https://api-gateway-100.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-100.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-101",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-101.com' issues a POST request to 'https://api-gateway-101.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-101.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-101.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-101.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-101.com' to 'https://api-gateway-101.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-101.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-102",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-102.com' issues a POST request to 'https://api-gateway-102.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-102.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-102.com.",
      "Access-Control-Allow-Origin: https://app-client-102.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-102.com' to 'https://api-gateway-102.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-102.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-103",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-103.com' issues a POST request to 'https://api-gateway-103.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-103.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-103.com.",
      "Access-Control-Allow-Origin: https://app-client-103.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-103.com' to 'https://api-gateway-103.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-103.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-104",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-104.com' issues a POST request to 'https://api-gateway-104.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-104.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-104.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-104.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-104.com' to 'https://api-gateway-104.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-104.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-105",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-105.com' issues a POST request to 'https://api-gateway-105.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-105.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-105.com.",
      "Access-Control-Allow-Origin: https://app-client-105.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-105.com' to 'https://api-gateway-105.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-105.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-106",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-106.com' issues a POST request to 'https://api-gateway-106.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-106.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-106.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-106.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-106.com' to 'https://api-gateway-106.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-106.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-107",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-107.com' issues a POST request to 'https://api-gateway-107.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-107.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-107.com.",
      "Access-Control-Allow-Origin: https://app-client-107.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-107.com' to 'https://api-gateway-107.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-107.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-108",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-108.com' issues a POST request to 'https://api-gateway-108.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-108.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-108.com.",
      "Access-Control-Allow-Origin: https://app-client-108.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-108.com' to 'https://api-gateway-108.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-108.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-109",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-109.com' issues a POST request to 'https://api-gateway-109.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-109.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-109.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-109.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-109.com' to 'https://api-gateway-109.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-109.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-110",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-110.com' issues a POST request to 'https://api-gateway-110.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-110.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-110.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-110.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-110.com' to 'https://api-gateway-110.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-110.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-111",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-111.com' issues a POST request to 'https://api-gateway-111.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-111.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-111.com.",
      "Access-Control-Allow-Origin: https://app-client-111.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-111.com' to 'https://api-gateway-111.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-111.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-112",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-112.com' issues a POST request to 'https://api-gateway-112.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-112.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-112.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-112.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-112.com' to 'https://api-gateway-112.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-112.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-113",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-113.com' issues a POST request to 'https://api-gateway-113.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-113.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-113.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-113.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-113.com' to 'https://api-gateway-113.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-113.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-114",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-114.com' issues a POST request to 'https://api-gateway-114.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-114.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-114.com.",
      "Access-Control-Allow-Origin: https://app-client-114.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-114.com' to 'https://api-gateway-114.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-114.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-115",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-115.com' issues a POST request to 'https://api-gateway-115.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-115.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-115.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-115.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-115.com' to 'https://api-gateway-115.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-115.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-116",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-116.com' issues a POST request to 'https://api-gateway-116.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-116.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-116.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-116.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-116.com' to 'https://api-gateway-116.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-116.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-117",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-117.com' issues a POST request to 'https://api-gateway-117.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-117.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-117.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-117.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-117.com' to 'https://api-gateway-117.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-117.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-118",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-118.com' issues a POST request to 'https://api-gateway-118.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-118.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-118.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-118.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-118.com' to 'https://api-gateway-118.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-118.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-119",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-119.com' issues a POST request to 'https://api-gateway-119.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-119.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-119.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-119.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-119.com' to 'https://api-gateway-119.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-119.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-120",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-120.com' issues a POST request to 'https://api-gateway-120.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "Access-Control-Allow-Origin: https://app-client-120.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-120.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-120.com."
    ],
    "correctOptionIndex": 0,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-120.com' to 'https://api-gateway-120.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-120.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-121",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-121.com' issues a POST request to 'https://api-gateway-121.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-121.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-121.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-121.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-121.com' to 'https://api-gateway-121.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-121.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-122",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-122.com' issues a POST request to 'https://api-gateway-122.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://app-client-122.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Access-Control-Allow-Origin: https://api-gateway-122.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-122.com."
    ],
    "correctOptionIndex": 1,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-122.com' to 'https://api-gateway-122.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-122.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-123",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-123.com' issues a POST request to 'https://api-gateway-123.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-123.com and Access-Control-Allow-Credentials: true.",
      "Authorization: Bearer jwt_token and Host: https://app-client-123.com.",
      "Access-Control-Allow-Origin: https://app-client-123.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type."
    ],
    "correctOptionIndex": 3,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-123.com' to 'https://api-gateway-123.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-123.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-124",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-124.com' issues a POST request to 'https://api-gateway-124.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-124.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-124.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-124.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-124.com' to 'https://api-gateway-124.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-124.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sys-quiz-sec-125",
    "topic": "Security",
    "difficulty": "hard",
    "questionText": "A web client hosted on 'https://app-client-125.com' issues a POST request to 'https://api-gateway-125.com/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?",
    "options": [
      "X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.",
      "Access-Control-Allow-Origin: https://api-gateway-125.com and Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin: https://app-client-125.com (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.",
      "Authorization: Bearer jwt_token and Host: https://app-client-125.com."
    ],
    "correctOptionIndex": 2,
    "explanation": "Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from 'https://app-client-125.com' to 'https://api-gateway-125.com') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.",
    "codeSnippet": "// Preflight Request:\nOPTIONS /v1/users HTTP/1.1\nOrigin: https://app-client-125.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type"
  },
  {
    "id": "sd-quiz-adv-1",
    "topic": "Distributed Locking & Redlock",
    "difficulty": "hard",
    "questionText": "Why does Martin Kleppmann critique the Redlock algorithm (Redis distributed lock across N independent masters) for fencing sensitive storage systems?",
    "options": [
      "Redlock relies on synchronized system clocks across nodes; clock drifts or GC pauses can invalidate lease time before execution completes without fencing tokens.",
      "Redis nodes process lock requests synchronously, causing high network latency.",
      "Redlock uses SHA-256 signatures which are vulnerable to quantum computing attacks.",
      "Redis single-threaded architecture cannot execute Lua scripts for atomic CAS operations."
    ],
    "correctOptionIndex": 0,
    "explanation": "Kleppmann proved that Redlock is unsafe for strong correctness because uncoordinated clock drift or long JVM GC pauses can cause the lock lease to expire while a thread still thinks it owns the lock. Reliable fencing requires monotonic auto-incrementing fencing tokens (e.g. ZooKeeper sequential z-nodes).",
    "codeSnippet": "// Redlock algorithm: Acquire lock on N/2 + 1 Redis nodes\n// Lease time: 10 seconds"
  },
  {
    "id": "sd-quiz-adv-2",
    "topic": "Cache Stampede & Thundering Herd",
    "difficulty": "hard",
    "questionText": "When a hot cached key with 100,000 QPS expires in Redis, thousands of concurrent application threads simultaneously miss cache and query the primary SQL database (Cache Stampede). What is the optimal solution?",
    "options": [
      "Use Singleflight pattern (or Probabilistic Early Expiration XFetch) so only ONE thread recomputes the cache while others wait or get soft-expired data.",
      "Increase Redis maxmemory eviction policy to allkeys-lru.",
      "Set cache TTL to Integer.MAX_VALUE and never expire cached keys.",
      "Increase SQL database max_connections pool size from 100 to 100,000."
    ],
    "correctOptionIndex": 0,
    "explanation": "To prevent Cache Stampede (Thundering Herd), use Singleflight locking (only 1 thread fetches from DB on cache miss while other concurrent requests wait for the result) or Probabilistic Early Expiration (XFetch), which randomly recalculates the cache before TTL expiration.",
    "codeSnippet": "// Probabilistic Early Expiration (XFetch algorithm)\n// OR Single-flight mutex (Distributed Lock / Singleflight pattern)"
  },
  {
    "id": "sd-quiz-adv-3",
    "topic": "Kafka Cooperative Sticky Rebalance",
    "difficulty": "hard",
    "questionText": "How does the Cooperative Sticky Assignor (Kafka 2.4+) improve consumer group rebalancing over the legacy Eager Rebalance Protocol?",
    "options": [
      "Cooperative Rebalance performs incremental two-pass rebalancing, allowing consumers to continue processing unaffected partitions without a 'stop-the-world' pause.",
      "Cooperative Rebalance forces all consumers in the group to restart their JVM processes simultaneously.",
      "Cooperative Rebalance moves partition assignments directly into Kafka Broker ZK metadata node.",
      "Cooperative Rebalance turns off heartbeat threads during partition reassignment."
    ],
    "correctOptionIndex": 0,
    "explanation": "Legacy Eager Rebalancing revokes ALL partition assignments from ALL consumers, causing a global stop-the-world processing pause. Cooperative Sticky Assignor revokes ONLY partitions that actually need to move, allowing consumers to process unchanged partitions without interruption.",
    "codeSnippet": "# Consumer config:\npartition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor"
  },
  {
    "id": "sd-quiz-adv-4",
    "topic": "Rate Limiting & Token Bucket",
    "difficulty": "medium",
    "questionText": "Which rate limiting algorithm allows short bursts of traffic while enforcing a smooth average rate over time, making it ideal for API gateways?",
    "options": [
      "Token Bucket Algorithm: tokens refill at a constant rate up to bucket capacity; requests consume 1 token and burst up to capacity.",
      "Fixed Window Counter Algorithm: resets counter at boundary of every fixed minute.",
      "Leaky Bucket Algorithm: drops all burst traffic instantly if incoming rate exceeds exact leak speed.",
      "Sliding Window Log: stores full timestamp of every request in Redis Sorted Set."
    ],
    "correctOptionIndex": 0,
    "explanation": "Token Bucket permits burstiness (up to bucket capacity) while maintaining a strict long-term refill rate limit. Leaky Bucket smooths out requests at a strict constant rate without allowing bursts.",
    "codeSnippet": "// Capacity: 100 tokens, Refill rate: 10 tokens/sec"
  },
  {
    "id": "sd-quiz-adv-5",
    "topic": "LSM-Tree vs B+Tree Storage Engines",
    "difficulty": "hard",
    "questionText": "Why do write-heavy databases (RocksDB, Apache Cassandra, LevelDB) use Log-Structured Merge-trees (LSM-Trees) instead of traditional B+Trees?",
    "options": [
      "LSM-Trees convert random writes into sequential disk append operations in MemTable & WAL, dramatically increasing write throughput.",
      "LSM-Trees eliminate the need for secondary indexes and compaction background threads.",
      "LSM-Trees provide faster point read performance (O(1)) than B+Trees without Bloom filters.",
      "B+Trees require SSD drives while LSM-Trees only work on magnetic spinning disks."
    ],
    "correctOptionIndex": 0,
    "explanation": "LSM-Trees buffer writes in an in-memory MemTable and write-ahead log (WAL) as sequential appends. Sequential I/O is orders of magnitude faster than B+Tree random page updates on disk. Periodic compaction merges immutable SSTables asynchronously.",
    "codeSnippet": "// LSM-Tree Architecture:\n// MemTable (RAM) -> Write-Ahead Log (WAL) -> SSTables (Disk - Immutable Level Compaction)"
  },
  {
    "id": "sd-quiz-auto-506",
    "topic": "Distributed Systems",
    "difficulty": "hard",
    "questionText": "What is the primary function of Fencing Tokens in a distributed lock service (e.g. ZooKeeper / Etcd)? (Variant #506)",
    "options": [
      "Monotonically increasing numbers returned with the lock; storage node rejects writes with a token smaller than the last processed token.",
      "Random UUIDs generated by client applications to prevent replay attacks.",
      "Cryptographic RSA keys used to encrypt TCP network packets.",
      "Heartbeat ping messages sent every 500ms to keep Redis connection alive."
    ],
    "correctOptionIndex": 0,
    "explanation": "Fencing tokens prevent stale lock holders (delayed by GC pauses or network lag) from overwriting newer writes. Storage nodes enforce monotonic token checks (write token > last seen token).",
    "codeSnippet": "// Distributed Lock with Fencing Token\n// Token: 104 -> Storage checks: 104 > 103 (accepted)"
  },
  {
    "id": "sd-quiz-auto-507",
    "topic": "Caching Patterns",
    "difficulty": "medium",
    "questionText": "What is the difference between Write-Through and Write-Behind (Write-Back) cache strategies? (Variant #507)",
    "options": [
      "Write-Through writes to DB only; Write-Behind writes to Cache only.",
      "Write-Through writes to Cache and Database synchronously; Write-Behind buffers writes in Cache and flushes asynchronously to Database in batches.",
      "Write-Through is asynchronous; Write-Behind is synchronous.",
      "Write-Behind deletes cached keys immediately after writing."
    ],
    "correctOptionIndex": 1,
    "explanation": "Write-Through guarantees strict consistency by updating Cache and DB synchronously before returning. Write-Behind updates Cache immediately and asynchronously flushes to DB in batches for maximum write throughput.",
    "codeSnippet": "// Write Strategy Comparison"
  },
  {
    "id": "sd-quiz-auto-508",
    "topic": "Distributed Systems",
    "difficulty": "hard",
    "questionText": "What is the primary function of Fencing Tokens in a distributed lock service (e.g. ZooKeeper / Etcd)? (Variant #508)",
    "options": [
      "Random UUIDs generated by client applications to prevent replay attacks.",
      "Monotonically increasing numbers returned with the lock; storage node rejects writes with a token smaller than the last processed token.",
      "Cryptographic RSA keys used to encrypt TCP network packets.",
      "Heartbeat ping messages sent every 500ms to keep Redis connection alive."
    ],
    "correctOptionIndex": 1,
    "explanation": "Fencing tokens prevent stale lock holders (delayed by GC pauses or network lag) from overwriting newer writes. Storage nodes enforce monotonic token checks (write token > last seen token).",
    "codeSnippet": "// Distributed Lock with Fencing Token\n// Token: 104 -> Storage checks: 104 > 103 (accepted)"
  }
];
