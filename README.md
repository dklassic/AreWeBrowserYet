# AreWeBrowserYet
 
Are We Browser Yet is a project that tracks the usability of `Servo` Browser Engine through comparing supported features and performance status.

Currently the only thing that's being tracked is the CSS feature coverage of `Servo`.

## How it works

### CSS Popularity Coverage

The [chromestatus](https://chromestatus.com/metrics/css/popularity#variable) collects the most used css properties via Chrome's anonymous usage statistics, while `Servo` currently generates the [supported css properties page](https://doc.servo.org/stylo/css-properties.html) in its `Stylo` component documentation.

This simple page just loads and parse through the data and list out the supported css features of `Servo`.

### Browser Feature Coverage

The project [mdn-bcd-collector](https://mdn-bcd-collector.gooborg.com/) provides a full host of testing suite to check the features supported by a browser. We will run the latest Servo commit to perform this test locally, then retrieve links to relevant specs with [mdn's browser-compat-data](https://github.com/mdn/browser-compat-data).


## Future Work

- [x] Setup a GitHub page
- [x] Rework to be built with Zola
- [x] Automatic rebuilding every week
- [x] Host the page on a better domain
- [x] Add in supported HTML/JS API tracking
- [x] Improve frontend presentation
- [ ] Add in performance tracking
