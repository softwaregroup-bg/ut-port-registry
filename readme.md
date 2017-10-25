# ut-port-registry

Service discovery and distributed key-value store

## Overview
The following module provides simplified way for registering and fetching service definitions onto service discovery tool. As of now **ut-port-registry** implements [HashiCorp Consul](https://www.consul.io/intro/index.html) as service discovery tool. In the future another tool may be implemented depending on the platform needs.

##### Consul

Consul has multiple components, but as a whole, it is a tool for discovering and configuring services in your infrastructure. It provides several key features:

* **Service Discovery**: Clients of Consul can provide a service, such as api or mysql, and other clients can use Consul to discover providers of a given service. Using either DNS or HTTP, applications can easily find the services they depend upon.
* **Health Checking**: Consul clients can provide any number of health checks, either associated with a given service ("is the webserver returning 200 OK"), or with the local node ("is memory utilization below 90%"). This information can be used by an operator to monitor cluster health, and it is used by the service discovery components to route traffic away from unhealthy hosts.
* **KV Store**: Applications can make use of Consul's hierarchical key/value store for any number of purposes, including dynamic configuration, feature flagging, coordination, leader election, and more. The simple HTTP API makes it easy to use.
* **Multi Datacenter**: Consul supports multiple datacenters out of the box. This means users of Consul do not have to worry about building additional layers of abstraction to grow to multiple regions.

## Features
Registry port implements the following main features:
* Add Service - register new service with health check to the consul agent.
    ```js
    bus.importMethod('registry.service.add')(definition).then(...)...
    ```
* Fetch Service - fetch service by provided criteria.
    ```js
    bus.importMethod('registry.service.fetch')(criteria).then(...)...
    ```
* Local cache - store the result of fetch service for later use.
* Watches - Watches are a way of specifying a view of data (e.g. list of nodes, health checks) which is monitored for updates. When an update is detected, an external handler is invoked. The external handler either will update local cache or may call some custom logic.

## Usage

The registry port can be initialized in several different ways depending on the implementation requirements. Simple configuration can be found bellow:

```json
    "registry": {
        "client": {
            "type": "consul",
            "host": "127.0.0.1",
            "port": "8005"
        }
    }
```
If the above configuration is set, the registry port will be attached dynamically to the implementation, there is no need to define the port in `server/index.js`.

#### Client types
The client type is used to switch between the different implementations of the registry port:
##### Consul
This is the general scenario where the registry port is invoking Consul API directly, each time request is received.
Caching or watches are not available. This client type should be used in lightweight services where high load is not expected.

Example configuration:

```json
"client": {
    "type": "consul",
    "host": "127.0.0.1",
    "port": "8005"
}
```

##### Consul + Watch
This client supports local cache and watches. On a service fetch request,
registry port will lookup the local cache for method definitions. In case the service definition is found, it will be returned in the response, otherwise a call to Consul will be created. If the service definition is found in Consul, it will be stored locally in the cache and a watch function will be initialized. The watch function will automatically update the local cache each time the service definition was changed in consul. Optionally the port may invoke external method after the cache is updated, if it is defined in the configuration by the ```watchMethod``` property.
Note, this client may become heavy with all the running background tasks(fetching and comparing data) if a large number of services are handled though it.

Example configuration:

```json
"client": {
    "type": "consul",
    "options": {
        "watch": true,
        "watchMethod": "http.publish"
    },
    "host": "127.0.0.1",
    "port": "8005"
}
```
##### Ut + Watch
Consider the following diagram:

        +----------------+
        |                |                            +--------+
        | Implementation |                            | Consul |
        |                |                            +--------+
        +-------+--------+                                |
                |                                    +----+-----+
          +----------+                               | Registry |
          | Registry |                               +----------+
          +----------+                                    |
              |  |      Websocket                +--------+---------+
              |  +------------------------------>|                  |
              |         HTTP Request >           | Service Registry |
              +--------------------------------->|                  |
                                                 +------------------+

In this scenario an external implementation(Service Registry) is handling all the heavy tasks(checking services, updating cache, etc.). The process is as follow:
1. Implementation is asking the registry port for a service with name `x`.
2. Registry port is checking the cached service definitions.
3. If the service is not found, the registry port is sending HTTP Request to the `Service Registry`.
4. `Service Registry` is doing cache lookup too and if the service is not there, will fetch it directly from `Consul`.
5. Service definitions will be stored locally and a watch method will be initialized.
6. Implementation Registry will receive the service definitions as well as socket host and port
7. Implementation Registry is connecting to the socket host

Once the socket connection is open, the `Service Registry` will push data to all connected clients, each time the selected service is updated in Consul. This way the local cache at the `Implementation` will be up to date until the socket is closed.

Example configuration:
Note the `url` property defines the ip and port of the `Service Registry`.

```json
"client": {
    "type": "ut",
    "options": {
        "watch": true
    },
    "config": {
        "url": "http://127.0.0.1:8005"
    }
}
```

##### Ut
In case there is no need of local cache and watches, you can simply use `"type": "ut"` and `"watch": false` which will be calling the `Service Registry` via HTTP each time a service.fetch is invoked.

Example configuration:

```json
"client": {
    "type": "ut",
    "options": {
        "watch": false
    },
    "config": {
        "url": "http://127.0.0.1:8005"
    }
}
```


