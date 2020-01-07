import React, { useState, useEffect } from 'react'
import './index.css'
import { Button } from 'antd'

export default function Navigator(props) {
  const [titleValue, setTitleValue] = useState('')
  useEffect(() => {
    setTitleValue('this is a long title, just for test.')
    return
  }, [titleValue])
  return (
    <div className="navigator">
      <input className="title" placeholder="please input your title..."
        value={titleValue} onChange={(event) => setTitleValue(event.target.value)} />
      <Button type="primary" className="publish">publish</Button>
    </div>
  )
}