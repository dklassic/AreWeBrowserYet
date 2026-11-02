// Copied into the collector's static/resources directory by the workflow.
// Keep this outside scripts/: Servo executes every file there as a userscript.
importScripts('./sharedworker.js');

const collectorOnConnect = self.onconnect;
self.onconnect = function (event) {
  collectorOnConnect.call(self, event);

  const port = event.ports[0];
  const collectorOnMessage = port.onmessage;
  port.onmessage = function (messageEvent) {
    if (messageEvent.data === '__close_bcd_shared_worker__') {
      port.close();
      self.close();
      return;
    }

    collectorOnMessage.call(port, messageEvent);
  };
};
