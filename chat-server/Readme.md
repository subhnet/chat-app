


## Before Running the Project 

*Start Zookeeper*
```shell script
zookeeper-server-start .\config\zookeeper.properties
```

*Start Kafka*
```shell script
kafka-server-start .\config\server.properties
```

*Create a Topic*
```
kafka-topics --create --topic kafka-chat-2 --zookeeper localhost:2181 --replication-factor 1 --partitions 1
```

*Consume the topic (to test)*
```shell script
kafka-console-consumer --bootstrap-server localhost:9092 --topic kafka-chat-2
```
