package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	var err error
	db, err = sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		panic(err)
	}
	fmt.Println("Connected to database")
	defer db.Close()

	waitForDbConnection()
	createAdminUser()

	http.HandleFunc("/hello", helloHandler) //tester
	http.HandleFunc("/bookings/create", createBookingHandler)
	http.HandleFunc("/bookings/get", getBookingsHandler)
	http.HandleFunc("/bookings/edit", editBookingHandler)
	http.HandleFunc("/bookings/delete", deleteBookingHandler)
	http.HandleFunc("/auth/register", registerUserHandler)
	http.HandleFunc("/auth/login", loginUserHandler)
	http.HandleFunc("/auth/check", checkUserPermissionHandler)
	http.HandleFunc("/auth/userinfo", getUserInfoHandler)

	fmt.Println("Starting server on :5000")
	if err := http.ListenAndServe(":5000", nil); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
