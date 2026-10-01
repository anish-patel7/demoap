-- Annual growth-goal inputs. The opening capital is the total you set at the
-- previous December-end; the target for the goal year is:
--   opening_capital + (opening_capital * expected_return_pct/100) + (monthly_sip * 12)
-- 0 means "not configured yet" (the app falls back to current capital / this year).
ALTER TABLE wealth_plan ADD COLUMN goal_year INTEGER NOT NULL DEFAULT 0;
ALTER TABLE wealth_plan ADD COLUMN goal_opening_capital REAL NOT NULL DEFAULT 0;
