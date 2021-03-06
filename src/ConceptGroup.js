import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import Concept from './Concept.js'
import ConceptType from './ConceptType.js'
import Icon from './Icon.js'

import './css/ConceptGroup.css'

class ConceptGroup extends Component {
  static propTypes = {
    concepts: PropTypes.arrayOf(
      PropTypes.shape({
        coding: Concept.propTypes.coding,
        type: Concept.propTypes.type,
      }),
    ),
    // Total number of concepts that is available to view if the full result set
    // is requested by the user.
    total: PropTypes.number,
    // Path to view the full expanded list of concepts.
    linkPath: PropTypes.string.isRequired,
    top: PropTypes.number,
    left: PropTypes.number,
  }
  static defaultProps = {
    top: 0,
    left: 0,
    width: 100,
    height: 47,
  }

  render() {
    const { concepts, total, linkPath, top, left } = this.props
    const concept = concepts[0]
    const { type, status } = concept
    return (
      <div
        className="concept-group"
        style={{
          top: top + 'px',
          left: left + 'px',
        }}
      >
        <div className="concept concept-stacked-1">
          <ConceptType type={type} status={status} />
          <Link to={linkPath}>
            <Icon type="list" hoverType="list-active" width={20} height={20} />
          </Link>
        </div>
        <div className="concept concept-stacked-2" />
        <div className="concept concept-stacked-3" />
        <div className="concept-group-total">{total}</div>
      </div>
    )
  }
}

export default ConceptGroup
