using ExpenseTracker.Core.DTOs;
using ExpenseTracker.Core.Entities;

namespace ExpenseTracker.Core.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
}

public interface IUserRepository
{
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(int id);
    Task<User> CreateAsync(User user);
    Task UpdateAsync(User user);
}

public interface ITransactionRepository
{
    Task<(List<Transaction> Items, int Total)> GetFilteredAsync(int userId, TransactionFilterDto filter);
    Task<Transaction?> GetByIdAsync(int id, int userId);
    Task<Transaction> CreateAsync(Transaction transaction);
    Task UpdateAsync(Transaction transaction);
    Task DeleteAsync(Transaction transaction);
    Task<List<Transaction>> GetRecentAsync(int userId, int count);
    Task<decimal> GetMonthlyTotalAsync(int userId, string type, int month, int year);
    Task<List<(int Year, int Month, decimal Income, decimal Expenses)>> GetMonthlyTrendAsync(int userId, int months);
    Task<List<(string Name, string Color, decimal Amount)>> GetCategorySpendingAsync(int userId, int month, int year);
    Task<List<(DateTime Date, decimal Amount)>> GetDailySpendingAsync(int userId, int month, int year);
    Task<decimal> GetCategorySpentAsync(int userId, int categoryId, int month, int year);
}

public interface ICategoryRepository
{
    Task<List<Category>> GetByUserAsync(int userId, string? type = null);
    Task<Category?> GetByIdAsync(int id, int userId);
    Task<Category> CreateAsync(Category category);
    Task UpdateAsync(Category category);
    Task DeleteAsync(Category category);
}

public interface IAccountRepository
{
    Task<List<Account>> GetByUserAsync(int userId);
    Task<Account?> GetByIdAsync(int id, int userId);
    Task<Account> CreateAsync(Account account);
    Task UpdateAsync(Account account);
    Task<decimal> GetTotalBalanceAsync(int userId);
}

public interface IBudgetRepository
{
    Task<List<Budget>> GetByMonthAsync(int userId, int month, int year);
    Task<Budget?> GetByIdAsync(int id, int userId);
    Task<Budget> CreateAsync(Budget budget);
    Task UpdateAsync(Budget budget);
    Task DeleteAsync(Budget budget);
    Task<decimal> GetTotalBudgetAsync(int userId, int month, int year);
}

public interface IGoalRepository
{
    Task<List<Goal>> GetByUserAsync(int userId);
    Task<Goal?> GetByIdAsync(int id, int userId);
    Task<Goal> CreateAsync(Goal goal);
    Task UpdateAsync(Goal goal);
    Task DeleteAsync(Goal goal);
    Task AddContributionAsync(GoalContribution contribution);
}

public interface INotificationRepository
{
    Task<List<Notification>> GetByUserAsync(int userId, bool unreadOnly = false);
    Task<Notification> CreateAsync(Notification notification);
    Task MarkAsReadAsync(int id, int userId);
    Task MarkAllAsReadAsync(int userId);
}

public interface ITagRepository
{
    Task<List<Tag>> GetByUserAsync(int userId);
    Task<Tag?> GetByNameAsync(int userId, string name);
    Task<Tag> CreateAsync(Tag tag);
}

public interface IRecurringRepository
{
    Task<List<RecurringTransaction>> GetByUserAsync(int userId);
    Task<List<RecurringTransaction>> GetDueAsync(DateTime date);
    Task<RecurringTransaction?> GetByIdAsync(int id, int userId);
    Task<RecurringTransaction> CreateAsync(RecurringTransaction recurring);
    Task UpdateAsync(RecurringTransaction recurring);
    Task DeleteAsync(RecurringTransaction recurring);
}

public interface IAuditRepository
{
    Task LogAsync(int? userId, string action, string entityType, int? entityId, string? details);
}

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    string GenerateToken(User user);
}

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(int userId);
}

public interface ITransactionService
{
    Task<PagedResultDto<TransactionDto>> GetFilteredAsync(int userId, TransactionFilterDto filter);
    Task<TransactionDto?> GetByIdAsync(int id, int userId);
    Task<TransactionDto> CreateAsync(int userId, CreateTransactionDto dto);
    Task<TransactionDto?> UpdateAsync(int id, int userId, UpdateTransactionDto dto);
    Task<bool> DeleteAsync(int id, int userId);
}

public interface IExportService
{
    Task<byte[]> ExportTransactionsCsvAsync(int userId, TransactionFilterDto filter);
    Task<byte[]> ExportTransactionsExcelAsync(int userId, TransactionFilterDto filter);
    Task<byte[]> ExportMonthlyReportExcelAsync(int userId, int month, int year);
}

public interface IRecurringService
{
    Task ProcessDueTransactionsAsync();
}
