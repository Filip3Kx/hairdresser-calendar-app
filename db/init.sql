CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        surename TEXT NOT NULL,
        email TEXT NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL
    );

    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE
    );

    INSERT INTO users (name, email, password, is_admin) 
    VALUES ('admin', 'admin@example.com', 'admin', TRUE);