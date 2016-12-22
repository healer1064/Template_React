// @flow
/* eslint-disable max-len */

// Enzyme docs:
// http://airbnb.io/enzyme/docs/api/index.html

import React from 'react'
import { shallow } from 'enzyme'
import Template from './Template'


it('<Template> renders the Template content', () => {

  const wrapper = shallow(
    <Template API_URL="" />
  )

  expect(wrapper).toMatchSnapshot()

})
