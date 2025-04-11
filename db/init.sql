CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    surename TEXT NOT NULL,
    email TEXT NOT NULL,
    date DATE NOT NULL
);