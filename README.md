# openspace-api-js
JavaScript library to interface with [OpenSpace](https://github.com/OpenSpace/OpenSpace) using sockets and WebSockets.

## Work in progress
Both the API and libary are still very much work in progress, and are subject to change.

## Documentation

A [reference](https://openspace.github.io/openspace-api-js) can be found here. Examples are available below:

### NodeJS in the terminal
https://github.com/OpenSpace/openspace-api-js/blob/master/examples/example.js provides an example of how to connect from a NodeJS. To run it, run `npm example.js` in a terminal.

#### Secure WebSocket Connections
To enable secure WebSocket (`wss://`) connections in NodeJS, pass the `secure` parameter as `true`:
```javascript
const openspaceApi = require('openspace-api-js');
const api = openspaceApi('localhost', 4681, true); // Enable WSS
api.connect();
```

### Simple website
https://github.com/OpenSpace/openspace-api-js/blob/master/examples/index.html provides an example of connecting to OpenSpace from a website. For simplicity, the example is self-contained in the index.html file.

#### Secure WebSocket Connections in the Browser
To enable secure WebSocket (`wss://`) connections in the browser, pass the `secure` parameter as `true`:
```javascript
window.openspaceApi('localhost', 4682, true); // Enable WSS
```

### Web application
For a proper example of how to interact with OpenSpace from a web application using npm, webpack and modern ES versions, please refer to https://github.com/OpenSpace/openspace-api-web-example.


### Observable Notebook
Use Obserable notebooks to interact with OpenSpace locally:
https://observablehq.com/@emiax/openspace-notebook-example
This may be useful for tinkering, GUI prototyping and testing the lua interface during development.
