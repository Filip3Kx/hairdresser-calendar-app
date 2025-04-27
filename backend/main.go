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
	/*
		curl -X GET "http://localhost:5000/hello"
	*/

	http.HandleFunc("/bookings/create", createBookingHandler)
	/*
		curl -X POST "http://localhost:5000/bookings/create" \
		-H "Content-Type: application/json" \
		-H "Authorization: API_KEY" \
		-d '{
			"name": "John",
			"surname": "Doe",
			"email": "johndoe@example.com",
			"phone": "123456789",
			"service": 1,
			"start_time": "2025-05-01T09:00:00",
			"end_time": "2025-05-01T10:00:00"
		}'
	*/

	http.HandleFunc("/bookings/createGuest", createBookingHandlerGuest)
	/*
		curl -X POST "http://localhost:5000/bookings/createGuest" -H "Content-Type: application/json" -d '{
			"name": "John",
			"surname": "Doe",
			"email": "johndoe@example.com",
			"phone": "123456789",
			"service": 1,
			"start_time": "2025-05-01T09:00:00",
			"end_time": "2025-05-01T10:00:00"
		}'
	*/

	http.HandleFunc("/bookings/get", getBookingsHandler)
	/*
		curl -X GET "http://localhost:5000/bookings/get" \
		-H "Authorization: API_KEY"
	*/

	http.HandleFunc("/bookings/update", editBookingHandler)
	/*
		curl -X POST "http://localhost:5000/bookings/update" \
		-H "Content-Type: application/json" \
		-H "Authorization: API_KEY" \
		-d '{
			"id": 1,
			"name": "John",
			"surname": "Doe",
			"email": "johndoe@example.com",
			"phone": "123456789",
			"service": 1,
			"start_time": "2025-05-01T10:00:00",
			"end_time": "2025-05-01T11:00:00"
		}'
	*/

	http.HandleFunc("/bookings/delete", deleteBookingHandler)
	/*
		curl -X POST "http://localhost:5000/bookings/delete" \
		-H "Content-Type: application/json" \
		-H "Authorization: API_KEY" \
		-d '{
			"id": 1
		}'
	*/

	http.HandleFunc("/auth/register", registerUserHandler)
	/*
		curl -X POST "http://localhost:5000/auth/register" \
		-H "Content-Type: application/json" \
		-d '{
			"name": "John",
			"surname": "Doe",
			"email": "johndoe@example.com",
			"password": "password123"
		}'
	*/
	http.HandleFunc("/auth/login", loginUserHandler)
	/*
		curl -X POST "http://localhost:5000/auth/login" \
		-H "Content-Type: application/json" \
		-d '{
			"email": "johndoe@example.com",
			"password": "password123"
		}'
	*/
	http.HandleFunc("/auth/check", checkUserPermissionHandler)
	/*
		curl -X GET "http://localhost:5000/auth/check" \
		-H "Authorization: API_KEY"
	*/
	http.HandleFunc("/auth/get", getUserInfoHandler)
	/*
		curl -X GET "http://localhost:5000/auth/get" \
		-H "Authorization: API_KEY"
	*/

	fmt.Println("Starting server on :5000")
	if err := http.ListenAndServe(":5000", nil); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
