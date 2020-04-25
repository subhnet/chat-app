---
title: Realtime Chat app using Kafka, SpringBoot, ReactJS, and WebSockets
published: false
description: 
tags: 
---

In this tutorial we would be building a simple realtime chat application which demonstrates how to use Kafka as a MessageBroker along with Java,SpringBoot as Backend and ReactJS on the front-end.

This project is just for learning purpose. It doesn't contain production ready code.

## What is Kafka
Apache Kafka is a widely popular distributed messaging system which provides a fast, distributed, highly scalable, highly available, publish-subscribe messaging system.

In turn this solves part of a much harder problem:

Communication and integration between components of large software systems.

#### What can we do with Kafka?
* Messaging - communicating between apps
* Website Activity Tracking (click, searches...)
* Metrics collection - instead of writing to logs
* Source and target stream processing.

### Installation
Before starting the project, We need to download [Zookeeper](https://zookeeper.apache.org) and [Kafka](https://kafka.apache.org/).

You can download Kafka from [here](https://kafka.apache.org/downloads). 

Extract the contents of the compressed file into a folder of your preference.
Inside the Kafka directory, go to the `bin` folder. Here you’ll find many bash scripts that will be useful for running a Kafka application. 

If you are using Windows, you also have the same scripts inside the `windows` folder. This tutorial uses Linux commands, but you just need to use the equivalent Windows version if you’re running a Microsoft OS.

##### *Start Zookeeper*

**Zookeeper** is basically to manage the kafka cluster. It comes bundled with the downloaded kafka directory.So, we need not download it separately.

To start the zookeeper, go to the *bin* directory and enter the below command.
```
./zookeeper-server-start.sh ../config/zookeeper.properties
```

##### *Start Kafka Broker*
Next, To start the Kafka broker, run the below command in the same directory
```
./kafka-server-start.sh ../config/server.properties
```
Make sure zookeeper is running before starting kafka because Kafka receives information such as Offset information kept in the partitions from Zookeeper.

##### *Create a Kafka Topic*

After running Zookeeper and Apache Kafka respectively, We can create a Topic and send and receive data as Producer and Consumer.
```
kafka-topics --create --topic kafka-chat --zookeeper localhost:2181 --replication-factor 1 --partitions 1

```

Here we are creating a topic `kafka-chat` to handle chat messages. We would be using this topic later in the chat application.

Now, Let's write some code. 
## Backend Development with Java, SpringBoot and Kafka
We would be developing the backend in Spring Boot. 
So, download a fresh Spring Boot Project using [Spring Initializer](https://start.spring.io/) with following details.

* Project: Maven Project
* Language: Java
* Group: com.shubh
* Artifact: kafka-chat-server
* Dependencies:
    * Spring for Apache Kafka
    * Spring for Websocket

#### *Why WebSockets?*
Since it is not possible for Apache Kafka to send the Consumer Messages instantly to client with Classical GET and POST operations. 
I performed these operations using WebSockets which provide **full-duplex bidirectional** communication, which means that information can flow from the client to the server and also in the opposite direction simultaneously.
It is widely used in the chat applications.

### Developing Producer to push messages to Kafka Topic
First we would have to write a Config class for the Producer.

*ProducerConfiguration.java*
```java
@EnableKafka
@Configuration
public class ProducerConfiguration {
    @Bean
    public ProducerFactory<String, Message> producerFactory() {
        return new DefaultKafkaProducerFactory<>(producerConfigurations());
    }

    @Bean
    public Map<String, Object> producerConfigurations() {
        Map<String, Object> configurations = new HashMap<>();
        configurations.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, KafkaConstants.KAFKA_BROKER);
        configurations.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configurations.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return configurations;
    }

    @Bean
    public KafkaTemplate<String, Message> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
```
This class creates a `ProducerFactory` which knows how to create producers based on the configurations we provided.

We also declared a `KafkaTemplate` bean to perform high-level operations on your producer. In other words, the template is able to do operations such as sending a message to a topic and efficiently hides under-the-hood details from you.

In `producerConfigurations` method, we need to perform the following tasks:

* `BOOTSTRAP_SERVERS_CONFIG` to set the server address on which Kafka is running.
* `KEY_SERIALIZER_CLASS_CONFIG` and `VALUE_SERIALIZER_CLASS_CONFIG` to deserialize the key and value from the Kafka Queue.

The next step is to create a endpoint to send the messages to Kafka topic.
Create the following controller class for that.

##### *ChatController.java*
```java
@RestController
public class ChatController {

    @Autowired
    private KafkaTemplate<String, Message> kafkaTemplate;

    @PostMapping(value = "/api/send", consumes = "application/json", produces = "application/json")
    public void sendMessage(@RequestBody Message message) {
        message.setTimestamp(LocalDateTime.now().toString());
        try {
            //Sending the message to kafka topic queue
            kafkaTemplate.send(KafkaConstants.KAFKA_TOPIC, message).get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

}
```
As you can see the endpoint is quite simple. When we do `POST` request to `/api/send` it Injects the KafkaTemplate configured earlier and sends a message to `kafka-chat` topic which we created earlier.

Let's test everything we build until now. Run the `main` method inside `KafakaJavaApp.java` class. To run from command line, execute the following command
```
mvn spring-boot:run
``` 
Your server should be running on port 8080 and you can make API requests against it!
You can use postman to do a POST request as shown below.

![CapturePost](https://user-images.githubusercontent.com/5060594/80288485-ef996980-8755-11ea-8b62-a1deec2f0745.PNG)

But how do you know the command successfully sent a message to the topic? Right now, you don’t consume messages inside your app, which means you cannot be sure!

Fortunately, there is an easy way to create a consumr to test right away. Inside the bin folder of your Kafka directory, run the following command:
```
./kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic kafka-chat
```

Hit `http://localhost:8080/api/send` again to see the message in the terminal running the Kafka consumer


Now lets achieve the same functionality using the Java Code.For that we would need to build a Consumer or Listener in Java. 

### Develop a Consumer to listen to Kafka Topic.
Similar to `ProducerConfig.java` we need to have a Consumer Config to enable the consumer to find the broker.

*ListenerConfig.java*
```java
@EnableKafka
@Configuration
public class ListenerConfig {
    @Bean
    ConcurrentKafkaListenerContainerFactory<String, Message> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, Message> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, Message> consumerFactory() {
        return new DefaultKafkaConsumerFactory<>(consumerConfigurations(), new StringDeserializer(), new JsonDeserializer<>(Message.class));
    }

    @Bean
    public Map<String, Object> consumerConfigurations() {
        Map<String, Object> configurations = new HashMap<>();
        configurations.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, KafkaConstants.KAFKA_BROKER);
        configurations.put(ConsumerConfig.GROUP_ID_CONFIG, KafkaConstants.GROUP_ID);
        configurations.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        configurations.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        configurations.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        return configurations;
    }
}
```
In Consumer Config, similar to Producer Config we are setting the deserializer for key and value.
Additionally we need to set 
* GROUP_ID_CONFIG to set the Kafka consumer group ID
* AUTO_OFFSET_RESET_CONFIG to set the Offset Configuration. 
In this project, we are using the value "earliest" so that we will get all the values in the queue from the beginning.
Instead, we can also use "latest" to get only the latest value.

*MessageListener.java*

```java
@Component
public class MessageListener {
    @Autowired
    SimpMessagingTemplate template;

    @KafkaListener(
            topics = KafkaConstants.KAFKA_TOPIC,
            groupId = KafkaConstants.GROUP_ID
    )
    public void listen(Message message) {
        System.out.println("sending via kafka listener..");
        template.convertAndSend("/topic/group", message);
    }
}

```

In this class, the @KafkaListener annotated the method that will listen for the Kafka queue messages, 
and template.convertAndSend will convert the message and send that to WebSocket topic.


### Spring WebSocket Configuration
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // chat client will use this to connect to the server
        registry.addEndpoint("/ws-chat").setAllowedOrigins("*").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic/");
    }
}
```




  
  ---
  ---
    
      
      

## FrontEnd Development - ReactJS

### Create React App
We will use Create React App to install all the dependencies 

```
npm install --g create-react-app
create-react-app chat-ui
cd chat-ui
```

Install dependencies

```
npm install socketjs react-stomp material-ui
```


```
npm start
```

*Copy the Styling*

Copy and paste the css 

### Creating 




we are using SockJS to listen to the messages, which are sent from the server side WebSocket.

## Git Repo Link.

You can find the complete source code in my [Github](https://github.com/subhset/chat-app) page.


