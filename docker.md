# Docker

Docker is a tool that helps you package and run applications in a consistent and isolated(separate) environment. It uses something called containers to make this happen.

## What is a Container?

A container is like a lightweight, portable box that contains everything your application needs to run.

1. Your code<b1/>
2. Libraries<b1/>
3. Dependencies (like tools or software your app needs)<b1/>
4. Configuration files<b1/>
   Containers are isolated, They are not accessible inside another container. Each container is not accessible in other containers

```js
// get list of active containers
docker ps // list all active containers

// get all containers list
docker ps -a // list all containers

// start any container
docker start [name of container]

// stop any container
docker stop [name of container]

//delete any container
docker rm [name of container]

```

## What is an Image?

An image is like a blueprint or a template for creating containers. It contains all the instructions and files needed to run your application. When you "run" an image, it becomes a container.

```js
//run any image
docker run [name of image]

// run any image with necessary arguments
docker run --name [name of container] -p [outer-port : inner-port] -e env=value -e env=value  [image of name] // it start the image and then image convert into container

// pull any image from docker hub
docker pull [image of name] // it pull the image from docker hub if not already exists

// get list of images
docker images  // list all images which have been created

// delete any image
docker rmi [image name OR image id]


// build own image
docker build -t [name of image to build]

```

## Network

In docker network is use to connect multiple containers each other by giving then same network. Because we cannot use the PORT or any other thing in separate container so we use network.

```js
// create network
docker network create [name of network]

// delete any network
docker network rm [name of network]

```

## Connect container using network

```js
// 1) create container using network
docker run -d --name container01 --net [name of network] [image name]

// 2) create container using same network
docker run -d --name container02 --net [name of network] [image name]


// connect with running container
docker network connect [name of network] [name of container or ID of container]


```

## How to create own image

If we want our own image then we will follow the following steps.<br/>
Example : If i have NextJS application and i want to create its image and run it using docker.

```js
FROM node:20 // my Nextjs application need nodejs so my base image is node
WORKDIR /user/src/app   // where you code exist in container
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

If i have python image

```js
FROM python:3.14.0  // my python app need base image which is python
WORKDIR /path/src/app   // in container where my code exist
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
// Setup an app user so the container doesn't run as the root user
RUN useradd app
USER app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]


```

## Docker Compose File

If we have multiple images example my code have two folder one for client and one for server and server need mongodb mean here i need three images. If i don't create docker compose file then first i separately create their image and create their network so i connect multiple containers. <br/>
If we create docker compose file then the docker compose own handle all these steps

```js
version : '3.8'  # Specify the Docker Compose version

services:
  client:
      build:
        context : ./client   // path of Dockerfile which is in my client
        dockerfile : Dockerfile    // name of file
      container_name: client 
      ports:
       - 4000:4000
      environment:
        - DB_URL: "BD_URL",
        - PORT: "PORT",
        - API_KEY: "API_KEY",
      depends_on:   // that this image depends on backend so this not run until backend image not create
        - backend

    backend:
      build:   //image build
        context : ./server   // path of Dockerfile which is in my server
        dockerfile : Dockerfile // name of file
      container_name: server
      ports:
        - 4000:4000
      environment:
        - DB_URL: "BD_URL",
        - PORT: "PORT",
        - API_KEY: "API_KEY",
      depends_on:
        - mongodb

    mongodb:
      image: mongo
      container_name: my-mongo
      ports:
       - 27071:27017
      environment:
         USER_NAME: "ADMIN",
         PASSWORD: "ADMIN",

```
to run docker compose command is  **docker-compose up -d**
to stop docker compose command is  **docker-compose down**