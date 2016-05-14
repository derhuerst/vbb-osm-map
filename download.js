'use strict'

const queue     = require('queue')
const relations = require('vbb-osm-relations')
const flatten   = require('osm-flatten-relation')
const ndjson    = require('ndjson')
const fs        = require('fs')

const all = queue()
all.concurrency = 1

Object.keys(relations).map((line) => {
	let ids = relations[line]
	if (!Array.isArray(ids)) ids = [ids]
	ids.forEach((id) => all.push((cb) => {
		flatten(id, 10).on('error', cb)
		.pipe(ndjson.stringify())
		.pipe(fs.createWriteStream(`data/${line}.ndjson`))
		.on('finish', () => {
			console.info(line, '✓')
			cb()
		})
	}))
})

all.start()
all.on('error', console.error)
