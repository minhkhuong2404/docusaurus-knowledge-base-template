---
id: connect-four
title: "Problem: Connect Four"
sidebar_label: 🔴 Connect Four
---

# Connect Four

> **Difficulty:** Medium | **Frequency:** Medium | **Patterns:** State, Template Method, Strategy

---

## Interview Expectation

Connect Four tests your ability to model a turn-based game cleanly. Key areas:

| Expectation | Details |
|------------|---------|
| Board representation | 2D grid, efficient column operations |
| Win detection | Horizontal, vertical, both diagonals |
| Turn management | State pattern for game phases |
| Extensibility | Easy to add AI player, different board sizes |

---

## Step 1: Clarify Requirements

- **Board size?** → Standard 6×7 (6 rows, 7 columns)
- **Two players always?** → yes, but design for extensibility (AI later)
- **Gravity mechanic?** → Pieces fall to the lowest available row in a column
- **Win condition?** → 4 in a row: horizontal, vertical, or diagonal

---

## Step 2: Core Classes

```java
// ── Enums ──────────────────────────────────────────────────
public enum Piece  { RED, YELLOW, EMPTY }
public enum GameState { WAITING, IN_PROGRESS, FINISHED }

// ── Player ────────────────────────────────────────────────
public class Player {
    private final String name;
    private final Piece piece;

    public Player(String name, Piece piece) {
        this.name  = name;
        this.piece = piece;
    }

    public String getName() { return name; }
    public Piece getPiece() { return piece; }
}

// ── Board ─────────────────────────────────────────────────
public class Board {
    private final int rows;
    private final int cols;
    private final Piece[][] grid;

    public Board(int rows, int cols) {
        this.rows = rows;
        this.cols = cols;
        this.grid = new Piece[rows][cols];
        for (Piece[] row : grid) Arrays.fill(row, Piece.EMPTY);
    }

    /**
     * Drop a piece into a column. Returns the row where it landed, or -1 if full.
     */
    public int dropPiece(int col, Piece piece) {
        if (col < 0 || col >= cols) throw new IllegalArgumentException("Invalid column: " + col);

        for (int row = rows - 1; row >= 0; row--) {  // bottom-up
            if (grid[row][col] == Piece.EMPTY) {
                grid[row][col] = piece;
                return row;
            }
        }
        return -1; // column is full
    }

    public boolean isColumnFull(int col) {
        return grid[0][col] != Piece.EMPTY;
    }

    public boolean isFull() {
        for (int col = 0; col < cols; col++) {
            if (!isColumnFull(col)) return false;
        }
        return true;
    }

    /**
     * Check if placing piece at (row, col) creates a win.
     */
    public boolean checkWin(int row, int col, Piece piece) {
        return checkDirection(row, col, piece, 0, 1) >= 4  // horizontal
            || checkDirection(row, col, piece, 1, 0) >= 4  // vertical
            || checkDirection(row, col, piece, 1, 1) >= 4  // diagonal ↘
            || checkDirection(row, col, piece, 1, -1) >= 4; // diagonal ↙
    }

    // Count consecutive pieces in both directions of (dr, dc)
    private int checkDirection(int row, int col, Piece piece, int dr, int dc) {
        return 1
            + countInDirection(row, col, piece, dr, dc)
            + countInDirection(row, col, piece, -dr, -dc);
    }

    private int countInDirection(int row, int col, Piece piece, int dr, int dc) {
        int count = 0;
        int r = row + dr, c = col + dc;
        while (r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] == piece) {
            count++;
            r += dr;
            c += dc;
        }
        return count;
    }

    public void print() {
        for (Piece[] row : grid) {
            System.out.println(
                Arrays.stream(row)
                    .map(p -> p == Piece.RED ? "🔴" : p == Piece.YELLOW ? "🟡" : "⚫")
                    .collect(Collectors.joining(" "))
            );
        }
        System.out.println("1  2  3  4  5  6  7");
    }
}
```

---

## Step 3: Game Engine (State Pattern)

```java
public class ConnectFourGame {
    private final Board board;
    private final Player[] players;
    private int currentPlayerIndex;
    private GameState state;
    private Player winner;

    public ConnectFourGame(Player player1, Player player2) {
        this.board   = new Board(6, 7);
        this.players = new Player[]{ player1, player2 };
        this.currentPlayerIndex = 0;
        this.state   = GameState.IN_PROGRESS;
    }

    public MoveResult makeMove(int column) {
        if (state != GameState.IN_PROGRESS) {
            throw new IllegalStateException("Game is not in progress");
        }

        Player current = getCurrentPlayer();

        if (board.isColumnFull(column)) {
            return MoveResult.invalidMove("Column " + (column + 1) + " is full");
        }

        int row = board.dropPiece(column, current.getPiece());

        if (board.checkWin(row, column, current.getPiece())) {
            state  = GameState.FINISHED;
            winner = current;
            board.print();
            return MoveResult.win(current);
        }

        if (board.isFull()) {
            state = GameState.FINISHED;
            board.print();
            return MoveResult.draw();
        }

        currentPlayerIndex = (currentPlayerIndex + 1) % 2;
        board.print();
        return MoveResult.success(getNextPlayer());
    }

    public Player getCurrentPlayer() { return players[currentPlayerIndex]; }
    public Player getNextPlayer()    { return players[(currentPlayerIndex + 1) % 2]; }
    public Optional<Player> getWinner() { return Optional.ofNullable(winner); }
    public GameState getState() { return state; }
}

// Result object — avoids returning null or throwing exceptions for valid game states
public sealed interface MoveResult {
    record Success(Player nextPlayer)   implements MoveResult {}
    record Win(Player winner)           implements MoveResult {}
    record Draw()                       implements MoveResult {}
    record InvalidMove(String reason)   implements MoveResult {}

    static MoveResult success(Player next)  { return new Success(next); }
    static MoveResult win(Player winner)    { return new Win(winner); }
    static MoveResult draw()               { return new Draw(); }
    static MoveResult invalidMove(String r) { return new InvalidMove(r); }
}
```

---

## Step 4: Example Run

```java
Player alice = new Player("Alice", Piece.RED);
Player bob   = new Player("Bob",   Piece.YELLOW);
ConnectFourGame game = new ConnectFourGame(alice, bob);

Scanner scanner = new Scanner(System.in);
while (game.getState() == GameState.IN_PROGRESS) {
    System.out.print(game.getCurrentPlayer().getName() + "'s turn (1-7): ");
    int col = scanner.nextInt() - 1;  // convert to 0-indexed

    MoveResult result = game.makeMove(col);

    switch (result) {
        case MoveResult.Win(var w)       -> System.out.println(w.getName() + " wins! 🎉");
        case MoveResult.Draw()           -> System.out.println("It's a draw!");
        case MoveResult.InvalidMove(var r)-> System.out.println("Invalid: " + r);
        case MoveResult.Success(var next)-> System.out.println(next.getName() + "'s turn next");
    }
}
```

---

## Senior Deep Dive

:::note Senior Deep Dive 🔴
**AI Player:** Abstract `Player` with a `makeMove(Board board)` method. Implement `HumanPlayer` (reads from stdin) and `AIPlayer` (uses Minimax with alpha-beta pruning). The `ConnectFourGame` calls `player.makeMove(board)` polymorphically.

**Win detection optimization:** Instead of checking all 4 directions from scratch each time, maintain 4 bitmask arrays (one per direction) and do bitwise operations — O(1) win check after each move.
:::

---

## Interview Checklist

- [ ] Board with gravity (pieces fall to bottom of column)
- [ ] Win detection: all 4 directions, counting from both sides
- [ ] Turn alternation is correct
- [ ] Invalid move handling (full column, game over)
- [ ] `MoveResult` sealed type avoids nulls and exceptions for game states
- [ ] Board printing for visualization
- [ ] Discussed AI player extension (Minimax)
