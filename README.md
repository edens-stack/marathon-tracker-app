# 🏃‍♂️ Marathon Tracker

A simple, slick tracker for a 27-week marathon training plan — tick off each
session (outdoor run, indoor easy run, indoor tempo run, leg strength), watch
the progress bar fill up, and keep an eye on weeks completed, sessions done,
and your current streak.

No build step, no dependencies — just `index.html`, `style.css`, `plan.js`
(the training data) and `app.js` (the logic). Open `index.html` in a browser
and it works.

## Editing your plan

Everything about the schedule lives in [`plan.js`](plan.js) as a plain array —
edit the labels, distances or number of weeks there and the app rebuilds
itself automatically.

## Progress storage

Ticked runs are saved in your browser's `localStorage`, so progress persists
between visits on the same device/browser (there's no account or server —
clearing browser data clears your progress).
