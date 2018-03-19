import React from 'react'
import { shallow } from 'enzyme'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import { Search } from '../src/Search.js'
import AdvancedSearch from '../src/AdvancedSearch.js'
import config from './config.js'

import searchBundle1 from './fixtures/searchBundle-1.json'
import searchBundle2 from './fixtures/searchBundle-2.json'

var mock = new MockAdapter(axios)

describe('Search', () => {
  it('should retrieve all results on download click', () => {
    const props = {
      fhirServer: config.fhirServer,
      history: {},
    }
    const wrapper = shallow(<Search {...props} />)
    wrapper.setState({
      query: 'type:MP ancestor:37732011000036107|phenylephrine',
      advanced: true,
    })
    // Mock out HTTP calls such that the search request receives the first page,
    // and the subsequent request receives the second page of results.
    mock
      .onGet(
        `${
          props.fhirServer
        }/Medication?medication-resource-type=UPD&ancestor=Medication/37732011000036107&status=active,inactive,entered-in-error&_summary=true&_count=20`,
      )
      .reply(200, searchBundle1, { 'content-type': 'application/fhir+json' })
      .onGet(
        `${
          props.fhirServer
        }?_getpages=ac0f1c84-093d-4696-af6a-d8245e92f846&_getpagesoffset=20&_count=20&_bundletype=searchset`,
      )
      .reply(200, searchBundle2, { 'content-type': 'application/fhir+json' })
    // Get the `onDownloadClick` handler passed to the AdvancedSearchComponent,
    // and call it.
    const onDownloadClick = wrapper.find(AdvancedSearch).prop('onDownloadClick')
    onDownloadClick()
    // Give the async code a chance to execute, then check that the `allResults`
    // prop has been passed to the AdvancedSearch component, with the correct value.
    return new Promise(resolve => {
      setTimeout(() => {
        wrapper.update()
        const advancedSearch = wrapper.find(AdvancedSearch)
        expect(advancedSearch).toBeDefined()
        expect(advancedSearch.prop('allResults')).toBeDefined()
        expect(advancedSearch.prop('allResults')).toMatchSnapshot()
        resolve()
      }, 50)
    })
  })
})