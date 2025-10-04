# Use Node.js version 20
FROM reactnativecommunity/react-native-android:v20.0

# Set the working directory in the container
WORKDIR /app

# Initialize a new React Native project.
# This creates a 'MyReactApp' directory with a complete project structure.
RUN npx --yes react-native@0.72.0 init MyReactApp --version 0.72.0

# Set the working directory to the newly created project
WORKDIR /app/MyReactApp

# Copy your custom App.js from the host to overwrite the default one in the image
COPY ./App.js /app/MyReactApp/App.js

# Expose the Metro bundler port
EXPOSE 8081

# The command to start the Metro bundler when the container starts
CMD ["yarn", "start", "--host", "localhost"]