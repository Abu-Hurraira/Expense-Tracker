namespace ExpenseTracker.Core.DTOs;

public record RegisterDto(string Username, string Email, string Password);
public record LoginDto(string Username, string Password);
public record AuthResponseDto(string Token, int UserId, string Username, string Role, string Currency, string Theme, DateTime ExpiresAt);

public record UserSettingsDto(string Currency, string Theme);

public record AccountDto(int AccountId, string Name, string Type, decimal Balance);
public record CreateAccountDto(string Name, string Type, decimal Balance);
public record SetBalanceDto(decimal Amount);
public record TransferDto(int FromAccountId, int ToAccountId, decimal Amount, string? Description);

public record CategoryDto(int CategoryId, string Name, string Type, string Color, string Icon);
public record CreateCategoryDto(string Name, string Type, string Color, string Icon);

public record TransactionDto(
    int TransactionId, int AccountId, int CategoryId, string Type, decimal Amount,
    string? Description, string? Notes, DateTime TransactionDate,
    string? AccountName, string? CategoryName, string? CategoryColor,
    int? TransferToAccountId, List<string> Tags, List<AttachmentDto> Attachments);

public record AttachmentDto(int AttachmentId, string FilePath, string FileName);

public record CreateTransactionDto(
    int AccountId, int CategoryId, string Type, decimal Amount,
    string? Description, string? Notes, DateTime? TransactionDate,
    int? TransferToAccountId, List<string>? Tags, string? AttachmentPath, string? AttachmentFileName);

public record UpdateTransactionDto(
    int AccountId, int CategoryId, string Type, decimal Amount,
    string? Description, string? Notes, DateTime TransactionDate,
    int? TransferToAccountId, List<string>? Tags);

public record TransactionFilterDto(
    string? Search, int? CategoryId, string? Type,
    DateTime? StartDate, DateTime? EndDate, List<string>? Tags,
    int Page = 1, int PageSize = 20);

public record PagedResultDto<T>(List<T> Items, int TotalCount, int Page, int PageSize, int TotalPages);

public record BudgetDto(int BudgetId, int? CategoryId, string? CategoryName, int Month, int Year, decimal Amount, decimal Spent, decimal Remaining, double PercentUsed);
public record CreateBudgetDto(int? CategoryId, int Month, int Year, decimal Amount);

public record GoalDto(int GoalId, string Name, decimal TargetAmount, decimal CurrentAmount, DateTime? TargetDate, double PercentComplete);
public record CreateGoalDto(string Name, decimal TargetAmount, DateTime? TargetDate);
public record ContributeAmountDto(decimal Amount);
public record GoalContributionDto(int ContributionId, decimal Amount, DateTime DateAdded);

public record DashboardSummaryDto(
    decimal TotalBalance, decimal MonthlyIncome, decimal MonthlyExpenses,
    decimal RemainingBudget, List<TransactionDto> RecentTransactions,
    List<MonthlyTrendDto> MonthlyTrend, List<CategorySpendingDto> CategorySpending);

public record MonthlyTrendDto(string Month, decimal Income, decimal Expenses);
public record CategorySpendingDto(string CategoryName, string Color, decimal Amount, double Percentage);

public record ReportDto(
    decimal TotalIncome, decimal TotalExpenses, decimal NetBalance,
    List<CategorySpendingDto> CategoryBreakdown, List<DailySpendingDto> DailySpending);

public record DailySpendingDto(string Date, decimal Amount);

public record CalendarDayDto(string Date, decimal TotalSpending, int TransactionCount, string Intensity);

public record NotificationDto(int NotificationId, string Title, string Message, bool IsRead, DateTime CreatedAt);

public record TagDto(int TagId, string Name);

public record RecurringTransactionDto(
    int RecurringId, int AccountId, int CategoryId, string Type, decimal Amount,
    string? Description, string Frequency, DateTime NextDueDate, bool IsActive);

public record CreateRecurringDto(
    int AccountId, int CategoryId, string Type, decimal Amount,
    string? Description, string Frequency, DateTime NextDueDate);
