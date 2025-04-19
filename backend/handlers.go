package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

var db *sql.DB

func helloHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Hello, World!")
}

func createBookingHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	apiKey := r.Header.Get("Authorization")
	if apiKey != "" {
		if valid, _ := validateAPIKey(apiKey); !valid {
			http.Error(w, "Invalid API key", http.StatusUnauthorized)
			return
		}
	}
	var b Booking
	err := json.NewDecoder(r.Body).Decode(&b)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	err = db.QueryRow("SELECT id FROM users WHERE api_key = $1", apiKey).Scan(&b.UserId)
	if err != nil {
		valid, _ := validateUserExistence(b.Email)
		if valid {
			http.Error(w, "User already exists, please log in or use another e-mail", http.StatusConflict)
			return
		}
		_, err = db.Exec("INSERT INTO bookings (name, surename, email, date, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6)", b.Name, b.Surename, b.Email, b.Date, b.StartTime, b.EndTime)
	} else {
		_, err = db.Exec("INSERT INTO bookings (name, surename, email, date, start_time, end_time, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)", b.Name, b.Surename, b.Email, b.Date, b.StartTime, b.EndTime, b.UserId)
	}
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to insert booking: %v", err), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func editBookingHandler(w http.ResponseWriter, r *http.Request) {
	print(1)
}

func deleteBookingHandler(w http.ResponseWriter, r *http.Request) {
	print(1)
}

func getBookingsHandler(w http.ResponseWriter, r *http.Request) {
	logedIn := false
	id := "-1"
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	apiKey := r.Header.Get("Authorization")
	if apiKey != "" {
		if valid, _ := validateAPIKey(apiKey); !valid {
			http.Error(w, "Invalid API key", http.StatusUnauthorized)
			return
		}
		logedIn = true
		err := db.QueryRow("SELECT id FROM users WHERE api_key = $1", apiKey).Scan(&id)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to fetch user ID: %v", err), http.StatusInternalServerError)
			return
		}
	}

	rows, err := db.Query("SELECT date, start_time, end_time, user_id, users.api_key FROM bookings LEFT JOIN users ON bookings.user_id=users.id")
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch bookings: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var bookings []map[string]string
	for rows.Next() {
		var date, startTime, endTime, userId, apiKey sql.NullString
		if err := rows.Scan(&date, &startTime, &endTime, &userId, &apiKey); err != nil {
			http.Error(w, fmt.Sprintf("Failed to parse bookings: %v", err), http.StatusInternalServerError)
			return
		}
		booking := map[string]string{
			"date":       date.String,
			"start_time": startTime.String,
			"end_time":   endTime.String,
		}
		if userId.Valid && logedIn && id == userId.String {
			booking["user_id"] = userId.String
		}
		bookings = append(bookings, booking)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bookings)
}

func registerUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var u User
	err := json.NewDecoder(r.Body).Decode(&u)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	valid, _ := validateUserExistence(u.Email)
	if valid {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	encryptedPassword, err := encryptPassword(u.Password)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to encrypt password: %v", err), http.StatusInternalServerError)
		return
	}

	apiKey, err := generateAPIKey()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to generate API key: %v", err), http.StatusInternalServerError)
		return
	}

	_, err = db.Exec("INSERT INTO users (name, surename, email, password, api_key) VALUES ($1, $2, $3, $4, $5)", u.Name, u.Surename, u.Email, encryptedPassword, apiKey)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to register user: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintln(w, "User registered")
}

func loginUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var u User
	err := json.NewDecoder(r.Body).Decode(&u)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	var encryptedPassword string
	err = db.QueryRow("SELECT password FROM users WHERE email = $1", u.Email).Scan(&encryptedPassword)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusUnauthorized)
			return
		}
		http.Error(w, fmt.Sprintf("Failed to fetch user: %v", err), http.StatusInternalServerError)
		return
	}

	err = decryptPassword(encryptedPassword, u.Password)
	if err != nil {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	var apiKey string
	err = db.QueryRow("SELECT api_key FROM users WHERE email = $1", u.Email).Scan(&apiKey)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch API key: %v", err), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"api_key": apiKey})
}
