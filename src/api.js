const Topic = require('./topic');

class OpenSpaceApi {

  /**
   * Construct an instance of the OpenSpace API.
   * @param {Object} socket - An instance of Socket or WebSocket.
   * @param {boolean} [secure=false] - Whether to use WSS (secure WebSocket).
   */
  constructor(socket, secure = false) {
    this._callbacks = {};
    this._nextTopicId = 0;

    socket.onConnect(() => {});
    socket.onDisconnect(() => {});
    socket.onMessage((message) => {
      const messageObject = JSON.parse(message);
      if (messageObject.topic !== undefined) {
        const cb = this._callbacks[messageObject.topic];
        if (cb) {
          cb(messageObject.payload);
        }
      }
    });

    this._socket = socket;
    this._secure = secure; // Store the secure flag
  }

  /**
   * Set connect callback.
   * @param {function} callback - The function to execute when connection is established.
   */
  onConnect(callback) {
    this._socket.onConnect(callback);
  }

  /**
   * Set disconnect callback.
   * @param {function} callback - The function to execute when socket is disconnected.
   */
  onDisconnect(callback) {
    this._socket.onDisconnect(callback);
  }

  /**
   * Connect to OpenSpace.
   */
  connect() {
    this._socket.connect();
  }

  /**
   * Disconnect from OpenSpace.
   */
  disconnect() {
    this._socket.disconnect();
  }

  /**
   * Initialize a new channel of communication
   * @param {string} type - A string specifying the type of topic to construct.
   *                        See OpenSpace's server module for available topic types.
   *
   * @return {Topic} - An object representing the topic.
   */
  startTopic(type, payload) {
    if (typeof type !== 'string') {
      throw("Topic type must be a string")
    }

    const topic = this._nextTopicId++;
    const messageObject = {
        topic,
        type,
        payload
    };

    this._socket.send(JSON.stringify(messageObject));

    const promise = () => {
      return new Promise((resolve, reject) => {
        this._callbacks[topic] = resolve;
        cancelled.then(() => {
          delete this._callbacks[topic];
        });
      });
    }

    let cancel, cancelled = new Promise(resolve => cancel = resolve);

    const iterator = (async function* () {
      try {
        while (true) {
          yield await promise();
        }
      } catch (e) {
        return;
      }
    })();

    const talk = (payload) => {
      const messageObject = {
          topic,
          payload
      };
      this._socket.send(JSON.stringify(messageObject));
    }

    return new Topic(iterator, talk, cancel);
  }

  /**
   * Authenticate this client.
   * This must be done if the client is not whitelisted in openspace.cfg.
   * @param {string} secret - The secret used to authenticate with OpenSpace.
   */
  async authenticate(secret) {
    let topic = this.startTopic('authorize', {
      key: secret
    });
    try {
      const response = await topic.iterator().next();
      topic.cancel();
      return response.value;
    } catch (e) {
      throw "Authentication error: \n" + e;
    }
  }

  /**
   * Set a property
   * @param {string} property - The URI of the property to set.
   * @param {*} value - The value to set the property to.
   */
  setProperty(property, value) {
    if (typeof property !== 'string') {
      throw("Property must be a valid uri string")
    }
    const topic = this.startTopic('set', {
       property,
       value
     });
     topic.cancel();
  }

  /**
   * Get a property
   * @param {string} property - The URI of the property to set.
   * @return {*} The value of the property.
   */
  async getProperty(property) {
    if (typeof property !== 'string') {
      throw("Property must be a valid uri string")
    }
    const topic = this.startTopic('get', {
      property,
    });
    try {
      const response = await topic.iterator().next();
      topic.cancel();
      return response.value;
    } catch (e) {
      throw "Error getting property. \n" + e;
    }
  }

  /**
   * Get a property
   * @param {string} type - The type of documentation to get.
   *        For available types, check documentationtopic.cpp
   *        in OpenSpace's server module.
   * @return {Object} An object representing the requested documentation.
   */
  async getDocumentation(type) {
    const topic = this.startTopic('documentation', {
      type
    });

    try {
      const response = await topic.iterator().next();
      topic.cancel();
      return response.value;
    } catch (e) {
      throw "Error getting documentation: \n" + e;
    }
  }

  /**
   * Subscribe to a property
   * @param {string} property - The URI of the property.
   * @return {Topic} A topic object to represent the subscription topic.
   *         When cancelled, this object will unsubscribe to the property.
   */
  subscribeToProperty(property) {
    if (typeof property !== 'string') {
      throw("Property must be a valid uri string")
    }
    const topic = this.startTopic('subscribe', {
      event: 'start_subscription',
      property
    });

    return new Topic(
      topic.iterator(),
      topic._talk,
      () => {
        topic.talk({
          event: 'stop_subscription'
        });
        topic.cancel();
      }
    );
  }

  /**
   * Execute a lua script
   * @param {string} script - The lua script to execute.
   * @param {bool} getReturnValue - Specified whether the return value should be collected.
   * @param {bool} shouldBeSynchronized - Specified whether the script should be synchronized on a cluster
   * @return {*} The return value of the script, if `getReturnValue` is true, otherwise undefined.
   */
  async executeLuaScript(script, getReturnValue = true, shouldBeSynchronized = true) {
    if (typeof script !== 'string') {
      throw("Script must be a string")
    }
    const topic = this.startTopic('luascript', {
      script,
      return: getReturnValue,
      shouldBeSynchronized
    });

    if (getReturnValue) {
      try {
        const response = await topic.iterator().next();
        topic.cancel();
        return response.value;
      } catch (e) {
        throw "Error executing lua script: \n" + e;
      }
    } else {
      topic.cancel();
    }
  }

  /**
   * Execute a lua function from the OpenSpace library
   * @param {string} function - The lua function to execute (for example `openspace.addSceneGraphNode`).
   * @param {string} getReturnValue - Specified whether the return value should be collected.
   * @return {*} The return value of the script, if `getReturnValue` is true, otherwise undefined.
   */
  async executeLuaFunction(fun, args, getReturnValue = true) {
    if (typeof fun !== 'string') {
      throw("Function must be a string")
    }
    const topic = this.startTopic('luascript', {
      function: fun,
      arguments: args,
      return: true
    });

    if (getReturnValue) {
      try {
        const response = await topic.iterator().next();
        topic.cancel();
        return response.value;
      } catch (e) {
        throw "Error executing lua function: \n" + e
      }
    } else {
      topic.cancel();
    }
  }

  /**
   * Get an object representing the OpenSpace lua library.
   * @param {bool} multiReturn - whether the library should return the raw lua tables.
   *   If this value is true, the 1-indexed lua table will be returned as a JavaScript object.
   *   if the value is false, the only the first return value will be returned
   * @return {Object} The lua library, mapped to async JavaScript functions.
   */
  async library(multiReturn) {
    if (multiReturn === undefined) {
      multiReturn = true;
    }
    const generateAsyncMultiRetFunction = functionName => {
      return async (...args) => {
        try {
          return await this.executeLuaFunction(functionName, args);
        } catch (e) {
          throw "Lua execution error: \n" + e
        }
      }
    };

    const generateAsyncSingleRetFunction = functionName => {
      return async (...args) => {
        try {
          const luaTable = await this.executeLuaFunction(functionName, args);
          if (luaTable) {
            return luaTable[1];
          }
          return null;
        } catch (e) {
          throw "Lua execution error: \n" + e
        }
      }
    };

    let documentation;
    try {
      documentation = await this.getDocumentation('lua');
    } catch (e) {
      throw "Failed to get documentation: \n" + e;
    }
    const jsLibrary = {};

    documentation.forEach(lib => {
      let subJsLibrary = undefined;
      if (lib.library === '') {
        subJsLibrary = jsLibrary;
      } else {
        subJsLibrary = jsLibrary[lib.library] = {};
      }

      lib.functions.forEach(f => {
        const fullFunctionName =
          'openspace.' +
          (subJsLibrary === jsLibrary ? '' : (lib.library + '.')) +
          f.name;

        subJsLibrary[f.name] = multiReturn ?
          generateAsyncMultiRetFunction(fullFunctionName) :
          generateAsyncSingleRetFunction(fullFunctionName);
      });
    });

    return jsLibrary;
  }

  /**
   * Get an object representing the OpenSpace lua library.
   * @return {Object} The lua library, mapped to async JavaScript functions.
   * This method only returns the first return value.
   */
  async singleReturnLibrary() {
    return await this.library(false);
  }

  /**
   * Get an object representing the OpenSpace lua library.
   * @return {Object} The lua library, mapped to async JavaScript functions.
   * The values returned by the async functions will be the entire lua tables,
   * with 1-indexed values.
   */
  async multiReturnLibrary() {
    return await this.library(true);
  }
}

module.exports = OpenSpaceApi;