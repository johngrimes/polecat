import React, { Component } from 'react'
import PropTypes from 'prop-types'
import isEqual from 'lodash.isequal'
import omit from 'lodash.omit'
import onClickOutside from 'react-onclickoutside'

import TextField from './TextField.js'
import Loading from './Loading.js'
import Expand from './Expand.js'
import QuickSearchResults from './QuickSearchResults.js'
import { searchPathFromQuery } from './Router.js'
import { isValidSctid } from './snomed/sctid.js'

import './css/BasicSearch.css'

export class BasicSearch extends Component {
  static propTypes = {
    routedQuery: PropTypes.string,
    currentQuery: PropTypes.string,
    results: PropTypes.array,
    bundle: PropTypes.shape({ total: PropTypes.number }),
    focusUponMount: PropTypes.bool,
    loading: PropTypes.bool,
    quickSearchShouldClose: PropTypes.bool,
    onQueryUpdate: PropTypes.func,
    onToggleAdvanced: PropTypes.func,
    onSelectResult: PropTypes.func,
    onQuickSearchClosed: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = { results: this.updateResults(props), quickSearchOpen: false }
    this.handleQueryUpdate = this.handleQueryUpdate.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleClickOutside = this.handleClickOutside.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleToggleAdvanced = this.handleToggleAdvanced.bind(this)
    this.handleSelectResult = this.handleSelectResult.bind(this)
  }

  updateResults(props) {
    let { results } = props
    results = this.addMoreLinkToResults(results, props)
    return this.selectFirstResult(results)
  }

  addMoreLinkToResults(results, { bundle, currentQuery, routedQuery }) {
    const query = currentQuery || routedQuery
    if (!results || !bundle || !bundle.total) return results
    if (bundle.total > results.length) {
      return results.concat([
        {
          type: 'more',
          link: searchPathFromQuery(query),
          total: bundle.total,
        },
      ])
    } else return results
  }

  selectFirstResult(results) {
    if (!results) return results
    return results.map((result, i) => {
      return i === 0 ? { ...result, selected: true } : result
    })
  }

  closeQuickSearch() {
    const { results } = this.state
    this.setState(() => ({
      results: results ? results.map(r => omit(r, 'selected')) : results,
      quickSearchOpen: false,
    }))
  }

  handleQueryUpdate(query) {
    const { onQueryUpdate } = this.props
    // If the query is an SCTID, translate it into the tagged query sytax for
    // specifying an SCTID.
    if (onQueryUpdate)
      onQueryUpdate(isValidSctid(query) ? `id:${query}` : query)
  }

  handleFocus() {
    this.setState(() => ({ quickSearchOpen: true }))
  }

  handleClickOutside() {
    this.closeQuickSearch()
  }

  handleKeyDown(event) {
    // Close the quick search if Escape is pressed.
    if (event.key === 'Escape') {
      this.closeQuickSearch()
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const { results } = this.state,
        selectedIndex = results.findIndex(r => r.selected)
      if (event.key === 'ArrowDown') this.setState({ quickSearchOpen: true })
      let newSelection
      if (selectedIndex === -1) newSelection = 0
      else {
        newSelection =
          event.key === 'ArrowDown'
            ? Math.min(selectedIndex + 1, results.length - 1)
            : Math.max(selectedIndex - 1, 0)
      }
      this.setState(() => ({
        results: results.map(
          (r, i) =>
            i === newSelection ? { ...r, selected: true } : omit(r, 'selected'),
        ),
      }))
    } else if (event.key === 'Enter') {
      const { results } = this.state,
        selectedResult = results ? results.find(r => r.selected) : null
      if (selectedResult) this.handleSelectResult(selectedResult)
    }
  }

  handleToggleAdvanced() {
    const { onToggleAdvanced } = this.props
    if (onToggleAdvanced) onToggleAdvanced(false)
  }

  handleSelectResult(result) {
    const { onSelectResult } = this.props
    this.closeQuickSearch()
    if (onSelectResult) onSelectResult(result)
  }

  componentWillReceiveProps(nextProps) {
    const updateProps = ['routedQuery', 'currentQuery', 'results']
    const { quickSearchShouldClose, onQuickSearchClosed } = nextProps
    if (nextProps.quickSearchShouldClose) {
      this.closeQuickSearch()
    } else if (updateProps.some(p => !isEqual(this.props[p], nextProps[p]))) {
      this.setState({
        results: this.updateResults(nextProps),
        quickSearchOpen: true,
      })
    }
    if (quickSearchShouldClose && onQuickSearchClosed) onQuickSearchClosed()
  }

  render() {
    const { routedQuery, currentQuery, focusUponMount, loading } = this.props
    const { results, quickSearchOpen } = this.state
    // If the query has been updated within state, use that over props.
    const query =
      currentQuery === null || currentQuery === undefined
        ? routedQuery
        : currentQuery
    return (
      <div className="search-basic">
        <div className="search-basic-form">
          <TextField
            value={query}
            placeholder="Search"
            className="search-input"
            onChange={this.handleQueryUpdate}
            onFocus={this.handleFocus}
            onKeyDown={this.handleKeyDown}
            focusUponMount={focusUponMount}
            selectAllUponFocus={true}
          />
          <Loading loading={loading}>
            <Expand
              active={false}
              className="search-toggle-advanced"
              onToggle={this.handleToggleAdvanced}
            />
          </Loading>
        </div>
        {quickSearchOpen ? (
          <QuickSearchResults
            query={query}
            results={results}
            onSelectResult={this.handleSelectResult}
          />
        ) : null}
      </div>
    )
  }
}

export default onClickOutside(BasicSearch)
