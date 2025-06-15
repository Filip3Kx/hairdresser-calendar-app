package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"os"
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
	v, err := isBookingConflict(b.StartTime, b.EndTime)
	if v || err != nil {
		http.Error(w, "Booking conflict", http.StatusConflict)
		return
	}
	v, err = isEmailRegistered(b.Email, apiKey)
	if v || err != nil {
		http.Error(w, "Email already registered", http.StatusConflict)
		return
	}
	if b.Service == 0 {
		b.Service = 1
	}

	err = db.QueryRow("SELECT id FROM users WHERE api_key = $1", apiKey).Scan(&b.UserId)
	if err != nil {
		valid, _ := validateUserExistence(b.Email)
		if valid {
			http.Error(w, "User already exists, please log in or use another e-mail", http.StatusConflict)
			return
		}
	}

	_, err = db.Exec(
		"INSERT INTO bookings (name, surname, email, phone, service, start_time, end_time, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
		b.Name,
		b.Surname,
		b.Email,
		sql.NullString{String: b.Phone, Valid: b.Phone != ""},
		b.Service,
		b.StartTime,
		b.EndTime,
		b.UserId,
	)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to insert booking: %v", err), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func createBookingHandlerGuest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var b Booking
	err := json.NewDecoder(r.Body).Decode(&b)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	v, err := isBookingConflict(b.StartTime, b.EndTime)
	if v || err != nil {
		http.Error(w, "Booking conflict", http.StatusConflict)
		return
	}
	v, err = isEmailRegistered(b.Email, "")
	if v || err != nil {
		http.Error(w, "Email already registered", http.StatusConflict)
		return
	}
	if b.Service == 0 {
		b.Service = 1
	}

	_, err = db.Exec(
		"INSERT INTO bookings (name, surname, email, phone, service, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6, $7)",
		b.Name,
		b.Surname,
		b.Email,
		sql.NullString{String: b.Phone, Valid: b.Phone != ""},
		b.Service,
		b.StartTime,
		b.EndTime,
	)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to insert booking: %v", err), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func getBookingsHandler(w http.ResponseWriter, r *http.Request) {
	loggedIn := false
	isAdmin := false
	id := -1
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
		loggedIn = true
		err := db.QueryRow("SELECT id FROM users WHERE api_key = $1", apiKey).Scan(&id)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to fetch user ID: %v", err), http.StatusInternalServerError)
			return
		}
		isAdmin, err = validateAdmin(apiKey)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to validate admin: %v", err), http.StatusInternalServerError)
			return
		}
	}

	rows, err := db.Query("SELECT bookings.id, bookings.user_id, bookings.name, bookings.surname, bookings.email, bookings.phone, bookings.service, bookings.start_time, bookings.end_time FROM bookings LEFT JOIN users ON bookings.user_id=users.id")
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch bookings: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var bookings []map[string]string
	for rows.Next() {
		var booking Booking
		var userId sql.NullInt64
		err := rows.Scan(&booking.Id, &userId, &booking.Name, &booking.Surname, &booking.Email, &booking.Phone, &booking.Service, &booking.StartTime, &booking.EndTime)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to scan booking: %v", err), http.StatusInternalServerError)
			return
		}

		if userId.Valid && loggedIn && userId.Int64 == int64(id) {
			booking.UserId = int(userId.Int64)
		} else if isAdmin {
			// Do nothing
		} else {
			booking.UserId = 0
			booking.Name = "Taken"
			booking.Surname = ""
			booking.Email = "Hidden"
			booking.Phone = "Hidden"
			booking.Service = 0
		}

		bookings = append(bookings, map[string]string{
			"id":         fmt.Sprintf("%d", booking.Id),
			"name":       booking.Name,
			"surname":    booking.Surname,
			"email":      booking.Email,
			"phone":      booking.Phone,
			"service":    fmt.Sprintf("%d", booking.Service),
			"start_time": booking.StartTime,
			"end_time":   booking.EndTime,
			"user_id":    fmt.Sprintf("%d", booking.UserId),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bookings)
}

func editBookingHandler(w http.ResponseWriter, r *http.Request) {
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
	isAdmin, err := validateAdmin(apiKey)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to validate admin: %v", err), http.StatusInternalServerError)
		return
	}
	if !isAdmin {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var b Booking
	err = json.NewDecoder(r.Body).Decode(&b)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	if b.Service == 0 {
		b.Service = 1
	}
	_, err = db.Exec(
		"UPDATE bookings SET name = $1, surname = $2, email = $3, phone = $4, service = $5, start_time = $6, end_time = $7 WHERE id = $8 ",
		b.Name,
		b.Surname,
		b.Email,
		sql.NullString{String: b.Phone, Valid: b.Phone != ""},
		b.Service,
		b.StartTime,
		b.EndTime,
		b.Id,
	)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to update booking: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func deleteBookingHandler(w http.ResponseWriter, r *http.Request) {
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
	isAdmin, err := validateAdmin(apiKey)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to validate admin: %v", err), http.StatusInternalServerError)
		return
	}
	if !isAdmin {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var b Booking
	err = json.NewDecoder(r.Body).Decode(&b)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	_, err = db.Exec(
		"DELETE FROM bookings WHERE id = $1",
		b.Id,
	)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to delete booking: %v", err), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
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

	_, err = db.Exec("INSERT INTO users (name, surname, email, password, api_key) VALUES ($1, $2, $3, $4, $5)", u.Name, u.Surname, u.Email, encryptedPassword, apiKey)
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

func checkUserPermissionHandler(w http.ResponseWriter, r *http.Request) {
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
	}
	isAdmin, err := validateAdmin(apiKey)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to validate admin: %v", err), http.StatusInternalServerError)
		return
	}
	if !isAdmin {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func getUserInfoHandler(w http.ResponseWriter, r *http.Request) {
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
	}
	var u User
	err := db.QueryRow("SELECT name, surname, email FROM users WHERE api_key = $1", apiKey).Scan(&u.Name, &u.Surname, &u.Email)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch user info: %v", err), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(u)
}

func getServicesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.Query("SELECT id, name, duration FROM services")
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch services: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var services []map[string]string
	for rows.Next() {
		var service Service
		err := rows.Scan(&service.Id, &service.Name, &service.Duration)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to scan service: %v", err), http.StatusInternalServerError)
			return
		}
		services = append(services, map[string]string{
			"id":       fmt.Sprintf("%d", service.Id),
			"name":     service.Name,
			"duration": service.Duration,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(services)
}

func sendTestEmailHandler(w http.ResponseWriter, r *http.Request) {
	to := "filip.kubawski@gmail.com"
	subject := "Test Email"
	body := "This is a test email from your calendar app."

	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

	msg := []byte("From: " + smtpUser + "\r\n" +
		"To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"Content-Type: text/plain; charset=\"utf-8\"\r\n" +
		"\r\n" +
		body + "\r\n")

	addr := smtpHost + ":" + smtpPort
	log.Printf("Sending email to %s via %s\n", to, addr)

	err := smtp.SendMail(addr, auth, smtpUser, []string{to}, msg)
	if err != nil {
		http.Error(w, "Failed to send email: "+err.Error(), http.StatusInternalServerError)
		log.Printf("SMTP error: %v", err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Test email sent"))
}
