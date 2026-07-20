// After mdn-bcd-collector's tests page is loaded, run the test.
onload = () => {
  installSelfClosingSharedWorker();

  // collector will generate a script based on the test environment settings.
  // We only need the parameters from the script and call the bcd.go function by ourselves.
  let run_str = document.getElementById('run').onclick.toString();
  const resourceCount = extractResourceCount(run_str);

  bcd.go(onBcdTestComplete, resourceCount, true, {
    name: 'servo',
    version: '1',
  });
};

async function onBcdTestComplete(results) {
  try {
    await sendTestResults(results);
    await exportReport();
  } finally {
    // Close the window to terminate the servo process.
    window.close();
  }
}

function installSelfClosingSharedWorker() {
  if (typeof SharedWorker !== 'function') {
    return;
  }

  const NativeSharedWorker = SharedWorker;
  const closeMessage = '__close_bcd_shared_worker__';
  const collectorWorkerURL = new URL(
    '/resources/sharedworker.js',
    location.href,
  ).href;
  const wrapperSource = `
    const collectorWorkerURL = ${JSON.stringify(collectorWorkerURL)};
    const closeMessage = ${JSON.stringify(closeMessage)};
    const nativeImportScripts = self.importScripts;

    self.importScripts = function (...urls) {
      const resolvedURLs = urls.map((url) =>
        new URL(url, collectorWorkerURL).href
      );
      return nativeImportScripts.apply(self, resolvedURLs);
    };

    nativeImportScripts.call(self, collectorWorkerURL);

    const collectorOnConnect = self.onconnect;
    self.onconnect = function (event) {
      collectorOnConnect.call(self, event);

      const port = event.ports[0];
      const collectorOnMessage = port.onmessage;
      port.onmessage = function (messageEvent) {
        if (messageEvent.data === closeMessage) {
          port.close();
          self.close();
          return;
        }

        collectorOnMessage.call(port, messageEvent);
      };
    };
  `;
  const wrapperURL = URL.createObjectURL(
    new Blob([wrapperSource], {type: 'text/javascript'}),
  );

  function SelfClosingSharedWorker(scriptURL, options) {
    if (arguments.length === 0) {
      // Servo currently creates a worker for a missing URL instead of throwing.
      throw new TypeError('SharedWorker requires a single argument');
    }

    const resolvedURL = new URL(scriptURL, location.href).href;
    const workerURL =
      resolvedURL === collectorWorkerURL ? wrapperURL : scriptURL;
    const worker =
      arguments.length === 1
        ? new NativeSharedWorker(workerURL)
        : new NativeSharedWorker(workerURL, options);

    if (resolvedURL === collectorWorkerURL) {
      // Acknowledge receipt of the results so the worker can safely close.
      const closeWorker = () => {
        worker.port.removeEventListener('message', closeWorker);
        worker.port.postMessage(closeMessage);
      };
      worker.port.addEventListener('message', closeWorker);
    }

    return worker;
  }

  Object.setPrototypeOf(SelfClosingSharedWorker, NativeSharedWorker);
  SelfClosingSharedWorker.prototype = NativeSharedWorker.prototype;
  window.SharedWorker = SelfClosingSharedWorker;
}

function extractResourceCount(input) {
  const match = input.match(/undefined,\s*(\d+),/);
  return match ? parseInt(match[1], 10) : null;
}

// Send test results to collector.
// Collector will store the results in its session storage temporarily.
async function sendTestResults(results) {
  console.log('Beginning sending report to collector...');

  const resultsURL =
    (location.origin || location.protocol + '//' + location.host) +
    '/api/results?for=' +
    encodeURIComponent(location.href);

  const response = await fetch(resultsURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    body: JSON.stringify(results),
  });

  if (response.ok) {
    console.log('Report sent successfully');
  } else {
    console.error('Failed to send report:', response.statusText);
  }
}

// Send export request to collector.
// This will make collector generate a json report in the `collector/download/` directory.
async function exportReport() {
  console.log('Beginning report export...');

  const resultsURL =
    (location.origin || location.protocol + '//' + location.host) + '/export';

  const response = await fetch(resultsURL, {
    method: 'POST',
  });

  if (response.ok) {
    console.log('Report exported successfully');
    let responseText = await response.text();
    let filename = responseText.match(/<a.*href="\/download\/(.*)"/)[1];
    console.log(`RESULT_FILENAME: ${filename}`);
  } else {
    console.error('Failed to export report:', response.statusText);
  }
}
