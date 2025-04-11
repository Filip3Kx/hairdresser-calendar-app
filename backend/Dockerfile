# Use an official Golang image as a parent image
FROM golang:1.24

# Set the working directory in the container
WORKDIR /app

# Copy the Go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code into the container
COPY . .

# Build the Go application
RUN go build -o main .

# Expose the port the app runs on
EXPOSE 5000

# Run the application
CMD ["./main"]