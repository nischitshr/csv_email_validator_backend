
# **Backend Notes – CSV Email Validation System**

## **1. Project Overview**

**Goal:**
To process a CSV file containing email addresses and determine which emails are deliverable, non-deliverable, disposable, or role-based.

**Key Features Implemented:**

1. Syntax validation
2. Domain validation
3. MX record validation
4. Disposable email detection
5. Role-based email detection
6. Deliverable/Non-deliverable classification
7. Handling CSV input and output JSON result

---

## **2. Tech Stack**

| Layer           | Technology / Library             | Purpose                                               |
| --------------- | -------------------------------- | ----------------------------------------------------- |
| Backend         | NestJS                           | Framework for building the service                    |
| CSV Parsing     | fast-csv                         | Read and parse CSV files                              |
| Validation      | validator.js                     | Check syntax of emails                                |
| DNS Checks      | Node `dns` module (promises)     | Check domain existence and MX records                 |
| File Handling   | Node `stream` and Express Multer | Read CSV uploads from client                          |
| Data Structures | Arrays & Objects                 | Store deliverable, non-deliverable, and detailed info |

---

## **3. Email Validation Flow**

### **Step 1 – CSV Input**

* CSV file is uploaded via an API endpoint.
* CSV file is read as a buffer and converted into a stream for parsing.

### **Step 2 – Parsing CSV**

* `fast-csv` parses each row.
* Only the `email` column is considered.
* Empty rows are ignored.

### **Step 3 – Syntax Validation**

* Using `validator.isEmail(email)`
* Ensures the email has correct format: `local@domain.tld`
* Example:

  * ✅ `john.doe@example.com`
  * ❌ `invalid-email`

### **Step 4 – Domain Validation**

* Extract domain: `email.split('@')[1]`
* Check if domain exists using `dns.lookup(domain)`
* If lookup fails → domain is invalid

### **Step 5 – MX Record Check**

* Check for mail exchange records: `dns.resolveMx(domain)`
* MX record exists → domain can receive emails

### **Step 6 – Disposable Email Detection**

* Compare domain against a **predefined disposable domain list**:
  `['10minutemail.com', 'mailinator.com', 'tempmail.com']`
* Emails from these domains are marked **non-deliverable**

### **Step 7 – Role-Based Email Detection**

* Check if the local part starts with common role prefixes:
  `['info', 'admin', 'support', 'contact', 'sales']`
* Role-based emails are marked **non-deliverable** (optional depending on use case)

### **Step 8 – Deliverable Determination**

* Email is considered **deliverable** if:

```text
syntaxValid && domainValid && mxValid && !disposable && !roleBased
```

---

## **4. Data Structure for Output**

```ts
{
  total: number;                    // Total emails processed
  deliverableCount: number;         // Count of valid emails
  undeliverableCount: number;       // Count of invalid emails
  deliverableEmails: string[];      // List of valid emails
  nonDeliverableEmails: string[];   // List of invalid emails
  details: [
    {
      email: string;
      syntaxValid: boolean;
      domainValid: boolean;
      mxValid: boolean;
      disposable: boolean;
      roleBased: boolean;
      deliverable: boolean;
    }
  ]
}
```

---

## **5. Backend Implementation Highlights**

* **Service:** `EmailService` handles all logic.
* **Async Handling:** All DNS checks are async with `await`.
* **CSV Stream Parsing:** Efficiently handles large files without loading the entire file into memory.
* **Extensible:** Can easily add more disposable domains, role-based prefixes, or validation rules.

---

## **6. Current Status**

✅ CSV parsing implemented
✅ Syntax, domain, MX validation implemented
✅ Disposable & role-based detection implemented
✅ Deliverable/non-deliverable counts & details generated
✅ Supports ~100+ emails; can scale to 500+ with streaming
