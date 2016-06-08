'use strict'
var align = require('wide-align')
var validate = require('aproba')
var objectAssign = require('object-assign')
var wideTruncate = require('./wide-truncate')
var error = require('./error')
var TemplateItem = require('./template-item')

var Template = module.exports = function (width, template) {
  this.setWidth(width)
  this.setTemplate(template)
}
Template.prototype = {}

Template.prototype.setWidth = function (width) {
  this.width = width
}
Template.prototype.setTemplate = function (template) {
  this.template = template
}

Template.prototype.render = function (values) {
  validate('O', arguments)
  var self = this
  var items = self.prepareItems(values)
  function thenRenderValue (item) {
    return self.renderValue(item, values)
  }
  var rendered = items.map(thenRenderValue).join('')
  return align.left(wideTruncate(rendered, self.width), self.width)
}

function preType (item) {
  var cappedTypeName = item.type[0].toUpperCase() + item.type.slice(1)
  return 'pre' + cappedTypeName
}

function postType (item) {
  var cappedTypeName = item.type[0].toUpperCase() + item.type.slice(1)
  return 'post' + cappedTypeName
}

function hasPreOrPost (item, values) {
  if (!item.type) return
  return values[preType(item)] || values[postType(item)]
}

Template.prototype.generatePreAndPost = function generatePreAndPost (baseItem, parentValues) {
  var item = objectAssign({}, baseItem)
  var values = Object.create(parentValues)
  var template = []
  var pre = preType(item)
  var post = postType(item)
  if (values[pre]) {
    template.push({value: values[pre]})
    values[pre] = null
  }
  item.minLength = null
  item.length = null
  item.maxLength = null
  template.push(item)
  values[item.type] = values[item.type]
  if (values[post]) {
    template.push({value: values[post]})
    values[post] = null
  }
  var tmpl = new Template(0, template)
  return function ($1, $2, length) {
    tmpl.setWidth(length)
    return tmpl.render(values)
  }
}

Template.prototype.prepareItems = function prepareItems (values) {
  validate('O', arguments)
  var self = this
  function cloneAndObjectify (item, index, arr) {
    var cloned = new TemplateItem(item, self.width)
    var type = cloned.type
    if (cloned.value == null) {
      if (!(type in values)) throw new error.MissingTemplateValue(cloned, values)
      cloned.value = values[type]
    }
    if (cloned.value == null || cloned.value === '') return null
    cloned.index = index
    cloned.first = index === 0
    cloned.last = index === arr.length - 1
    if (hasPreOrPost(cloned, values)) cloned.value = self.generatePreAndPost(cloned, values)
    return cloned
  }

  var output = self.template.map(cloneAndObjectify).filter(function (item) { return item != null })

  var outputLength = 0
  var remainingSpace = self.width
  var variableCount = output.length

  function consumeSpace (length) {
    if (length > remainingSpace) length = remainingSpace
    outputLength += length
    remainingSpace -= length
  }

  function finishSizing (item, length) {
    if (item.finished) throw new error.Internal('Tried to finish template item that was already finished')
    if (length === Infinity) throw new error.Internal('Length of template item cannot be infinity')
    if (length != null) item.length = length
    item.minLength = null
    item.maxLength = null
    --variableCount
    item.finished = true
    if (item.length == null) item.length = item.getBaseLength()
    if (item.length == null) throw new error.Internal('Finished template items must have a length')
    consumeSpace(item.getLength())
  }

  output.forEach(function (item) {
    if (!item.kerning) return
    var prevPadRight = item.first ? 0 : output[item.index - 1].padRight
    if (!item.first && prevPadRight < item.kerning) item.padLeft = item.kerning - prevPadRight
    if (!item.last) item.padRight = item.kerning
  })

  // Finish any that have a fixed (literal or intuited) length
  output.forEach(function (item) {
    if (item.getBaseLength() == null) return
    finishSizing(item)
  })

  var resized = 0
  var resizing
  var hunkSize
  do {
    resizing = false
    hunkSize = Math.round(remainingSpace / variableCount)
    output.forEach(function (item) {
      if (item.finished) return
      if (!item.maxLength) return
      if (item.getMaxLength() < hunkSize) {
        finishSizing(item, item.maxLength)
        resizing = true
      }
    })
  } while (resizing && resized++ < output.length)
  if (resizing) throw new error.Internal('Resize loop iterated too many times while determining maxLength')

  resized = 0
  do {
    resizing = false
    hunkSize = Math.round(remainingSpace / variableCount)
    output.forEach(function (item) {
      if (item.finished) return
      if (!item.minLength) return
      if (item.getMinLength() >= hunkSize) {
        finishSizing(item, item.minLength)
        resizing = true
      }
    })
  } while (resizing && resized++ < output.length)
  if (resizing) throw new error.Internal('Resize loop iterated too many times while determining minLength')

  hunkSize = Math.round(remainingSpace / variableCount)
  output.forEach(function (item) {
    if (item.finished) return
    finishSizing(item, hunkSize)
  })

  return output
}

Template.prototype.renderFunction = function renderFunction (item, values, length) {
  validate('OON', arguments)
  if (item.type) {
    return item.value.call(this, values, values[item.type + 'Theme'] || {}, length)
  } else {
    return item.value.call(this, values, {}, length)
  }
}

Template.prototype.renderValue = function renderValue (item, values) {
  var length = item.getBaseLength()
  var value = typeof item.value === 'function' ? this.renderFunction(item, values, length) : item.value
  if (value == null || value === '') return ''
  var alignWith = align[item.align] || align.left
  var leftPadding = item.padLeft ? align.left('', item.padLeft) : ''
  var rightPadding = item.padRight ? align.right('', item.padRight) : ''
  var truncated = wideTruncate(String(value), length)
  var aligned = alignWith(truncated, length)
  return leftPadding + aligned + rightPadding
}
