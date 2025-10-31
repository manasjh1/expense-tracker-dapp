module expense_tracker::expense_tracker {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_framework::timestamp;

    /// Error codes
    const E_EXPENSE_NOT_FOUND: u64 = 1;
    const E_NOT_AUTHORIZED: u64 = 2;
    const E_INVALID_AMOUNT: u64 = 3;
    const E_INVALID_CATEGORY: u64 = 4;

    /// Expense categories
    const CATEGORY_FOOD: u8 = 1;
    const CATEGORY_TRANSPORT: u8 = 2;
    const CATEGORY_ENTERTAINMENT: u8 = 3;
    const CATEGORY_BILLS: u8 = 4;
    const CATEGORY_SHOPPING: u8 = 5;
    const CATEGORY_HEALTHCARE: u8 = 6;
    const CATEGORY_EDUCATION: u8 = 7;
    const CATEGORY_OTHER: u8 = 8;

    /// Expense structure
    struct Expense has copy, drop, store {
        id: u64,
        amount: u64,
        description: String,
        category: u8,
        date: u64,
        created_at: u64,
    }

    /// User's expense tracker resource
    struct ExpenseTracker has key {
        expenses: vector<Expense>,
        expense_counter: u64,
        total_spent: u64,
        expense_added_events: event::EventHandle<ExpenseAddedEvent>,
        expense_deleted_events: event::EventHandle<ExpenseDeletedEvent>,
    }

    /// Events
    struct ExpenseAddedEvent has drop, store {
        expense_id: u64,
        amount: u64,
        description: String,
        category: u8,
        user: address,
    }

    struct ExpenseDeletedEvent has drop, store {
        expense_id: u64,
        amount: u64,
        user: address,
    }

    /// Initialize expense tracker for user
    public entry fun initialize_tracker(account: &signer) {
        let account_addr = signer::address_of(account);
        
        if (!exists<ExpenseTracker>(account_addr)) {
            move_to(account, ExpenseTracker {
                expenses: vector::empty<Expense>(),
                expense_counter: 0,
                total_spent: 0,
                expense_added_events: account::new_event_handle<ExpenseAddedEvent>(account),
                expense_deleted_events: account::new_event_handle<ExpenseDeletedEvent>(account),
            });
        }
    }

    /// Add a new expense
    public entry fun add_expense(
        account: &signer,
        amount: u64,
        description: String,
        category: u8,
        date: u64,
    ) acquires ExpenseTracker {
        let account_addr = signer::address_of(account);
        
        // Validate inputs
        assert!(amount > 0, E_INVALID_AMOUNT);
        assert!(category >= 1 && category <= 8, E_INVALID_CATEGORY);
        
        // Initialize if doesn't exist
        if (!exists<ExpenseTracker>(account_addr)) {
            initialize_tracker(account);
        };

        let tracker = borrow_global_mut<ExpenseTracker>(account_addr);
        
        let expense_id = tracker.expense_counter + 1;
        tracker.expense_counter = expense_id;

        let new_expense = Expense {
            id: expense_id,
            amount,
            description,
            category,
            date,
            created_at: timestamp::now_seconds(),
        };

        vector::push_back(&mut tracker.expenses, new_expense);
        tracker.total_spent = tracker.total_spent + amount;

        // Emit event
        event::emit_event(&mut tracker.expense_added_events, ExpenseAddedEvent {
            expense_id,
            amount,
            description,
            category,
            user: account_addr,
        });
    }

    /// Delete an expense
    public entry fun delete_expense(account: &signer, expense_id: u64) acquires ExpenseTracker {
        let account_addr = signer::address_of(account);
        assert!(exists<ExpenseTracker>(account_addr), E_NOT_AUTHORIZED);

        let tracker = borrow_global_mut<ExpenseTracker>(account_addr);
        let expenses_ref = &mut tracker.expenses;
        
        let len = vector::length(expenses_ref);
        let i = 0;
        let found = false;
        let expense_amount = 0;

        while (i < len) {
            let expense = vector::borrow(expenses_ref, i);
            if (expense.id == expense_id) {
                expense_amount = expense.amount;
                vector::remove(expenses_ref, i);
                found = true;
                break
            };
            i = i + 1;
        };

        assert!(found, E_EXPENSE_NOT_FOUND);
        tracker.total_spent = tracker.total_spent - expense_amount;

        // Emit event
        event::emit_event(&mut tracker.expense_deleted_events, ExpenseDeletedEvent {
            expense_id,
            amount: expense_amount,
            user: account_addr,
        });
    }

    /// Get all expenses for a user
    #[view]
    public fun get_expenses(user_addr: address): vector<Expense> acquires ExpenseTracker {
        if (!exists<ExpenseTracker>(user_addr)) {
            return vector::empty<Expense>()
        };

        let tracker = borrow_global<ExpenseTracker>(user_addr);
        tracker.expenses
    }

    /// Get total spent by user
    #[view]
    public fun get_total_spent(user_addr: address): u64 acquires ExpenseTracker {
        if (!exists<ExpenseTracker>(user_addr)) {
            return 0
        };

        let tracker = borrow_global<ExpenseTracker>(user_addr);
        tracker.total_spent
    }

    /// Get expense count
    #[view]
    public fun get_expense_count(user_addr: address): u64 acquires ExpenseTracker {
        if (!exists<ExpenseTracker>(user_addr)) {
            return 0
        };

        let tracker = borrow_global<ExpenseTracker>(user_addr);
        tracker.expense_counter
    }

    /// Get spending by category
    #[view]
    public fun get_category_spending(user_addr: address, category: u8): u64 acquires ExpenseTracker {
        if (!exists<ExpenseTracker>(user_addr)) {
            return 0
        };

        let tracker = borrow_global<ExpenseTracker>(user_addr);
        let expenses = &tracker.expenses;
        let len = vector::length(expenses);
        let i = 0;
        let total = 0;

        while (i < len) {
            let expense = vector::borrow(expenses, i);
            if (expense.category == category) {
                total = total + expense.amount;
            };
            i = i + 1;
        };

        total
    }

    /// Check if tracker exists
    #[view]
    public fun tracker_exists(user_addr: address): bool {
        exists<ExpenseTracker>(user_addr)
    }

    /// Get category name as string (helper for frontend)
    #[view]
    public fun get_category_name(category: u8): String {
        if (category == 1) { string::utf8(b"Food & Dining") }
        else if (category == 2) { string::utf8(b"Transportation") }
        else if (category == 3) { string::utf8(b"Entertainment") }
        else if (category == 4) { string::utf8(b"Bills & Utilities") }
        else if (category == 5) { string::utf8(b"Shopping") }
        else if (category == 6) { string::utf8(b"Healthcare") }
        else if (category == 7) { string::utf8(b"Education") }
        else { string::utf8(b"Other") }
    }
}