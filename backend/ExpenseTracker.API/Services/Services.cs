using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ExpenseTracker.Core.DTOs;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ClosedXML.Excel;

namespace ExpenseTracker.API.Services;

public class AuthService(
    IUserRepository userRepo,
    ICategoryRepository categoryRepo,
    IAccountRepository accountRepo,
    IAuditRepository auditRepo,
    IConfiguration config) : IAuthService
{
    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        if (await userRepo.GetByUsernameAsync(dto.Username) != null)
            throw new InvalidOperationException("Username already exists");
        if (await userRepo.GetByEmailAsync(dto.Email) != null)
            throw new InvalidOperationException("Email already exists");

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = HashPassword(dto.Password),
            Role = "User"
        };
        user = await userRepo.CreateAsync(user);

        await SeedDefaultDataAsync(user.UserId);

        await auditRepo.LogAsync(user.UserId, "Register", "User", user.UserId, "New user registered");
        return BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await userRepo.GetByUsernameAsync(dto.Username)
            ?? throw new UnauthorizedAccessException("Invalid credentials");

        if (!VerifyPassword(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials");

        user.LastLoginAt = DateTime.UtcNow;
        await userRepo.UpdateAsync(user);
        await auditRepo.LogAsync(user.UserId, "Login", "User", user.UserId, "User logged in");

        return BuildAuthResponse(user);
    }

    public string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddMinutes(int.Parse(config["Jwt:ExpiryMinutes"] ?? "60"));

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims:
            [
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            ],
            expires: expiry,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private AuthResponseDto BuildAuthResponse(User user)
    {
        var expiry = DateTime.UtcNow.AddMinutes(int.Parse(config["Jwt:ExpiryMinutes"] ?? "60"));
        return new AuthResponseDto(GenerateToken(user), user.UserId, user.Username, user.Role, user.Currency, user.Theme, expiry);
    }

    private async Task SeedDefaultDataAsync(int userId)
    {
        var defaults = new[]
        {
            ("Food", "Expense", "#ef4444", "fa-utensils"),
            ("Transport", "Expense", "#f59e0b", "fa-car"),
            ("Bills", "Expense", "#8b5cf6", "fa-file-invoice"),
            ("Entertainment", "Expense", "#ec4899", "fa-film"),
            ("Salary", "Income", "#22c55e", "fa-money-bill"),
            ("Other Income", "Income", "#14b8a6", "fa-plus-circle")
        };

        foreach (var (name, type, color, icon) in defaults)
        {
            await categoryRepo.CreateAsync(new Category
            {
                UserId = userId, Name = name, Type = type, Color = color, Icon = icon
            });
        }

        var accounts = new[] { ("Cash", "Cash"), ("Bank Account", "Bank"), ("Wallet", "Wallet") };
        foreach (var (name, type) in accounts)
        {
            await accountRepo.CreateAsync(new Account { UserId = userId, Name = name, Type = type });
        }
    }

    public static string HashPassword(string password)
    {
        using var rng = RandomNumberGenerator.Create();
        var salt = new byte[16];
        rng.GetBytes(salt);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public static bool VerifyPassword(string password, string stored)
    {
        var parts = stored.Split('.');
        if (parts.Length != 2) return false;
        var salt = Convert.FromBase64String(parts[0]);
        var hash = Convert.FromBase64String(parts[1]);
        var test = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100000, HashAlgorithmName.SHA256, 32);
        return CryptographicOperations.FixedTimeEquals(hash, test);
    }
}

public class DashboardService(
    ITransactionRepository transactionRepo,
    IAccountRepository accountRepo,
    IBudgetRepository budgetRepo,
    IMemoryCache cache) : IDashboardService
{
    public async Task<DashboardSummaryDto> GetSummaryAsync(int userId)
    {
        var cacheKey = $"dashboard_{userId}_{DateTime.UtcNow:yyyyMM}";
        if (cache.TryGetValue(cacheKey, out DashboardSummaryDto? cached) && cached != null)
            return cached;

        var now = DateTime.UtcNow;
        var totalBalance = await accountRepo.GetTotalBalanceAsync(userId);
        var monthlyIncome = await transactionRepo.GetMonthlyTotalAsync(userId, "Income", now.Month, now.Year);
        var monthlyExpenses = await transactionRepo.GetMonthlyTotalAsync(userId, "Expense", now.Month, now.Year);
        var totalBudget = await budgetRepo.GetTotalBudgetAsync(userId, now.Month, now.Year);
        var remainingBudget = totalBudget - monthlyExpenses;

        var recent = await transactionRepo.GetRecentAsync(userId, 10);
        var trend = await transactionRepo.GetMonthlyTrendAsync(userId, 6);
        var categorySpending = await transactionRepo.GetCategorySpendingAsync(userId, now.Month, now.Year);
        var totalCatSpending = categorySpending.Sum(c => c.Amount);

        var summary = new DashboardSummaryDto(
            totalBalance, monthlyIncome, monthlyExpenses, remainingBudget,
            recent.Select(MapTransaction).ToList(),
            trend.Select(t => new MonthlyTrendDto($"{t.Year}-{t.Month:D2}", t.Income, t.Expenses)).ToList(),
            categorySpending.Select(c => new CategorySpendingDto(
                c.Name, c.Color, c.Amount,
                totalCatSpending > 0 ? Math.Round((double)(c.Amount / totalCatSpending * 100), 1) : 0)).ToList());

        cache.Set(cacheKey, summary, TimeSpan.FromMinutes(2));
        return summary;
    }

    private static TransactionDto MapTransaction(Transaction t) => new(
        t.TransactionId, t.AccountId, t.CategoryId, t.Type, t.Amount,
        t.Description, t.Notes, t.TransactionDate,
        t.Account?.Name, t.Category?.Name, t.Category?.Color,
        t.TransferToAccountId,
        t.TransactionTags.Select(tt => tt.Tag.Name).ToList(),
        t.Attachments.Select(a => new AttachmentDto(a.AttachmentId, a.FilePath, a.FileName)).ToList());
}

public class TransactionService(
    ITransactionRepository transactionRepo,
    IAccountRepository accountRepo,
    ITagRepository tagRepo,
    INotificationRepository notificationRepo,
    IBudgetRepository budgetRepo,
    IAuditRepository auditRepo,
    IMemoryCache cache) : ITransactionService
{
    public async Task<PagedResultDto<TransactionDto>> GetFilteredAsync(int userId, TransactionFilterDto filter)
    {
        var (items, total) = await transactionRepo.GetFilteredAsync(userId, filter);
        return new PagedResultDto<TransactionDto>(
            items.Select(MapTransaction).ToList(), total, filter.Page, filter.PageSize,
            (int)Math.Ceiling(total / (double)filter.PageSize));
    }

    public async Task<TransactionDto?> GetByIdAsync(int id, int userId)
    {
        var t = await transactionRepo.GetByIdAsync(id, userId);
        return t == null ? null : MapTransaction(t);
    }

    public async Task<TransactionDto> CreateAsync(int userId, CreateTransactionDto dto)
    {
        var account = await accountRepo.GetByIdAsync(dto.AccountId, userId)
            ?? throw new InvalidOperationException("Account not found");

        var transaction = new Transaction
        {
            UserId = userId,
            AccountId = dto.AccountId,
            CategoryId = dto.CategoryId,
            Type = dto.Type,
            Amount = dto.Amount,
            Description = dto.Description,
            Notes = dto.Notes,
            TransactionDate = dto.TransactionDate ?? DateTime.UtcNow,
            TransferToAccountId = dto.TransferToAccountId
        };

        if (dto.Type == "Transfer" && dto.TransferToAccountId.HasValue)
        {
            var toAccount = await accountRepo.GetByIdAsync(dto.TransferToAccountId.Value, userId)
                ?? throw new InvalidOperationException("Transfer account not found");
            account.Balance -= dto.Amount;
            toAccount.Balance += dto.Amount;
            await accountRepo.UpdateAsync(account);
            await accountRepo.UpdateAsync(toAccount);
        }
        else if (dto.Type == "Income")
            account.Balance += dto.Amount;
        else if (dto.Type == "Expense")
            account.Balance -= dto.Amount;

        await accountRepo.UpdateAsync(account);

        if (dto.Tags?.Count > 0)
        {
            foreach (var tagName in dto.Tags)
            {
                var tag = await tagRepo.GetByNameAsync(userId, tagName)
                    ?? await tagRepo.CreateAsync(new Tag { UserId = userId, Name = tagName });
                transaction.TransactionTags.Add(new TransactionTag { Tag = tag });
            }
        }

        if (!string.IsNullOrWhiteSpace(dto.AttachmentPath))
        {
            transaction.Attachments.Add(new Attachment
            {
                FilePath = dto.AttachmentPath,
                FileName = dto.AttachmentFileName ?? "attachment"
            });
        }

        transaction = await transactionRepo.CreateAsync(transaction);
        cache.Remove($"dashboard_{userId}_{DateTime.UtcNow:yyyyMM}");

        if (dto.Type == "Expense")
            await CheckBudgetAlertAsync(userId, dto.CategoryId, dto.Amount);

        await auditRepo.LogAsync(userId, "Create", "Transaction", transaction.TransactionId, dto.Description);
        return MapTransaction(transaction);
    }

    public async Task<TransactionDto?> UpdateAsync(int id, int userId, UpdateTransactionDto dto)
    {
        var existing = await transactionRepo.GetByIdAsync(id, userId);
        if (existing == null) return null;

        var account = await accountRepo.GetByIdAsync(existing.AccountId, userId);
        if (account != null)
        {
            if (existing.Type == "Income") account.Balance -= existing.Amount;
            else if (existing.Type == "Expense") account.Balance += existing.Amount;
            await accountRepo.UpdateAsync(account);
        }

        existing.AccountId = dto.AccountId;
        existing.CategoryId = dto.CategoryId;
        existing.Type = dto.Type;
        existing.Amount = dto.Amount;
        existing.Description = dto.Description;
        existing.Notes = dto.Notes;
        existing.TransactionDate = dto.TransactionDate;
        existing.UpdatedAt = DateTime.UtcNow;

        account = await accountRepo.GetByIdAsync(dto.AccountId, userId);
        if (account != null)
        {
            if (dto.Type == "Income") account.Balance += dto.Amount;
            else if (dto.Type == "Expense") account.Balance -= dto.Amount;
            await accountRepo.UpdateAsync(account);
        }

        await transactionRepo.UpdateAsync(existing);
        cache.Remove($"dashboard_{userId}_{DateTime.UtcNow:yyyyMM}");
        await auditRepo.LogAsync(userId, "Update", "Transaction", id, dto.Description);
        return MapTransaction(existing);
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var existing = await transactionRepo.GetByIdAsync(id, userId);
        if (existing == null) return false;

        var account = await accountRepo.GetByIdAsync(existing.AccountId, userId);
        if (account != null)
        {
            if (existing.Type == "Income") account.Balance -= existing.Amount;
            else if (existing.Type == "Expense") account.Balance += existing.Amount;
            await accountRepo.UpdateAsync(account);
        }

        await transactionRepo.DeleteAsync(existing);
        cache.Remove($"dashboard_{userId}_{DateTime.UtcNow:yyyyMM}");
        await auditRepo.LogAsync(userId, "Delete", "Transaction", id, null);
        return true;
    }

    private async Task CheckBudgetAlertAsync(int userId, int categoryId, decimal amount)
    {
        var now = DateTime.UtcNow;
        var budgets = await budgetRepo.GetByMonthAsync(userId, now.Month, now.Year);
        var budget = budgets.FirstOrDefault(b => b.CategoryId == categoryId);
        if (budget == null) return;

        var spent = await transactionRepo.GetCategorySpentAsync(userId, categoryId, now.Month, now.Year);
        if (spent > budget.Amount)
        {
            await notificationRepo.CreateAsync(new Notification
            {
                UserId = userId,
                Title = "Budget Exceeded",
                Message = $"You've exceeded your budget for {budget.Category?.Name ?? "category"} by {(spent - budget.Amount):N2}"
            });
        }
    }

    private static TransactionDto MapTransaction(Transaction t) => new(
        t.TransactionId, t.AccountId, t.CategoryId, t.Type, t.Amount,
        t.Description, t.Notes, t.TransactionDate,
        t.Account?.Name, t.Category?.Name, t.Category?.Color,
        t.TransferToAccountId,
        t.TransactionTags.Select(tt => tt.Tag?.Name ?? "").Where(n => n != "").ToList(),
        t.Attachments.Select(a => new AttachmentDto(a.AttachmentId, a.FilePath, a.FileName)).ToList());
}

public class ExportService(ITransactionRepository transactionRepo) : IExportService
{
    public async Task<byte[]> ExportTransactionsCsvAsync(int userId, TransactionFilterDto filter)
    {
        filter = filter with { Page = 1, PageSize = 10000 };
        var (items, _) = await transactionRepo.GetFilteredAsync(userId, filter);
        var sb = new StringBuilder();
        sb.AppendLine("Date,Type,Category,Amount,Description,Notes,Account");
        foreach (var t in items)
            sb.AppendLine($"{t.TransactionDate:yyyy-MM-dd},{t.Type},{t.Category?.Name},{t.Amount},{t.Description},{t.Notes},{t.Account?.Name}");
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportTransactionsExcelAsync(int userId, TransactionFilterDto filter)
    {
        filter = filter with { Page = 1, PageSize = 10000 };
        var (items, _) = await transactionRepo.GetFilteredAsync(userId, filter);
        using var workbook = new ClosedXML.Excel.XLWorkbook();
        var ws = workbook.Worksheets.Add("Transactions");
        ws.Cell(1, 1).Value = "Date"; ws.Cell(1, 2).Value = "Type"; ws.Cell(1, 3).Value = "Category";
        ws.Cell(1, 4).Value = "Amount"; ws.Cell(1, 5).Value = "Description"; ws.Cell(1, 6).Value = "Notes";
        var row = 2;
        foreach (var t in items)
        {
            ws.Cell(row, 1).Value = t.TransactionDate.ToString("yyyy-MM-dd");
            ws.Cell(row, 2).Value = t.Type;
            ws.Cell(row, 3).Value = t.Category?.Name;
            ws.Cell(row, 4).Value = t.Amount;
            ws.Cell(row, 5).Value = t.Description;
            ws.Cell(row, 6).Value = t.Notes;
            row++;
        }
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportMonthlyReportExcelAsync(int userId, int month, int year)
    {
        var income = await transactionRepo.GetMonthlyTotalAsync(userId, "Income", month, year);
        var expenses = await transactionRepo.GetMonthlyTotalAsync(userId, "Expense", month, year);
        var categories = await transactionRepo.GetCategorySpendingAsync(userId, month, year);

        using var workbook = new ClosedXML.Excel.XLWorkbook();
        var ws = workbook.Worksheets.Add("Monthly Report");
        ws.Cell(1, 1).Value = $"Report: {year}-{month:D2}";
        ws.Cell(3, 1).Value = "Total Income"; ws.Cell(3, 2).Value = income;
        ws.Cell(4, 1).Value = "Total Expenses"; ws.Cell(4, 2).Value = expenses;
        ws.Cell(5, 1).Value = "Net Balance"; ws.Cell(5, 2).Value = income - expenses;
        ws.Cell(7, 1).Value = "Category"; ws.Cell(7, 2).Value = "Amount";
        var row = 8;
        foreach (var c in categories)
        {
            ws.Cell(row, 1).Value = c.Name;
            ws.Cell(row, 2).Value = c.Amount;
            row++;
        }
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}

public class RecurringService(
    IRecurringRepository recurringRepo,
    ITransactionRepository transactionRepo,
    IAccountRepository accountRepo,
    INotificationRepository notificationRepo) : IRecurringService
{
    public async Task ProcessDueTransactionsAsync()
    {
        var due = await recurringRepo.GetDueAsync(DateTime.UtcNow);
        foreach (var r in due)
        {
            var transaction = new Transaction
            {
                UserId = r.UserId,
                AccountId = r.AccountId,
                CategoryId = r.CategoryId,
                Type = r.Type,
                Amount = r.Amount,
                Description = r.Description ?? $"Recurring: {r.Frequency}",
                TransactionDate = r.NextDueDate
            };

            var account = await accountRepo.GetByIdAsync(r.AccountId, r.UserId);
            if (account != null)
            {
                if (r.Type == "Income") account.Balance += r.Amount;
                else if (r.Type == "Expense") account.Balance -= r.Amount;
                await accountRepo.UpdateAsync(account);
            }

            await transactionRepo.CreateAsync(transaction);

            r.NextDueDate = r.Frequency switch
            {
                "Daily" => r.NextDueDate.AddDays(1),
                "Weekly" => r.NextDueDate.AddDays(7),
                "Monthly" => r.NextDueDate.AddMonths(1),
                "Yearly" => r.NextDueDate.AddYears(1),
                _ => r.NextDueDate.AddMonths(1)
            };
            await recurringRepo.UpdateAsync(r);

            await notificationRepo.CreateAsync(new Notification
            {
                UserId = r.UserId,
                Title = "Recurring Transaction",
                Message = $"Auto-generated: {r.Description ?? r.Type} - {r.Amount:N2}"
            });
        }
    }
}

public class RecurringBackgroundService(IServiceProvider services) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = services.CreateScope();
            var recurringService = scope.ServiceProvider.GetRequiredService<IRecurringService>();
            await recurringService.ProcessDueTransactionsAsync();
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}
