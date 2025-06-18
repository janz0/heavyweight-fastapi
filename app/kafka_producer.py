# app/kafka_producer.py
from confluent_kafka import Producer, KafkaException
from confluent_kafka.admin import AdminClient, NewTopic
import os
import json

producer: Producer = None

def ensure_kafka_topic(bootstrap_servers: str, topic_name: str):
    admin = AdminClient({'bootstrap.servers': bootstrap_servers})
    metadata = admin.list_topics(timeout=10)

    if topic_name in metadata.topics:
        print(f"✅ Kafka topic '{topic_name}' already exists.")
        return

    print(f"📦 Creating Kafka topic: {topic_name}")
    new_topic = NewTopic(topic=topic_name, num_partitions=1, replication_factor=1)

    futures = admin.create_topics([new_topic])

    try:
        futures[topic_name].result()  # Blocks until topic is created or fails
        print(f"✅ Kafka topic '{topic_name}' created.")
    except KafkaException as e:
        print(f"❌ Failed to create topic '{topic_name}':", e)

def init_producer(topics: list[str] = None,):
    global producer

    kafka_broker = os.getenv("KAFKA_BROKER", "kafka.railway.internal:29092")
    client_id = os.getenv("KAFKA_CLIENT_ID", "fastapi-kafka")

    producer = Producer({
        "bootstrap.servers": kafka_broker,
        "client.id": client_id,
        "security.protocol": "PLAINTEXT",  # <- required for Railway internal
    })

    if topics:
        for topic in topics:
            ensure_kafka_topic(kafka_broker, topic)



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
