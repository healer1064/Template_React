// @flow
import Boom from 'boom'
import Fs from 'fs'
import Path from 'path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import Helmet from 'react-helmet'
import { Provider } from 'react-redux'
import { match, RouterContext } from 'react-router'
import createHistory from 'react-router/lib/createMemoryHistory'
import { syncHistoryWithStore } from 'react-router-redux'
import getRoutes from 'src/routes'
import { requireAuth } from 'src/helpers/auth'
import { getAssets } from 'server/utils'
import configureStore from 'src/redux/store'
import env from 'config/env'
import vars from 'config/variables'

// Default render options for react templates
// 'renderToStaticMarkup' omits react data properties
// 'renderToString' is used for re-hydrating on client-side
const defaultRenderOptions = {
  runtimeOptions: {
    docType: '<!DOCTYPE html>',
    renderMethod: 'renderToString',
  },
}


const routedHtml = (request: Object, reply: Function) => {

  // Paths relative to inside build/ only in prod
  const assets = getAssets()
  const cssPath = './public/styles.css'
  const cssFile = Path.resolve(__dirname, cssPath)
  let css = ''

  try {

    css = Fs.readFileSync(cssFile, 'utf-8')
    request.log(['info', 'css'], css.length)

  }
  catch (error) {

    request.log(['error', 'css'], error)

  }

  request.log(['info'], request.url.href)

  if (module.hot) {

    module.hot.accept('src/routes', () => {
    })

  }

  // Get initial store state
  let initialState
  if (process.env.NODE_ENV === 'development') {

    const statePath = '../../state.json'
    const stateFile = Path.resolve(__dirname, statePath)

    try {

      const devtoolState = JSON.parse(Fs.readFileSync(stateFile, 'utf-8'))
      const index = devtoolState.currentStateIndex
      initialState = devtoolState.computedStates[index].state
      request.log(['info', 'state'], initialState)

    }
    catch (stateError) {

      // This can fail silently if state.json doesn't exist
      // request.log(['error', 'state'], stateError)

    }

  }

  const memoryHistory = createHistory(request.url.href)

  // Inject server request info
  const _request = { userAgent: request.headers['user-agent'] }
  request.log(['info', 'user-agent'], _request.userAgent)

  const getAuthToken = () => {

    return request.state[vars.appAuthCookieKey]

  }

  const authenticated = typeof getAuthToken() !== 'undefined'

  // Pass initial state to store along with server ENV vars
  const store = configureStore({
    ...initialState,
    auth: {
      authenticated,
    },
    env,
    request: _request,
  }, memoryHistory)

  const history = syncHistoryWithStore(memoryHistory, store)

  // Let react-router match the raw URL to generate the
  // RouterContext here on the server
  match({
    routes: getRoutes(requireAuth(getAuthToken)),
    history,
    location: request.url.href,
  }, (error: string, redirectLocation: Object, renderProps: Object): any => {

    if (error) {

      request.log(['error', 'react-router'], error)
      return reply(Boom.serverTimeout(error))

    }
    else if (redirectLocation) {

      return reply
        .redirect(redirectLocation.pathname + redirectLocation.search)
        .temporary()

    }
    else if (renderProps) {


      // Get rendered router context
      const children = renderToString(
        <Provider store={store}>
          <RouterContext {...renderProps} />
        </Provider>
      )

      // Get resulting store state
      const preloadedState = store.getState()

      // Get resulting head info
      const head = Helmet.rewind()

      // Inject the RouterContext into the props sent to the layout
      const htmlProps = {
        assets,
        children,
        css,
        head,
        preloadedState,
      }

      // Render the layout with props
      return request.render(
        'Html',
        htmlProps,
        defaultRenderOptions,
        (errorLayout: string, output: string): any => {

          if (errorLayout) {

            request.log(['error', 'view'], errorLayout)
            return reply(Boom.serverTimeout(errorLayout))

          }

          return reply(output)

        }
      )

    }

    // If react-router couldn't match anything and threw no error
    return reply(Boom.notFound())

  })

}


export default routedHtml
