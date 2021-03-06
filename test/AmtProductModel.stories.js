import React from 'react'
import { storiesOf } from '@storybook/react'
import { host } from 'storybook-host'

import AmtProductModel from '../src/AmtProductModel.js'
import nodesLinks1 from './fixtures/nodesLinks-813191000168107.json'

const { nodes: nodes1, links: links1 } = nodesLinks1
const width = 800
const height = 800

const twoNodes = {
  nodes: [
    {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '21415011000036100',
          display: 'amoxicillin',
        },
      ],
      type: 'UPD',
    },
    {
      type: 'UPD',
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '21360011000036101',
          display: 'amoxicillin + clavulanic acid',
        },
      ],
      focused: true,
    },
  ],
  links: [
    { source: '21415011000036100', target: '21360011000036101', type: 'is-a' },
  ],
}

const fixedPos = {
  E: [[100, 100], [400, 100]],
  ESE: [[100, 100], [400, 194.41696971]],
  SE: [[100, 100], [400, 309.6385542]],
  SSE: [[100, 100], [400, 389.6986192]],
  S: [[100, 100], [100, 300]],
  SSW: [[400, 100], [100, 389.6986192]],
  SW: [[400, 100], [100, 309.6385542]],
  WSW: [[400, 100], [100, 194.41696971]],
  W: [[400, 100], [100, 100]],
  WNW: [[400, 194.41696971], [100, 100]],
  NW: [[400, 309.6385542], [100, 100]],
  NNW: [[400, 389.6986192], [100, 100]],
  N: [[100, 300], [100, 100]],
  NNE: [[100, 389.6986192], [400, 100]],
  NE: [[100, 309.6385542], [400, 100]],
  ENE: [[100, 194.41696971], [400, 100]],
}

const farPos = [[100, 100], [400, 309.6385542]]
const closePos = [[100, 100], [280, 232.7710843]]

const addFixedPos = (nodes, fixedPos) =>
  nodes.map((node, i) => ({
    ...{ fx: fixedPos[i][0], fy: fixedPos[i][1] },
    ...node,
  }))

const stories = storiesOf('AmtProductModel', module)
  .addDecorator(
    host({ width: '802px', height: '802px', border: '1px solid #ccc' }),
  )
  .add('With nodes and links', () => (
    <AmtProductModel
      nodes={nodes1}
      links={links1}
      viewport={{ width, height }}
    />
  ))

for (const pos in fixedPos) {
  stories.add(`${pos} link`, () => {
    const nodes = addFixedPos(twoNodes.nodes, fixedPos[pos])
    return (
      <AmtProductModel
        nodes={nodes}
        links={twoNodes.links}
        viewport={{ width, height }}
      />
    )
  })
}

stories
  .add('Association link', () => {
    const nodes = addFixedPos(twoNodes.nodes, farPos)
    const links = [{ ...twoNodes.links[0], ...{ type: 'has-brand' } }]
    return (
      <AmtProductModel
        nodes={nodes}
        links={links}
        viewport={{ width, height }}
      />
    )
  })
  .add('Association link (close)', () => {
    const nodes = addFixedPos(twoNodes.nodes, closePos)
    const links = [{ ...twoNodes.links[0], ...{ type: 'has-brand' } }]
    return (
      <AmtProductModel
        nodes={nodes}
        links={links}
        viewport={{ width, height }}
      />
    )
  })
  .add('Inheritance link', () => {
    const nodes = addFixedPos(twoNodes.nodes, farPos)
    const links = [{ ...twoNodes.links[0], ...{ type: 'is-a' } }]
    return (
      <AmtProductModel
        nodes={nodes}
        links={links}
        viewport={{ width, height }}
      />
    )
  })
  .add('Inheritance link (close)', () => {
    const nodes = addFixedPos(twoNodes.nodes, closePos)
    const links = [{ ...twoNodes.links[0], ...{ type: 'is-a' } }]
    return (
      <AmtProductModel
        nodes={nodes}
        links={links}
        viewport={{ width, height }}
      />
    )
  })
  .add('Aggregation link', () => {
    const nodes = addFixedPos(twoNodes.nodes, farPos)
    const links = [{ ...twoNodes.links[0], ...{ type: 'has-component' } }]
    return (
      <AmtProductModel
        nodes={nodes}
        links={links}
        viewport={{ width, height }}
      />
    )
  })
  .add('Aggregation link (close)', () => {
    const nodes = addFixedPos(twoNodes.nodes, closePos)
    const links = [{ ...twoNodes.links[0], ...{ type: 'has-component' } }]
    return (
      <AmtProductModel
        nodes={nodes}
        links={links}
        viewport={{ width, height }}
      />
    )
  })
