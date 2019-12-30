import React, { useState, useRef } from 'react'
import './index.css'

export default function Write() {
  const [showCursor, setShowCursor] = useState(false) // 光标的显隐.
  const [showCursorController, setShowCursorController] = useState(true)
  const [cursorInterval, setCursorInterval] = useState(null)
  // const [textareaValue, setTextareaValue] = useState('')
  const [text, setText] = useState('')
  // const [ifChangeText, setIfChangeText] = useState(true)
  // 因为 onChange 方法会执行两次, 所以设置一个控制器.
  const textarea = useRef()
  const methods = {
    toggleCursorState() { // 进入页面显示光标
      if (showCursorController) {
        setShowCursor(true)
        setShowCursorController(false)
        setCursorInterval(setInterval(() => setShowCursor(prevCursor => !prevCursor), 500)) // 必须写成函数形式!
        textarea.current.focus()
      }
    },
    leaveWrite() { // 离开页面光标消失.
      setShowCursor(false)
      setShowCursorController(true)
      clearInterval(cursorInterval)
    },
    getText(event) { // 为啥 onChange 方法会执行两次?
      // setIfChangeText(prevIfChangeText => !prevIfChangeText)
      console.log(1)
      // if (ifChangeText) {
      setText(text + event.target.value)
      // }
    },
    keyEvent(event) {
      if (event.key === 'Backspace') {
        console.log(text.length)
        setText(text.slice(0, text.length - 1))
      }
      // event.stopPropagation()
    }
  }
  return (
    <div className="write" onClick={methods.toggleCursorState}>
      <div className="caret">
        <textarea
          className="writing"
          ref={textarea}
          onBlur={methods.leaveWrite}
          value=""
          onChange={(event) => methods.getText(event)}
          onKeyDown={methods.keyEvent} />
        { showCursor ? <div className="cursor" /> : undefined }
      </div>
      <div className="text-list">
        <div>{text}</div>
      </div>
    </div>
  )
}
