'use strict'

const parse    = require('vbb-parse-line')
const colors   = require('vbb-util/lines/colors')
const map      = require('through2-map')



const translate = ((left, top, right, bottom) => {
	const width   = right - left
	const height  = bottom - top
	const x = (x) => (x - left) / width * 100
	const y = (y) => (y - top)  / height * 100
	return {x, y}
})(
	  13.0882097323 // left
	, 52.6697240587 // top
	, 13.7606105539 // right
	, 52.3418234221 // bottom
)

const color = (line) => {
	line = parse(line)
	if (colors[line.type] && colors[line.type][line._])
		return colors[line.type][line._].bg
	return '#333'
}

const round = (x) => Math.round(x * 10000) / 10000

const relative = (translate) => {
	let previous = {x: 0, y: 0}
	return map({objectMode: true}, (node) => {
		const x = translate.x(node.longitude)
		const y = translate.y(node.latitude)
		const delta = {dx: x - previous.x, dy: y - previous.y}
		previous = {x, y}
		return delta
	})
}



module.exports = {translate, color, round, relative}
