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

	_, err = db.Exec("INSERT INTO bookings (name, surename, email, date, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6)", b.Name, b.Surename, b.Email, b.Date, b.StartTime, b.EndTime)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to insert booking: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintln(w, "Booking created")
}

func getBookingsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.Query("SELECT date, start_time, end_time FROM bookings")
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch bookings: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var bookings []map[string]string
	for rows.Next() {
		var date, startTime, endTime string
		if err := rows.Scan(&date, &startTime, &endTime); err != nil {
			http.Error(w, fmt.Sprintf("Failed to parse bookings: %v", err), http.StatusInternalServerError)
			return
		}
		bookings = append(bookings, map[string]string{
			"date":       date,
			"start_time": startTime,
			"end_time":   endTime,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bookings)
}
