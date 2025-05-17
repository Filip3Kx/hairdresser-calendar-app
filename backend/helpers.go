package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func generateAPIKey() (string, error) {
	key := make([]byte, 32) // 32 bytes = 256 bits
	_, err := rand.Read(key)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(key), nil
}

func validateAPIKey(apiKey string) (bool, error) {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users WHERE api_key = $1", apiKey).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to validate API key: %v", err)
	}
	return count > 0, nil
}

func encryptPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

func decryptPassword(encryptedPassword, password string) error {
	err := bcrypt.CompareHashAndPassword([]byte(encryptedPassword), []byte(password))
	if err != nil {
		return err
	}
	return nil
}

func validateUserExistence(email string) (bool, error) {
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check user existence: %v", err)
	}
	return exists, nil
}

func waitForDbConnection() {
	for {
		err := db.Ping()
		if err == nil {
			break
		}
		fmt.Println("Waiting for database connection...")
		time.Sleep(1 * time.Second)
	}
}

func createAdminUser() {
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = 'admin@example.com')").Scan(&exists)
	if err != nil {
		panic(err)
	}
	if !exists {
		hashedPassword, err := encryptPassword("admin")
		if err != nil {
			panic(err)
		}
		apiKey, err := generateAPIKey()
		if err != nil {
			panic(err)
		}
		_, err = db.Exec("INSERT INTO users (name, surname, email, password, api_key, is_admin) VALUES ('admin', 'admin', 'admin@example.com', $1, $2, TRUE)", hashedPassword, apiKey)
		if err != nil {
			panic(err)
		}
		log.Println("Admin user created")
	} else {
		log.Println("Admin user already exists")
	}
}

func validateAdmin(apiKey string) (bool, error) {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users WHERE api_key = $1 AND is_admin = TRUE", apiKey).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to validate admin: %v", err)
	}
	return count > 0, nil
}

func isBookingConflict(startTime, endTime string) (bool, error) {
	var count int
	query := `
        SELECT COUNT(*) FROM bookings
        WHERE 
            DATE(start_time) = DATE($1)
            AND (start_time < $3 AND end_time > $2)
    `
	err := db.QueryRow(query, startTime, startTime, endTime).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check booking conflict: %v", err)
	}
	return count > 0, nil
}

func isEmailRegistered(email, apiKey string) (bool, error) {
	if apiKey != "" {
		var userEmail string
		err := db.QueryRow("SELECT email FROM users WHERE api_key = $1", apiKey).Scan(&userEmail)
		if err != nil {
			return false, fmt.Errorf("failed to get user info: %v", err)
		}
		if userEmail == email {
			return false, nil
		}
	}
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check if email is registered: %v", err)
	}
	return exists, nil
}
