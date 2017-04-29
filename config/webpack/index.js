// @flow
/* eslint-disable global-require */

'use strict'

const { NODE_ENV } = process.env

const server = 'server'

if (!NODE_ENV) throw new Error('Set NODE_ENV')

const devtool = require('./devtool')[NODE_ENV]
const entry = require('./entry')[NODE_ENV]
const output = require('./output')[NODE_ENV]
const resolve = require('./resolve')[NODE_ENV]
const externals = require('./externals')[NODE_ENV]
const node = require('./node')[NODE_ENV]
const plugins = require('./plugins')[NODE_ENV]
const target = require('./target')[NODE_ENV]
const webpackModule = require('./module')[NODE_ENV]

const clientConfig = require('./client')

// Additional build scripts
const config = [
  clientConfig,
  {

    devtool: devtool[server],
    entry: entry[server],
    externals: externals[server],
    output: output[server],
    resolve: resolve[server],
    target: target[server],
    node: node[server],
    plugins: plugins[server],

    module: webpackModule[server],

  }]


module.exports = config
