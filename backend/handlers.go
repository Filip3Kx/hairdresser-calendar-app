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

	var b Booking
	err := json.NewDecoder(r.Body).Decode(&b)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("INSERT INTO bookings (name, surename, email, date) VALUES ($1, $2, $3, $4)", b.Name, b.Surename, b.Email, b.Date)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to insert booking: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintln(w, "Booking created")
}
