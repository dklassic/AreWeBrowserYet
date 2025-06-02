// After mdn-bcd-collector's tests page is loaded, run the test.
onload = () => {
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
  await sendTestResults(results);
  await exportReport();

  // Close the window to terminate the servo process.
  window.close();
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
