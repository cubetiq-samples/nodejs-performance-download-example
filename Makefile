# Build and run Docker container
DOCKER_IMAGE_NAME = nodejs-dl-performance

all: build stop run

# Build Docker image
build:
	docker build -t $(DOCKER_IMAGE_NAME) .

# Run Docker container
run:
	docker run --rm -p 3000:3000 --name $(DOCKER_IMAGE_NAME) $(DOCKER_IMAGE_NAME)

# Check Docker container is running and remove it
stop:
	docker ps -a | grep $(DOCKER_IMAGE_NAME) | awk '{print $$1}' | xargs --no-run-if-empty docker rm -f

# Remove Docker image
clean:
	docker rmi $(DOCKER_IMAGE_NAME)