const WebSocketWrapper = require('../src/websocket');

test('WebSocketWrapper supports WSS connections', () => {
  const ws = new WebSocketWrapper('localhost', 4681, true); // Use secure=true
  expect(ws._secure).toBe(true);
  expect(ws._address).toBe('localhost');
  expect(ws._port).toBe(4681);
});
