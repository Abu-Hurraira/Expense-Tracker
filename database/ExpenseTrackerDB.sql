-- ExpenseTrackerDB - SQL Server Schema
-- Run on local SQL Server instance

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ExpenseTrackerDB')
    CREATE DATABASE ExpenseTrackerDB;
GO

USE ExpenseTrackerDB;
GO

-- Users
IF OBJECT_ID('dbo.Users', 'U') IS NULL
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL DEFAULT 'User',
    Currency NVARCHAR(10) NOT NULL DEFAULT 'PKR',
    Theme NVARCHAR(10) NOT NULL DEFAULT 'light',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    LastLoginAt DATETIME NULL
);

-- Accounts
IF OBJECT_ID('dbo.Accounts', 'U') IS NULL
CREATE TABLE Accounts (
    AccountId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
    Name NVARCHAR(50) NOT NULL,
    Type NVARCHAR(20) NOT NULL, -- Cash, Bank, Wallet
    Balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- Categories
IF OBJECT_ID('dbo.Categories', 'U') IS NULL
CREATE TABLE Categories (
    CategoryId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
    Name NVARCHAR(50) NOT NULL,
    Type NVARCHAR(10) NOT NULL, -- Income, Expense
    Color NVARCHAR(20) NOT NULL DEFAULT '#6366f1',
    Icon NVARCHAR(50) NOT NULL DEFAULT 'fa-tag',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- Transactions
IF OBJECT_ID('dbo.Transactions', 'U') IS NULL
CREATE TABLE Transactions (
    TransactionId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
    AccountId INT NOT NULL FOREIGN KEY REFERENCES Accounts(AccountId),
    CategoryId INT NOT NULL FOREIGN KEY REFERENCES Categories(CategoryId),
    Type NVARCHAR(10) NOT NULL, -- Income, Expense, Transfer
    Amount DECIMAL(18,2) NOT NULL,
    Description NVARCHAR(255) NULL,
    Notes NVARCHAR(500) NULL,
    TransactionDate DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    TransferToAccountId INT NULL FOREIGN KEY REFERENCES Accounts(AccountId)
);

-- Budgets
IF OBJECT_ID('dbo.Budgets', 'U') IS NULL
CREATE TABLE Budgets (
    BudgetId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
    CategoryId INT NULL FOREIGN KEY REFERENCES Categories(CategoryId),
    Month INT NOT NULL,
    Year INT NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- Goals
IF OBJECT_ID('dbo.Goals', 'U') IS NULL
CREATE TABLE Goals (
    GoalId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
    Name NVARCHAR(100) NOT NULL,
    TargetAmount DECIMAL(18,2) NOT NULL,
    CurrentAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    TargetDate DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- GoalContributions
IF OBJECT_ID('dbo.GoalContributions', 'U') IS NULL
CREATE TABLE GoalContributions (
    ContributionId INT PRIMARY KEY IDENTITY(1,1),
    GoalId INT NOT NULL FOREIGN KEY REFERENCES Goals(GoalId) ON DELETE CASCADE,
    Amount DECIMAL(18,2) NOT NULL,
    DateAdded DATETIME NOT NULL DEFAULT GETDATE()
);

-- RecurringTransactions
IF OBJECT_ID('dbo.RecurringTransactions', 'U') IS NULL
CREATE TABLE RecurringTransactions (
    RecurringId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
    AccountId INT NOT NULL FOREIGN KEY REFERENCES Accounts(AccountId),
    CategoryId INT NOT NULL FOREIGN KEY REFERENCES Categories(CategoryId),
    Type NVARCHAR(10) NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Description NVARCHAR(255) NULL,
    Frequency NVARCHAR(20) NOT NULL, -- Daily, Weekly, Monthly, Yearly
    NextDueDate DATETIME NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- Attachments
IF OBJECT_ID('dbo.Attachments', 'U') IS NULL
CREATE TABLE Attachments (
    AttachmentId INT PRIMARY KEY IDENTITY(1,1),
    TransactionId INT NOT NULL FOREIGN KEY REFERENCES Transactions(TransactionId) ON DELETE CASCADE,
    FilePath NVARCHAR(500) NOT NULL,
    FileName NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- Tags
IF OBJECT_ID('dbo.Tags', 'U') IS NULL
CREATE TABLE Tags (
    TagId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
    Name NVARCHAR(50) NOT NULL
);

-- TransactionTags
IF OBJECT_ID('dbo.TransactionTags', 'U') IS NULL
CREATE TABLE TransactionTags (
    TransactionId INT NOT NULL FOREIGN KEY REFERENCES Transactions(TransactionId) ON DELETE CASCADE,
    TagId INT NOT NULL FOREIGN KEY REFERENCES Tags(TagId) ON DELETE CASCADE,
    PRIMARY KEY (TransactionId, TagId)
);

-- Notifications
IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
CREATE TABLE Notifications (
    NotificationId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
    Title NVARCHAR(100) NOT NULL,
    Message NVARCHAR(255) NOT NULL,
    IsRead BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- AuditLogs
IF OBJECT_ID('dbo.AuditLogs', 'U') IS NULL
CREATE TABLE AuditLogs (
    AuditId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NULL FOREIGN KEY REFERENCES Users(UserId) ON DELETE SET NULL,
    Action NVARCHAR(50) NOT NULL,
    EntityType NVARCHAR(50) NOT NULL,
    EntityId INT NULL,
    Details NVARCHAR(500) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- Performance Indexes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Transactions_UserId')
    CREATE INDEX IX_Transactions_UserId ON Transactions(UserId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Transactions_TransactionDate')
    CREATE INDEX IX_Transactions_TransactionDate ON Transactions(TransactionDate);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Transactions_CategoryId')
    CREATE INDEX IX_Transactions_CategoryId ON Transactions(CategoryId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Transactions_UserId_Date')
    CREATE INDEX IX_Transactions_UserId_Date ON Transactions(UserId, TransactionDate);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Budgets_UserId_Month_Year')
    CREATE INDEX IX_Budgets_UserId_Month_Year ON Budgets(UserId, Year, Month);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Categories_UserId')
    CREATE INDEX IX_Categories_UserId ON Categories(UserId);
GO
