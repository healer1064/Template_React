/* eslint-disable flowtype/require-valid-file-annotation */
/* eslint-disable max-len */

// Enzyme docs:
// http://airbnb.io/enzyme/docs/api/index.html

import test from 'tape'
import React from 'react'
import { render } from 'enzyme'
import Profile from './Profile'
import { Profile as ProfileModel } from '../../redux/modules/profile'


test('<Profile> displays profile info', (t: Object) => {

  const profile = ProfileModel({
    city: 'Austin, TX',
  })

  const wrapper = render(
    <Profile
      me={profile}
    />
  )
  const hasCity = wrapper.text().indexOf(profile.get('city')) !== -1

  t.equals(hasCity, true)
  t.end()

})
