using ExpenseTracker.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<GoalContribution> GoalContributions => Set<GoalContribution>();
    public DbSet<RecurringTransaction> RecurringTransactions => Set<RecurringTransaction>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<TransactionTag> TransactionTags => Set<TransactionTag>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasKey(u => u.UserId);
        modelBuilder.Entity<Account>().HasKey(a => a.AccountId);
        modelBuilder.Entity<Category>().HasKey(c => c.CategoryId);
        modelBuilder.Entity<Transaction>().HasKey(t => t.TransactionId);
        modelBuilder.Entity<Budget>().HasKey(b => b.BudgetId);
        modelBuilder.Entity<Goal>().HasKey(g => g.GoalId);
        modelBuilder.Entity<GoalContribution>().HasKey(gc => gc.ContributionId);
        modelBuilder.Entity<RecurringTransaction>().HasKey(r => r.RecurringId);
        modelBuilder.Entity<Attachment>().HasKey(a => a.AttachmentId);
        modelBuilder.Entity<Tag>().HasKey(t => t.TagId);
        modelBuilder.Entity<Notification>().HasKey(n => n.NotificationId);
        modelBuilder.Entity<AuditLog>().HasKey(a => a.AuditId);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties().Where(p => p.ClrType == typeof(decimal)))
                property.SetPrecision(18);
        }

        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Username).IsUnique();
            e.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<TransactionTag>(e =>
        {
            e.HasKey(tt => new { tt.TransactionId, tt.TagId });
            e.HasOne(tt => tt.Transaction).WithMany(t => t.TransactionTags)
                .HasForeignKey(tt => tt.TransactionId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(tt => tt.Tag).WithMany(t => t.TransactionTags)
                .HasForeignKey(tt => tt.TagId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Transaction>(e =>
        {
            e.HasIndex(t => t.UserId);
            e.HasIndex(t => t.TransactionDate);
            e.HasIndex(t => t.CategoryId);
            e.HasIndex(t => new { t.UserId, t.TransactionDate });

            e.HasOne(t => t.Account)
                .WithMany(a => a.Transactions)
                .HasForeignKey(t => t.AccountId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(t => t.TransferToAccount)
                .WithMany()
                .HasForeignKey(t => t.TransferToAccountId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Budget>(e =>
        {
            e.HasIndex(b => new { b.UserId, b.Year, b.Month });
            e.HasOne(b => b.Category).WithMany(c => c.Budgets)
                .HasForeignKey(b => b.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RecurringTransaction>(e =>
        {
            e.HasOne(r => r.Account).WithMany()
                .HasForeignKey(r => r.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(r => r.Category).WithMany()
                .HasForeignKey(r => r.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Transaction>(e =>
        {
            e.HasOne(t => t.Category).WithMany(c => c.Transactions)
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Category>(e =>
        {
            e.HasIndex(c => c.UserId);
        });
    }
}
