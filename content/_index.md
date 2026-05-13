+++
insert_anchor_links = "left"
title = "Are We Browser Yet"
+++

# Are We Browser Yet

Are We Browser Yet is a tracking site that monitors the development progress of the [Servo browser engine](https://github.com/servo/servo). It answers the question: *"How close is Servo to being a usable browser?"* by comparing Servo's web feature support against real-world usage popularity data.

## What is Servo?

Taken directly from [Servo.org](https://servo.org/):

> Created by Mozilla Research in 2012, the Servo project is a research and development effort. Stewardship of Servo moved from Mozilla Research to the [Linux Foundation](https://www.linuxfoundation.org/) in 2020, where its mission remains unchanged. In 2023 the project moved to [Linux Foundation Europe](https://linuxfoundation.eu/).
> 
> Servo is written in [Rust](https://www.rust-lang.org/), taking advantage of the memory safety properties and concurrency features of the language.
> 
> Since its creation in 2012, Servo has contributed to W3C and WHATWG web standards, reporting specification issues and submitting new cross-browser automated tests, and core team members have co-edited new standards that have been adopted by other browsers. As a result, the Servo project helps drive the entire web platform forward, while building on a platform of reusable, modular technologies that implement web standards.

You can learn more about Servo [here](https://servo.org/about/).

## Why do we need this site?

As the Servo browser engine develops, it would be great to have an easily accessible way to track the trajectory of the development. While Servo already tracks [the scores of WPT test](https://wpt.servo.org/), it's hard to gauge the actual usability of the browser through results of WPT test suites. Hence this site aims to track the coverage of available CSS features and HTML/JS APIs.

## What does the site track?

- **[CSS Feature Coverage](/metrics/css)** — CSS properties Servo supports, ranked by real-world usage, cross-referenced with ChromeStatus popularity and W3C specs.
- **[Browser Feature Coverage](/metrics/browser-feature)** — Web API support tested via the mdn-bcd-collector suite, ranked by ChromeStatus popularity data.
- **[Full API List](/metrics/browser-feature-full)** — A comprehensive list of all BCD APIs grouped by category, with MDN and spec links.

## How does the site work?

The site automatically rebuilds every week using the latest Servo nightly binary. Servo is run headlessly against a local [mdn-bcd-collector](https://mdn-bcd-collector.gooborg.com/) server to gather Web API support data, which is then mapped to popularity-ranked web features. CSS data is fetched from `doc.servo.org` and ChromeStatus. See each individual page to learn more about how it handles relevant data.