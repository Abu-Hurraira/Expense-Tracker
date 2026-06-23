using ExpenseTracker.Core.DTOs;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Repositories;

public class UserRepository(AppDbContext db) : IUserRepository
{
    public Task<User?> GetByUsernameAsync(string username) =>
        db.Users.FirstOrDefaultAsync(u => u.Username == username);

    public Task<User?> GetByEmailAsync(string email) =>
        db.Users.FirstOrDefaultAsync(u => u.Email == email);

    public Task<User?> GetByIdAsync(int id) =>
        db.Users.FindAsync(id).AsTask();

    public async Task<User> CreateAsync(User user)
    {
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    public async Task UpdateAsync(User user)
    {
        db.Users.Update(user);
        await db.SaveChangesAsync();
    }
}

public class TransactionRepository(AppDbContext db) : ITransactionRepository
{
    private IQueryable<Transaction> BaseQuery(int userId) =>
        db.Transactions
            .Include(t => t.Account)
            .Include(t => t.Category)
            .Include(t => t.Attachments)
            .Include(t => t.TransactionTags).ThenInclude(tt => tt.Tag)
            .Where(t => t.UserId == userId);

    public async Task<(List<Transaction> Items, int Total)> GetFilteredAsync(int userId, TransactionFilterDto filter)
    {
        var query = BaseQuery(userId);

        if (!string.IsNullOrWhiteSpace(filter.Search))
            query = query.Where(t => (t.Description != null && t.Description.Contains(filter.Search)) ||
                                     (t.Notes != null && t.Notes.Contains(filter.Search)));

        if (filter.CategoryId.HasValue)
            query = query.Where(t => t.CategoryId == filter.CategoryId);

        if (!string.IsNullOrWhiteSpace(filter.Type))
            query = query.Where(t => t.Type == filter.Type);

        if (filter.StartDate.HasValue)
            query = query.Where(t => t.TransactionDate >= filter.StartDate);

        if (filter.EndDate.HasValue)
            query = query.Where(t => t.TransactionDate <= filter.EndDate);

        if (filter.Tags?.Count > 0)
            query = query.Where(t => t.TransactionTags.Any(tt => filter.Tags.Contains(tt.Tag.Name)));

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return (items, total);
    }

    public Task<Transaction?> GetByIdAsync(int id, int userId) =>
        BaseQuery(userId).FirstOrDefaultAsync(t => t.TransactionId == id);

    public async Task<Transaction> CreateAsync(Transaction transaction)
    {
        db.Transactions.Add(transaction);
        await db.SaveChangesAsync();
        return transaction;
    }

    public async Task UpdateAsync(Transaction transaction)
    {
        db.Transactions.Update(transaction);
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Transaction transaction)
    {
        db.Transactions.Remove(transaction);
        await db.SaveChangesAsync();
    }

    public Task<List<Transaction>> GetRecentAsync(int userId, int count) =>
        BaseQuery(userId).OrderByDescending(t => t.TransactionDate).Take(count).ToListAsync();

    public Task<decimal> GetMonthlyTotalAsync(int userId, string type, int month, int year) =>
        db.Transactions
            .Where(t => t.UserId == userId && t.Type == type &&
                        t.TransactionDate.Month == month && t.TransactionDate.Year == year)
            .SumAsync(t => t.Amount);

    public async Task<List<(int Year, int Month, decimal Income, decimal Expenses)>> GetMonthlyTrendAsync(int userId, int months)
    {
        var startDate = DateTime.UtcNow.AddMonths(-months + 1);
        startDate = new DateTime(startDate.Year, startDate.Month, 1);

        var data = await db.Transactions
            .Where(t => t.UserId == userId && t.TransactionDate >= startDate && t.Type != "Transfer")
            .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                Income = g.Where(t => t.Type == "Income").Sum(t => t.Amount),
                Expenses = g.Where(t => t.Type == "Expense").Sum(t => t.Amount)
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync();

        return data.Select(d => (d.Year, d.Month, d.Income, d.Expenses)).ToList();
    }

    public async Task<List<(string Name, string Color, decimal Amount)>> GetCategorySpendingAsync(int userId, int month, int year)
    {
        var data = await db.Transactions
            .Where(t => t.UserId == userId && t.Type == "Expense" &&
                        t.TransactionDate.Month == month && t.TransactionDate.Year == year)
            .GroupBy(t => new { t.Category.Name, t.Category.Color })
            .Select(g => new { g.Key.Name, g.Key.Color, Amount = g.Sum(t => t.Amount) })
            .OrderByDescending(x => x.Amount)
            .ToListAsync();

        return data.Select(d => (d.Name, d.Color, d.Amount)).ToList();
    }

    public async Task<List<(DateTime Date, decimal Amount)>> GetDailySpendingAsync(int userId, int month, int year)
    {
        var data = await db.Transactions
            .Where(t => t.UserId == userId && t.Type == "Expense" &&
                        t.TransactionDate.Month == month && t.TransactionDate.Year == year)
            .GroupBy(t => t.TransactionDate.Date)
            .Select(g => new { Date = g.Key, Amount = g.Sum(t => t.Amount) })
            .ToListAsync();

        return data.Select(d => (d.Date, d.Amount)).ToList();
    }

    public Task<decimal> GetCategorySpentAsync(int userId, int categoryId, int month, int year) =>
        db.Transactions
            .Where(t => t.UserId == userId && t.CategoryId == categoryId && t.Type == "Expense" &&
                        t.TransactionDate.Month == month && t.TransactionDate.Year == year)
            .SumAsync(t => t.Amount);
}

public class CategoryRepository(AppDbContext db) : ICategoryRepository
{
    public Task<List<Category>> GetByUserAsync(int userId, string? type = null)
    {
        var query = db.Categories.Where(c => c.UserId == userId);
        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(c => c.Type == type);
        return query.OrderBy(c => c.Name).ToListAsync();
    }

    public Task<Category?> GetByIdAsync(int id, int userId) =>
        db.Categories.FirstOrDefaultAsync(c => c.CategoryId == id && c.UserId == userId);

    public async Task<Category> CreateAsync(Category category)
    {
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category;
    }

    public async Task UpdateAsync(Category category)
    {
        db.Categories.Update(category);
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Category category)
    {
        db.Categories.Remove(category);
        await db.SaveChangesAsync();
    }
}

public class AccountRepository(AppDbContext db) : IAccountRepository
{
    public Task<List<Account>> GetByUserAsync(int userId) =>
        db.Accounts.Where(a => a.UserId == userId).OrderBy(a => a.Name).ToListAsync();

    public Task<Account?> GetByIdAsync(int id, int userId) =>
        db.Accounts.FirstOrDefaultAsync(a => a.AccountId == id && a.UserId == userId);

    public async Task<Account> CreateAsync(Account account)
    {
        db.Accounts.Add(account);
        await db.SaveChangesAsync();
        return account;
    }

    public async Task UpdateAsync(Account account)
    {
        db.Accounts.Update(account);
        await db.SaveChangesAsync();
    }

    public Task<decimal> GetTotalBalanceAsync(int userId) =>
        db.Accounts.Where(a => a.UserId == userId).SumAsync(a => a.Balance);
}

public class BudgetRepository(AppDbContext db) : IBudgetRepository
{
    public Task<List<Budget>> GetByMonthAsync(int userId, int month, int year) =>
        db.Budgets.Include(b => b.Category)
            .Where(b => b.UserId == userId && b.Month == month && b.Year == year)
            .ToListAsync();

    public Task<Budget?> GetByIdAsync(int id, int userId) =>
        db.Budgets.Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.BudgetId == id && b.UserId == userId);

    public async Task<Budget> CreateAsync(Budget budget)
    {
        db.Budgets.Add(budget);
        await db.SaveChangesAsync();
        return budget;
    }

    public async Task UpdateAsync(Budget budget)
    {
        db.Budgets.Update(budget);
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Budget budget)
    {
        db.Budgets.Remove(budget);
        await db.SaveChangesAsync();
    }

    public Task<decimal> GetTotalBudgetAsync(int userId, int month, int year) =>
        db.Budgets.Where(b => b.UserId == userId && b.Month == month && b.Year == year)
            .SumAsync(b => b.Amount);
}

public class GoalRepository(AppDbContext db) : IGoalRepository
{
    public Task<List<Goal>> GetByUserAsync(int userId) =>
        db.Goals.Include(g => g.Contributions).Where(g => g.UserId == userId).ToListAsync();

    public Task<Goal?> GetByIdAsync(int id, int userId) =>
        db.Goals.Include(g => g.Contributions)
            .FirstOrDefaultAsync(g => g.GoalId == id && g.UserId == userId);

    public async Task<Goal> CreateAsync(Goal goal)
    {
        db.Goals.Add(goal);
        await db.SaveChangesAsync();
        return goal;
    }

    public async Task UpdateAsync(Goal goal)
    {
        db.Goals.Update(goal);
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Goal goal)
    {
        db.Goals.Remove(goal);
        await db.SaveChangesAsync();
    }

    public async Task AddContributionAsync(GoalContribution contribution)
    {
        db.GoalContributions.Add(contribution);
        await db.SaveChangesAsync();
    }
}

public class NotificationRepository(AppDbContext db) : INotificationRepository
{
    public Task<List<Notification>> GetByUserAsync(int userId, bool unreadOnly = false)
    {
        var query = db.Notifications.Where(n => n.UserId == userId);
        if (unreadOnly) query = query.Where(n => !n.IsRead);
        return query.OrderByDescending(n => n.CreatedAt).Take(50).ToListAsync();
    }

    public async Task<Notification> CreateAsync(Notification notification)
    {
        db.Notifications.Add(notification);
        await db.SaveChangesAsync();
        return notification;
    }

    public async Task MarkAsReadAsync(int id, int userId)
    {
        var n = await db.Notifications.FirstOrDefaultAsync(x => x.NotificationId == id && x.UserId == userId);
        if (n != null) { n.IsRead = true; await db.SaveChangesAsync(); }
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        await db.Notifications.Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }
}

public class TagRepository(AppDbContext db) : ITagRepository
{
    public Task<List<Tag>> GetByUserAsync(int userId) =>
        db.Tags.Where(t => t.UserId == userId).OrderBy(t => t.Name).ToListAsync();

    public Task<Tag?> GetByNameAsync(int userId, string name) =>
        db.Tags.FirstOrDefaultAsync(t => t.UserId == userId && t.Name == name);

    public async Task<Tag> CreateAsync(Tag tag)
    {
        db.Tags.Add(tag);
        await db.SaveChangesAsync();
        return tag;
    }
}

public class RecurringRepository(AppDbContext db) : IRecurringRepository
{
    public Task<List<RecurringTransaction>> GetByUserAsync(int userId) =>
        db.RecurringTransactions.Include(r => r.Category).Include(r => r.Account)
            .Where(r => r.UserId == userId).ToListAsync();

    public Task<List<RecurringTransaction>> GetDueAsync(DateTime date) =>
        db.RecurringTransactions.Include(r => r.Category).Include(r => r.Account)
            .Where(r => r.IsActive && r.NextDueDate.Date <= date.Date).ToListAsync();

    public Task<RecurringTransaction?> GetByIdAsync(int id, int userId) =>
        db.RecurringTransactions.FirstOrDefaultAsync(r => r.RecurringId == id && r.UserId == userId);

    public async Task<RecurringTransaction> CreateAsync(RecurringTransaction recurring)
    {
        db.RecurringTransactions.Add(recurring);
        await db.SaveChangesAsync();
        return recurring;
    }

    public async Task UpdateAsync(RecurringTransaction recurring)
    {
        db.RecurringTransactions.Update(recurring);
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(RecurringTransaction recurring)
    {
        db.RecurringTransactions.Remove(recurring);
        await db.SaveChangesAsync();
    }
}

public class AuditRepository(AppDbContext db) : IAuditRepository
{
    public async Task LogAsync(int? userId, string action, string entityType, int? entityId, string? details)
    {
        db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details
        });
        await db.SaveChangesAsync();
    }
}
