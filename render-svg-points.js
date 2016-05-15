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



const line = (name, color, translate) =>
	map({objectMode: true}, (node) => `
<circle cx="${translate.x(node.longitude)}" cy="${translate.y(node.latitude)}"
	r=".1" fill="${color}"/>`)




const svg = merge()
svg.pipe(wrap(`<svg
	version="1.1" xmlns="http://www.w3.org/2000/svg"
	width="700" height="700" viewBox="0 0 100 100">`,
	`\n</svg>`))
.pipe(fs.createWriteStream('points.svg'))

const tasks = queue()
tasks.concurrency = 1

glob.sync('data/@(S|U)*.ndjson')
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
