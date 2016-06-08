'use strict'
var test = require('tap').test
var Template = require('../template')

test('Template', function (t) {
  var result
  var template
  template = new Template(10, [{type: 'name'}])
  result = template.render({name: 'NAME'})
  t.is(result, 'NAME      ', 'name substitution')

  template = new Template(10, [{type: 'name'}, {type: 'completionbar'}])
  result = template.render({
    name: 'NAME',
    completionbar: function (values, theme, width) {
      return 'xx' + String(width) + 'xx'
    }
  })
  t.is(result, 'NAMExx6xx ', 'name + 50%')

  template = new Template(10, ['static'])
  result = template.render({})
  t.is(result, 'static    ', 'static text')

  template = new Template(10, ['static', {type: 'name'}])
  result = template.render({name: 'NAME'})
  t.is(result, 'staticNAME', 'static text + var')

  template = new Template(10, ['static', {type: 'name', kerning: 1}])
  result = template.render({name: 'NAME'})
  t.is(result, 'static NAM', 'pre-separated')

  template = new Template(10, [{type: 'name', kerning: 1}, 'static'])
  result = template.render({name: 'NAME'})
  t.is(result, 'NAME stati', 'post-separated')

  template = new Template(10, ['1', {type: 'name', kerning: 1}, '2'])
  result = template.render({name: ''})
  t.is(result, '12        ', 'separated no value')

  template = new Template(10, ['1', {type: 'name', kerning: 1}, '2'])
  result = template.render({name: 'NAME'})
  t.is(result, '1 NAME 2  ', 'separated value')

  template = new Template(10, ['AB', {type: 'name', kerning: 1}, {value: 'CD', kerning: 1}])
  result = template.render({name: 'NAME'})
  t.is(result, 'AB NAME CD', 'multi kerning')

  template = new Template(10, [{type: 'name', length: '50%'}, 'static'])
  result = template.render({name: 'N'})
  t.is(result, 'N    stati', 'percent length')

  try {
    template = new Template(10, [{type: 'xyzzy'}, 'static'])
    result = template.render({})
    t.fail('missing type')
  } catch (e) {
    t.pass('missing type')
  }

  template = new Template(10, [{type: 'name', minLength: '20%'}, 'this long thing'])
  result = template.render({name: 'N'})
  t.is(result, 'N this lon', 'percent minlength')

  template = new Template(10, [{type: 'name', maxLength: '20%'}, 'nope'])
  result = template.render({name: 'NAME'})
  t.is(result, 'NAnope    ', 'percent maxlength')

  template = new Template(10, [{type: 'name', padLeft: 2, padRight: 2}, '||'])
  result = template.render({name: 'NAME'})
  t.is(result, '  NAME  ||', 'manual padding')

  template = new Template(10, [{value: 'ABC', minLength: 2, maxLength: 6}, 'static'])
  result = template.render({})
  t.is(result, 'ABC static', 'max hunk size < maxLength')

  template = new Template(10, [{value: function () { return '' }}])
  result = template.render({})
  t.is(result, '          ', 'empty value')

  template = new Template(10, [{value: '12古34', align: 'center', length: '100%'}])
  result = template.render({})
  t.is(result, '  12古34  ', 'wide chars')

  template = new Template(10, [{type: 'test', value: 'abc'}])
  result = template.render({preTest: '¡', postTest: '!'})
  t.is(result, '¡abc!     ', 'pre/post values')

  template = new Template(10, [{type: 'test', value: 'abc'}])
  result = template.render({preTest: '¡'})
  t.is(result, '¡abc      ', 'pre values')

  template = new Template(10, [{type: 'test', value: 'abc'}])
  result = template.render({postTest: '!'})
  t.is(result, 'abc!      ', 'post values')

  template = new Template(10, [{value: 'abc'}, {value: '‼‼', length: 0}, {value: 'def'}])
  result = template.render({})
  t.is(result, 'abcdef    ', 'post values')

  template = new Template(10, [{value: 'abc', align: 'xyzzy'}])
  result = template.render({})
  t.is(result, 'abc       ', 'unknown aligns are align left')

  t.end()
})
