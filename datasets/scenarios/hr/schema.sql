DROP TABLE IF EXISTS job_offers CASCADE;
DROP TABLE IF EXISTS interview_stages CASCADE;
DROP TABLE IF EXISTS applicants CASCADE;
DROP TABLE IF EXISTS job_postings CASCADE;

CREATE TABLE job_postings (
    posting_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    min_experience_years INT NOT NULL,
    base_salary_max NUMERIC(10, 2) NOT NULL,
    posted_date DATE NOT NULL
);

CREATE TABLE applicants (
    applicant_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    years_experience INT NOT NULL,
    current_company VARCHAR(100)
);

CREATE TABLE interview_stages (
    stage_id SERIAL PRIMARY KEY,
    posting_id INT NOT NULL REFERENCES job_postings(posting_id),
    applicant_id INT NOT NULL REFERENCES applicants(applicant_id),
    stage_name VARCHAR(50) NOT NULL, -- 'screening', 'technical', 'system_design', 'behavioral'
    interviewer_score INT NOT NULL CHECK (interviewer_score BETWEEN 1 AND 5),
    completed_at TIMESTAMP NOT NULL
);

CREATE TABLE job_offers (
    offer_id SERIAL PRIMARY KEY,
    posting_id INT NOT NULL REFERENCES job_postings(posting_id),
    applicant_id INT NOT NULL REFERENCES applicants(applicant_id),
    offered_salary NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL -- 'accepted', 'declined', 'pending'
);
