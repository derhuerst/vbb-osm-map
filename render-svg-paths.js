'use strict'

const map      = require('through2-map')
const wrap     = require('wrap-stream')
const duplexer = require('duplexer')
const merge    = require('merge-stream')
const queue    = require('queue')
const glob     = require('glob')
const path     = require('path')
const fs       = require('fs')
const ndjson   = require('ndjson')

const _        = require('./helpers')



const line = (name, color, translate) => {
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




const svg = merge()
svg.pipe(wrap(`<svg
	version="1.1" xmlns="http://www.w3.org/2000/svg"
	width="600" height="600" viewBox="0 0 100 100">`,
	`\n</svg>`))
.pipe(fs.createWriteStream('all.svg'))

const tasks = queue()
tasks.concurrency = 1

glob.sync('data/U*.ndjson')
.forEach((file) => tasks.push((next) => {

	const name = path.basename(file, '.ndjson')
	svg.add(fs.createReadStream(file)
	.pipe(ndjson.parse()).on('error', next)
	.pipe(line(name, _.color(name), _.translate)).on('error', next)
	.on('end', () => {
		console.info(name, '✓')
		next()
	}))
}))
tasks.start()
