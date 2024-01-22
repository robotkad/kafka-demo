# Kafka-Demo Project

This repo attempts to demonstate the idea of using a kafka topic to keep small in-memory stores across many hosts in sync. In this demo, you can add a uuid to be 'blocked' and then view the entire list of blocked uuid's. Note that you can do either of these functions on any host, and it will work like magic.

Topic compaction would be ideal, but has not been implemented. Neither have deletions, but the idea would be that you would emit a tombstone event to remove an id from the in-memory stores.

## tl:dr;

- push in new ids via curl (eg; `curl -X POST http://localhost:8080/blocked -H "Content-Type: application/json" -d '["33287ae3-4a01-4ae8-8d41-e41ff92fd982"]'`)
- view current ids in a browser `http://localhost:8080/blocked ` (or `curl` if you are not as lazy as me)
- view docker logs and observe that any one of the five app server returns your request with the full set of id's. anime_wow.wav

## Prerequisites

Before you begin, ensure you have;

- Docker and Docker Compose are installed on your machine.

## Getting Started

Follow these steps to get your application up and running:

### Cloning the Repository

First, clone the repository from GitHub:

```bash
git clone https://github.com/robotkad/kafka-demo.git
cd kafka-demo
```

### Starting the Services

To start the services, including Kafka, Zookeeper, the Node.js app, and the NGINX load balancer, run:

```bash
docker-compose up --build --scale app=5
```

This command builds the application image, starts all the services, and scales the `app` service to 5 instances.

### Adding UUIDs

To add a UUID to the `blocked` topic, use the following `curl` command:

```bash
curl -X POST http://localhost:8080/blocked -H "Content-Type: application/json" -d '["33287ae3-4a01-4ae8-8d41-e41ff92fd982"]'
```

Replace `33287ae3-4a01-4ae8-8d41-e41ff92fd982` with your desired UUID. This command sends the UUID to the load-balanced `app` service, which then produces a Kafka message with the UUID. Im sure there is a better way to do this, I got lazy.

### Viewing the List of UUIDs

To view the list of all UUIDs that have been sent to the `blocked` topic, use the following endpoint:

```bash
curl http://localhost:8080/blocked
```

This will return a JSON array of UUIDs stored in memory.

### Persistence of UUIDs

It's important to note that if a single `app` container is restarted, once it is back online, it will still serve back the list of UUIDs. This is due to the app's Kafka consumer, which is configured to consume from the beginning of the topic, thus repopulating the in-memory list with the UUIDs.
