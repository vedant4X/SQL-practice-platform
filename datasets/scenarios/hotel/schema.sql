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
);
