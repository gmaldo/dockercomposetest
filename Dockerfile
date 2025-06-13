# Using node18 base image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# copy package.json and package-lock.json
COPY package*.json ./

# install dependencies
RUN npm install

# copy the rest of the code
COPY . .

# Expose port
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]