package main

type Booking struct {
	Name      string `json:"name"`
	Surename  string `json:"surname"`
	Email     string `json:"email"`
	Date      string `json:"date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	UserId    int    `json:"user_id"`
}

type User struct {
	Name     string `json:"name"`
	Surename string `json:"surname"`
	Email    string `json:"email"`
	Password string `json:"password"`
	ApiKey   string `json:"api_key"`
}
