DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS sales_reps CASCADE;

CREATE TABLE sales_reps (
    rep_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    territory VARCHAR(50) NOT NULL,
    quota NUMERIC(12, 2) NOT NULL,
    commission_rate NUMERIC(4, 3) NOT NULL
);

CREATE TABLE leads (
    lead_id SERIAL PRIMARY KEY,
    rep_id INT NOT NULL REFERENCES sales_reps(rep_id),
    company_name VARCHAR(100) NOT NULL,
    industry VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL -- 'new', 'contacted', 'qualified', 'lost'
);

CREATE TABLE opportunities (
    opportunity_id SERIAL PRIMARY KEY,
    lead_id INT NOT NULL REFERENCES leads(lead_id),
    deal_size NUMERIC(12, 2) NOT NULL,
    stage VARCHAR(30) NOT NULL, -- 'proposal', 'negotiation', 'closed_won', 'closed_lost'
    close_date DATE NOT NULL
);

CREATE TABLE contracts (
    contract_id SERIAL PRIMARY KEY,
    opportunity_id INT NOT NULL REFERENCES opportunities(opportunity_id),
    signed_date DATE NOT NULL,
    annual_contract_value NUMERIC(12, 2) NOT NULL,
    duration_months INT NOT NULL
);
