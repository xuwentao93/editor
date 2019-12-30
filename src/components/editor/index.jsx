import React from 'react'
import './index.css'
import Navigator from '../navigator'
import View from '../view'
import Write from '../write'

export default function Editor() {
  return (
    <>
      <Navigator className='title'/>
      <div className="editor">
        <Write className='write' />
        <View className='view' />
      </div>
    </>
  )
}
