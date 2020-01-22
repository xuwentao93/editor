import React, { useState } from 'react'
import './index.css'
import Navigator from '../navigator'
import View from '../view'
import Write from '../write'

export default function Editor() {
  const [text, setText] = useState([])
  return (
    <>
      <Navigator className='title'/>
      <div className="editor">
        <Write className='write' setText={setText} />
        <View className='view' text={text} />
      </div>
    </>
  )
}
