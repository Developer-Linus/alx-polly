# ALX Polly: A Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. This project serves as a practical learning ground for modern web development concepts, with a special focus on identifying and fixing common security vulnerabilities.

## About the Application

ALX Polly allows authenticated users to create, share, and vote on polls. It's a simple yet powerful application that demonstrates key features of modern web development:

-   **Authentication**: Secure user sign-up and login.
-   **Poll Management**: Users can create, view, and delete their own polls.
-   **Voting System**: A straightforward system for casting and viewing votes.
-   **User Dashboard**: A personalized space for users to manage their polls.

The application is built with a modern tech stack:

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Backend & Database**: [Supabase](https://supabase.io/)
-   **UI**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
-   **State Management**: React Server Components and Client Components

---

## 🚀 The Challenge: Security Audit & Remediation

As a developer, writing functional code is only half the battle. Ensuring that the code is secure, robust, and free of vulnerabilities is just as critical. This version of ALX Polly has been intentionally built with several security flaws, providing a real-world scenario for you to practice your security auditing skills.

**Your mission is to act as a security engineer tasked with auditing this codebase.**

### Your Objectives:

1.  **Identify Vulnerabilities**:
    -   Thoroughly review the codebase to find security weaknesses.
    -   Pay close attention to user authentication, data access, and business logic.
    -   Think about how a malicious actor could misuse the application's features.

2.  **Understand the Impact**:
    -   For each vulnerability you find, determine the potential impact.Query your AI assistant about it. What data could be exposed? What unauthorized actions could be performed?

3.  **Propose and Implement Fixes**:
    -   Once a vulnerability is identified, ask your AI assistant to fix it.
    -   Write secure, efficient, and clean code to patch the security holes.
    -   Ensure that your fixes do not break existing functionality for legitimate users.

### Where to Start?

A good security audit involves both static code analysis and dynamic testing. Here’s a suggested approach:

1.  **Familiarize Yourself with the Code**:
    -   Start with `app/lib/actions/` to understand how the application interacts with the database.
    -   Explore the page routes in the `app/(dashboard)/` directory. How is data displayed and managed?
    -   Look for hidden or undocumented features. Are there any pages not linked in the main UI?

2.  **Use Your AI Assistant**:
    -   This is an open-book test. You are encouraged to use AI tools to help you.
    -   Ask your AI assistant to review snippets of code for security issues.
    -   Describe a feature's behavior to your AI and ask it to identify potential attack vectors.
    -   When you find a vulnerability, ask your AI for the best way to patch it.

---

## Getting Started

To begin your security audit, you'll need to get the application running on your local machine.

### 1. Prerequisites

-   [Node.js](https://nodejs.org/) (v20.x or higher recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   A [Supabase](https://supabase.io/) account (the project is pre-configured, but you may need your own for a clean slate).

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd alx-polly
npm install
```

### 3. Environment Variables

The project uses Supabase for its backend. An environment file `.env.local` is needed.Use the keys you created during the Supabase setup process.

### 4. Running the Development Server

Start the application in development mode:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

Good luck, engineer! This is your chance to step into the shoes of a security professional and make a real impact on the quality and safety of this application. Happy hunting!

---

## 🔒 Security Fixes Implemented

This section documents the security vulnerabilities that were identified and remediated in the ALX Polly application. Each fix includes the vulnerability description, potential impact, and the solution implemented.

### 1. Admin Role-Based Access Control (RBAC)

**Vulnerability**: The admin panel at `/admin` was accessible to any authenticated user without proper role verification.

**Impact**: Any registered user could access administrative functions, potentially viewing all polls and user data.

**Fix**: 
- Implemented `requireAdmin()` middleware function in `auth-actions.ts`
- Added server-side admin role verification in the admin page
- Created proper error handling and redirects for unauthorized access

### 2. Insecure Direct Object Reference (IDOR) in Poll Deletion

**Vulnerability**: The `deletePoll` function didn't verify poll ownership, allowing users to delete any poll by manipulating the poll ID.

**Impact**: Users could delete polls belonging to other users, leading to data loss and service disruption.

**Fix**:
- Added ownership verification in `deletePoll` function
- Implemented admin override capability for legitimate administrative actions
- Added proper error messages for unauthorized deletion attempts

### 3. Missing Authorization in Poll Editing

**Vulnerability**: Poll editing functionality lacked proper ownership verification, allowing users to edit polls they didn't create.

**Impact**: Users could modify other users' polls, potentially spreading misinformation or disrupting poll integrity.

**Fix**:
- Created `getPollByIdForEdit` function with ownership verification
- Updated edit page to use secure poll fetching
- Added proper error handling and user-friendly access denied messages

### 4. Weak Authentication Middleware

**Vulnerability**: The authentication middleware lacked comprehensive session validation and security headers.

**Impact**: Potential session hijacking, clickjacking, and other client-side attacks.

**Fix**:
- Enhanced middleware with rate limiting capabilities
- Added security headers (X-Frame-Options, X-Content-Type-Options, CSP, etc.)
- Implemented robust session validation with age checks
- Added proper error handling for authentication failures

### 5. Client-Side Security Issues in Share Component

**Vulnerability**: The `vulnerable-share.tsx` component had multiple security issues:
- XSS vulnerability from unescaped poll titles
- Potential `window.open` abuse
- Lack of input sanitization

**Impact**: Cross-site scripting attacks, potential malicious redirects, and data exposure.

**Fix**:
- Created `secure-share.tsx` with proper input sanitization
- Added HTML escaping for dynamic content
- Implemented `noopener,noreferrer` attributes for external links
- Added UUID validation and text length limits

### 6. Comprehensive Input Validation

**Vulnerability**: Missing or inadequate input validation across forms and API endpoints.

**Impact**: Data corruption, injection attacks, and application crashes from malformed input.

**Fix**:
- Implemented Zod schemas for all user inputs
- Added client-side validation with real-time error feedback
- Enhanced server-side validation in all action functions
- Created reusable validation utilities and HTML sanitization functions

### Security Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security validation (client-side, server-side, database-level)
2. **Principle of Least Privilege**: Users can only access and modify their own resources
3. **Input Sanitization**: All user inputs are validated and sanitized before processing
4. **Secure Headers**: Comprehensive security headers to prevent common web attacks
5. **Error Handling**: Generic error messages to prevent information disclosure
6. **Session Security**: Robust session validation and management

### Testing Your Security Fixes

To verify the security improvements:

1. **Test RBAC**: Try accessing `/admin` with a non-admin account
2. **Test IDOR**: Attempt to delete/edit polls you don't own
3. **Test Input Validation**: Submit forms with invalid or malicious data
4. **Test XSS Prevention**: Try injecting scripts in poll titles and options
5. **Check Security Headers**: Use browser dev tools to verify security headers

These fixes transform ALX Polly from a vulnerable application into a security-hardened polling platform that follows modern web security best practices.
