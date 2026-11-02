import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const userscript = readFileSync(new URL('../scripts/test.js', import.meta.url), 'utf8');
const wrapper = readFileSync(
  new URL('../collector-resources/servo-sharedworker.js', import.meta.url),
  'utf8',
);

test('collector worker uses a same-origin URL and closes after results arrive', () => {
  const listeners = new Map();
  const messages = [];
  class NativeSharedWorker {
    constructor(...args) {
      this.args = args;
      this.port = {
        addEventListener: (name, listener) => listeners.set(name, listener),
        removeEventListener: (name) => listeners.delete(name),
        postMessage: (message) => messages.push(message),
      };
    }
  }
  const context = vm.createContext({
    URL,
    location: {href: 'http://localhost:5200/tests/'},
    SharedWorker: NativeSharedWorker,
  });
  context.window = context;
  vm.runInContext(userscript, context);
  vm.runInContext('installSelfClosingSharedWorker()', context);

  const worker = new context.SharedWorker('/resources/sharedworker.js');
  assert.deepEqual(worker.args, ['http://localhost:5200/resources/servo-sharedworker.js']);
  assert.ok(worker instanceof NativeSharedWorker);
  listeners.get('message')();
  assert.deepEqual(messages, ['__close_bcd_shared_worker__']);
  assert.equal(listeners.size, 0);

  const options = {name: 'unrelated'};
  const otherWorker = new context.SharedWorker('/other.js', options);
  assert.deepEqual(otherWorker.args, ['/other.js', options]);
  assert.equal(listeners.size, 0);
  assert.throws(() => new context.SharedWorker(), /requires a single argument/);
});

test('served wrapper forwards test messages and closes only on acknowledgement', () => {
  const events = [];
  const port = {close: () => events.push('port closed')};
  const context = vm.createContext({
    importScripts(url) {
      assert.equal(url, './sharedworker.js');
      context.onconnect = function (event) {
        assert.equal(this, vm.runInContext('self', context));
        assert.equal(event.ports[0], port);
        port.onmessage = function (message) {
          assert.equal(this, port);
          events.push(message.data);
        };
      };
    },
    close: () => events.push('worker closed'),
  });
  context.self = context;
  vm.runInContext(wrapper, context);
  context.onconnect({ports: [port]});
  port.onmessage({data: '{"tests":[]}'});
  assert.deepEqual(events, ['{"tests":[]}']);
  port.onmessage({data: '__close_bcd_shared_worker__'});
  assert.deepEqual(events, ['{"tests":[]}', 'port closed', 'worker closed']);
});
