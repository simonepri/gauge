'use strict'
var consoleStrings = require('./console-strings.js')
var Template = require('./template.js')
var validate = require('aproba')

var Plumbing = module.exports = function (theme, template, width) {
  if (!width) width = 80
  validate('OAN', [theme, template, width])
  this.showing = false
  this.setTheme(theme)
  this.setWidth(width)
  this.setTemplate(template)
}
Plumbing.prototype = {}

Plumbing.prototype.setTheme = function (theme) {
  validate('O', [theme])
  this.theme = theme
}

Plumbing.prototype.setTemplate = function (template) {
  validate('A', [template])
  this.template = new Template(this.width, template)
}

Plumbing.prototype.setWidth = function (width) {
  validate('N', [width])
  this.width = width
  if (this.template) this.template.setWidth(width)
}

Plumbing.prototype.hide = function () {
  return consoleStrings.gotoSOL() + consoleStrings.eraseLine()
}

Plumbing.prototype.hideCursor = consoleStrings.hideCursor

Plumbing.prototype.showCursor = consoleStrings.showCursor

Plumbing.prototype.show = function (status) {
  var values = Object.create(this.theme)
  for (var key in status) {
    values[key] = status[key]
  }

  return this.template.render(values).trim() +
         consoleStrings.eraseLine() + consoleStrings.gotoSOL()
}
