package main

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
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

func createAdminUser(email, password string) {
	var exists bool
	err := db.QueryRow(fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM users WHERE email = '%s')", email)).Scan(&exists)
	if err != nil {
		panic(err)
	}
	if !exists {
		hashedPassword, err := encryptPassword(password)
		if err != nil {
			panic(err)
		}
		apiKey, err := generateAPIKey()
		if err != nil {
			panic(err)
		}
		_, err = db.Exec(fmt.Sprintf("INSERT INTO users (name, surname, email, password, api_key, is_admin) VALUES ('admin', 'admin', '%s', $1, $2, TRUE)", email), hashedPassword, apiKey)
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

func notifyBookingCreated(name, surname, email, start_time, end_time string) error {
	to := os.Getenv("ADMIN_EMAIL")
	subject := fmt.Sprintf("New Booking Created: %s %s | %s - %s", name, surname, start_time, end_time)
	body := fmt.Sprintf("A new booking has been created:\n\nName: %s %s\nEmail: %s\nStart Time: %s\nEnd Time: %s", name, surname, email, start_time, end_time)

	payload := map[string]string{
		"to":      to,
		"subject": subject,
		"body":    body,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal email payload: %v", err)
	}

	req, err := http.NewRequest("POST", "http://localhost:5000/mail/send", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create email request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("email service returned status %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

func confirmBookingCreated(name, surname, email, start_time, end_time string) error {
	to := email
	subject := "Your booking was created"
	body := fmt.Sprintf("Your booking was created:\n\nName: %s %s\nEmail: %s\nStart Time: %s\nEnd Time: %s", name, surname, email, start_time, end_time)

	payload := map[string]string{
		"to":      to,
		"subject": subject,
		"body":    body,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal email payload: %v", err)
	}

	req, err := http.NewRequest("POST", "http://localhost:5000/mail/send", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create email request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("email service returned status %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}
