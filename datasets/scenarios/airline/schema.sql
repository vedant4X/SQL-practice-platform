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
);
