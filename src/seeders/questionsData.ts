export interface RawQuestionSeed {
  question_text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  options: {
    text: string;
    is_correct: boolean;
  }[];
}

export const questionsSeedData: RawQuestionSeed[] = [

  {
    question_text: "What is the output of `typeof NaN` in JavaScript?",
    category: "JavaScript",
    difficulty: "easy",
    explanation: "In JavaScript, NaN (Not-a-Number) is a numeric value representing an unrepresentable or undefined arithmetic result, so its type is 'number'.",
    options: [
      { text: "'number'", is_correct: true },
      { text: "'nan'", is_correct: false },
      { text: "'undefined'", is_correct: false },
      { text: "'object'", is_correct: false }
    ]
  },
  {
    question_text: "Which phase of the JavaScript Event Loop executes Microtasks like Promise callbacks (`.then()`)?",
    category: "JavaScript",
    difficulty: "medium",
    explanation: "Microtasks (such as Promise callbacks, queueMicrotask, and MutationObserver) run immediately after the currently running script completes and before the event loop moves to the next macrotask.",
    options: [
      { text: "Immediately after the current task finishes, before any other macrotask", is_correct: true },
      { text: "In the next cycle of the Timer phase (after setTimeout)", is_correct: false },
      { text: "Microtasks run in parallel on a dedicated background OS thread", is_correct: false },
      { text: "Only when the browser or Node process is completely idle", is_correct: false }
    ]
  },
  {
    question_text: "In JavaScript, what happens when you compare `[] == ![]`?",
    category: "JavaScript",
    difficulty: "hard",
    explanation: "`![]` evaluates to `false` because an empty array is truthy. The comparison becomes `[] == false`. Type coercion converts both to numbers: `[].toString()` is `''`, which converts to `0`, and `false` converts to `0`. `0 == 0` evaluates to `true`.",
    options: [
      { text: "true", is_correct: true },
      { text: "false", is_correct: false },
      { text: "TypeError: Invalid comparison", is_correct: false },
      { text: "undefined", is_correct: false }
    ]
  },
  {
    question_text: "What is a Closure in JavaScript?",
    category: "JavaScript",
    difficulty: "medium",
    explanation: "A closure is the combination of a function bundled together with references to its surrounding lexical environment, giving an inner function access to an outer function's scope.",
    options: [
      { text: "A function that has access to variables from its outer (enclosing) lexical scope even after that outer function has returned", is_correct: true },
      { text: "A method to close network connections automatically when unused", is_correct: false },
      { text: "A design pattern used exclusively to freeze object properties using Object.freeze()", is_correct: false },
      { text: "A syntax error when a function body is not properly closed with curly braces", is_correct: false }
    ]
  },
  {
    question_text: "What is the difference between `null` and `undefined` in JavaScript?",
    category: "JavaScript",
    difficulty: "easy",
    explanation: "`undefined` means a variable has been declared but has not yet been assigned a value, whereas `null` is an intentional assignment representing 'no value' or an empty reference.",
    options: [
      { text: "undefined means a variable has been declared but not assigned; null is an intentional assignment of no value", is_correct: true },
      { text: "null is a primitive type, whereas undefined is an instance of an Object", is_correct: false },
      { text: "There is no difference; they are strictly equal (null === undefined)", is_correct: false },
      { text: "null is used exclusively for numbers; undefined is for strings", is_correct: false }
    ]
  },
  {
    question_text: "In TypeScript, what is the key difference between `unknown` and `any`?",
    category: "TypeScript",
    difficulty: "medium",
    explanation: "Both represent any possible value, but `unknown` is type-safe: TypeScript prevents you from calling methods or accessing properties on an `unknown` variable without first narrowing its type (e.g., via `typeof` or type guards).",
    options: [
      { text: "unknown requires type-checking or narrowing before performing operations on it, while any disables type-checking completely", is_correct: true },
      { text: "any can only store primitives, while unknown can only store objects and functions", is_correct: false },
      { text: "unknown is converted to string at compile time, whereas any remains untyped", is_correct: false },
      { text: "There is no difference; unknown is just a deprecated alias for any", is_correct: false }
    ]
  },
  {
    question_text: "What does the JavaScript `Array.prototype.reduce()` method return when invoked on an empty array without an initial value?",
    category: "JavaScript",
    difficulty: "medium",
    explanation: "Calling `reduce()` on an empty array without supplying an initial accumulator value throws a `TypeError: Reduce of empty array with no initial value`.",
    options: [
      { text: "Throws a TypeError", is_correct: true },
      { text: "Returns undefined", is_correct: false },
      { text: "Returns null", is_correct: false },
      { text: "Returns an empty array `[]`", is_correct: false }
    ]
  },
  {
    question_text: "In TypeScript, which operator is used for the non-null assertion?",
    category: "TypeScript",
    difficulty: "easy",
    explanation: "The postfix exclamation mark `!` tells the TypeScript compiler that an expression is neither `null` nor `undefined`.",
    options: [
      { text: "The postfix `!` operator (e.g. `value!`)", is_correct: true },
      { text: "The `?` operator (e.g. `value?`)", is_correct: false },
      { text: "The `as NonNullable` operator", is_correct: false },
      { text: "The double question mark `??`", is_correct: false }
    ]
  },
  {
    question_text: "What is the difference between `Object.freeze()` and `Object.seal()` in JavaScript?",
    category: "JavaScript",
    difficulty: "hard",
    explanation: "`Object.seal()` prevents adding or deleting properties but allows modifying existing writable properties. `Object.freeze()` does all of that AND makes all existing properties non-writable.",
    options: [
      { text: "Object.seal allows mutating existing writable properties; Object.freeze makes existing properties read-only", is_correct: true },
      { text: "Object.freeze creates a deep copy, while Object.seal creates a shallow copy", is_correct: false },
      { text: "Object.seal prevents prototype changes only; Object.freeze prevents garbage collection", is_correct: false },
      { text: "Object.freeze only works on arrays; Object.seal works on plain objects", is_correct: false }
    ]
  },
  {
    question_text: "Which of the following is true about arrow functions in JavaScript?",
    category: "JavaScript",
    difficulty: "easy",
    explanation: "Arrow functions do not have their own `this`, `arguments`, `super`, or `new.target`. Instead, `this` is lexically resolved from the enclosing execution context.",
    options: [
      { text: "They retain the `this` value of the enclosing lexical context and cannot be used as constructors", is_correct: true },
      { text: "They bind `this` dynamically to the caller at runtime", is_correct: false },
      { text: "They can be invoked with the `new` keyword to create object instances", is_correct: false },
      { text: "They have their own unique `arguments` object separate from the outer function", is_correct: false }
    ]
  },


  {
    question_text: "Which of the following data types in Python is immutable?",
    category: "Python",
    difficulty: "easy",
    explanation: "Tuples (along with ints, floats, strings, and frozensets) are immutable in Python; their contents cannot be modified after creation.",
    options: [
      { text: "tuple", is_correct: true },
      { text: "list", is_correct: false },
      { text: "dict", is_correct: false },
      { text: "set", is_correct: false }
    ]
  },
  {
    question_text: "In Python, what is the Global Interpreter Lock (GIL)?",
    category: "Python",
    difficulty: "medium",
    explanation: "The GIL is a mutex used by CPython to ensure only one native thread executes Python bytecode at a time, preventing race conditions within CPython's memory management.",
    options: [
      { text: "A mutex that prevents multiple native threads from executing Python bytecodes simultaneously in CPython", is_correct: true },
      { text: "A security feature that prevents unauthorized network sockets from opening", is_correct: false },
      { text: "A lock mechanism that synchronizes SQLite transactions across multiple worker processes", is_correct: false },
      { text: "An internal compiler flag that disables garbage collection for high-performance loops", is_correct: false }
    ]
  },
  {
    question_text: "What will the expression `[x * 2 for x in range(5) if x % 2 == 0]` evaluate to in Python?",
    category: "Python",
    difficulty: "easy",
    explanation: "range(5) produces 0, 1, 2, 3, 4. Even numbers are 0, 2, 4. Multiplying each by 2 yields [0, 4, 8].",
    options: [
      { text: "[0, 4, 8]", is_correct: true },
      { text: "[0, 2, 4]", is_correct: false },
      { text: "[2, 6]", is_correct: false },
      { text: "[0, 2, 4, 6, 8]", is_correct: false }
    ]
  },
  {
    question_text: "In Python, what is the difference between `is` and `==`?",
    category: "Python",
    difficulty: "medium",
    explanation: "`==` checks for equality of value (via `__eq__`), while `is` checks for identity—whether two variables point to the exact same object in memory.",
    options: [
      { text: "`is` checks object identity (same memory address); `==` checks value equality", is_correct: true },
      { text: "`==` checks memory address; `is` checks type compatibility", is_correct: false },
      { text: "`is` is used only for strings; `==` is used for all other data types", is_correct: false },
      { text: "`is` performs automatic type coercion; `==` performs strict comparison", is_correct: false }
    ]
  },
  {
    question_text: "What does the `yield` keyword do inside a Python function?",
    category: "Python",
    difficulty: "medium",
    explanation: "The `yield` keyword pauses function execution and yields a value to the caller, turning the function into a generator iterator.",
    options: [
      { text: "Pauses function execution and returns a value to the caller, producing a generator", is_correct: true },
      { text: "Immediately terminates the function and frees all local variables", is_correct: false },
      { text: "Yields CPU execution to another OS thread using cooperative multithreading", is_correct: false },
      { text: "Declares an asynchronous callback inside an asyncio event loop", is_correct: false }
    ]
  },
  {
    question_text: "Why is using a mutable default argument like `def append_to(item, target_list=[])` considered a pitfall in Python?",
    category: "Python",
    difficulty: "medium",
    explanation: "Default arguments in Python are evaluated once when the function is defined, not every time it is called. Thus, mutations to `target_list` persist across subsequent calls.",
    options: [
      { text: "The default list is instantiated once at function definition time and shared across all calls", is_correct: true },
      { text: "Python raises a SyntaxError if a list literal is passed as a default parameter", is_correct: false },
      { text: "The list is garbage collected as soon as the function returns", is_correct: false },
      { text: "It causes memory fragmentation by allocating a new array on every invocation", is_correct: false }
    ]
  },
  {
    question_text: "In Python, what is the purpose of the `__init__` method?",
    category: "Python",
    difficulty: "easy",
    explanation: "`__init__` is an instance initializer called right after the object has been created (by `__new__`) to set up initial state.",
    options: [
      { text: "To initialize the attributes and state of a newly created class instance", is_correct: true },
      { text: "To allocate raw memory for a new object before instantiation", is_correct: false },
      { text: "To define static class-level constants that cannot be overridden", is_correct: false },
      { text: "To destroy the object when reference count reaches zero", is_correct: false }
    ]
  },
  {
    question_text: "What does `*args` and `**kwargs` allow in a Python function definition?",
    category: "Python",
    difficulty: "easy",
    explanation: "`*args` allows passing an arbitrary number of positional arguments as a tuple, while `**kwargs` allows passing an arbitrary number of keyword arguments as a dictionary.",
    options: [
      { text: "`*args` captures variable positional arguments as a tuple; `**kwargs` captures variable keyword arguments as a dict", is_correct: true },
      { text: "`*args` accepts only integer pointers; `**kwargs` accepts memory buffers", is_correct: false },
      { text: "`*args` creates a generator; `**kwargs` creates a list comprehension", is_correct: false },
      { text: "They enforce strict type validation at runtime for all function parameters", is_correct: false }
    ]
  },


  {
    question_text: "What is the key difference between `WHERE` and `HAVING` clauses in SQL?",
    category: "Databases",
    difficulty: "medium",
    explanation: "`WHERE` filters individual rows before any grouping or aggregation takes place. `HAVING` filters aggregated groups after the `GROUP BY` clause is processed.",
    options: [
      { text: "`WHERE` filters rows before aggregation; `HAVING` filters aggregated groups after `GROUP BY`", is_correct: true },
      { text: "`HAVING` can only be used with subqueries, while `WHERE` cannot", is_correct: false },
      { text: "`WHERE` filters columns, whereas `HAVING` filters rows", is_correct: false },
      { text: "They are completely interchangeable syntactically and functionally", is_correct: false }
    ]
  },
  {
    question_text: "In the context of database transactions, what does the 'I' in ACID stand for?",
    category: "Databases",
    difficulty: "easy",
    explanation: "ACID stands for Atomicity, Consistency, Isolation, and Durability. Isolation ensures concurrent transactions do not interfere with each other.",
    options: [
      { text: "Isolation", is_correct: true },
      { text: "Integrity", is_correct: false },
      { text: "Idempotency", is_correct: false },
      { text: "Indexing", is_correct: false }
    ]
  },
  {
    question_text: "What kind of SQL JOIN returns all rows from the left table and matched rows from the right table, filling with NULL when no match exists?",
    category: "Databases",
    difficulty: "easy",
    explanation: "A LEFT OUTER JOIN (or LEFT JOIN) keeps all records from the left table and pairs them with matching records from the right table; unmatched rows contain NULL for the right table's columns.",
    options: [
      { text: "LEFT JOIN", is_correct: true },
      { text: "INNER JOIN", is_correct: false },
      { text: "FULL OUTER JOIN", is_correct: false },
      { text: "CROSS JOIN", is_correct: false }
    ]
  },
  {
    question_text: "What is a primary drawback of adding too many secondary indexes to a SQL database table?",
    category: "Databases",
    difficulty: "medium",
    explanation: "While indexes accelerate SELECT queries, every INSERT, UPDATE, and DELETE statement must also update each index tree, increasing write latency and storage overhead.",
    options: [
      { text: "Slows down write operations (INSERT, UPDATE, DELETE) and increases storage usage", is_correct: true },
      { text: "Prevents the database from using foreign key constraints", is_correct: false },
      { text: "Disables ACID transaction guarantees across all tables", is_correct: false },
      { text: "Causes automatic corruption of B-Tree nodes on high-concurrency reads", is_correct: false }
    ]
  },
  {
    question_text: "What is Database Normalization (up to 3NF) primarily designed to achieve?",
    category: "Databases",
    difficulty: "medium",
    explanation: "Normalization organizes table structures to minimize data redundancy and prevent data anomalies (insertion, update, and deletion anomalies) while ensuring dependency integrity.",
    options: [
      { text: "Minimize data redundancy and avoid update/insertion/deletion anomalies", is_correct: true },
      { text: "Maximize query read speed by duplicating data across multiple cache tables", is_correct: false },
      { text: "Compress binary data into smaller chunks for cold storage", is_correct: false },
      { text: "Enforce automatic encryption of all string columns in the database", is_correct: false }
    ]
  },
  {
    question_text: "In SQL, what is the result of evaluating `SELECT NULL = NULL;`?",
    category: "Databases",
    difficulty: "hard",
    explanation: "In SQL three-valued logic, `NULL` represents an unknown value. Comparing two unknown values with `=` yields `UNKNOWN` (treated as falsy/null in boolean contexts), not `TRUE`. `IS NULL` must be used instead.",
    options: [
      { text: "NULL (or UNKNOWN)", is_correct: true },
      { text: "TRUE (1)", is_correct: false },
      { text: "FALSE (0)", is_correct: false },
      { text: "SyntaxError", is_correct: false }
    ]
  },
  {
    question_text: "What does `ON DELETE CASCADE` specified on a foreign key do?",
    category: "Databases",
    difficulty: "easy",
    explanation: "`ON DELETE CASCADE` automatically deletes all child rows referencing a parent row when that parent row is deleted.",
    options: [
      { text: "Automatically deletes child rows when the referenced parent row is deleted", is_correct: true },
      { text: "Prevents deletion of the parent row if any child rows exist", is_correct: false },
      { text: "Sets the foreign key column in the child rows to NULL", is_correct: false },
      { text: "Creates a backup archive of the deleted row in a cascade log table", is_correct: false }
    ]
  },
  {
    question_text: "Which transaction isolation level prevents Dirty Reads, Non-Repeatable Reads, and Phantom Reads?",
    category: "Databases",
    difficulty: "hard",
    explanation: "SERIALIZABLE is the strictest isolation level defined by the ANSI SQL standard; it executes transactions in a way that produces results equivalent to serial (sequential) execution, preventing phantom reads.",
    options: [
      { text: "SERIALIZABLE", is_correct: true },
      { text: "REPEATABLE READ", is_correct: false },
      { text: "READ COMMITTED", is_correct: false },
      { text: "READ UNCOMMITTED", is_correct: false }
    ]
  },


  {
    question_text: "What is the fundamental difference between `git rebase` and `git merge`?",
    category: "Git",
    difficulty: "medium",
    explanation: "`git merge` combines branches by creating a new merge commit preserving exact history and timeline, while `git rebase` replays commits on top of the target branch to create a linear commit history.",
    options: [
      { text: "`git merge` preserves branch topology with a merge commit; `git rebase` replays commits linearly on top of a base", is_correct: true },
      { text: "`git rebase` deletes previous commits permanently without leaving reflog entries", is_correct: false },
      { text: "`git merge` only works locally; `git rebase` is exclusively for remote repositories", is_correct: false },
      { text: "`git rebase` can only be run by repository administrators", is_correct: false }
    ]
  },
  {
    question_text: "What does `git cherry-pick <commit-hash>` do?",
    category: "Git",
    difficulty: "easy",
    explanation: "`git cherry-pick` applies the changes introduced by a specific existing commit from another branch onto your currently checked-out branch as a new commit.",
    options: [
      { text: "Applies the changes from a specific commit onto the current branch as a new commit", is_correct: true },
      { text: "Picks the newest commits and deletes all previous ones from the branch", is_correct: false },
      { text: "Interactive tool to resolve merge conflicts automatically using AI", is_correct: false },
      { text: "Tags a specific commit for release deployment", is_correct: false }
    ]
  },
  {
    question_text: "What does it mean when Git is in a 'detached HEAD' state?",
    category: "Git",
    difficulty: "medium",
    explanation: "A 'detached HEAD' means HEAD points directly to a specific commit hash rather than to a named branch reference.",
    options: [
      { text: "HEAD points directly to a commit rather than to a named local branch", is_correct: true },
      { text: "The remote repository has been disconnected or deleted", is_correct: false },
      { text: "The local repository is corrupted and requires git fsck repair", is_correct: false },
      { text: "The current branch has diverged beyond the ability to merge", is_correct: false }
    ]
  },
  {
    question_text: "What is the difference between `git reset --soft` and `git reset --hard`?",
    category: "Git",
    difficulty: "medium",
    explanation: "`--soft` moves HEAD to the target commit while keeping changes staged in the index; `--hard` resets HEAD, index, and discards all unstaged/staged working directory changes.",
    options: [
      { text: "`--soft` keeps modified files staged in index; `--hard` discards all working directory and index changes", is_correct: true },
      { text: "`--hard` saves all files to stash; `--soft` deletes uncommitted files immediately", is_correct: false },
      { text: "`--soft` pushes changes to remote; `--hard` prevents remote pushes", is_correct: false },
      { text: "`--soft` only resets commits authored within the last 24 hours", is_correct: false }
    ]
  },
  {
    question_text: "What does `git stash pop` do compared to `git stash apply`?",
    category: "Git",
    difficulty: "easy",
    explanation: "`git stash apply` restores stashed changes but leaves them in the stash list; `git stash pop` applies the changes and removes them from the stash list.",
    options: [
      { text: "`pop` applies the stash and removes it from the stash list; `apply` applies it while keeping it in the stash list", is_correct: true },
      { text: "`pop` discards the stash without applying it; `apply` merges it into main", is_correct: false },
      { text: "`apply` works on multiple stashes at once; `pop` can only stash new files", is_correct: false },
      { text: "`pop` is only used when merge conflicts occur", is_correct: false }
    ]
  },


  {
    question_text: "Which of the following HTTP methods is defined as idempotent according to the HTTP/1.1 specification?",
    category: "Web & HTTP",
    difficulty: "medium",
    explanation: "An idempotent HTTP method can be executed multiple times without changing the server state beyond the initial call. PUT, DELETE, GET, and HEAD are idempotent; POST is not.",
    options: [
      { text: "PUT", is_correct: true },
      { text: "POST", is_correct: false },
      { text: "PATCH (in typical non-standardized implementations)", is_correct: false },
      { text: "CONNECT", is_correct: false }
    ]
  },
  {
    question_text: "What is the exact semantic difference between HTTP status codes 401 Unauthorized and 403 Forbidden?",
    category: "Web & HTTP",
    difficulty: "easy",
    explanation: "401 means the client is unauthenticated (lacks valid authentication credentials); 403 means the server understands who the user is, but the user does not have permission for the requested resource.",
    options: [
      { text: "401 means unauthenticated (missing/invalid credentials); 403 means authenticated but lacking permission", is_correct: true },
      { text: "401 indicates server failure; 403 indicates client syntax errors", is_correct: false },
      { text: "401 is only for HTTPS; 403 is for HTTP connections", is_correct: false },
      { text: "401 requires an API key; 403 requires a JWT bearer token", is_correct: false }
    ]
  },
  {
    question_text: "What does CORS (Cross-Origin Resource Sharing) protect?",
    category: "Web & HTTP",
    difficulty: "medium",
    explanation: "CORS is a browser security mechanism that restricts a web page from making AJAX/Fetch requests to a different domain/origin than the one that served the page, unless the server explicitly permits it.",
    options: [
      { text: "It prevents malicious websites in the user's browser from accessing data from another origin without permission", is_correct: true },
      { text: "It prevents DDoS attacks on the backend server by throttling IP addresses", is_correct: false },
      { text: "It encrypts HTTP headers sent between the client browser and API gateway", is_correct: false },
      { text: "It blocks curl and Postman requests from connecting to backend APIs", is_correct: false }
    ]
  },
  {
    question_text: "Which HTTP header is sent by a client to declare the MIME type of data in the request body?",
    category: "Web & HTTP",
    difficulty: "easy",
    explanation: "`Content-Type` indicates the media type of the resource in the request body (e.g. `application/json`), whereas `Accept` informs the server what media types the client can accept in return.",
    options: [
      { text: "Content-Type", is_correct: true },
      { text: "Accept", is_correct: false },
      { text: "Content-Encoding", is_correct: false },
      { text: "Transfer-Encoding", is_correct: false }
    ]
  },
  {
    question_text: "Why should sensitive authentication tokens NOT be stored in browser `localStorage`?",
    category: "Web & HTTP",
    difficulty: "medium",
    explanation: "`localStorage` is fully accessible to any JavaScript running on the domain. If an application suffers a Cross-Site Scripting (XSS) vulnerability, an attacker can extract tokens directly. `HttpOnly` cookies mitigate this.",
    options: [
      { text: "It is vulnerable to theft via Cross-Site Scripting (XSS) attacks because JavaScript can access it", is_correct: true },
      { text: "localStorage is transmitted automatically in every HTTP request header, causing bandwidth bloat", is_correct: false },
      { text: "localStorage is erased whenever the user closes the active browser tab", is_correct: false },
      { text: "localStorage cannot store strings longer than 128 characters", is_correct: false }
    ]
  },
  {
    question_text: "In a RESTful architecture, what does 'statelessness' mean?",
    category: "Web & HTTP",
    difficulty: "easy",
    explanation: "Statelessness means each request from client to server must contain all of the information necessary to understand and process the request, and the server does not store client session state between requests.",
    options: [
      { text: "Every request contains all necessary context; the server stores no client session context between requests", is_correct: true },
      { text: "The server must never write to a persistent database", is_correct: false },
      { text: "Clients are not allowed to cache any response data locally", is_correct: false },
      { text: "The API cannot use HTTPS or TLS handshakes", is_correct: false }
    ]
  },


  {
    question_text: "What is the average time complexity of looking up a key in a well-distributed Hash Table?",
    category: "Data Structures",
    difficulty: "easy",
    explanation: "With a good hash function and reasonable load factor, average lookup in a hash table is O(1) constant time.",
    options: [
      { text: "O(1)", is_correct: true },
      { text: "O(log n)", is_correct: false },
      { text: "O(n)", is_correct: false },
      { text: "O(n log n)", is_correct: false }
    ]
  },
  {
    question_text: "What prerequisite must be satisfied before Binary Search can be applied to an array?",
    category: "Algorithms",
    difficulty: "easy",
    explanation: "Binary Search relies on dividing the search space in half based on comparison, which requires the underlying array elements to be sorted.",
    options: [
      { text: "The array must be sorted", is_correct: true },
      { text: "The array must contain only unique values", is_correct: false },
      { text: "The array length must be an exact power of 2", is_correct: false },
      { text: "The array elements must be positive integers", is_correct: false }
    ]
  },
  {
    question_text: "Which data structure follows the First-In, First-Out (FIFO) principle?",
    category: "Data Structures",
    difficulty: "easy",
    explanation: "A Queue processes elements in First-In, First-Out (FIFO) order, whereas a Stack operates on Last-In, First-Out (LIFO).",
    options: [
      { text: "Queue", is_correct: true },
      { text: "Stack", is_correct: false },
      { text: "Heap", is_correct: false },
      { text: "Binary Search Tree", is_correct: false }
    ]
  },
  {
    question_text: "What is the worst-case time complexity of QuickSort?",
    category: "Algorithms",
    difficulty: "medium",
    explanation: "QuickSort has an average time complexity of O(n log n), but when poor pivot choices occur (e.g. picking the minimum or maximum element consistently in an already sorted array), it degrades to O(n²).",
    options: [
      { text: "O(n²)", is_correct: true },
      { text: "O(n log n)", is_correct: false },
      { text: "O(n)", is_correct: false },
      { text: "O(2ⁿ)", is_correct: false }
    ]
  },
  {
    question_text: "Which graph traversal algorithm uses a Queue and visits vertices layer by layer (level order)?",
    category: "Algorithms",
    difficulty: "easy",
    explanation: "Breadth-First Search (BFS) traverses a graph or tree level by level using a Queue, whereas Depth-First Search (DFS) uses a Stack (or recursion).",
    options: [
      { text: "Breadth-First Search (BFS)", is_correct: true },
      { text: "Depth-First Search (DFS)", is_correct: false },
      { text: "Dijkstra's Algorithm with a Max-Heap", is_correct: false },
      { text: "Bellman-Ford Algorithm", is_correct: false }
    ]
  },
  {
    question_text: "What is the height of a balanced Binary Search Tree containing `n` nodes?",
    category: "Data Structures",
    difficulty: "medium",
    explanation: "In a balanced BST (like an AVL or Red-Black tree), the height is kept proportional to O(log n), which guarantees O(log n) search, insertion, and deletion times.",
    options: [
      { text: "O(log n)", is_correct: true },
      { text: "O(n)", is_correct: false },
      { text: "O(n log n)", is_correct: false },
      { text: "O(1)", is_correct: false }
    ]
  },
  {
    question_text: "What is the time complexity of finding an element in a balanced Binary Search Tree?",
    category: "Data Structures",
    difficulty: "easy",
    explanation: "Because half of the remaining subtree is eliminated at each step, searching in a balanced BST takes O(log n) time.",
    options: [
      { text: "O(log n)", is_correct: true },
      { text: "O(1)", is_correct: false },
      { text: "O(n)", is_correct: false },
      { text: "O(n²)", is_correct: false }
    ]
  },
  {
    question_text: "What is the space complexity of naive recursive Fibonacci `fib(n) = fib(n-1) + fib(n-2)` due to call stack depth?",
    category: "Algorithms",
    difficulty: "medium",
    explanation: "Although the time complexity of naive Fibonacci is O(2ⁿ), the maximum depth of the recursive call stack at any point in execution is proportional to `n`, giving an auxiliary space complexity of O(n).",
    options: [
      { text: "O(n)", is_correct: true },
      { text: "O(2ⁿ)", is_correct: false },
      { text: "O(1)", is_correct: false },
      { text: "O(log n)", is_correct: false }
    ]
  },


  {
    question_text: "In SOLID principles, what does the Liskov Substitution Principle (LSP) state?",
    category: "Architecture",
    difficulty: "medium",
    explanation: "LSP states that objects of a superclass should be replaceable with objects of a subclass without affecting the correctness of the program.",
    options: [
      { text: "Subtypes must be substitutable for their base types without altering expected behavior or correctness", is_correct: true },
      { text: "Every class should have only one single reason to change", is_correct: false },
      { text: "High-level modules must never depend directly on low-level concrete implementations", is_correct: false },
      { text: "Software entities should be open for modification and closed for extension", is_correct: false }
    ]
  },
  {
    question_text: "What is the primary objective of the Dependency Inversion Principle (DIP)?",
    category: "Architecture",
    difficulty: "medium",
    explanation: "DIP dictates that high-level modules should not import anything directly from low-level modules; both should depend on abstractions (interfaces).",
    options: [
      { text: "High-level modules should depend on abstractions/interfaces rather than concrete low-level implementations", is_correct: true },
      { text: "Functions should always invert boolean flags before validating parameters", is_correct: false },
      { text: "All database queries must be inverted to run as background cron jobs", is_correct: false },
      { text: "Child classes must invert the order of parameters passed to their parent constructors", is_correct: false }
    ]
  },
  {
    question_text: "What does the Factory Method design pattern provide?",
    category: "Architecture",
    difficulty: "easy",
    explanation: "The Factory Method pattern defines an interface for creating an object, but lets subclasses decide which class to instantiate.",
    options: [
      { text: "An interface for creating objects, delegating the instantiation logic to subclasses or factory methods", is_correct: true },
      { text: "A global mutable cache that stores database connections in memory", is_correct: false },
      { text: "A structural pattern used to convert the interface of a class into another interface clients expect", is_correct: false },
      { text: "A behavioral pattern that broadcasts events to multiple observer listeners", is_correct: false }
    ]
  },
  {
    question_text: "What is the core concept behind CQRS (Command Query Responsibility Segregation)?",
    category: "Architecture",
    difficulty: "hard",
    explanation: "CQRS separates read and update operations for a data store, using distinct models to update information (Commands) and read information (Queries).",
    options: [
      { text: "Separating the data model for mutating state (Commands) from the data model for fetching data (Queries)", is_correct: true },
      { text: "Merging relational databases with NoSQL databases into a single query handler", is_correct: false },
      { text: "Executing SQL queries only during server boot time", is_correct: false },
      { text: "Encrypting all command-line inputs before passing them to the shell", is_correct: false }
    ]
  },
  {
    question_text: "What is the Singleton design pattern and what is a common criticism of it in unit testing?",
    category: "Architecture",
    difficulty: "medium",
    explanation: "The Singleton pattern ensures a class has only one instance and provides a global access point to it. A major downside is that it introduces global mutable state, making mocking and test isolation difficult.",
    options: [
      { text: "Ensures only one instance of a class exists; it makes unit testing hard by introducing tight coupling and global state", is_correct: true },
      { text: "Creates a new instance on every function call; it is criticized for excessive CPU memory usage", is_correct: false },
      { text: "Restricts methods to take only a single argument; it violates DRY principles", is_correct: false },
      { text: "Wraps legacy code inside an adapter; it slows down unit test execution time", is_correct: false }
    ]
  },
  {
    question_text: "In an Event-Driven Architecture, what is the role of an Event Broker (e.g. Kafka, RabbitMQ)?",
    category: "Architecture",
    difficulty: "easy",
    explanation: "An event broker decouples publishers and subscribers by receiving events from producers, storing/routing them, and delivering them reliably to consumers.",
    options: [
      { text: "To decouple producers and consumers by receiving, buffering, and routing messages asynchronously", is_correct: true },
      { text: "To directly execute SQL transactions on primary database instances", is_correct: false },
      { text: "To compile frontend TypeScript files into optimized browser bundles", is_correct: false },
      { text: "To generate cryptographic SSL certificates on the fly", is_correct: false }
    ]
  },


  {
    question_text: "What are the three parts of a standard JSON Web Token (JWT)?",
    category: "Security",
    difficulty: "easy",
    explanation: "A JWT consists of three parts separated by dots (`.`): Header (algorithm & token type), Payload (claims/data), and Signature (verifies integrity).",
    options: [
      { text: "Header, Payload, Signature", is_correct: true },
      { text: "Key, Value, Checksum", is_correct: false },
      { text: "Issuer, Subject, Expiration", is_correct: false },
      { text: "Public Key, Private Key, Ciphertext", is_correct: false }
    ]
  },
  {
    question_text: "Why are Parameterized Queries (Prepared Statements) effective at preventing SQL Injection?",
    category: "Security",
    difficulty: "medium",
    explanation: "Parameterized queries separate SQL code structure from user data. The database compiles the SQL statement before inserting parameter values, treating user input strictly as literal data rather than executable SQL syntax.",
    options: [
      { text: "The database parses and compiles the SQL query structure separately, treating parameters purely as data literals", is_correct: true },
      { text: "They run regex sanitization on the client before sending queries to the database", is_correct: false },
      { text: "They encrypt the entire database table using symmetric AES-256", is_correct: false },
      { text: "They automatically convert all SQL queries into GraphQL endpoints", is_correct: false }
    ]
  },
  {
    question_text: "What is the difference between Hashing and Encryption?",
    category: "Security",
    difficulty: "medium",
    explanation: "Hashing is a one-way mathematical function that transforms input into a fixed-length string and cannot be reversed. Encryption is a two-way function designed to be decrypted with the proper key.",
    options: [
      { text: "Hashing is a one-way non-reversible function; Encryption is two-way and can be decrypted with a key", is_correct: true },
      { text: "Hashing requires a private key to read; Encryption produces random numbers", is_correct: false },
      { text: "Hashing is only used for SSL/TLS certificates; Encryption is only for passwords", is_correct: false },
      { text: "They are synonyms for the exact same cryptographic algorithm", is_correct: false }
    ]
  },
  {
    question_text: "What protection does setting the `HttpOnly` flag on an HTTP cookie provide?",
    category: "Security",
    difficulty: "easy",
    explanation: "The `HttpOnly` flag prevents client-side scripts (such as JavaScript via `document.cookie`) from accessing the cookie, protecting it from theft during Cross-Site Scripting (XSS) attacks.",
    options: [
      { text: "Prevents client-side JavaScript from accessing the cookie via `document.cookie`, mitigating XSS token theft", is_correct: true },
      { text: "Forces the cookie to be transmitted exclusively over plaintext HTTP instead of HTTPS", is_correct: false },
      { text: "Restricts the cookie to only be read by search engine web crawlers", is_correct: false },
      { text: "Automatically deletes the cookie after 60 seconds of inactivity", is_correct: false }
    ]
  },
  {
    question_text: "Why is a cryptographic Salt used when hashing passwords with algorithms like bcrypt or Argon2?",
    category: "Security",
    difficulty: "medium",
    explanation: "A salt is random data added to the password before hashing. It guarantees that identical passwords produce distinct hashes, defending against precomputed Rainbow Table attacks.",
    options: [
      { text: "It ensures identical passwords produce unique hash values, preventing Rainbow Table lookup attacks", is_correct: true },
      { text: "It compresses the password so it fits into an 8-bit integer field", is_correct: false },
      { text: "It allows the backend to decrypt passwords back to plaintext when users forget them", is_correct: false },
      { text: "It speeds up password verification to under 1 nanosecond", is_correct: false }
    ]
  },
  {
    question_text: "What is Cross-Site Request Forgery (CSRF) and how does the `SameSite=Lax` or `Strict` cookie attribute help prevent it?",
    category: "Security",
    difficulty: "hard",
    explanation: "CSRF tricks an authenticated user's browser into executing unwanted actions on another site. `SameSite` prevents cookies from being sent along with cross-site requests initiated by third-party origins.",
    options: [
      { text: "It prevents browsers from sending authenticated session cookies along with cross-origin requests initiated by third parties", is_correct: true },
      { text: "It forces the browser to prompt the user with a CAPTCHA before every form submission", is_correct: false },
      { text: "It converts all incoming POST requests into read-only GET requests automatically", is_correct: false },
      { text: "It blocks all third-party CSS fonts and JavaScript CDN files from loading", is_correct: false }
    ]
  },
  {
    question_text: "What is the primary role of an asymmetric cryptographic handshake (like RSA or Diffie-Hellman) in TLS/HTTPS?",
    category: "Security",
    difficulty: "hard",
    explanation: "Asymmetric cryptography is computationally expensive, so it is used during the TLS handshake to verify identity and securely negotiate a shared symmetric key, which is then used to encrypt the actual session data efficiently.",
    options: [
      { text: "To authenticate server identity and securely exchange a symmetric session key for fast data encryption", is_correct: true },
      { text: "To encrypt every single packet with a different public key for the lifetime of the connection", is_correct: false },
      { text: "To compress HTTP headers using gzip before sending TCP packets", is_correct: false },
      { text: "To bypass firewall rules by disguising TCP traffic as UDP DNS queries", is_correct: false }
    ]
  },


  {
    question_text: "In a Dockerfile, what is the key difference between `ENTRYPOINT` and `CMD`?",
    category: "DevOps",
    difficulty: "medium",
    explanation: "`ENTRYPOINT` specifies the executable command that will always run when the container starts, while `CMD` provides default arguments that can easily be overridden by CLI arguments when running `docker run`.",
    options: [
      { text: "`ENTRYPOINT` defines the core executable; `CMD` provides default arguments that can be overridden at runtime", is_correct: true },
      { text: "`CMD` executes during docker build; `ENTRYPOINT` executes only when pushed to Docker Hub", is_correct: false },
      { text: "`ENTRYPOINT` is only for Linux containers; `CMD` is only for Windows containers", is_correct: false },
      { text: "`CMD` runs as root; `ENTRYPOINT` always runs as an unprivileged guest user", is_correct: false }
    ]
  },
  {
    question_text: "What is the primary benefit of Multi-stage builds in Dockerfiles?",
    category: "DevOps",
    difficulty: "easy",
    explanation: "Multi-stage builds allow you to use separate stages for building (with compilers, devDependencies, and SDKs) and copy only the final compiled artifacts into a lightweight production runtime image, drastically reducing final image size.",
    options: [
      { text: "Reduces final image size by discarding build tools, compilers, and intermediate artifacts", is_correct: true },
      { text: "Allows running multiple container instances inside a single Docker container", is_correct: false },
      { text: "Enables automatic vertical autoscaling of container RAM and CPU", is_correct: false },
      { text: "Guarantees zero-downtime deployments without requiring a reverse proxy", is_correct: false }
    ]
  },
  {
    question_text: "How does Docker layer caching optimize container image builds?",
    category: "DevOps",
    difficulty: "medium",
    explanation: "Each Dockerfile instruction creates a cached layer. If a command and its input files haven't changed since the previous build, Docker reuses the existing cached layer, skipping redundant execution.",
    options: [
      { text: "Reuses previously built layers when instructions and their copied files have not changed, skipping redundant work", is_correct: true },
      { text: "Compresses all filesystem layers into a zip archive stored on Docker Hub", is_correct: false },
      { text: "Runs all Dockerfile instructions simultaneously in parallel threads", is_correct: false },
      { text: "Disables garbage collection inside the Linux kernel during image build", is_correct: false }
    ]
  },
  {
    question_text: "What is the difference between a Docker Volume and a Bind Mount?",
    category: "DevOps",
    difficulty: "medium",
    explanation: "Docker Volumes are managed entirely by Docker inside Docker's dedicated storage area on the host filesystem, whereas Bind Mounts mount any arbitrary host directory directly into the container.",
    options: [
      { text: "Volumes are managed entirely by Docker in a dedicated storage area; Bind mounts map any arbitrary host filesystem path", is_correct: true },
      { text: "Bind mounts persist data when a container is removed, while volumes are always deleted immediately", is_correct: false },
      { text: "Volumes only work on read-only filesystems; Bind mounts only work on network drives", is_correct: false },
      { text: "There is no difference; bind mount is simply an older deprecated name for volume", is_correct: false }
    ]
  },
  {
    question_text: "In Kubernetes, what is a Pod?",
    category: "DevOps",
    difficulty: "easy",
    explanation: "A Pod is the smallest deployable compute unit in Kubernetes. It represents a single instance of a running process and can contain one or more containers that share storage and network namespaces.",
    options: [
      { text: "The smallest deployable unit in Kubernetes, encapsulating one or more tightly-coupled containers that share network and storage", is_correct: true },
      { text: "A physical bare-metal server in a cloud provider datacenter", is_correct: false },
      { text: "A virtual private cloud (VPC) subnet containing database instances", is_correct: false },
      { text: "A command-line script used to install Docker on Ubuntu", is_correct: false }
    ]
  },
  {
    question_text: "What is the difference between Horizontal Scaling (Scale Out) and Vertical Scaling (Scale Up)?",
    category: "Architecture",
    difficulty: "easy",
    explanation: "Vertical scaling increases the CPU/RAM capacity of an existing machine, while horizontal scaling adds more machine/container instances to distribute load across a pool.",
    options: [
      { text: "Horizontal adds more server/container instances; Vertical upgrades CPU/RAM on the existing machine", is_correct: true },
      { text: "Horizontal increases hard drive storage; Vertical increases network bandwidth", is_correct: false },
      { text: "Horizontal is only for SQL databases; Vertical is only for Redis caches", is_correct: false },
      { text: "Vertical scaling requires containerization; Horizontal does not", is_correct: false }
    ]
  },


  {
    question_text: "What makes a JavaScript `WeakMap` different from a standard `Map`?",
    category: "JavaScript",
    difficulty: "hard",
    explanation: "In a `WeakMap`, keys must be objects and are held weakly. If there are no other references to a key object, it can be garbage collected even if it exists in the `WeakMap`. Also, `WeakMap` is not iterable.",
    options: [
      { text: "Keys must be objects and are held weakly, allowing them to be garbage collected when no other references exist", is_correct: true },
      { text: "WeakMap has a maximum capacity of 16 key-value pairs before throwing an error", is_correct: false },
      { text: "WeakMap values are always encrypted using SHA-256", is_correct: false },
      { text: "WeakMap allows duplicate keys whereas standard Map does not", is_correct: false }
    ]
  },
  {
    question_text: "What is the difference between `Promise.all()` and `Promise.allSettled()` in JavaScript?",
    category: "JavaScript",
    difficulty: "medium",
    explanation: "`Promise.all()` rejects immediately if any single promise rejects (fail-fast). `Promise.allSettled()` waits for all promises to finish regardless of whether they resolve or reject, returning an array of their status and results.",
    options: [
      { text: "`Promise.all` fails fast on the first rejection; `Promise.allSettled` waits for all promises to resolve or reject", is_correct: true },
      { text: "`Promise.allSettled` runs promises sequentially; `Promise.all` runs them in parallel", is_correct: false },
      { text: "`Promise.all` returns an iterator; `Promise.allSettled` returns a callback function", is_correct: false },
      { text: "`Promise.allSettled` can only take a maximum of 2 promises", is_correct: false }
    ]
  },
  {
    question_text: "In TypeScript, what does the `keyof` type operator produce?",
    category: "TypeScript",
    difficulty: "medium",
    explanation: "The `keyof` operator takes an object type and produces a string or numeric literal union of its keys (e.g. `keyof { id: number; name: string }` yields `'id' | 'name'`).",
    options: [
      { text: "A union of string or numeric literal types representing the keys of the given object type", is_correct: true },
      { text: "An array of runtime object property names at execution time", is_correct: false },
      { text: "The primitive type of the first property defined in an interface", is_correct: false },
      { text: "A boolean indicating whether an object has own properties", is_correct: false }
    ]
  },
  {
    question_text: "In Node.js, how does `process.nextTick()` differ from `setImmediate()`?",
    category: "JavaScript",
    difficulty: "hard",
    explanation: "`process.nextTick()` fires immediately after the current operation completes, before the event loop continues. `setImmediate()` schedules a callback in the Check phase of the event loop after I/O events.",
    options: [
      { text: "`process.nextTick()` executes immediately after current execution before the event loop continues; `setImmediate()` runs in the event loop's check phase", is_correct: true },
      { text: "`setImmediate()` executes before microtasks; `process.nextTick()` runs on an OS background thread", is_correct: false },
      { text: "`process.nextTick()` has a 1-second delay; `setImmediate()` has no delay", is_correct: false },
      { text: "They are identical aliases for scheduling callbacks in the timers phase", is_correct: false }
    ]
  },
  {
    question_text: "What is a `Symbol` in JavaScript and what is its primary characteristic?",
    category: "JavaScript",
    difficulty: "medium",
    explanation: "`Symbol` is a primitive data type introduced in ES6. Every symbol value returned from `Symbol()` is completely unique and immutable, making them ideal as non-colliding object property keys.",
    options: [
      { text: "A unique, immutable primitive value frequently used to create non-colliding object property keys", is_correct: true },
      { text: "A special HTML tag used to render SVG graphics dynamically", is_correct: false },
      { text: "A mutable data structure equivalent to an expandable circular buffer", is_correct: false },
      { text: "A floating-point representation of ASCII characters", is_correct: false }
    ]
  },
  {
    question_text: "In TypeScript, what does the utility type `Record<K, T>` construct?",
    category: "TypeScript",
    difficulty: "easy",
    explanation: "`Record<K, T>` constructs an object type whose property keys are of type `K` and whose property values are of type `T`.",
    options: [
      { text: "An object type whose property keys are of type `K` and property values are of type `T`", is_correct: true },
      { text: "An immutable tuple containing exactly `K` elements of type `T`", is_correct: false },
      { text: "A database transaction row mapping type used exclusively by ORMs", is_correct: false },
      { text: "A function signature that returns a promise of type `T`", is_correct: false }
    ]
  },
  {
    question_text: "What is the purpose of the `AbortController` API in modern JavaScript?",
    category: "JavaScript",
    difficulty: "medium",
    explanation: "`AbortController` provides a way to abort one or more asynchronous operations, such as DOM fetch requests or event listeners, on demand via an `AbortSignal`.",
    options: [
      { text: "To cancel and abort asynchronous operations (such as fetch HTTP requests) on demand", is_correct: true },
      { text: "To prevent uncaught exceptions from crashing Node.js child processes", is_correct: false },
      { text: "To terminate the browser window when high memory consumption is detected", is_correct: false },
      { text: "To immediately revoke user authentication cookies upon logout", is_correct: false }
    ]
  },


  {
    question_text: "In Python, what is guaranteed by using the `with` statement with a Context Manager?",
    category: "Python",
    difficulty: "easy",
    explanation: "The `with` statement guarantees that the `__exit__` method is called to release resources (like closing files or network sockets) even if an exception occurs inside the block.",
    options: [
      { text: "Guarantees cleanup code (`__exit__`) will be executed even if an exception occurs inside the block", is_correct: true },
      { text: "Runs the enclosed code block inside an isolated Docker container", is_correct: false },
      { text: "Converts synchronous functions into async coroutines automatically", is_correct: false },
      { text: "Disables all Python logging while the block is executing", is_correct: false }
    ]
  },
  {
    question_text: "What is the primary memory optimization benefit of defining `__slots__` in a Python class?",
    category: "Python",
    difficulty: "hard",
    explanation: "By default, Python instances store attributes in a dynamic `__dict__`. Defining `__slots__` prevents the creation of `__dict__` for each instance, saving significant memory when creating millions of small objects.",
    options: [
      { text: "Prevents the allocation of a per-instance `__dict__`, significantly reducing memory consumption for large numbers of instances", is_correct: true },
      { text: "Enables multi-core hardware threading by unlocking the Global Interpreter Lock (GIL)", is_correct: false },
      { text: "Enforces strict static type compilation into machine code using Cython", is_correct: false },
      { text: "Allows class attributes to be shared across distributed network nodes", is_correct: false }
    ]
  },
  {
    question_text: "What is the difference between `asyncio.gather()` and sequentially awaiting multiple coroutines in Python?",
    category: "Python",
    difficulty: "medium",
    explanation: "`asyncio.gather()` runs multiple coroutines concurrently in the event loop and collects their results, whereas sequential `await` calls wait for each coroutine to finish before starting the next.",
    options: [
      { text: "`asyncio.gather()` runs coroutines concurrently on the event loop, whereas sequential awaits run one after the other", is_correct: true },
      { text: "`asyncio.gather()` creates separate OS processes, while sequential awaits use threads", is_correct: false },
      { text: "`asyncio.gather()` can only be used with HTTP GET requests", is_correct: false },
      { text: "Sequential awaits are non-blocking, while `asyncio.gather()` blocks the main thread", is_correct: false }
    ]
  },
  {
    question_text: "What does the `@property` decorator in Python allow a developer to do?",
    category: "Python",
    difficulty: "easy",
    explanation: "The `@property` decorator allows a method to be accessed like an attribute, providing clean getter (and optional setter/deleter) encapsulation without changing public API syntax.",
    options: [
      { text: "Allows a class method to be accessed like an attribute while encapsulating getter and setter logic", is_correct: true },
      { text: "Declares a class attribute as private and prevents child classes from reading it", is_correct: false },
      { text: "Exports the class attribute to an external environment variable file", is_correct: false },
      { text: "Automatically synchronizes the attribute value with an active Redis key", is_correct: false }
    ]
  },
  {
    question_text: "In Python, what is the difference between `copy.copy()` and `copy.deepcopy()`?",
    category: "Python",
    difficulty: "medium",
    explanation: "`copy.copy()` constructs a new compound object and inserts references to the original objects (shallow copy). `copy.deepcopy()` recursively copies all nested objects, producing a fully independent clone.",
    options: [
      { text: "`copy()` creates a shallow copy with references to nested objects; `deepcopy()` recursively duplicates all nested objects", is_correct: true },
      { text: "`deepcopy()` only copies primitive types; `copy()` copies complex class instances", is_correct: false },
      { text: "`deepcopy()` writes the copy to disk; `copy()` keeps it in RAM", is_correct: false },
      { text: "`copy()` retains immutability; `deepcopy()` makes all fields mutable", is_correct: false }
    ]
  },
  {
    question_text: "What happens in Python when an exception occurs inside a `try` block that has a `finally` clause?",
    category: "Python",
    difficulty: "easy",
    explanation: "The `finally` clause is always executed before exiting the `try` block, regardless of whether an exception was raised, caught, or unhandled.",
    options: [
      { text: "The `finally` block is guaranteed to execute before the try/except statement finishes", is_correct: true },
      { text: "The `finally` block is only executed if an exception was caught by an `except` clause", is_correct: false },
      { text: "The `finally` block is executed only if no exceptions occurred at all", is_correct: false },
      { text: "The `finally` block catches all exceptions and silences them automatically", is_correct: false }
    ]
  },


  {
    question_text: "What is the fundamental difference between a Process and a Thread in modern operating systems?",
    category: "Operating Systems",
    difficulty: "medium",
    explanation: "A Process has its own dedicated address space and independent system resources. Threads belonging to the same process share the process's memory space, code, and heap, but each has its own call stack and program counter.",
    options: [
      { text: "Processes have isolated address spaces; Threads share the memory space (heap) of their parent process", is_correct: true },
      { text: "Threads have isolated memory; Processes share heap memory with other processes", is_correct: false },
      { text: "A Process can only run on a single CPU core, while a Thread automatically runs across all cores", is_correct: false },
      { text: "Threads are managed exclusively by the BIOS hardware, not by the operating system kernel", is_correct: false }
    ]
  },
  {
    question_text: "What is a File Descriptor in Unix/Linux operating systems?",
    category: "Operating Systems",
    difficulty: "medium",
    explanation: "A file descriptor is an integer handle that the operating system kernel uses to identify an open file, network socket, pipe, or I/O resource for a specific process.",
    options: [
      { text: "An unsigned integer used by the kernel to identify and track open I/O resources (files, sockets, pipes)", is_correct: true },
      { text: "A descriptive metadata tag that labels the file author and creation date", is_correct: false },
      { text: "A physical partition table stored in the hard disk master boot record", is_correct: false },
      { text: "A cryptographic checksum verifying file integrity on disk", is_correct: false }
    ]
  },
  {
    question_text: "What is the key difference between Unix signals `SIGTERM` (15) and `SIGKILL` (9)?",
    category: "Operating Systems",
    difficulty: "medium",
    explanation: "`SIGTERM` politely requests a process to terminate, allowing it to catch the signal, flush data, close connections, and shut down gracefully. `SIGKILL` cannot be caught or ignored and immediately terminates the process via the kernel.",
    options: [
      { text: "`SIGTERM` can be caught to perform a graceful shutdown; `SIGKILL` cannot be caught or ignored and kills the process immediately", is_correct: true },
      { text: "`SIGKILL` gives the process 30 seconds to clean up; `SIGTERM` terminates immediately", is_correct: false },
      { text: "`SIGTERM` is only for background daemons; `SIGKILL` is only for foreground terminals", is_correct: false },
      { text: "`SIGTERM` restarts the process; `SIGKILL` pauses it indefinitely", is_correct: false }
    ]
  },
  {
    question_text: "In operating systems, what is Virtual Memory?",
    category: "Operating Systems",
    difficulty: "medium",
    explanation: "Virtual Memory provides an abstraction over physical RAM, giving each process a contiguous, protected address space and using paging to swap data between physical RAM and secondary storage when necessary.",
    options: [
      { text: "A memory management capability that provides an abstracted, isolated address space and maps virtual pages to physical RAM or disk", is_correct: true },
      { text: "A RAM module simulated over a local area network using SMB protocols", is_correct: false },
      { text: "A temporary cache stored exclusively inside CPU L1 cache registers", is_correct: false },
      { text: "A cloud-based memory backup service provided by hosting providers", is_correct: false }
    ]
  },
  {
    question_text: "What is the primary function of the Domain Name System (DNS)?",
    category: "Networking",
    difficulty: "easy",
    explanation: "DNS translates human-readable domain names (such as `example.com`) into machine-routable IP addresses (such as `93.184.216.34` or IPv6 equivalents).",
    options: [
      { text: "To resolve human-friendly domain names into machine-readable IP addresses", is_correct: true },
      { text: "To encrypt HTTP payloads between the browser and web servers", is_correct: false },
      { text: "To assign dynamic MAC addresses to network switches", is_correct: false },
      { text: "To compress video streaming packets over UDP", is_correct: false }
    ]
  },
  {
    question_text: "What is the key difference between TCP (Transmission Control Protocol) and UDP (User Datagram Protocol)?",
    category: "Networking",
    difficulty: "easy",
    explanation: "TCP is connection-oriented, reliable, and guarantees in-order packet delivery with error checking and flow control. UDP is connectionless, lightweight, and does not guarantee delivery or packet ordering, making it ideal for low-latency streaming and gaming.",
    options: [
      { text: "TCP is connection-oriented and guarantees ordered, reliable delivery; UDP is connectionless and prioritizes low latency over reliability", is_correct: true },
      { text: "UDP requires a 3-way handshake; TCP does not require connection establishment", is_correct: false },
      { text: "TCP only works over fiber optic cables; UDP works over copper cables", is_correct: false },
      { text: "UDP packets are encrypted by default; TCP packets are always plaintext", is_correct: false }
    ]
  },
  {
    question_text: "What major performance problem of HTTP/1.1 did multiplexing in HTTP/2 solve?",
    category: "Networking",
    difficulty: "medium",
    explanation: "In HTTP/1.1, Head-of-Line (HoL) blocking meant a slow or stalled request at the front of a TCP connection blocked all subsequent requests on that connection. HTTP/2 multiplexes multiple independent request/response streams concurrently over a single TCP connection.",
    options: [
      { text: "Application-layer Head-of-Line (HoL) blocking, allowing multiple requests and responses concurrently over a single TCP connection", is_correct: true },
      { text: "Eliminated the need for DNS lookups by hardcoding IP tables in browsers", is_correct: false },
      { text: "Removed the 404 Not Found error code to make web browsing seamless", is_correct: false },
      { text: "Prevented network switches from dropping UDP packets during peak traffic", is_correct: false }
    ]
  },
  {
    question_text: "What is a Deadlock in concurrent systems, and which of the following is one of the four Coffman conditions required for a deadlock to occur?",
    category: "Operating Systems",
    difficulty: "hard",
    explanation: "A deadlock is a situation where a set of processes are blocked because each process is holding a resource and waiting for another resource held by another process. The four Coffman conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.",
    options: [
      { text: "A state where processes cannot proceed because each holds resources another needs; 'Circular Wait' is one of the four required conditions", is_correct: true },
      { text: "A memory leak caused by unclosed file handles; resolved by running garbage collection", is_correct: false },
      { text: "A network routing loop caused by misconfigured BGP routers; requires restarting the firewall", is_correct: false },
      { text: "A situation where CPU clock speed drops below 1 GHz due to thermal throttling", is_correct: false }
    ]
  }
];
