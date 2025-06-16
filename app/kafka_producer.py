# app/kafka_producer.py
from confluent_kafka import Producer
import os
import json

producer: Producer = None

def init_producer():
    global producer

    kafka_broker = os.getenv("KAFKA_BROKER", "kafka.railway.internal:29092")
    client_id = os.getenv("KAFKA_CLIENT_ID", "fastapi-kafka")

    producer = Producer({
        "bootstrap.servers": kafka_broker,
        "client.id": client_id,
        "security.protocol": "PLAINTEXT",  # <- required for Railway internal
    })

def send_kafka_message(topic: str, key: str, value: dict):
    if producer is None:
        raise RuntimeError("Kafka producer not initialized")

    producer.produce(
        topic=topic,
        key=key,
        value=json.dumps(value),
        on_delivery=lambda err, msg: print(
            f"[Kafka] {'✅' if not err else f'❌ {err}'}: {msg.topic()}:{msg.key()}"
        )
    )
    producer.poll(0)
