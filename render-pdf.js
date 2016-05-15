'use strict'

const map      = require('through2-map')
const wrap     = require('wrap-stream')
const duplexer = require('duplexer')
const PDF      = require('pdfkit')
const queue    = require('queue')
const glob     = require('glob')
const path     = require('path')
const fs       = require('fs')
const ndjson   = require('ndjson')

const _        = require('./helpers')



const line = (color, translate) => {
	let first = true
	const step = (step) => {
		if (first === true) {
			first = false
			return `\nM${step.dx} ${step.dy}`
		}
		return `\nl${step.dx} ${step.dy}`
	}

	const input = _.relative(translate)
	const output = input
	.pipe(map({objectMode: true}, step))
	.pipe(wrap(`
<path stroke="${color}" stroke-width="2" fill="none" d="`, `
"/>`))
	return duplexer(input, output)
}




const doc = new PDF()
doc.pipe(fs.createWriteStream('all.pdf'))

const tasks = queue()
tasks.concurrency = 1

glob.sync('data/U*.ndjson')
.forEach((file) => tasks.push((next) => {

	const name = path.basename(file, '.ndjson')
	doc.strokeColor(_.color(name))

	let first = true
	const step = (node) => {
		const x = _.translate.x(node.longitude)
		const y = _.translate.y(node.latitude)
		if (first === true) {
			first = false
			doc.moveTo(x, y)
		}
		else doc.lineTo(x, y)
	}

	fs.createReadStream(file)
	.pipe(ndjson.parse()).on('error', next)
	.on('data', step)
	.on('end', () => {
		doc.stroke()
		console.info(name, '✓')
		next()
	})

}))
tasks.start()
tasks.on('end', () => doc.end())
