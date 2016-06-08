var Gauge = require('.')
var themes = require('./themes')

function formatNumber (num) {
  var hours = Math.trunc(num / 3600)
  var mins = Math.trunc((num % 3600) / 60)
  var secs = Math.round(num % 60)
  var result = ''
  if (hours) result += hours + 'h '
  if (mins) result += mins + 'm '
  result += secs + 's'
  return result
}

function getEta (template) {
  this._eta = this._eta || {
    created: process.hrtime(),
    last: process.hrtime(),
    remaining: null
  }
  return this._eta
}

function elapsed (from, to) {
  var s = from[0] - to[0]
  var ns = from[1] - to[1]
  return s + (ns / 1000000000)
}

themes.addToAllThemes({
  'eta': function (values, theme, width) {
    var eta = getEta(this)
    var now = process.hrtime()
    var sinceLast = elapsed(now, eta.last)
    if (sinceLast >= 1 || !eta.remaining || eta.remaining < 1) {
      var tillNow = elapsed(eta.last, eta.created)
      var remaining = (tillNow / values.completed) - tillNow
      eta.last = now
      eta.remaining = remaining
    }
    return formatNumber(eta.remaining)
  },
  'elapsed': function (values, theme, width) {
    var eta = getEta(this)
    return formatNumber(elapsed(process.hrtime(), eta.created))
  }
})

var template = [
  {type: 'progressbar', length: 20},
  {type: 'activityIndicator', kerning: 1, length: 1},
  ' eta:',
  {type: 'eta', maxLength: 10, kerning: 1},
  'so far:',
  {type: 'elapsed', length: 10, kerning: 1},
  {type: 'section', kerning: 1},
  {type: 'subsection', kerning: 1}
]
var gauge = new Gauge(process.stderr, {template: template})

var progress = 0

var cnt = 0
var pulse = setInterval(function () {
  gauge.pulse('this is a thing that happened ' + (++cnt))
}, 110)
var prog = setInterval(function () {
  progress += 0.0001
  gauge.show(Math.round(progress * 1000), progress)
  if (progress >= 1) {
    clearInterval(prog)
    clearInterval(pulse)
    gauge.disable()
  }
}, 100)
gauge.show()
