# Verification Tests

This folder contains verification scripts used to validate critical bug fixes.

## Double Registration Fix Verification (`verify_concurrency.py`)

This script validates the fix for the "Double Registration" race condition.

### Purpose
It simulates concurrent registration requests for the same email address to ensure that:
1.  Exactly one request succeeds (200 OK).
2.  Duplicate requests are rejected (400 Bad Request) by the backend.
3.  No 500 errors occur (idempotency/integrity handling works).

### How to Run

1.  Set up the Python environment:
    ```bash
    source .venv/bin/activate
    pip install httpx
    ```

2.  Run the script:
    ```bash
    PYTHONPATH=. python tests/verify_concurrency.py
    ```

### Expected Output
```
✅ PASSED: Race condition handled correctly.
   - Exactly 1 request succeeded.
   - Duplicates were rejected with 400 Bad Request.
```
