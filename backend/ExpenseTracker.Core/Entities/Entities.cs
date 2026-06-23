namespace ExpenseTracker.Core.Entities;

public class User
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public string Currency { get; set; } = "PKR";
    public string Theme { get; set; } = "light";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public ICollection<Account> Accounts { get; set; } = [];
    public ICollection<Category> Categories { get; set; } = [];
    public ICollection<Transaction> Transactions { get; set; } = [];
    public ICollection<Budget> Budgets { get; set; } = [];
    public ICollection<Goal> Goals { get; set; } = [];
    public ICollection<RecurringTransaction> RecurringTransactions { get; set; } = [];
    public ICollection<Tag> Tags { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
}

public class Account
{
    public int AccountId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Cash";
    public decimal Balance { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = [];
}

public class Category
{
    public int CategoryId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Expense";
    public string Color { get; set; } = "#6366f1";
    public string Icon { get; set; } = "fa-tag";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = [];
    public ICollection<Budget> Budgets { get; set; } = [];
}

public class Transaction
{
    public int TransactionId { get; set; }
    public int UserId { get; set; }
    public int AccountId { get; set; }
    public int CategoryId { get; set; }
    public string Type { get; set; } = "Expense";
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public int? TransferToAccountId { get; set; }

    public User User { get; set; } = null!;
    public Account Account { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public Account? TransferToAccount { get; set; }
    public ICollection<Attachment> Attachments { get; set; } = [];
    public ICollection<TransactionTag> TransactionTags { get; set; } = [];
}

public class Budget
{
    public int BudgetId { get; set; }
    public int UserId { get; set; }
    public int? CategoryId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Category? Category { get; set; }
}

public class Goal
{
    public int GoalId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateTime? TargetDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<GoalContribution> Contributions { get; set; } = [];
}

public class GoalContribution
{
    public int ContributionId { get; set; }
    public int GoalId { get; set; }
    public decimal Amount { get; set; }
    public DateTime DateAdded { get; set; } = DateTime.UtcNow;

    public Goal Goal { get; set; } = null!;
}

public class RecurringTransaction
{
    public int RecurringId { get; set; }
    public int UserId { get; set; }
    public int AccountId { get; set; }
    public int CategoryId { get; set; }
    public string Type { get; set; } = "Expense";
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string Frequency { get; set; } = "Monthly";
    public DateTime NextDueDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Account Account { get; set; } = null!;
    public Category Category { get; set; } = null!;
}

public class Attachment
{
    public int AttachmentId { get; set; }
    public int TransactionId { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Transaction Transaction { get; set; } = null!;
}

public class Tag
{
    public int TagId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;

    public User User { get; set; } = null!;
    public ICollection<TransactionTag> TransactionTags { get; set; } = [];
}

public class TransactionTag
{
    public int TransactionId { get; set; }
    public int TagId { get; set; }

    public Transaction Transaction { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}

public class Notification
{
    public int NotificationId { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public class AuditLog
{
    public int AuditId { get; set; }
    public int? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
