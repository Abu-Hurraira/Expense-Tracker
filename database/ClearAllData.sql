-- Wipes ALL data from ExpenseTrackerDB (users, expenses, balances, everything)
-- Run: sqlcmd -S "(localdb)\mssqllocaldb" -i ClearAllData.sql
-- Stop the API first if it is running.

USE master;
GO

IF DB_ID(N'ExpenseTrackerDB') IS NOT NULL
BEGIN
    ALTER DATABASE ExpenseTrackerDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ExpenseTrackerDB;
    PRINT 'ExpenseTrackerDB dropped. Restart the API to recreate an empty database.';
END
ELSE
    PRINT 'ExpenseTrackerDB does not exist.';
GO
