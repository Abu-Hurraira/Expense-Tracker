using System.Security.Claims;
using ExpenseTracker.Core.DTOs;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace ExpenseTracker.API.Controllers;

internal static class DashboardCache
{
    public static void Invalidate(IMemoryCache cache, int userId) =>
        cache.Remove($"dashboard_{userId}_{DateTime.UtcNow:yyyyMM}");
}

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        try { return Ok(await authService.RegisterAsync(dto)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        try { return Ok(await authService.LoginAsync(dto)); }
        catch (UnauthorizedAccessException) { return Unauthorized(new { message = "Invalid credentials" }); }
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary() =>
        Ok(await dashboardService.GetSummaryAsync(UserId));
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController(ITransactionService transactionService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<TransactionDto>>> GetAll([FromQuery] TransactionFilterDto filter) =>
        Ok(await transactionService.GetFilteredAsync(UserId, filter));

    [HttpGet("{id}")]
    public async Task<ActionResult<TransactionDto>> GetById(int id)
    {
        var result = await transactionService.GetByIdAsync(id, UserId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TransactionDto>> Create(CreateTransactionDto dto) =>
        Ok(await transactionService.CreateAsync(UserId, dto));

    [HttpPut("{id}")]
    public async Task<ActionResult<TransactionDto>> Update(int id, UpdateTransactionDto dto)
    {
        var result = await transactionService.UpdateAsync(id, UserId, dto);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) =>
        await transactionService.DeleteAsync(id, UserId) ? NoContent() : NotFound();
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController(ICategoryRepository categoryRepo, IAuditRepository auditRepo) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll([FromQuery] string? type)
    {
        var items = await categoryRepo.GetByUserAsync(UserId, type);
        return Ok(items.Select(c => new CategoryDto(c.CategoryId, c.Name, c.Type, c.Color, c.Icon)).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(CreateCategoryDto dto)
    {
        var cat = await categoryRepo.CreateAsync(new Category
        {
            UserId = UserId, Name = dto.Name, Type = dto.Type, Color = dto.Color, Icon = dto.Icon
        });
        await auditRepo.LogAsync(UserId, "Create", "Category", cat.CategoryId, dto.Name);
        return Ok(new CategoryDto(cat.CategoryId, cat.Name, cat.Type, cat.Color, cat.Icon));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryDto>> Update(int id, CreateCategoryDto dto)
    {
        var cat = await categoryRepo.GetByIdAsync(id, UserId);
        if (cat == null) return NotFound();
        cat.Name = dto.Name; cat.Type = dto.Type; cat.Color = dto.Color; cat.Icon = dto.Icon;
        await categoryRepo.UpdateAsync(cat);
        await auditRepo.LogAsync(UserId, "Update", "Category", id, dto.Name);
        return Ok(new CategoryDto(cat.CategoryId, cat.Name, cat.Type, cat.Color, cat.Icon));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var cat = await categoryRepo.GetByIdAsync(id, UserId);
        if (cat == null) return NotFound();
        await categoryRepo.DeleteAsync(cat);
        await auditRepo.LogAsync(UserId, "Delete", "Category", id, null);
        return NoContent();
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountsController(IAccountRepository accountRepo, ITransactionRepository transactionRepo, ICategoryRepository categoryRepo, IAuditRepository auditRepo, IMemoryCache cache) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<AccountDto>>> GetAll()
    {
        var items = await accountRepo.GetByUserAsync(UserId);
        return Ok(items.Select(a => new AccountDto(a.AccountId, a.Name, a.Type, a.Balance)).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<AccountDto>> Create(CreateAccountDto dto)
    {
        var acc = await accountRepo.CreateAsync(new Account
        {
            UserId = UserId, Name = dto.Name, Type = dto.Type, Balance = dto.Balance
        });
        DashboardCache.Invalidate(cache, UserId);
        return Ok(new AccountDto(acc.AccountId, acc.Name, acc.Type, acc.Balance));
    }

    [HttpPut("{id}/balance")]
    public async Task<ActionResult<AccountDto>> SetBalance(int id, [FromBody] SetBalanceDto dto)
    {
        var acc = await accountRepo.GetByIdAsync(id, UserId);
        if (acc == null) return NotFound();

        // Daily tracker: one total balance — store on this account, clear others
        var allAccounts = await accountRepo.GetByUserAsync(UserId);
        foreach (var account in allAccounts)
        {
            account.Balance = account.AccountId == id ? dto.Amount : 0;
            await accountRepo.UpdateAsync(account);
        }

        DashboardCache.Invalidate(cache, UserId);
        return Ok(new AccountDto(acc.AccountId, acc.Name, acc.Type, dto.Amount));
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer(TransferDto dto)
    {
        var from = await accountRepo.GetByIdAsync(dto.FromAccountId, UserId);
        var to = await accountRepo.GetByIdAsync(dto.ToAccountId, UserId);
        if (from == null || to == null) return BadRequest(new { message = "Invalid accounts" });
        if (from.Balance < dto.Amount) return BadRequest(new { message = "Insufficient balance" });

        from.Balance -= dto.Amount;
        to.Balance += dto.Amount;
        await accountRepo.UpdateAsync(from);
        await accountRepo.UpdateAsync(to);

        var cats = await categoryRepo.GetByUserAsync(UserId, "Expense");
        var catId = cats.FirstOrDefault()?.CategoryId ?? 1;

        await transactionRepo.CreateAsync(new Transaction
        {
            UserId = UserId, AccountId = dto.FromAccountId, CategoryId = catId,
            Type = "Transfer", Amount = dto.Amount, Description = dto.Description ?? "Transfer",
            TransferToAccountId = dto.ToAccountId, TransactionDate = DateTime.UtcNow
        });

        DashboardCache.Invalidate(cache, UserId);
        return Ok(new { message = "Transfer successful" });
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BudgetsController(IBudgetRepository budgetRepo, ITransactionRepository transactionRepo) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<BudgetDto>>> GetByMonth([FromQuery] int month, [FromQuery] int year)
    {
        var budgets = await budgetRepo.GetByMonthAsync(UserId, month, year);
        var result = new List<BudgetDto>();
        foreach (var b in budgets)
        {
            var spent = b.CategoryId.HasValue
                ? await transactionRepo.GetCategorySpentAsync(UserId, b.CategoryId.Value, month, year)
                : await transactionRepo.GetMonthlyTotalAsync(UserId, "Expense", month, year);
            result.Add(new BudgetDto(b.BudgetId, b.CategoryId, b.Category?.Name, b.Month, b.Year,
                b.Amount, spent, b.Amount - spent,
                b.Amount > 0 ? (double)(spent / b.Amount * 100) : 0));
        }
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<BudgetDto>> Create(CreateBudgetDto dto)
    {
        if (dto.Amount <= 0) return BadRequest(new { message = "Budget amount must be greater than zero" });
        if (dto.Month is < 1 or > 12) return BadRequest(new { message = "Invalid month" });
        if (dto.Year < 2000) return BadRequest(new { message = "Invalid year" });

        var budget = await budgetRepo.CreateAsync(new Budget
        {
            UserId = UserId, CategoryId = dto.CategoryId, Month = dto.Month, Year = dto.Year, Amount = dto.Amount
        });
        return Ok(new BudgetDto(budget.BudgetId, budget.CategoryId, null, budget.Month, budget.Year,
            budget.Amount, 0, budget.Amount, 0));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BudgetDto>> Update(int id, CreateBudgetDto dto)
    {
        var budget = await budgetRepo.GetByIdAsync(id, UserId);
        if (budget == null) return NotFound();
        budget.CategoryId = dto.CategoryId; budget.Month = dto.Month; budget.Year = dto.Year; budget.Amount = dto.Amount;
        await budgetRepo.UpdateAsync(budget);
        return Ok(new BudgetDto(budget.BudgetId, budget.CategoryId, budget.Category?.Name, budget.Month, budget.Year,
            budget.Amount, 0, budget.Amount, 0));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var budget = await budgetRepo.GetByIdAsync(id, UserId);
        if (budget == null) return NotFound();
        await budgetRepo.DeleteAsync(budget);
        return NoContent();
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController(ITransactionRepository transactionRepo, IAccountRepository accountRepo) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("monthly")]
    public async Task<ActionResult<ReportDto>> GetMonthly([FromQuery] int month, [FromQuery] int year)
    {
        var income = await transactionRepo.GetMonthlyTotalAsync(UserId, "Income", month, year);
        var expenses = await transactionRepo.GetMonthlyTotalAsync(UserId, "Expense", month, year);
        var accountBalance = await accountRepo.GetTotalBalanceAsync(UserId);
        var categories = await transactionRepo.GetCategorySpendingAsync(UserId, month, year);
        var daily = await transactionRepo.GetDailySpendingAsync(UserId, month, year);
        var totalCat = categories.Sum(c => c.Amount);

        return Ok(new ReportDto(income, expenses, accountBalance,
            categories.Select(c => new CategorySpendingDto(c.Name, c.Color, c.Amount,
                totalCat > 0 ? Math.Round((double)(c.Amount / totalCat * 100), 1) : 0)).ToList(),
            daily.Select(d => new DailySpendingDto(d.Date.ToString("yyyy-MM-dd"), d.Amount)).ToList()));
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CalendarController(ITransactionRepository transactionRepo) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<CalendarDayDto>>> GetCalendarData([FromQuery] int month, [FromQuery] int year)
    {
        var daily = await transactionRepo.GetDailySpendingAsync(UserId, month, year);
        var max = daily.Count > 0 ? daily.Max(d => d.Amount) : 0;

        return Ok(daily.Select(d => new CalendarDayDto(
            d.Date.ToString("yyyy-MM-dd"), d.Amount, 0,
            max > 0 ? GetIntensity(d.Amount, max) : "low")).ToList());
    }

    private static string GetIntensity(decimal amount, decimal max)
    {
        var ratio = (double)(amount / max);
        return ratio switch { > 0.75 => "high", > 0.4 => "medium", _ => "low" };
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController(INotificationRepository notificationRepo) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> GetAll([FromQuery] bool unreadOnly = false)
    {
        var items = await notificationRepo.GetByUserAsync(UserId, unreadOnly);
        return Ok(items.Select(n => new NotificationDto(n.NotificationId, n.Title, n.Message, n.IsRead, n.CreatedAt)).ToList());
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        await notificationRepo.MarkAsReadAsync(id, UserId);
        return NoContent();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await notificationRepo.MarkAllAsReadAsync(UserId);
        return NoContent();
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GoalsController(IGoalRepository goalRepo) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<GoalDto>>> GetAll()
    {
        var goals = await goalRepo.GetByUserAsync(UserId);
        return Ok(goals.Select(g => new GoalDto(g.GoalId, g.Name, g.TargetAmount, g.CurrentAmount,
            g.TargetDate, g.TargetAmount > 0 ? (double)(g.CurrentAmount / g.TargetAmount * 100) : 0)).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<GoalDto>> Create(CreateGoalDto dto)
    {
        var goal = await goalRepo.CreateAsync(new Goal
        {
            UserId = UserId, Name = dto.Name, TargetAmount = dto.TargetAmount, TargetDate = dto.TargetDate
        });
        return Ok(new GoalDto(goal.GoalId, goal.Name, goal.TargetAmount, goal.CurrentAmount, goal.TargetDate, 0));
    }

    [HttpPost("{id}/contribute")]
    public async Task<IActionResult> Contribute(int id, [FromBody] ContributeAmountDto dto)
    {
        if (dto.Amount <= 0) return BadRequest(new { message = "Contribution must be greater than zero" });
        var goal = await goalRepo.GetByIdAsync(id, UserId);
        if (goal == null) return NotFound();
        await goalRepo.AddContributionAsync(new GoalContribution { GoalId = id, Amount = dto.Amount });
        goal.CurrentAmount += dto.Amount;
        await goalRepo.UpdateAsync(goal);
        return Ok(new GoalDto(goal.GoalId, goal.Name, goal.TargetAmount, goal.CurrentAmount, goal.TargetDate,
            goal.TargetAmount > 0 ? (double)(goal.CurrentAmount / goal.TargetAmount * 100) : 0));
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TagsController(ITagRepository tagRepo) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<TagDto>>> GetAll()
    {
        var tags = await tagRepo.GetByUserAsync(UserId);
        return Ok(tags.Select(t => new TagDto(t.TagId, t.Name)).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<TagDto>> Create([FromBody] string name)
    {
        var existing = await tagRepo.GetByNameAsync(UserId, name);
        if (existing != null) return Ok(new TagDto(existing.TagId, existing.Name));
        var tag = await tagRepo.CreateAsync(new Tag { UserId = UserId, Name = name });
        return Ok(new TagDto(tag.TagId, tag.Name));
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RecurringController(IRecurringRepository recurringRepo) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<RecurringTransactionDto>>> GetAll()
    {
        var items = await recurringRepo.GetByUserAsync(UserId);
        return Ok(items.Select(r => new RecurringTransactionDto(r.RecurringId, r.AccountId, r.CategoryId,
            r.Type, r.Amount, r.Description, r.Frequency, r.NextDueDate, r.IsActive)).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<RecurringTransactionDto>> Create(CreateRecurringDto dto)
    {
        var r = await recurringRepo.CreateAsync(new RecurringTransaction
        {
            UserId = UserId, AccountId = dto.AccountId, CategoryId = dto.CategoryId,
            Type = dto.Type, Amount = dto.Amount, Description = dto.Description,
            Frequency = dto.Frequency, NextDueDate = dto.NextDueDate
        });
        return Ok(new RecurringTransactionDto(r.RecurringId, r.AccountId, r.CategoryId, r.Type, r.Amount,
            r.Description, r.Frequency, r.NextDueDate, r.IsActive));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var r = await recurringRepo.GetByIdAsync(id, UserId);
        if (r == null) return NotFound();
        await recurringRepo.DeleteAsync(r);
        return NoContent();
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExportController(IExportService exportService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("transactions/csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] TransactionFilterDto filter)
    {
        var data = await exportService.ExportTransactionsCsvAsync(UserId, filter);
        return File(data, "text/csv", "transactions.csv");
    }

    [HttpGet("transactions/excel")]
    public async Task<IActionResult> ExportExcel([FromQuery] TransactionFilterDto filter)
    {
        var data = await exportService.ExportTransactionsExcelAsync(UserId, filter);
        return File(data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "transactions.xlsx");
    }

    [HttpGet("report/excel")]
    public async Task<IActionResult> ExportReport([FromQuery] int month, [FromQuery] int year)
    {
        var data = await exportService.ExportMonthlyReportExcelAsync(UserId, month, year);
        return File(data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"report_{year}_{month}.xlsx");
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController(IUserRepository userRepo, AppDbContext db, IAuditRepository auditRepo) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPut]
    public async Task<IActionResult> UpdateSettings(UserSettingsDto dto)
    {
        var user = await userRepo.GetByIdAsync(UserId);
        if (user == null) return NotFound();
        user.Currency = dto.Currency;
        user.Theme = dto.Theme;
        await userRepo.UpdateAsync(user);
        return Ok(dto);
    }

    [HttpDelete("reset")]
    public async Task<IActionResult> ResetAllData()
    {
        var user = await userRepo.GetByIdAsync(UserId);
        if (user == null) return NotFound();

        await db.Transactions.Where(t => t.UserId == UserId).ExecuteDeleteAsync();
        await db.Budgets.Where(b => b.UserId == UserId).ExecuteDeleteAsync();
        await db.Goals.Where(g => g.UserId == UserId).ExecuteDeleteAsync();
        await db.Categories.Where(c => c.UserId == UserId).ExecuteDeleteAsync();
        await db.Accounts.Where(a => a.UserId == UserId).ExecuteDeleteAsync();
        await db.Notifications.Where(n => n.UserId == UserId).ExecuteDeleteAsync();
        await auditRepo.LogAsync(UserId, "Reset", "User", UserId, "All data reset");
        return NoContent();
    }
}
