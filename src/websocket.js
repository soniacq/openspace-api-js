module.exports = class WebSocketWrapper {
  constructor(address, port, secure = false) {
    this._address = address;
    this._port = port;
    this._secure = secure; // Add secure flag
    this._client = null;
    this._onConnect = () => {};
    this._onDisconnect = () => {};
    this._onMessage = () => {};
  }

  onConnect(cb) {
    this._onConnect = cb;
  }

  onDisconnect(cb) {
    this._onDisconnect = cb;
  }
  
  onMessage(cb) {
    this._onMessage = (event) => {
      cb(event.data)
    };
  }

  connect() {
    const protocol = this._secure ? "wss://" : "ws://"; // Determine protocol
    const separator = this._secure ? "/" : ":"; // Use '/' for secure, ':' otherwise
    this._client = new WebSocket(protocol + this._address + separator + this._port);
    this._client.onopen = this._onConnect;
    this._client.onclose = this._onDisconnect;
    this._client.onmessage = this._onMessage;
  }

  send(message) {
    this._client.send(message);
  }

  disconnect() {
    this._client.close();
  }
}