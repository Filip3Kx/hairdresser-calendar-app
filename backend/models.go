package main

type Booking struct {
	Name      string `json:"name"`
	Surname   string `json:"surname"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Service   int16  `json:"service"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	UserId    int    `json:"user_id"`
}

type User struct {
	Name     string `json:"name"`
	Surname  string `json:"surname"`
	Email    string `json:"email"`
	Password string `json:"password"`
	ApiKey   string `json:"api_key"`
}

type Service struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Price       string `json:"price"`
	Duration    string `json:"duration"`
}
