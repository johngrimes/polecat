import React from 'react'
import { shallow } from 'enzyme'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import sinon from 'sinon'

import { Search } from '../src/Search.js'
import AdvancedSearch from '../src/AdvancedSearch.js'
import config from './config.js'

import searchBundle1 from './fixtures/searchBundle-1.json'
import searchBundle2 from './fixtures/searchBundle-2.json'
import searchBundle3 from './fixtures/searchBundle-3.json'
import searchBundle4 from './fixtures/searchBundle-4.json'
import searchBundle5 from './fixtures/searchBundle-5.json'
import searchBundle6 from './fixtures/searchBundle-6.json'

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
        }/Medication?medication-resource-type=UPD&ancestor=Medication/37732011000036107&status=active,inactive,entered-in-error&_summary=true&_count=100`,
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

  it('should download with query in props but not state', () => {
    const props = {
      fhirServer: config.fhirServer,
      query: 'type:MP ancestor:37732011000036107|phenylephrine',
      history: {},
    }
    const wrapper = shallow(<Search {...props} />)
    // Mock out HTTP calls such that the search request receives the first page,
    // and the subsequent request receives the second page of results.
    mock
      .onGet(
        `${
          props.fhirServer
        }/Medication?medication-resource-type=UPD&ancestor=Medication/37732011000036107&status=active,inactive,entered-in-error&_summary=true&_count=100`,
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
        resolve()
      }, 50)
    })
  })

  describe('request triggering', () => {
    let httpSpy
    beforeEach(() => (httpSpy = sinon.spy(axios, 'get')))
    afterEach(() => httpSpy.restore())

    it('should not make another request if sent the same query through props', () => {
      const props = {
        fhirServer: config.fhirServer,
        history: {},
        query: 'g',
      }
      mock
        .onGet(
          `${
            props.fhirServer
          }/Medication?status=active,inactive,entered-in-error&_text=g&_summary=true&_count=100`,
        )
        .reply(200, searchBundle1, {
          'content-type': 'application/fhir+json',
        })
      const wrapper = shallow(<Search {...props} />)
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.setProps({ loading: true, query: 'g' })
          expect(httpSpy.callCount).toBe(1)
          resolve()
        }, 50)
      })
    })

    it('should not make another request if sent the same query through onQueryUpdate', () => {
      const props = {
        fhirServer: config.fhirServer,
        history: { push: jest.fn() },
        query: 'g',
      }
      mock
        .onGet(
          `${
            props.fhirServer
          }/Medication?status=active,inactive,entered-in-error&_text=g&_summary=true&_count=100`,
        )
        .reply(200, searchBundle1, {
          'content-type': 'application/fhir+json',
        })
      const wrapper = shallow(<Search {...props} />)
      const onQueryUpdate = wrapper.find(AdvancedSearch).prop('onQueryUpdate')
      return new Promise(resolve => {
        setTimeout(() => {
          onQueryUpdate('g')
          expect(httpSpy.callCount).toBe(1)
          resolve()
        }, 50)
      })
    })

    it('should not make another request if the same query comes through onQueryUpdate, then props', () => {
      const props = {
        fhirServer: config.fhirServer,
        history: { push: jest.fn() },
      }
      mock
        .onGet(
          `${
            props.fhirServer
          }/Medication?status=active,inactive,entered-in-error&_text=g&_summary=true&_count=100`,
        )
        .reply(200, searchBundle1, {
          'content-type': 'application/fhir+json',
        })
      const wrapper = shallow(<Search {...props} />)
      wrapper.setState({ advanced: true })
      const onQueryUpdate = wrapper.find(AdvancedSearch).prop('onQueryUpdate')
      onQueryUpdate('g')
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.setProps({ query: 'g' })
          expect(httpSpy.callCount).toBe(1)
          resolve()
        }, 50)
      })
    })
  })

  describe('pagination', () => {
    it('should retrieve an extra page of results when onRequireMoreResults is called', () => {
      const props = {
        fhirServer: config.fhirServer,
        history: { push: jest.fn() },
      }
      const wrapper = shallow(<Search {...props} />)
      // Put search into advanced mode.
      wrapper.setState({
        advanced: true,
      })
      // Mock out HTTP calls such that the search request receives the first page,
      // and the subsequent request receives the second page of results.
      mock
        .onGet(
          `${
            props.fhirServer
          }/Medication?medication-resource-type=UPG&status=active&last-modified=ge2018-05-01&last-modified=le2018-05-31&_summary=true&_count=100`,
        )
        .replyOnce(200, searchBundle3, {
          'content-type': 'application/fhir+json',
        })
        .onGet(
          `${
            props.fhirServer
          }?_getpages=ceb6c9b6-2519-4bce-be8d-e19a8fa1f856&_getpagesoffset=100&_count=100&_bundletype=searchset`,
        )
        .replyOnce(200, searchBundle4, {
          'content-type': 'application/fhir+json',
        })
      // Update the query using the `onQueryUpdate` callback function.
      const onQueryUpdate = wrapper.find(AdvancedSearch).prop('onQueryUpdate')
      onQueryUpdate(
        'type:MPP status:active modified-from:2018-05-01 modified-to:2018-05-31',
      )
      // Give the async code a chance to execute, then run the first set of
      // assertions on downstream props.
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.update()
          const advancedSearch = wrapper.find(AdvancedSearch)
          // The first set of results should be passed to the AdvancedSearch
          // component, and the `moreLink` prop should be the next link from the
          // bundle.
          expect(advancedSearch).toBeDefined()
          expect(advancedSearch.prop('results')).toBeDefined()
          expect(advancedSearch.prop('results')).toMatchSnapshot()
          // Get the `onRequireMoreResults` handler passed to the AdvancedSearchComponent,
          // and call it.
          const onRequireMoreResults = wrapper
            .find(AdvancedSearch)
            .prop('onRequireMoreResults')
          onRequireMoreResults({ stopIndex: 150 })
          // Give the async code a chance to execute, then check that the
          // downstream props have been updated to match the second page of results.
          setTimeout(() => {
            wrapper.update()
            // The second set of results should be passed to the AdvancedSearch
            // component, and the `moreLink` prop should be unset, as there is
            // no next link in the second bundle.
            const advancedSearch = wrapper.find(AdvancedSearch)
            expect(advancedSearch).toBeDefined()
            expect(advancedSearch.prop('results')).toBeDefined()
            expect(advancedSearch.prop('results')).toMatchSnapshot()
            expect(advancedSearch.prop('moreLink')).toBeFalsy()
            resolve()
          }, 50)
        }, 50)
      })
    })

    it('should not retain paginated results between searches', () => {
      const props = {
        fhirServer: config.fhirServer,
        history: { push: jest.fn() },
        minRequestFrequency: 0,
      }
      const wrapper = shallow(<Search {...props} />)
      // Put search into advanced mode.
      wrapper.setState({
        advanced: true,
      })
      // Mock out HTTP calls such that the search request receives the first page,
      // and the subsequent request receives the second page of results.
      mock
        .onGet(
          `${
            props.fhirServer
          }/Medication?medication-resource-type=BPG&status=active&last-modified=ge2018-05-01&last-modified=le2018-05-31&_summary=true&_count=100`,
        )
        .replyOnce(200, searchBundle3, {
          'content-type': 'application/fhir+json',
        })
        .onGet(
          `${
            props.fhirServer
          }?_getpages=b92d05a5-8272-42fc-95d9-be572621f46c&_getpagesoffset=100&_count=100&_bundletype=searchset`,
        )
        .replyOnce(200, searchBundle4, {
          'content-type': 'application/fhir+json',
        })
        .onGet(
          `${
            props.fhirServer
          }/Medication?medication-resource-type=BPSF&status=active&last-modified=ge2018-05-01&last-modified=le2018-05-31&_summary=true&_count=100`,
        )
        .replyOnce(200, searchBundle5, {
          'content-type': 'application/fhir+json',
        })
        .onGet(
          `${
            props.fhirServer
          }?_getpages=f42a28a9-f81a-4943-bd17-7e425f7955f1&_getpagesoffset=100&_count=100&_bundletype=searchset`,
        )
        .replyOnce(200, searchBundle6, {
          'content-type': 'application/fhir+json',
        })
      // Update the query using the `onQueryUpdate` callback function.
      const onQueryUpdate = wrapper.find(AdvancedSearch).prop('onQueryUpdate')
      onQueryUpdate(
        'type:TPP status:active modified-from:2018-05-01 modified-to:2018-05-31',
      )
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.update()
          const onRequireMoreResults = wrapper
            .find(AdvancedSearch)
            .prop('onRequireMoreResults')
          onRequireMoreResults({ stopIndex: 150 })
          setTimeout(() => {
            wrapper.update()
            const onQueryUpdate = wrapper
              .find(AdvancedSearch)
              .prop('onQueryUpdate')
            onQueryUpdate(
              'type:TPUU status:active modified-from:2018-05-01 modified-to:2018-05-31',
            )
            setTimeout(() => {
              wrapper.update()
              const advancedSearch = wrapper.find(AdvancedSearch)
              expect(advancedSearch.prop('results')).toHaveLength(100)
              const onRequireMoreResults = wrapper
                .find(AdvancedSearch)
                .prop('onRequireMoreResults')
              onRequireMoreResults({ stopIndex: 150 })
              setTimeout(() => {
                wrapper.update()
                const advancedSearch = wrapper.find(AdvancedSearch)
                expect(advancedSearch.prop('results')).toHaveLength(200)
                expect(
                  advancedSearch.prop('results').some(r => r.type === 'TPP'),
                ).toBe(false)
                resolve()
              }, 50)
            }, 50)
          }, 50)
        }, 50)
      })
    })
  })
})
