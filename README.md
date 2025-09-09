# ALX Polly: A Secure Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. Create, share, and vote on polls with QR code sharing capabilities and robust security features.

## 📋 Project Overview

ALX Polly is a modern web application that enables users to:

- **Create Polls**: Design custom polls with multiple choice options
- **Share Easily**: Generate unique links and QR codes for poll sharing
- **Vote Securely**: Cast votes with authentication and validation
- **Manage Content**: View results, edit polls, and manage your content
- **Admin Features**: Administrative panel for user and content management

### Key Features

- 🔐 **Secure Authentication**: User registration and login with Supabase Auth
- 📊 **Poll Creation**: Intuitive poll builder with multiple options
- 🔗 **Easy Sharing**: Unique URLs and QR codes for poll distribution
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 👥 **User Management**: Personal dashboard for poll management
- 🛡️ **Security Hardened**: Protection against common web vulnerabilities
- ⚡ **Real-time Updates**: Live vote counting and results

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **QR Code Generation**: qrcode.react

### Backend & Database
- **Backend as a Service**: [Supabase](https://supabase.io/)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime

### Development & Deployment
- **Package Manager**: npm
- **Development**: Next.js Dev Server
- **Deployment**: Vercel (recommended)
- **Environment**: Node.js 18+

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

## 🚀 Getting Started

Follow these steps to set up ALX Polly on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18.0 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A [Supabase](https://supabase.io/) account (free tier available)
- Git for version control

### 1. Clone the Repository

```bash
git clone https://github.com/Developer-Linus/alx-polly.git
cd alx-polly
```

### 2. Install Dependencies

Install all required packages:

```bash
npm install
```

### 3. Supabase Setup

#### Create a New Supabase Project

1. Go to [Supabase](https://supabase.io/) and sign in
2. Click "New Project"
3. Choose your organization and enter project details:
   - **Name**: `alx-polly` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for setup to complete

#### Configure Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Create the required tables by running this SQL:

```sql
-- Create profiles table for user data
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view active polls" ON polls
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own polls" ON polls
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own polls" ON polls
  FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can view votes" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

3. Go to **Authentication > Settings** and configure:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: `http://localhost:3000/auth/callback`

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```bash
touch .env.local
```

Add your Supabase credentials (found in Project Settings > API):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Next.js Configuration
NEXTAUTH_SECRET=your_random_secret_key_here
NEXTAUTH_URL=http://localhost:3000
```

**To find your Supabase keys:**
1. Go to your Supabase project dashboard
2. Click on **Settings** → **API**
3. Copy the **Project URL** and **anon/public key**
4. Copy the **service_role key** (keep this secret!)

### 5. Run the Development Server

Start the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### 6. Create Your First Admin User

1. Register a new account through the application
2. In your Supabase dashboard, go to **Authentication > Users**
3. Find your user and note the UUID
4. Go to **Table Editor > profiles**
5. Update your user's role from 'user' to 'admin'
6. You can now access the admin panel at `/admin`

---

## 📱 Usage Guide

Here's how to use ALX Polly's key features:

### Creating Your First Poll

1. **Sign Up/Login**
   - Navigate to `/register` to create a new account
   - Or login at `/login` if you already have an account

2. **Create a Poll**
   - Click "Create Poll" from the main dashboard
   - Fill in the poll details:
     ```
     Title: "What's your favorite programming language?"
     Description: "Help us understand developer preferences"
     Options:
     - JavaScript
     - Python
     - TypeScript
     - Go
     ```
   - Click "Create Poll" to publish

3. **Share Your Poll**
   - After creation, you'll get a unique poll URL: `https://yourapp.com/polls/abc123`
   - Use the generated QR code to share on social media or print materials
   - Copy the direct link to share via email or messaging apps

### Voting on Polls

1. **Access a Poll**
   - Click on a shared poll link or scan a QR code
   - No account required for voting (anonymous voting supported)

2. **Cast Your Vote**
   - Select your preferred option from the list
   - Click "Vote" to submit your choice
   - View real-time results immediately after voting

3. **View Results**
   - See live vote counts and percentages
   - Results update in real-time as others vote
   - Visual charts show the distribution of votes

### Managing Your Polls

1. **View Your Polls**
   - Go to "My Polls" to see all polls you've created
   - Filter by active/inactive status
   - Sort by creation date or vote count

2. **Edit a Poll**
   - Click "Edit" on any of your polls
   - Modify title, description, or add new options
   - Toggle poll active/inactive status

3. **Delete a Poll**
   - Click "Delete" to permanently remove a poll
   - All associated votes will also be deleted
   - This action cannot be undone

### QR Code Sharing

1. **Generate QR Code**
   - Every poll automatically gets a QR code
   - QR code links directly to the voting page
   - Perfect for physical events, presentations, or printed materials

2. **Download QR Code**
   - Right-click on the QR code to save as image
   - Use in presentations, flyers, or social media posts
   - QR codes work on all modern smartphones

### Admin Features (Admin Users Only)

1. **Access Admin Panel**
   - Navigate to `/admin` (requires admin role)
   - View system-wide statistics and user management

2. **Manage All Polls**
   - View, edit, or delete any poll in the system
   - Monitor poll activity and user engagement
   - Export poll data for analysis

3. **User Management**
   - View all registered users
   - Promote users to admin status
   - Monitor user activity and poll creation

---

## 🧪 Testing the Application

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Manual Testing Checklist

**Authentication Flow:**
- [ ] User registration works correctly
- [ ] Email validation is enforced
- [ ] Login/logout functionality works
- [ ] Password requirements are enforced
- [ ] Session persistence across browser refreshes

**Poll Creation:**
- [ ] Can create polls with multiple options
- [ ] Form validation prevents empty submissions
- [ ] QR codes generate correctly
- [ ] Poll URLs are unique and accessible

**Voting System:**
- [ ] Anonymous users can vote
- [ ] Authenticated users can vote
- [ ] Duplicate voting is prevented
- [ ] Real-time results update correctly
- [ ] Vote counts are accurate

**Security Features:**
- [ ] Users can only edit/delete their own polls
- [ ] Admin panel is restricted to admin users
- [ ] SQL injection protection is working
- [ ] XSS protection is in place
- [ ] CSRF protection is enabled

### Performance Testing

```bash
# Build for production
npm run build

# Start production server
npm start

# Run Lighthouse audit
npx lighthouse http://localhost:3000 --output html
```

### Database Testing

1. **Test Row Level Security (RLS)**
   - Verify users can only access their own data
   - Test admin permissions work correctly
   - Ensure anonymous voting is properly handled

2. **Test Data Integrity**
   - Create polls with various option counts
   - Test voting with multiple users
   - Verify vote counts match database records

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
