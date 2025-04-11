package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	_ "github.com/lib/pq"
)

type Booking struct {
	Name     string `json:"name"`
	Surename string `json:"surname"`
	Email    string `json:"email"`
	Date     string `json:"date"`
}

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

func main() {
	var err error
	db, err = sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		panic(err)
	}
	defer db.Close()

	http.HandleFunc("/hello", helloHandler)
	http.HandleFunc("/bookings", createBookingHandler)

	fmt.Println("Starting server on :5000")
	if err := http.ListenAndServe(":5000", nil); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
