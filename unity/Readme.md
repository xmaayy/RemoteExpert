# Remote Expert Unity
![Remote Expert](../Docs/Logos/01.jpg)

This is the unity project used for creating Remote Agent applications using the Remote Expert Software.

## Hardware and Software Requirements

The Remote Technician can be run on a Microsoft HoloLens 1 or 2. It can only be compiled on a computer running Windows due to some of the dependencies being not being compatible with Mac or Linux.

## Dependencies
### Install Unity 2017
Ensure that you are installing unity 2017 if you are using the Hololens 1
(Unity Installer)[https://unity3d.com/get-unity/download]
### Install Visual Studio
(Visual Studio)[https://visualstudio.microsoft.com/downloads/]

## Import Remote Expert into Unity
Open unity and import the "unity" folder as a project into it

## Extending the application
### RemoteExpertTemplate.unity
This file is the main scene from which all Remote Expert applications are made
Make a copy of this file, and give it the name that you want


### The router
When a request is received from the Base-station, it is read by the Router and handled in a way determined by you.
To determine what each request does, the router needs to be configured by using the config.json file.

### config.json
The config.json file is where you can customize the functionality of your Remote Expert Application.
At compile time the config.json file is read, and a Router is generated based on its contents.

The contents of this file will be explained

The format is as follows:

```
{
    "rest": [{ // This is the configuration fo the rest handler
        "name" "the name of the resource",
        "prefab": "The filename in the Resources folder of the prefab",
        "verbs": ["An array of strings as a subset of, get, post, put, and delete"],
    }],
    "customHandlers": [{ // This is the configuration for custom handlers
        "name": "an identifying name to call",
        "handler": "The filename of the Handler in the Resources/Handlers folder",
    }]
}
```

### Handlers
When the Hololens receives a message from the base-station, the router reads the name field in the request and sends the message to the specified handler.

Handlers receive the request data, process it in some way and send back a response.

There are two main types of handlers, the Rest Handler, and custom handlers.

### The Rest Handler
Most operations that the Base-station wants to instruct the Hololens to do, involve placeing, modifying, reading the attributes of, and removing holograms from the view of the Hololens. These conveniently correspond with the four most common REST verbs, post, put, get,  delete.

Because of this, Remote expert built in a special handler to create, read, update, and destroy different types of holograms based on simple requests.

This is an example configuration of the rest handler in config.json

```
"rest": [{
    "name": "water", 
    "prefab": "H20.unity", 
    "verbs": ["get", "post", "patch", "delete"],
    "attributes": {
        "location": "float[]",
        "scale": "float[]",
        "color": "float[]"
    }
}]
```

In this case we have the name water, which will be used by the router to determine which resource should be created. The prefab field points to a specific file containing a unity prefab. In this case we have a model of a water molecule which is the model that will be rendered. The verbs determine which operations are allowed, in this case we can do all 4. Finally the attributes determine which attributes are valid to send, in this case, the location that the hologram should be rendered, the size of the hologram, and the color.

### Rest Example Requests

#### Post
Creating a new blue molecule 1x1x1 meter in the current center of the hololens.

```
{
    "name": "water",
    "verb": "post",
    "attributes:"{
        "location": [0.5, 0.5],
        "scale": [1, 1, 1],
        "color": [0, 255, 0]
    }
}
```

On a success the following will be sent to the server

```
{
    "status": 200,
    "message": "Successfully created a hologram",
    "id": "79a2ab46-6d17-4049-b41f-2ac8874d3d85"
}
```

#### Get
Getting the previously created hologram
```
{
    "name": "water",
    "verb": "get",
    "id": "79a2ab46-6d17-4049-b41f-2ac8874d3d85"
}
```
On a success the following will be sent to the server
```
{
    "status": 200,
    "message": "Successfully retrieved hologram",
    "body": {
        "id": "79a2ab46-6d17-4049-b41f-2ac8874d3d85",
        "location": [0.5, 0.5],
        "scale": [1, 1, 1],
        "color": [0, 255, 0]
    }
}
```
#### Put
Modifying the previously created hologram, doubling the size of the x-axis and turning it green
```
{
    "name": "water",
    "verb": "put",
    "id": "79a2ab46-6d17-4049-b41f-2ac8874d3d85",
    "attributes": {
        "scale": [2, 1, 1],
        "color": [255, 0, 0]
    }
}
```
On a success the following will be sent to the server
```
{
    "status": 200,
    "message": "Successfully modified hologram",
    "body": {
        "id": "79a2ab46-6d17-4049-b41f-2ac8874d3d85",
        "location": [0.5, 0.5],
        "scale": [2, 1, 1],
        "color": [255, 0, 0]
    }
}
```
#### Delete
Removing the previously created hologram
```
{
    "name": "water",
    "verb": "delete",
    "id": "79a2ab46-6d17-4049-b41f-2ac8874d3d85"
}
```
On a success the following will be returned to the server
```
{
    "status": 200,
    "message": "Successfully deleted hologram",
    "id": "79a2ab46-6d17-4049-b41f-2ac8874d3d85",
}
```
### Custom Handlers
If the functionality of placing and modifying holograms is not enough for your application you can use custom handlers

Custom handlers extend the Handler class, and can be made to respond to a specific request, and do any action possible within the HoloLens environment.

One example of a custom handler would be to retrieve the current spatial mesh, and send it to the base-station

### Making a Custom Handler
The handler is a unity game object, and consists of a single method, "handle".

Extend the Handler class and name it whatever you would like, placing the handler file in the Handlers folder.
We will create a file named SpatialMeshHandler.cs and place it in the Handlers folder.

Override the handle function, 
- It must take, a string: message as an argument, this is the request, that is routed to it.
- Add any functionality you would like. In this fetch the current spatial mesh.
- The function must then return a string which will be the response to the requester. In this return the serialized spatial mesh

### Registering a custom handler
Once you have made your custom handler. You must register it using the config.json file. this is done in the customHandlers field.

```
"customHandlers": [{
    "name": "get spatial mesh",
    "handler": "SpatialMeshHandler.cs",
}]
```
Any request that has the field "name" with a value of "get spatial mesh", will now be routed to the handler we just created

An example request is simply this:
```
{
    "name": "get spatial mesh"
}
``