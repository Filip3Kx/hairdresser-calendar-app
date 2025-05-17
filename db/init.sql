CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE
);

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER,
    price NUMERIC(10, 2)
);

INSERT INTO services (name, description, duration, price) VALUES
('Not specified', 'To be discussed with the saloon', '60', '0.00'),
('Haircut', 'A simple haircut', '30', '20.00'),
('Shave', 'A simple shave', '15', '10.00'),
('Facial', 'A simple facial treatment', '45', '50.00'),
('Manicure', 'A simple manicure treatment', '30', '25.00'),
('Pedicure', 'A simple pedicure treatment', '30', '25.00');

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    email TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    phone TEXT,
    service INTEGER REFERENCES services(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

    