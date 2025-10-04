#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- Restarting app ---"
docker-compose down react-native
docker-compose up -d react-native --build

echo "--- Waiting for Android emulator to be ready (this may take a minute) ---"
# We wait until the emulator reports that it is fully booted
until docker exec calendar_app_emulator adb shell getprop sys.boot_completed | grep -m 1 "1"; do
  echo "Emulator not ready yet, waiting 5 seconds..."
  sleep 5
done

echo "--- Emulator is ready! ---"

echo "--- Setting up port forwarding for Metro ---"
docker exec calendar_app_mobile adb connect calendar_app_emulator:5555
docker exec calendar_app_mobile adb -s calendar_app_emulator:5555 reverse tcp:8081 tcp:8081

echo "--- Installing and launching the app on the emulator ---"
docker exec calendar_app_mobile npx react-native run-android

echo "--- Setup complete! Tailing logs. Press Ctrl+C to exit. ---"
docker-compose logs -f react-native