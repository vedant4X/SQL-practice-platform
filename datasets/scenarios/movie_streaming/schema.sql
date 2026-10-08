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
);
