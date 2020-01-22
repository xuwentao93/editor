import React from 'react'

export default function View(props) {

  return (
    <div className="view">
      <div>{ `text.length is ${props.text.length}` }</div>
    </div>
  )
}
