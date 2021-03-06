import React from 'react'

import {
  codingToGroupCode,
  humaniseRelationshipType,
} from '../fhir/medication.js'

export const calculateLinkOptions = (link, options) => {
  let mergedOptions = calculateBearings(link, options)
  mergedOptions = calculateLinkEndings(link, mergedOptions)
  mergedOptions = calculateLinkMidpoint(link, mergedOptions)
  mergedOptions = calculateControlPoints(mergedOptions)
  return mergedOptions
}

// Returns a SVG representation of a curved arrow with an arrow head based upon
// the type of relationship.
export const curveForLink = (link, i, options) => {
  const { startX, startY, endX, endY, cp1x, cp1y, cp2x, cp2y } = options
  const linkPath = `M ${startX},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`
  const arrowType =
    link.type === 'has-component'
      ? 'aggregation'
      : link.type === 'is-a' ? 'inheritance' : 'association'
  return (
    <g key={i} className={`relationship relationship-${link.type}`}>
      <path
        className={link.highlight ? 'link link-highlighted' : 'link'}
        d={linkPath}
        markerEnd={
          link.highlight
            ? `url(#arrow-${arrowType}-highlighted)`
            : `url(#arrow-${arrowType})`
        }
      />
      <path
        className="link-hover-target"
        d={linkPath}
        onMouseMove={options.mouseMoveLink}
        onMouseLeave={options.mouseLeaveLink}
      />
    </g>
  )
}

// Returns markup that will render a label for the link, describing the type of
// relationship.
export const labelForLink = (link, i, options) => {
  const { midpointX, midpointY, onMouseMove, onMouseLeave } = options

  return (
    <div
      className="link-type"
      style={{
        top: `${midpointY}px`,
        left: `${midpointX}px`,
      }}
      key={i}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {link.sourceIsGroup
        ? humaniseRelationshipType(link.type, true)
        : humaniseRelationshipType(link.type)}
    </div>
  )
}

// Calculates the bearing between the two concepts, and the diagonals of each
// concept based on their sizes. The diagonals are used to determine which side
// of the concept to put the link ending on.
const calculateBearings = (link, options) => {
  const {
      conceptWidth,
      conceptHeight,
      conceptGroupWidth,
      conceptGroupHeight,
    } = options,
    conceptAngle = Math.atan(conceptHeight / conceptWidth),
    conceptGroupAngle = Math.atan(conceptGroupHeight / conceptGroupWidth),
    { source: { x: x1, y: y1 }, target: { x: x2, y: y2 } } = link,
    adj = x2 - x1,
    opp = y2 - y1,
    bearing =
      opp > 0
        ? Math.atan2(opp, adj)
        : opp === 0
          ? adj < 0 ? Math.PI : 0
          : Math.atan2(opp, adj) + 2 * Math.PI
  return {
    ...options,
    conceptAngle,
    conceptGroupAngle,
    southEast: conceptAngle,
    southWest: Math.PI - conceptAngle,
    northWest: Math.PI + conceptAngle,
    northEast: 2 * Math.PI - conceptAngle,
    groupSouthEast: conceptGroupAngle,
    groupSouthWest: Math.PI - conceptGroupAngle,
    groupNorthWest: Math.PI + conceptGroupAngle,
    groupNorthEast: 2 * Math.PI - conceptGroupAngle,
    bearing,
  }
}

// Calculates the co-ordinates of the start and end points of the link.
const calculateLinkEndings = (link, options) => {
  const {
      southEast,
      southWest,
      northWest,
      northEast,
      groupSouthEast,
      groupSouthWest,
      groupNorthWest,
      groupNorthEast,
      conceptWidth,
      conceptHeight,
      conceptGroupWidth,
      conceptGroupHeight,
      conceptAngle,
      conceptGroupAngle,
      bearing,
    } = options,
    { source: { x: x1, y: y1 }, target: { x: x2, y: y2 } } = link,
    sourceIsGroup = !!codingToGroupCode(link.source.coding),
    targetIsGroup = !!codingToGroupCode(link.target.coding),
    sourceHorizDistCenter = sourceIsGroup
      ? conceptGroupWidth / 2
      : conceptWidth / 2,
    targetHorizDistCenter = targetIsGroup
      ? conceptGroupWidth / 2
      : conceptWidth / 2,
    sourceVertDistCenter = sourceIsGroup
      ? conceptGroupHeight / 2
      : conceptHeight / 2,
    targetVertDistCenter = targetIsGroup
      ? conceptGroupHeight / 2
      : conceptHeight / 2,
    sourceAngle = sourceIsGroup ? conceptGroupAngle : conceptAngle,
    targetAngle = targetIsGroup ? conceptGroupAngle : conceptAngle,
    sourceSouthEast = sourceIsGroup ? groupSouthEast : southEast,
    sourceSouthWest = sourceIsGroup ? groupSouthWest : southWest,
    sourceNorthWest = sourceIsGroup ? groupNorthWest : northWest,
    sourceNorthEast = sourceIsGroup ? groupNorthEast : northEast,
    targetSouthEast = targetIsGroup ? groupSouthEast : southEast,
    targetSouthWest = targetIsGroup ? groupSouthWest : southWest,
    targetNorthWest = targetIsGroup ? groupNorthWest : northWest,
    targetNorthEast = targetIsGroup ? groupNorthEast : northEast
  let newOptions = {
    ...options,
    sourceSouthEast,
    sourceSouthWest,
    sourceNorthWest,
    sourceNorthEast,
    targetSouthEast,
    targetSouthWest,
    targetNorthWest,
    targetNorthEast,
  }
  let angle
  // Calculate startings.
  switch (true) {
    case bearing >= sourceNorthEast || bearing < sourceSouthEast:
      angle = conceptAngle =>
        bearing < conceptAngle ? bearing : bearing - 2 * Math.PI
      newOptions = {
        ...newOptions,
        startX: x1 + sourceHorizDistCenter,
        startY: y1 + sourceHorizDistCenter * Math.tan(angle(sourceAngle)),
      }
      break
    case bearing >= sourceSouthEast && bearing < sourceSouthWest:
      angle = bearing - Math.PI / 2
      newOptions = {
        ...newOptions,
        startX: x1 - sourceVertDistCenter * Math.tan(angle),
        startY: y1 + sourceVertDistCenter,
      }
      break
    case bearing >= sourceSouthWest && bearing < sourceNorthWest:
      angle = bearing - Math.PI
      newOptions = {
        ...newOptions,
        startX: x1 - sourceHorizDistCenter,
        startY: y1 - sourceHorizDistCenter * Math.tan(angle),
      }
      break
    case bearing >= sourceNorthWest && bearing < sourceNorthEast:
      angle = bearing - 3 * Math.PI / 2
      newOptions = {
        ...newOptions,
        startX: x1 + sourceVertDistCenter * Math.tan(angle),
        startY: y1 - sourceVertDistCenter,
      }
      break
    default:
      throw new Error(`Unexpected bearing: ${bearing}`)
  }
  // Calculate endings.
  switch (true) {
    case bearing >= targetNorthEast || bearing < targetSouthEast:
      angle = conceptAngle =>
        bearing < conceptAngle ? bearing : bearing - 2 * Math.PI
      newOptions = {
        ...newOptions,
        endX: x2 - targetHorizDistCenter,
        endY: y2 - targetHorizDistCenter * Math.tan(angle(targetAngle)),
      }
      break
    case bearing >= targetSouthEast && bearing < targetSouthWest:
      angle = bearing - Math.PI / 2
      newOptions = {
        ...newOptions,
        endX: x2 + targetVertDistCenter * Math.tan(angle),
        endY: y2 - targetVertDistCenter,
      }
      break
    case bearing >= targetSouthWest && bearing < targetNorthWest:
      angle = bearing - Math.PI
      newOptions = {
        ...newOptions,
        endX: x2 + targetHorizDistCenter,
        endY: y2 + targetHorizDistCenter * Math.tan(angle),
      }
      break
    case bearing >= targetNorthWest && bearing < targetNorthEast:
      angle = bearing - 3 * Math.PI / 2
      newOptions = {
        ...newOptions,
        endX: x2 - targetVertDistCenter * Math.tan(angle),
        endY: y2 + targetVertDistCenter,
      }
      break
    default:
      throw new Error(`Unexpected bearing: ${bearing}`)
  }
  return newOptions
}

// Calculates the midpoint of the link for labelling purposes.
const calculateLinkMidpoint = (link, options) => {
  const { startX, startY, endX, endY } = options
  return {
    ...options,
    ...{
      midpointX: startX + (endX - startX) / 2,
      midpointY: startY + (endY - startY) / 2,
    },
  }
}

// Calculates the control points for the Bézier curve, based on the curviness
// and the distance between the concepts.
const calculateControlPoints = options => {
  const {
      sourceSouthEast,
      sourceSouthWest,
      sourceNorthWest,
      sourceNorthEast,
      targetSouthEast,
      targetSouthWest,
      targetNorthWest,
      targetNorthEast,
      bearing,
      linkCurviness,
      startX,
      startY,
      endX,
      endY,
      arrowSize,
    } = options,
    adj = endX - startX,
    opp = endY - startY,
    angle = Math.atan(Math.abs(opp) / Math.abs(adj)),
    linkLength = angle === 0 ? Math.abs(adj) : Math.abs(opp) / Math.sin(angle),
    cpLength = arrowSize * 2 + linkLength * linkCurviness
  let newOptions = { ...options }
  // Calculate starting control points.
  switch (true) {
    case bearing >= sourceNorthEast || bearing < sourceSouthEast:
      newOptions = {
        ...newOptions,
        cp1x: startX + cpLength,
        cp1y: startY,
      }
      break
    case bearing >= sourceSouthEast && bearing < sourceSouthWest:
      newOptions = {
        ...newOptions,
        cp1x: startX,
        cp1y: startY + cpLength,
      }
      break
    case bearing >= sourceSouthWest && bearing < sourceNorthWest:
      newOptions = {
        ...newOptions,
        cp1x: startX - cpLength,
        cp1y: startY,
      }
      break
    case bearing >= sourceNorthWest && bearing < sourceNorthEast:
      newOptions = {
        ...newOptions,
        cp1x: startX,
        cp1y: startY - cpLength,
      }
      break
    default:
      throw new Error(`Unexpected bearing: ${bearing}`)
  }
  // Calculate ending control points.
  switch (true) {
    case bearing >= targetNorthEast || bearing < targetSouthEast:
      newOptions = {
        ...newOptions,
        cp2x: endX - cpLength,
        cp2y: endY,
      }
      break
    case bearing >= targetSouthEast && bearing < targetSouthWest:
      newOptions = {
        ...newOptions,
        cp2x: endX,
        cp2y: endY - cpLength,
      }
      break
    case bearing >= targetSouthWest && bearing < targetNorthWest:
      newOptions = {
        ...newOptions,
        cp2x: endX + cpLength,
        cp2y: endY,
      }
      break
    case bearing >= targetNorthWest && bearing < targetNorthEast:
      newOptions = {
        ...newOptions,
        cp2x: endX,
        cp2y: endY + cpLength,
      }
      break
    default:
      throw new Error(`Unexpected bearing: ${bearing}`)
  }
  return newOptions
}

export const associationMarker = (size, highlighted) => (
  <marker
    id={highlighted ? 'arrow-association-highlighted' : 'arrow-association'}
    viewBox="-1 -1 11 11"
    refX="10"
    refY="5"
    markerWidth={size * 0.8}
    markerHeight={size * 0.8}
    markerUnits="userSpaceOnUse"
    orient="auto"
  >
    <path
      className={
        highlighted
          ? 'arrow arrow-association arrow-highlighted'
          : 'arrow arrow-association'
      }
      d="M 0,0 L 10,5 L 0,10"
    />
  </marker>
)

export const inheritanceMarker = (size, highlighted) => (
  <marker
    id={highlighted ? 'arrow-inheritance-highlighted' : 'arrow-inheritance'}
    viewBox="-1 -1 11 11"
    refX="10"
    refY="5"
    markerWidth={size}
    markerHeight={size}
    markerUnits="userSpaceOnUse"
    orient="auto"
  >
    <path
      className={
        highlighted
          ? 'arrow arrow-inheritance arrow-highlighted'
          : 'arrow arrow-inheritance'
      }
      d="M 0,0 L 10,5 L 0,10 Z"
    />
  </marker>
)

export const aggregationMarker = (size, highlighted) => (
  <marker
    id={highlighted ? 'arrow-aggregation-highlighted' : 'arrow-aggregation'}
    viewBox="-1 -1 20 10"
    refX="20"
    refY="5"
    markerWidth={size}
    markerHeight={size}
    markerUnits="userSpaceOnUse"
    orient="auto"
  >
    <path
      className={
        highlighted
          ? 'arrow arrow-aggregation arrow-highlighted'
          : 'arrow arrow-aggregation'
      }
      d="M 0,5 L 10,0 L 20,5 L 10,10 Z"
    />
  </marker>
)
