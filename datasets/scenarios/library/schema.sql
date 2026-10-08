DROP TABLE IF EXISTS book_loans CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS authors CASCADE;

CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    nationality VARCHAR(50)
);

CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    author_id INT NOT NULL REFERENCES authors(author_id),
    category VARCHAR(50) NOT NULL,
    publication_year INT NOT NULL,
    copies_available INT NOT NULL DEFAULT 1
);

CREATE TABLE members (
    member_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    membership_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
);

CREATE TABLE book_loans (
    loan_id SERIAL PRIMARY KEY,
    book_id INT NOT NULL REFERENCES books(book_id),
    member_id INT NOT NULL REFERENCES members(member_id),
    loan_date DATE NOT NULL,
    due_date DATE NOT NULL,
    returned_date DATE
);
