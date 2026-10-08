import fs from "fs";
import path from "path";

const scenarios = [
  {
    name: "banking",
    schema: `
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS bank_customers CASCADE;

CREATE TABLE bank_customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    credit_score INT NOT NULL,
    joined_date DATE NOT NULL
);

CREATE TABLE branches (
    branch_id SERIAL PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    total_assets NUMERIC(14, 2) NOT NULL
);

CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES bank_customers(customer_id),
    branch_id INT NOT NULL REFERENCES branches(branch_id),
    account_type VARCHAR(20) NOT NULL, -- 'checking', 'savings', 'money_market'
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL REFERENCES accounts(account_id),
    transaction_type VARCHAR(20) NOT NULL, -- 'deposit', 'withdrawal', 'transfer'
    amount NUMERIC(10, 2) NOT NULL,
    tx_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed'
);`,
    sampleData: `
INSERT INTO bank_customers VALUES
(1, 'Alice Morgan', 'alice.m@bank.com', 760, '2021-03-10'),
(2, 'Bob Vance', 'bob.v@bank.com', 680, '2021-07-22'),
(3, 'Charlie Day', 'charlie.d@bank.com', 720, '2022-01-15'),
(4, 'Dana Scully', 'dana.s@bank.com', 810, '2022-05-18'),
(5, 'Fox Mulder', 'fox.m@bank.com', 620, '2023-02-01');

INSERT INTO branches VALUES
(1, 'Metro Downtown', 'New York', 85000000.00),
(2, 'West Coast Hub', 'San Francisco', 92000000.00),
(3, 'Windy City Branch', 'Chicago', 64000000.00);

INSERT INTO accounts VALUES
(101, 1, 1, 'checking', 14500.00, '2021-03-10 10:00:00'),
(102, 1, 1, 'savings', 52000.00, '2021-04-01 11:30:00'),
(103, 2, 2, 'checking', 3400.00, '2021-07-22 09:15:00'),
(104, 3, 3, 'checking', 8900.00, '2022-01-15 14:00:00'),
(105, 4, 1, 'savings', 125000.00, '2022-05-18 16:45:00'),
(106, 5, 2, 'checking', 850.00, '2023-02-01 13:20:00');

INSERT INTO transactions VALUES
(1, 101, 'deposit', 5000.00, '2023-01-10 09:30:00', 'completed'),
(2, 101, 'withdrawal', 1200.00, '2023-01-15 14:10:00', 'completed'),
(3, 102, 'deposit', 10000.00, '2023-02-01 11:00:00', 'completed'),
(4, 103, 'withdrawal', 500.00, '2023-02-14 16:30:00', 'completed'),
(5, 104, 'deposit', 3200.00, '2023-03-05 10:15:00', 'completed'),
(6, 105, 'deposit', 25000.00, '2023-03-20 12:45:00', 'completed'),
(7, 106, 'withdrawal', 300.00, '2023-04-01 15:00:00', 'completed');`,
    hiddenData1: `
INSERT INTO bank_customers VALUES
(1, 'Tony Soprano', 'tony@bada.com', 710, '2021-01-10'),
(2, 'Paulie Gualtieri', 'paulie@bada.com', 590, '2021-04-12');
INSERT INTO branches VALUES (1, 'North Jersey', 'Newark', 45000000.00);
INSERT INTO accounts VALUES
(101, 1, 1, 'checking', 45000.00, '2021-01-10 10:00:00'),
(102, 2, 1, 'savings', 12000.00, '2021-04-12 11:00:00');
INSERT INTO transactions VALUES
(1, 101, 'deposit', 20000.00, '2023-01-05 10:00:00', 'completed'),
(2, 102, 'withdrawal', 1000.00, '2023-02-10 14:00:00', 'completed');`,
    hiddenData2: `
INSERT INTO bank_customers VALUES
(1, 'Walter White', 'ww@pollos.com', 800, '2020-05-01');
INSERT INTO branches VALUES (1, 'Albuquerque Main', 'Albuquerque', 30000000.00);
INSERT INTO accounts VALUES (101, 1, 1, 'checking', 750000.00, '2020-05-01 10:00:00');
INSERT INTO transactions VALUES (1, 101, 'deposit', 50000.00, '2023-01-10 10:00:00', 'completed');`
  },
  {
    name: "hospital",
    schema: `
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    emergency_contact VARCHAR(20)
);

CREATE TABLE doctors (
    doctor_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    experience_years INT NOT NULL
);

CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id),
    doctor_id INT NOT NULL REFERENCES doctors(doctor_id),
    appointment_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'completed', 'scheduled', 'cancelled', 'no_show'
    diagnosis TEXT
);

CREATE TABLE prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    appointment_id INT NOT NULL REFERENCES appointments(appointment_id),
    medication_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    duration_days INT NOT NULL
);`,
    sampleData: `
INSERT INTO patients VALUES
(1, 'Grace Hopper', '1985-04-12', 'F', 'O+', '555-0101'),
(2, 'John Von Neumann', '1990-11-23', 'M', 'A+', '555-0102'),
(3, 'Barbara Liskov', '1978-08-05', 'F', 'B+', '555-0103'),
(4, 'Donald Knuth', '1965-01-10', 'M', 'AB+', '555-0104'),
(5, 'Linus Torvalds', '1982-12-28', 'M', 'O-', '555-0105');

INSERT INTO doctors VALUES
(1, 'Dr. Gregory House', 'Diagnostic Medicine', 'Internal', 22),
(2, 'Dr. Allison Cameron', 'Immunology', 'Immunology', 8),
(3, 'Dr. Robert Chase', 'Intensive Care', 'Surgery', 10),
(4, 'Dr. James Wilson', 'Oncology', 'Oncology', 18);

INSERT INTO appointments VALUES
(1, 1, 1, '2023-01-15 09:00:00', 'completed', 'Acute intermittent porphyria'),
(2, 2, 2, '2023-01-20 11:30:00', 'completed', 'Severe allergic rhinitis'),
(3, 3, 1, '2023-02-05 14:00:00', 'completed', 'Lyme disease suspected'),
(4, 4, 4, '2023-02-18 10:00:00', 'completed', 'Benign lymphadenopathy'),
(5, 5, 3, '2023-03-01 15:30:00', 'cancelled', NULL),
(6, 1, 2, '2023-03-12 10:30:00', 'completed', 'Routine post-treatment follow-up');

INSERT INTO prescriptions VALUES
(1, 1, 'Hemin Infusion', '3mg/kg IV', 4),
(2, 2, 'Fexofenadine', '180mg Daily', 30),
(3, 3, 'Doxycycline', '100mg BID', 14),
(4, 4, 'Observation Only', 'None', 0);`,
    hiddenData1: `
INSERT INTO patients VALUES (1, 'Marty McFly', '1968-06-09', 'M', 'O+', '555-1985');
INSERT INTO doctors VALUES (1, 'Dr. Emmett Brown', 'General Practice', 'Clinic', 30);
INSERT INTO appointments VALUES (1, 1, 1, '2023-01-10 10:00:00', 'completed', 'Temporal displacement fatigue');
INSERT INTO prescriptions VALUES (1, 1, 'Hydration salts', '500ml', 3);`,
    hiddenData2: `
INSERT INTO patients VALUES (1, 'Sarah Connor', '1975-02-14', 'F', 'A-', '555-2029');
INSERT INTO doctors VALUES (1, 'Dr. Peter Silberman', 'Psychiatry', 'Behavioral', 25);
INSERT INTO appointments VALUES (1, 1, 1, '2023-02-01 11:00:00', 'completed', 'Stress response');
INSERT INTO prescriptions VALUES (1, 1, 'Sertraline', '50mg', 30);`
  },
  {
    name: "food_delivery",
    schema: `
DROP TABLE IF EXISTS delivery_order_items CASCADE;
DROP TABLE IF EXISTS delivery_orders CASCADE;
DROP TABLE IF EXISTS delivery_drivers CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

CREATE TABLE restaurants (
    restaurant_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cuisine VARCHAR(50) NOT NULL,
    rating NUMERIC(2, 1) NOT NULL,
    city VARCHAR(50) NOT NULL
);

CREATE TABLE menu_items (
    item_id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(restaurant_id),
    item_name VARCHAR(100) NOT NULL,
    price NUMERIC(8, 2) NOT NULL,
    is_vegetarian BOOLEAN DEFAULT FALSE
);

CREATE TABLE delivery_drivers (
    driver_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL, -- 'bike', 'scooter', 'car'
    rating NUMERIC(2, 1) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE delivery_orders (
    order_id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(restaurant_id),
    driver_id INT REFERENCES delivery_drivers(driver_id),
    customer_name VARCHAR(100) NOT NULL,
    order_timestamp TIMESTAMP NOT NULL,
    delivery_fee NUMERIC(5, 2) NOT NULL,
    total_amount NUMERIC(8, 2) NOT NULL,
    delivery_status VARCHAR(20) NOT NULL -- 'delivered', 'in_transit', 'cancelled'
);

CREATE TABLE delivery_order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES delivery_orders(order_id),
    item_id INT NOT NULL REFERENCES menu_items(item_id),
    quantity INT NOT NULL,
    item_price NUMERIC(8, 2) NOT NULL
);`,
    sampleData: `
INSERT INTO restaurants VALUES
(1, 'Napoli Woodfire Pizza', 'Italian', 4.8, 'Chicago'),
(2, 'Tokyo Ramen Bar', 'Japanese', 4.9, 'Chicago'),
(3, 'Taco Fiesta', 'Mexican', 4.5, 'Chicago'),
(4, 'Green Lotus Vegan', 'Vegan', 4.7, 'Chicago');

INSERT INTO menu_items VALUES
(1, 1, 'Margherita Pizza', 16.50, TRUE),
(2, 1, 'Truffle Mushroom Pizza', 21.00, TRUE),
(3, 1, 'Diavola Pepperoni', 19.00, FALSE),
(4, 2, 'Tonkotsu Ramen', 15.50, FALSE),
(5, 2, 'Spicy Miso Ramen', 16.00, FALSE),
(6, 2, 'Gyoza Dumplings', 8.50, FALSE),
(7, 3, 'Street Tacos Trio', 12.00, FALSE),
(8, 3, 'Guacamole & Chips', 7.50, TRUE),
(9, 4, 'Buddha Bowl', 14.00, TRUE);

INSERT INTO delivery_drivers VALUES
(1, 'Carlos Ramirez', 'bike', 4.9, TRUE),
(2, 'Sarah Jenkins', 'scooter', 4.8, TRUE),
(3, 'Michael Chang', 'car', 4.7, TRUE),
(4, 'David Patel', 'bike', 4.5, FALSE);

INSERT INTO delivery_orders VALUES
(101, 1, 1, 'Emily Watson', '2023-06-01 18:30:00', 3.99, 37.50, 'delivered'),
(102, 2, 2, 'James Bond', '2023-06-01 19:15:00', 4.99, 31.50, 'delivered'),
(103, 3, 1, 'Clark Kent', '2023-06-02 12:45:00', 2.99, 19.50, 'delivered'),
(104, 1, 3, 'Bruce Wayne', '2023-06-02 20:10:00', 3.99, 40.00, 'delivered'),
(105, 4, 2, 'Diana Prince', '2023-06-03 13:00:00', 3.50, 17.50, 'delivered'),
(106, 2, NULL, 'Peter Parker', '2023-06-03 19:30:00', 4.99, 32.00, 'cancelled');

INSERT INTO delivery_order_items VALUES
(1, 101, 1, 1, 16.50),
(2, 101, 2, 1, 21.00),
(3, 102, 4, 2, 15.50),
(4, 103, 7, 1, 12.00),
(5, 103, 8, 1, 7.50),
(6, 104, 2, 1, 21.00),
(7, 104, 3, 1, 19.00),
(8, 105, 9, 1, 14.00);`,
    hiddenData1: `
INSERT INTO restaurants VALUES (1, 'Burger Haven', 'American', 4.6, 'Austin');
INSERT INTO menu_items VALUES (1, 1, 'Double Smash Burger', 13.50, FALSE);
INSERT INTO delivery_drivers VALUES (1, 'Leo Vance', 'car', 4.8, TRUE);
INSERT INTO delivery_orders VALUES (101, 1, 1, 'Sam Wilson', '2023-07-01 18:00:00', 3.99, 17.49, 'delivered');
INSERT INTO delivery_order_items VALUES (1, 101, 1, 1, 13.50);`,
    hiddenData2: `
INSERT INTO restaurants VALUES (1, 'Curry Express', 'Indian', 4.7, 'Seattle');
INSERT INTO menu_items VALUES (1, 1, 'Paneer Tikka Masala', 15.00, TRUE);
INSERT INTO delivery_drivers VALUES (1, 'Rita Fox', 'scooter', 4.9, TRUE);
INSERT INTO delivery_orders VALUES (101, 1, 1, 'Bucky Barnes', '2023-07-10 19:30:00', 4.50, 19.50, 'delivered');
INSERT INTO delivery_order_items VALUES (1, 101, 1, 1, 15.00);`
  },
  {
    name: "movie_streaming",
    schema: `
DROP TABLE IF EXISTS watch_history CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS streaming_users CASCADE;

CREATE TABLE streaming_users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL,
    joined_date DATE NOT NULL
);

CREATE TABLE movies (
    movie_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    genre VARCHAR(50) NOT NULL,
    release_year INT NOT NULL,
    duration_minutes INT NOT NULL,
    imdb_rating NUMERIC(3, 1)
);

CREATE TABLE subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES streaming_users(user_id),
    plan_name VARCHAR(30) NOT NULL, -- 'basic', 'standard', 'premium'
    monthly_price NUMERIC(6, 2) NOT NULL,
    status VARCHAR(20) NOT NULL -- 'active', 'cancelled', 'expired'
);

CREATE TABLE watch_history (
    watch_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES streaming_users(user_id),
    movie_id INT NOT NULL REFERENCES movies(movie_id),
    watched_at TIMESTAMP NOT NULL,
    completed_percentage INT NOT NULL -- 0 to 100
);`,
    sampleData: `
INSERT INTO streaming_users VALUES
(1, 'neo_matrix', 'neo@zion.net', 'USA', '2021-01-15'),
(2, 'trinity_z', 'trinity@zion.net', 'USA', '2021-02-10'),
(3, 'morpheus', 'morpheus@zion.net', 'USA', '2021-03-01'),
(4, 'cypher', 'cypher@zion.net', 'UK', '2022-04-18'),
(5, 'oracle', 'oracle@matrix.net', 'Canada', '2022-09-05');

INSERT INTO movies VALUES
(1, 'Interstellar', 'Sci-Fi', 2014, 169, 8.7),
(2, 'Inception', 'Sci-Fi', 2010, 148, 8.8),
(3, 'The Dark Knight', 'Action', 2008, 152, 9.0),
(4, 'Pulp Fiction', 'Crime', 1994, 154, 8.9),
(5, 'Spirited Away', 'Animation', 2001, 125, 8.6),
(6, 'Parasite', 'Thriller', 2019, 132, 8.5);

INSERT INTO subscriptions VALUES
(1, 1, 'premium', 19.99, 'active'),
(2, 2, 'premium', 19.99, 'active'),
(3, 3, 'standard', 14.99, 'active'),
(4, 4, 'basic', 9.99, 'cancelled'),
(5, 5, 'standard', 14.99, 'active');

INSERT INTO watch_history VALUES
(1, 1, 1, '2023-01-10 20:00:00', 100),
(2, 1, 2, '2023-01-15 21:30:00', 95),
(3, 2, 1, '2023-01-18 19:00:00', 100),
(4, 2, 3, '2023-02-01 22:00:00', 80),
(5, 3, 5, '2023-02-14 18:30:00', 100),
(6, 4, 4, '2023-03-01 23:00:00', 45),
(7, 5, 6, '2023-03-15 20:15:00', 100),
(8, 1, 3, '2023-04-02 21:00:00', 100);`,
    hiddenData1: `
INSERT INTO streaming_users VALUES (1, 'luke_sky', 'luke@tatooine.com', 'USA', '2021-05-01');
INSERT INTO movies VALUES (1, 'Star Wars IV', 'Sci-Fi', 1977, 121, 8.6);
INSERT INTO subscriptions VALUES (1, 1, 'premium', 19.99, 'active');
INSERT INTO watch_history VALUES (1, 1, 1, '2023-01-05 20:00:00', 100);`,
    hiddenData2: `
INSERT INTO streaming_users VALUES (1, 'han_solo', 'han@falcon.com', 'Corellia', '2021-06-01');
INSERT INTO movies VALUES (1, 'Blade Runner', 'Sci-Fi', 1982, 117, 8.1);
INSERT INTO subscriptions VALUES (1, 1, 'standard', 14.99, 'active');
INSERT INTO watch_history VALUES (1, 1, 1, '2023-02-10 19:00:00', 90);`
  },
  {
    name: "social_media",
    schema: `
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS social_users CASCADE;

CREATE TABLE social_users (
    user_id SERIAL PRIMARY KEY,
    handle VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    bio TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES social_users(user_id),
    content TEXT NOT NULL,
    media_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES posts(post_id),
    user_id INT NOT NULL REFERENCES social_users(user_id),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE likes (
    like_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES posts(post_id),
    user_id INT NOT NULL REFERENCES social_users(user_id),
    liked_at TIMESTAMP NOT NULL,
    UNIQUE(post_id, user_id)
);

CREATE TABLE follows (
    follower_id INT NOT NULL REFERENCES social_users(user_id),
    following_id INT NOT NULL REFERENCES social_users(user_id),
    followed_at TIMESTAMP NOT NULL,
    PRIMARY KEY(follower_id, following_id)
);`,
    sampleData: `
INSERT INTO social_users VALUES
(1, 'tech_guru', 'Alex Rivera', 'Building distributed systems', '2021-01-10 10:00:00'),
(2, 'data_wiz', 'Clara Belle', 'SQL & Machine Learning advocate', '2021-02-15 11:30:00'),
(3, 'design_pro', 'Marcus Cole', 'UI/UX Designer & Typographer', '2021-03-20 14:15:00'),
(4, 'dev_sam', 'Samantha Fox', 'Full-stack explorer', '2022-01-05 09:00:00'),
(5, 'quiet_reader', 'David Ross', 'Bookworm & Coffee lover', '2022-05-12 16:45:00');

INSERT INTO posts VALUES
(1, 1, 'PostgreSQL 16 CTE optimization benchmarks are astonishing!', NULL, '2023-01-15 10:30:00'),
(2, 2, 'Top 5 window functions every analyst must master.', NULL, '2023-01-18 14:00:00'),
(3, 1, 'Docker vs Podman in 2024: my honest architectural takeaways.', NULL, '2023-02-01 09:15:00'),
(4, 3, 'Design systems should prioritize keyboard accessibility first.', NULL, '2023-02-10 16:20:00'),
(5, 4, 'Just solved my first 100 SQL interview challenges!', NULL, '2023-03-05 11:45:00');

INSERT INTO comments VALUES
(1, 1, 2, 'Completely agree, the planner handles inline materialization well!', '2023-01-15 11:00:00'),
(2, 1, 4, 'What hardware did you benchmark on?', '2023-01-15 12:15:00'),
(3, 2, 1, 'LAG and LEAD save hours of self-joins.', '2023-01-18 15:30:00'),
(4, 4, 1, 'Crucial for WCAG AA compliance.', '2023-02-10 17:00:00');

INSERT INTO likes VALUES
(1, 1, 2, '2023-01-15 10:45:00'),
(2, 1, 3, '2023-01-15 11:10:00'),
(3, 1, 4, '2023-01-15 12:00:00'),
(4, 2, 1, '2023-01-18 14:30:00'),
(5, 2, 4, '2023-01-18 15:00:00'),
(6, 5, 1, '2023-03-05 12:00:00'),
(7, 5, 2, '2023-03-05 12:30:00');

INSERT INTO follows VALUES
(2, 1, '2021-03-01 10:00:00'),
(3, 1, '2021-04-10 14:00:00'),
(4, 1, '2022-02-01 09:30:00'),
(1, 2, '2021-03-05 11:00:00'),
(4, 2, '2022-03-15 15:20:00'),
(1, 3, '2021-05-01 16:00:00');`,
    hiddenData1: `
INSERT INTO social_users VALUES
(1, 'alice_w', 'Alice Wonder', 'Writer', '2021-01-01 10:00:00'),
(2, 'bob_m', 'Bob Maker', 'Coder', '2021-02-01 10:00:00');
INSERT INTO posts VALUES (1, 1, 'Hello world!', NULL, '2023-01-01 10:00:00');
INSERT INTO likes VALUES (1, 1, 2, '2023-01-01 10:30:00');
INSERT INTO follows VALUES (2, 1, '2021-03-01 10:00:00');`,
    hiddenData2: `
INSERT INTO social_users VALUES (1, 'solo_coder', 'Solo One', 'Hacker', '2021-01-01 10:00:00');
INSERT INTO posts VALUES (1, 1, 'Just starting out', NULL, '2023-02-01 10:00:00');`
  },
  {
    name: "airline",
    schema: `
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS flights CASCADE;
DROP TABLE IF EXISTS passengers CASCADE;
DROP TABLE IF EXISTS airports CASCADE;

CREATE TABLE airports (
    airport_code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL
);

CREATE TABLE passengers (
    passenger_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    passport_number VARCHAR(30) UNIQUE NOT NULL,
    frequent_flyer_miles INT DEFAULT 0
);

CREATE TABLE flights (
    flight_id SERIAL PRIMARY KEY,
    flight_number VARCHAR(10) NOT NULL,
    origin VARCHAR(3) NOT NULL REFERENCES airports(airport_code),
    destination VARCHAR(3) NOT NULL REFERENCES airports(airport_code),
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL -- 'on_time', 'delayed', 'cancelled'
);

CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    passenger_id INT NOT NULL REFERENCES passengers(passenger_id),
    booking_date TIMESTAMP NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    booking_status VARCHAR(20) NOT NULL -- 'confirmed', 'cancelled'
);

CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(booking_id),
    flight_id INT NOT NULL REFERENCES flights(flight_id),
    seat_number VARCHAR(5) NOT NULL,
    travel_class VARCHAR(20) NOT NULL -- 'economy', 'business', 'first'
);`,
    sampleData: `
INSERT INTO airports VALUES
('JFK', 'John F. Kennedy International', 'New York', 'USA'),
('LHR', 'Heathrow Airport', 'London', 'UK'),
('HND', 'Haneda Airport', 'Tokyo', 'Japan'),
('ORD', 'OHare International', 'Chicago', 'USA'),
('CDG', 'Charles de Gaulle', 'Paris', 'France');

INSERT INTO passengers VALUES
(1, 'Benjamin', 'Franklin', 'P987654321', 45000),
(2, 'Amelia', 'Earhart', 'P123456789', 120000),
(3, 'Charles', 'Lindbergh', 'P555666777', 85000),
(4, 'Bessie', 'Coleman', 'P444333222', 62000),
(5, 'Howard', 'Hughes', 'P111222333', 190000);

INSERT INTO flights VALUES
(1, 'AA100', 'JFK', 'LHR', '2023-05-10 18:30:00', '2023-05-11 06:45:00', 750.00, 'on_time'),
(2, 'BA202', 'LHR', 'JFK', '2023-05-15 10:00:00', '2023-05-15 13:15:00', 820.00, 'on_time'),
(3, 'JL005', 'JFK', 'HND', '2023-06-01 12:00:00', '2023-06-02 15:30:00', 1250.00, 'on_time'),
(4, 'UA440', 'ORD', 'LHR', '2023-06-10 21:00:00', '2023-06-11 10:45:00', 690.00, 'delayed'),
(5, 'AF022', 'JFK', 'CDG', '2023-06-20 19:15:00', '2023-06-21 08:30:00', 780.00, 'cancelled');

INSERT INTO bookings VALUES
(1, 1, '2023-04-01 14:00:00', 750.00, 'confirmed'),
(2, 2, '2023-04-05 11:20:00', 2500.00, 'confirmed'),
(3, 3, '2023-04-12 16:45:00', 1250.00, 'confirmed'),
(4, 4, '2023-05-01 09:30:00', 690.00, 'confirmed'),
(5, 5, '2023-05-10 15:10:00', 780.00, 'cancelled');

INSERT INTO tickets VALUES
(1, 1, 1, '14B', 'economy'),
(2, 2, 1, '2A', 'business'),
(3, 2, 2, '2A', 'business'),
(4, 3, 3, '12F', 'economy'),
(5, 4, 4, '22C', 'economy');`,
    hiddenData1: `
INSERT INTO airports VALUES ('LAX', 'Los Angeles International', 'Los Angeles', 'USA'), ('SFO', 'San Francisco International', 'San Francisco', 'USA');
INSERT INTO passengers VALUES (1, 'Buzz', 'Aldrin', 'P000111222', 95000);
INSERT INTO flights VALUES (1, 'DL101', 'LAX', 'SFO', '2023-07-01 08:00:00', '2023-07-01 09:30:00', 180.00, 'on_time');
INSERT INTO bookings VALUES (1, 1, '2023-06-15 10:00:00', 180.00, 'confirmed');
INSERT INTO tickets VALUES (1, 1, 1, '4C', 'economy');`,
    hiddenData2: `
INSERT INTO airports VALUES ('BOS', 'Logan International', 'Boston', 'USA'), ('MIA', 'Miami International', 'Miami', 'USA');
INSERT INTO passengers VALUES (1, 'Neil', 'Armstrong', 'P999888777', 150000);
INSERT INTO flights VALUES (1, 'B650', 'BOS', 'MIA', '2023-08-01 10:00:00', '2023-08-01 13:30:00', 220.00, 'on_time');
INSERT INTO bookings VALUES (1, 1, '2023-07-20 14:00:00', 220.00, 'confirmed');
INSERT INTO tickets VALUES (1, 1, 1, '10A', 'economy');`
  },
  {
    name: "hotel",
    schema: `
DROP TABLE IF EXISTS room_services CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS hotel_guests CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;

CREATE TABLE hotels (
    hotel_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    star_rating INT NOT NULL CHECK (star_rating BETWEEN 1 AND 5)
);

CREATE TABLE rooms (
    room_id SERIAL PRIMARY KEY,
    hotel_id INT NOT NULL REFERENCES hotels(hotel_id),
    room_number VARCHAR(10) NOT NULL,
    room_type VARCHAR(30) NOT NULL, -- 'standard', 'deluxe', 'suite'
    price_per_night NUMERIC(8, 2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE hotel_guests (
    guest_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20)
);

CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    guest_id INT NOT NULL REFERENCES hotel_guests(guest_id),
    room_id INT NOT NULL REFERENCES rooms(room_id),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL -- 'confirmed', 'checked_out', 'cancelled'
);

CREATE TABLE room_services (
    service_id SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL REFERENCES reservations(reservation_id),
    service_type VARCHAR(50) NOT NULL, -- 'breakfast', 'spa', 'laundry'
    charge NUMERIC(8, 2) NOT NULL,
    ordered_at TIMESTAMP NOT NULL
);`,
    sampleData: `
INSERT INTO hotels VALUES
(1, 'Grand Palace Hotel', 'Paris', 5),
(2, 'Boutique Canal Inn', 'Amsterdam', 4),
(3, 'Alpine Mountain Lodge', 'Zurich', 4);

INSERT INTO rooms VALUES
(1, 1, '101', 'standard', 220.00, TRUE),
(2, 1, '201', 'deluxe', 380.00, TRUE),
(3, 1, 'PH1', 'suite', 850.00, TRUE),
(4, 2, '12', 'standard', 160.00, TRUE),
(5, 2, '24', 'deluxe', 240.00, TRUE),
(6, 3, '105', 'standard', 200.00, TRUE);

INSERT INTO hotel_guests VALUES
(1, 'Victor', 'Hugo', 'victor@hugo.fr', '555-0011'),
(2, 'Vincent', 'Van Gogh', 'vincent@art.nl', '555-0022'),
(3, 'Albert', 'Einstein', 'albert@phys.ch', '555-0033'),
(4, 'Marie', 'Curie', 'marie@curie.fr', '555-0044');

INSERT INTO reservations VALUES
(1, 1, 2, '2023-04-10', '2023-04-14', 1520.00, 'checked_out'),
(2, 2, 4, '2023-04-15', '2023-04-18', 480.00, 'checked_out'),
(3, 3, 6, '2023-05-01', '2023-05-05', 800.00, 'checked_out'),
(4, 4, 3, '2023-06-10', '2023-06-13', 2550.00, 'confirmed'),
(5, 1, 1, '2023-07-01', '2023-07-03', 440.00, 'cancelled');

INSERT INTO room_services VALUES
(1, 1, 'breakfast', 45.00, '2023-04-11 08:30:00'),
(2, 1, 'laundry', 30.00, '2023-04-12 11:00:00'),
(3, 3, 'spa', 120.00, '2023-05-02 16:00:00'),
(4, 4, 'breakfast', 55.00, '2023-06-11 09:00:00');`,
    hiddenData1: `
INSERT INTO hotels VALUES (1, 'Sunset Resort', 'Honolulu', 5);
INSERT INTO rooms VALUES (1, 1, '501', 'suite', 600.00, TRUE);
INSERT INTO hotel_guests VALUES (1, 'Jack', 'London', 'jack@adventures.com', '555-9988');
INSERT INTO reservations VALUES (1, 1, 1, '2023-08-01', '2023-08-05', 2400.00, 'checked_out');
INSERT INTO room_services VALUES (1, 1, 'breakfast', 40.00, '2023-08-02 08:00:00');`,
    hiddenData2: `
INSERT INTO hotels VALUES (1, 'Highland Castle', 'Edinburgh', 4);
INSERT INTO rooms VALUES (1, 1, '10', 'standard', 150.00, TRUE);
INSERT INTO hotel_guests VALUES (1, 'Arthur', 'Conan Doyle', 'arthur@bakerst.co.uk', '555-2211');
INSERT INTO reservations VALUES (1, 1, 1, '2023-09-10', '2023-09-12', 300.00, 'checked_out');`
  },
  {
    name: "library",
    schema: `
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
);`,
    sampleData: `
INSERT INTO authors VALUES
(1, 'George Orwell', 'British'),
(2, 'Gabriel Garcia Marquez', 'Colombian'),
(3, 'Haruki Murakami', 'Japanese'),
(4, 'Jane Austen', 'British'),
(5, 'Isaac Asimov', 'American');

INSERT INTO books VALUES
(1, '1984', 1, 'Dystopian', 1949, 3),
(2, 'Animal Farm', 1, 'Satire', 1945, 2),
(3, 'One Hundred Years of Solitude', 2, 'Magic Realism', 1967, 1),
(4, 'Norwegian Wood', 3, 'Literary Fiction', 1987, 4),
(5, 'Pride and Prejudice', 4, 'Romance', 1813, 2),
(6, 'Foundation', 5, 'Sci-Fi', 1951, 3);

INSERT INTO members VALUES
(1, 'Leo Tolstoy', 'leo@writers.org', '2022-01-10', 'active'),
(2, 'Virginia Woolf', 'virginia@writers.org', '2022-03-15', 'active'),
(3, 'Franz Kafka', 'franz@writers.org', '2022-06-20', 'active'),
(4, 'Emily Dickinson', 'emily@writers.org', '2023-01-05', 'active');

INSERT INTO book_loans VALUES
(1, 1, 1, '2023-02-01', '2023-02-15', '2023-02-14'),
(2, 3, 2, '2023-02-10', '2023-02-24', '2023-02-22'),
(3, 4, 3, '2023-03-01', '2023-03-15', NULL), -- Currently borrowed/overdue
(4, 6, 1, '2023-03-10', '2023-03-24', '2023-03-20'),
(5, 5, 4, '2023-04-05', '2023-04-19', NULL);`,
    hiddenData1: `
INSERT INTO authors VALUES (1, 'Ernest Hemingway', 'American');
INSERT INTO books VALUES (1, 'The Old Man and the Sea', 1, 'Fiction', 1952, 2);
INSERT INTO members VALUES (1, 'F. Scott Fitzgerald', 'scott@writers.org', '2022-05-01', 'active');
INSERT INTO book_loans VALUES (1, 1, 1, '2023-05-01', '2023-05-15', '2023-05-10');`,
    hiddenData2: `
INSERT INTO authors VALUES (1, 'Homer', 'Greek');
INSERT INTO books VALUES (1, 'The Odyssey', 1, 'Epic Poetry', -700, 1);
INSERT INTO members VALUES (1, 'Virgil', 'virgil@ancient.org', '2022-08-01', 'active');
INSERT INTO book_loans VALUES (1, 1, 1, '2023-06-01', '2023-06-15', NULL);`
  },
  {
    name: "inventory",
    schema: `
DROP TABLE IF EXISTS stock_transactions CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;

CREATE TABLE warehouses (
    warehouse_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(50) NOT NULL,
    capacity INT NOT NULL
);

CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL
);

CREATE TABLE stock_items (
    item_id SERIAL PRIMARY KEY,
    warehouse_id INT NOT NULL REFERENCES warehouses(warehouse_id),
    supplier_id INT NOT NULL REFERENCES suppliers(supplier_id),
    sku VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 10,
    unit_cost NUMERIC(10, 2) NOT NULL
);

CREATE TABLE stock_transactions (
    tx_id SERIAL PRIMARY KEY,
    item_id INT NOT NULL REFERENCES stock_items(item_id),
    transaction_type VARCHAR(20) NOT NULL, -- 'inbound', 'outbound', 'adjustment'
    quantity INT NOT NULL,
    tx_date TIMESTAMP NOT NULL
);`,
    sampleData: `
INSERT INTO warehouses VALUES
(1, 'Midwest Logistics Hub', 'Chicago', 50000),
(2, 'Pacific Coast Facility', 'Seattle', 35000),
(3, 'Atlantic Distribution Depot', 'Newark', 45000);

INSERT INTO suppliers VALUES
(1, 'Apex Electronics Component Co', 'apex@suppliers.com', 'Taiwan'),
(2, 'Nordic Timber & Materials', 'nordic@timber.se', 'Sweden'),
(3, 'Global Packaging Solutions', 'info@globalpkg.com', 'USA');

INSERT INTO stock_items VALUES
(1, 1, 1, 'SKU-MICRO-01', 'ARM Cortex Processor IC', 450, 100, 18.50),
(2, 1, 1, 'SKU-CAP-100', 'Electrolytic Capacitor 100uF', 3200, 500, 0.45),
(3, 2, 2, 'SKU-PLANK-OAK', 'Solid Oak Finished Planks 2m', 15, 25, 42.00), -- Below reorder level
(4, 2, 3, 'SKU-BOX-M', 'Standard Corrugated Box Medium', 1800, 300, 1.20),
(5, 3, 1, 'SKU-OLED-6IN', '6-inch OLED Display Panel', 8, 50, 65.00); -- Critical stock level

INSERT INTO stock_transactions VALUES
(1, 1, 'inbound', 500, '2023-01-15 08:30:00'),
(2, 1, 'outbound', 50, '2023-01-20 14:00:00'),
(3, 2, 'inbound', 4000, '2023-02-01 10:00:00'),
(4, 2, 'outbound', 800, '2023-02-15 16:30:00'),
(5, 3, 'inbound', 50, '2023-03-01 09:00:00'),
(6, 3, 'outbound', 35, '2023-03-20 11:45:00');`,
    hiddenData1: `
INSERT INTO warehouses VALUES (1, 'Southern Depot', 'Dallas', 25000);
INSERT INTO suppliers VALUES (1, 'Texas Precision Instruments', 'tpi@texas.com', 'USA');
INSERT INTO stock_items VALUES (1, 1, 1, 'SKU-RELAY-01', '12V Automotive Relay', 200, 50, 4.50);
INSERT INTO stock_transactions VALUES (1, 1, 'inbound', 200, '2023-04-01 10:00:00');`,
    hiddenData2: `
INSERT INTO warehouses VALUES (1, 'Mountain Depot', 'Denver', 15000);
INSERT INTO suppliers VALUES (1, 'Rocky Metal Works', 'rocky@metal.com', 'USA');
INSERT INTO stock_items VALUES (1, 1, 1, 'SKU-BOLT-M8', 'M8 Steel Hex Bolt 50mm', 1500, 200, 0.25);
INSERT INTO stock_transactions VALUES (1, 1, 'inbound', 1500, '2023-05-01 10:00:00');`
  },
  {
    name: "finance",
    schema: `
DROP TABLE IF EXISTS dividends CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;

CREATE TABLE portfolios (
    portfolio_id SERIAL PRIMARY KEY,
    owner_name VARCHAR(100) NOT NULL,
    risk_tolerance VARCHAR(20) NOT NULL, -- 'low', 'moderate', 'high'
    created_at DATE NOT NULL
);

CREATE TABLE stocks (
    symbol VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    current_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE trades (
    trade_id SERIAL PRIMARY KEY,
    portfolio_id INT NOT NULL REFERENCES portfolios(portfolio_id),
    symbol VARCHAR(10) NOT NULL REFERENCES stocks(symbol),
    trade_type VARCHAR(10) NOT NULL, -- 'BUY', 'SELL'
    shares INT NOT NULL,
    price_per_share NUMERIC(10, 2) NOT NULL,
    trade_date TIMESTAMP NOT NULL
);

CREATE TABLE dividends (
    dividend_id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL REFERENCES stocks(symbol),
    amount_per_share NUMERIC(6, 2) NOT NULL,
    payout_date DATE NOT NULL
);`,
    sampleData: `
INSERT INTO portfolios VALUES
(1, 'Warren Buffet Fund', 'moderate', '2021-01-01'),
(2, 'Tech Growth Trust', 'high', '2021-06-15'),
(3, 'Conservative Income Shield', 'low', '2022-01-10');

INSERT INTO stocks VALUES
('AAPL', 'Apple Inc', 'Technology', 185.50),
('MSFT', 'Microsoft Corp', 'Technology', 415.20),
('JNJ', 'Johnson & Johnson', 'Healthcare', 155.00),
('KO', 'The Coca-Cola Co', 'Consumer Defensive', 62.40),
('NVDA', 'NVIDIA Corp', 'Technology', 890.00);

INSERT INTO trades VALUES
(1, 1, 'AAPL', 'BUY', 500, 150.00, '2022-03-10 10:00:00'),
(2, 1, 'KO', 'BUY', 1000, 58.00, '2022-04-15 11:30:00'),
(3, 2, 'NVDA', 'BUY', 200, 420.00, '2022-08-01 14:15:00'),
(4, 2, 'MSFT', 'BUY', 300, 310.00, '2022-10-05 09:45:00'),
(5, 3, 'JNJ', 'BUY', 800, 160.00, '2023-01-20 13:00:00'),
(6, 2, 'NVDA', 'SELL', 50, 780.00, '2023-05-15 15:30:00');

INSERT INTO dividends VALUES
(1, 'AAPL', 0.24, '2023-02-15'),
(2, 'KO', 0.46, '2023-04-01'),
(3, 'JNJ', 1.19, '2023-03-10'),
(4, 'MSFT', 0.75, '2023-03-14');`,
    hiddenData1: `
INSERT INTO portfolios VALUES (1, 'Alpha Capital', 'high', '2021-03-01');
INSERT INTO stocks VALUES ('AMZN', 'Amazon.com Inc', 'Consumer Cyclical', 178.00);
INSERT INTO trades VALUES (1, 1, 'AMZN', 'BUY', 100, 130.00, '2023-01-10 10:00:00');
INSERT INTO dividends VALUES (1, 'AMZN', 0.00, '2023-01-01');`,
    hiddenData2: `
INSERT INTO portfolios VALUES (1, 'Beta Holdings', 'low', '2021-05-01');
INSERT INTO stocks VALUES ('PG', 'Procter & Gamble', 'Consumer Defensive', 160.00);
INSERT INTO trades VALUES (1, 1, 'PG', 'BUY', 200, 145.00, '2023-02-01 10:00:00');
INSERT INTO dividends VALUES (1, 'PG', 0.94, '2023-04-15');`
  },
  {
    name: "hr",
    schema: `
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
);`,
    sampleData: `
INSERT INTO job_postings VALUES
(1, 'Senior Data Engineer', 'Data', 5, 175000.00, '2023-01-10'),
(2, 'Backend Architect', 'Engineering', 8, 210000.00, '2023-01-15'),
(3, 'Product Designer', 'Design', 4, 140000.00, '2023-02-01');

INSERT INTO applicants VALUES
(1, 'Maya', 'Lin', 'maya.lin@email.com', 6, 'FinTech Corp'),
(2, 'Liam', 'Chen', 'liam.chen@email.com', 9, 'CloudScale Systems'),
(3, 'Aria', 'Montgomery', 'aria.m@email.com', 4, 'Creative Studio'),
(4, 'Jon', 'Snow', 'jon.snow@email.com', 3, 'North Logistics');

INSERT INTO interview_stages VALUES
(1, 1, 1, 'technical', 5, '2023-01-20 14:00:00'),
(2, 1, 1, 'system_design', 4, '2023-01-25 15:30:00'),
(3, 2, 2, 'technical', 5, '2023-01-28 11:00:00'),
(4, 2, 2, 'system_design', 5, '2023-02-05 16:00:00'),
(5, 3, 3, 'portfolio_review', 4, '2023-02-12 10:00:00');

INSERT INTO job_offers VALUES
(1, 1, 1, 170000.00, 'accepted'),
(2, 2, 2, 205000.00, 'accepted');`,
    hiddenData1: `
INSERT INTO job_postings VALUES (1, 'DevOps Lead', 'Infrastructure', 7, 190000.00, '2023-03-01');
INSERT INTO applicants VALUES (1, 'Thor', 'Odinson', 'thor@asgard.com', 8, 'Thunder Corp');
INSERT INTO interview_stages VALUES (1, 1, 1, 'technical', 5, '2023-03-10 10:00:00');
INSERT INTO job_offers VALUES (1, 1, 1, 185000.00, 'accepted');`,
    hiddenData2: `
INSERT INTO job_postings VALUES (1, 'QA Lead', 'Testing', 5, 130000.00, '2023-04-01');
INSERT INTO applicants VALUES (1, 'Loki', 'Laufeyson', 'loki@asgard.com', 6, 'Mischief Labs');
INSERT INTO interview_stages VALUES (1, 1, 1, 'technical', 4, '2023-04-15 10:00:00');
INSERT INTO job_offers VALUES (1, 1, 1, 125000.00, 'declined');`
  },
  {
    name: "sales",
    schema: `
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
);`,
    sampleData: `
INSERT INTO sales_reps VALUES
(1, 'Jordan Belfort', 'Northeast', 1000000.00, 0.08),
(2, 'Glengarry Ross', 'West', 1200000.00, 0.09),
(3, 'Shelley Levene', 'Midwest', 750000.00, 0.07);

INSERT INTO leads VALUES
(1, 1, 'Omni Consumer Products', 'Manufacturing', 'qualified'),
(2, 1, 'Initech Solutions', 'Technology', 'qualified'),
(3, 2, 'Cyberdyne Systems', 'Defense', 'qualified'),
(4, 2, 'Massive Dynamic', 'Research', 'qualified'),
(5, 3, 'Dunder Mifflin', 'Paper', 'lost');

INSERT INTO opportunities VALUES
(1, 1, 250000.00, 'closed_won', '2023-02-15'),
(2, 2, 85000.00, 'closed_won', '2023-03-10'),
(3, 3, 500000.00, 'closed_won', '2023-04-01'),
(4, 4, 150000.00, 'negotiation', '2023-06-30');

INSERT INTO contracts VALUES
(1, 1, '2023-02-15', 250000.00, 12),
(2, 2, '2023-03-10', 85000.00, 24),
(3, 3, '2023-04-01', 500000.00, 36);`,
    hiddenData1: `
INSERT INTO sales_reps VALUES (1, 'Blake Sales', 'South', 900000.00, 0.08);
INSERT INTO leads VALUES (1, 1, 'Wayne Enterprises', 'Conglomerate', 'qualified');
INSERT INTO opportunities VALUES (1, 1, 400000.00, 'closed_won', '2023-05-01');
INSERT INTO contracts VALUES (1, 1, '2023-05-01', 400000.00, 12);`,
    hiddenData2: `
INSERT INTO sales_reps VALUES (1, 'Dave Moss', 'Central', 600000.00, 0.06);
INSERT INTO leads VALUES (1, 1, 'Stark Industries', 'Energy', 'qualified');
INSERT INTO opportunities VALUES (1, 1, 350000.00, 'closed_won', '2023-06-01');
INSERT INTO contracts VALUES (1, 1, '2023-06-01', 350000.00, 24);`
  }
];

const scenariosDir = path.resolve(process.cwd(), "datasets/scenarios");
if (!fs.existsSync(scenariosDir)) {
  fs.mkdirSync(scenariosDir, { recursive: true });
}

for (const sc of scenarios) {
  const dir = path.join(scenariosDir, sc.name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "schema.sql"), sc.schema.trim() + "\n");
  fs.writeFileSync(path.join(dir, "data.sql"), sc.sampleData.trim() + "\n");
  fs.writeFileSync(path.join(dir, "hidden_data_1.sql"), sc.hiddenData1.trim() + "\n");
  fs.writeFileSync(path.join(dir, "hidden_data_2.sql"), sc.hiddenData2.trim() + "\n");
  fs.writeFileSync(path.join(dir, "README.md"), `# ${sc.name.toUpperCase()} Scenario Database\n\nReal-world production schema and data for Level 10 realistic practice questions.\n`);
  console.log(`Generated scenario: ${sc.name}`);
}
console.log("All Level 10 scenario databases created successfully.");
