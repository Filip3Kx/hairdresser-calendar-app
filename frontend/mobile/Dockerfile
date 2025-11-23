# Use Node.js version 20 with Android SDK
FROM reactnativecommunity/react-native-android:v20.0

# Set the working directory
WORKDIR /app

# Initialize a new React Native project to get the basic structure
RUN npx --yes react-native@0.72.0 init MyReactApp --version 0.72.0

# Set the working directory to the newly created project
WORKDIR /app/MyReactApp

# Copy our custom package.json over the default one
COPY ./package.json /app/MyReactApp/package.json

# Install all dependencies defined in our package.json, including async-storage
RUN yarn install

# Copy the new App.js logic
COPY ./App.js /app/MyReactApp/App.js

# Expose the Metro bundler port
EXPOSE 8081

# The command to start the Metro bundler when the container starts
CMD ["yarn", "start", "--host", "localhost"]