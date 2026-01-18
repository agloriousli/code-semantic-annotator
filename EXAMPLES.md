# Example Code Snippets

Try these C++ code snippets to explore semantic decomposition:

## 1. Simple Factorial (Default)
```cpp
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
```

**What to look for:**
- Recursive structure
- Base case vs recursive case
- Return statements
- Comparison and arithmetic operators

---

## 2. Array Sum
```cpp
int sum(int arr[], int size) {
    int total = 0;
    for (int i = 0; i < size; i++) {
        total += arr[i];
    }
    return total;
}
```

**What to look for:**
- Loop constructs
- Array indexing
- Accumulator pattern
- Compound assignment operator

---

## 3. Simple Class Definition
```cpp
class Rectangle {
    int width;
    int height;
public:
    Rectangle(int w, int h) {
        width = w;
        height = h;
    }
};
```

**What to look for:**
- Class declaration
- Member variables (public/private)
- Constructor
- Initialization

---

## 4. Pointer Arithmetic
```cpp
void increment(int* ptr) {
    (*ptr)++;
}
```

**What to look for:**
- Pointer declaration and dereferencing
- Unary operators
- Function parameters
- Memory manipulation

---

## 5. Template Function
```cpp
template<typename T>
T max(T a, T b) {
    return a > b ? a : b;
}
```

**What to look for:**
- Template syntax
- Type parameters
- Conditional (ternary) operator
- Generic programming concepts

---

## 6. String Processing
```cpp
bool isPalindrome(std::string s) {
    for (int i = 0; i < s.length() / 2; i++) {
        if (s[i] != s[s.length() - 1 - i])
            return false;
    }
    return true;
}
```

**What to look for:**
- String operations
- Character comparison
- Array/string indexing
- Early return pattern

---

## 7. Linked List Node
```cpp
struct Node {
    int data;
    Node* next;
};
```

**What to look for:**
- Struct definition
- Self-referential pointers
- Member variables
- Data structure design

---

## 8. Simple Swap
```cpp
void swap(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}
```

**What to look for:**
- Reference parameters
- Variable declaration and assignment
- Temporary value pattern
- Side effects on parameters

---

## Tips for Best Results

1. **Start simple**: Begin with single functions, not entire programs
2. **Add comments**: Some code is clearer with inline context
3. **Use standard libraries**: The model understands `std` namespace well
4. **Test edge cases**: Include boundary conditions in your thinking
5. **Explore recursively**: Click deep into the semantic tree to understand composition

## How to Use These

1. Copy any snippet above
2. Paste into the code input area
3. Click "Analyze Code"
4. Explore the semantic tree interactively
5. Compare with other snippets to see different decomposition patterns

Happy exploring! 🔍
