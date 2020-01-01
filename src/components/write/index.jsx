import React, { useState, useRef } from 'react'
import './index.css'

let stop = false // 中文输入的情况下让文本框的内容正确外弹. 放在函数内部每次渲染的时候都会重置
// 为false, 用于 state 的时候会有延迟性.

export default function Write() { // conclusion: keyEvent 事件一定先于 onCange 事件.
  const [showCursor, setShowCursor] = useState(false) // 光标的显隐.
  const [showCursorController, setShowCursorController] = useState(true)
  const [cursorInterval, setCursorInterval] = useState(null)
  const [textList, setTextList] = useState(['']) // 储存文本内容的数组.
  const [line, setLine] = useState(0) // 光标的行数
  const [X, setX] = useState(0) // 光标, 输入框位置

  const textarea = useRef() // texaarea
  const caret = useRef() // textarea 和 caret 的父节点.
  const getLength = useRef() // 输入删除文本的长度的一个节点.

  const utils = {
    getStringLength(str) { // 获取文本在实际页面中的长度.
      getLength.current.innerHTML = str
      const width = window.getComputedStyle(getLength.current).width
      getLength.current.innerHTML = ''
      return parseFloat(width)
    },
    caretLeft(x, ifAdd = true) { // 设置光标左右的位置.
      const width = utils.getStringLength(textList[line][x - 1])
      const left = window.getComputedStyle(caret.current).left
      if (ifAdd) caret.current.style.left = parseFloat(left) + width + 'px'
      else caret.current.style.left = parseFloat(left) - width + 'px'
    }
  }

  const methods = {
    toggleCursorState() { // 进入页面显示光标
      if (showCursorController) {
        setShowCursor(true)
        setShowCursorController(false)
        setCursorInterval(setInterval(() => setShowCursor(prevCursor => !prevCursor), 500))
        // setShowCursor 必须写成函数形式, 否则无法实时更新!
        textarea.current.focus()
      }
    },
    leaveWrite() { // 离开页面光标消失.
      setShowCursor(false)
      setShowCursorController(true)
      clearInterval(cursorInterval)
    },
    getText() {
      // if (stop) return
      const value = textarea.current.value
      const left = window.getComputedStyle(caret.current).left
      const width = utils.getStringLength(value)
      caret.current.style.left = parseFloat(left) + width + 'px'
      if (value !== '\n') {
        const newText = Object.assign([], textList)
        newText[line] += value
        setX(X + value.length)
        // 上述代码可以直接替换不用 setTextList, 不过更新起来会非常慢.
        setTextList(newText)
      }
      textarea.current.value = ''
    },
    keyEvent(event) {
      if (stop) return
      const key = {
        Backspace() {
          if (X === 0) {
            if (line === 0) return
            const style = caret.current.style
            const width = utils.getStringLength(textList[line - 1])
            style.top = parseFloat(window.getComputedStyle(caret.current).top) - 20.8 + 'px'
            style.left = width + 'px'
            setLine(line - 1)
            setX(textList[line - 1].length)
            textList.splice(line, 1)
            return
          }
          const newText = Object.assign([], textList)
          utils.caretLeft(X, false)
          newText[line] = newText[line].slice(0, newText[line].length - 1)
          // console.log(newText)
          setTextList(newText)
          setX(X - 1)
        },
        Enter() {
          setLine(line + 1)
          setX(0)
          const style = caret.current.style
          style.left = '0'
          style.top = parseFloat(window.getComputedStyle(caret.current).top) + 20.8 + 'px'
          // console.log(style.top)
          textList.splice(line + 1, 0, '')
        },
        ArrowLeft() {
          console.log(X)
          if (X === 1) return
          utils.caretLeft(X, false)
          setX(X - 1)
        },
        ArrowRight() {
          console.log(X)
          if (X === textList[line].length) return
          utils.caretLeft(X)
          setX(X + 1)
        },
        ArrowTop() {

        },
        ArrowDown() {
          
        }
      }
      if (key[event.key]) key[event.key]()
    },
    onCompositionEnd() { // 中文输入法结束后
      stop = false
      methods.getText()
    }
  }
  return (
    <div className="write" onClick={methods.toggleCursorState}>
      <div className="caret" ref={caret}>
        <textarea
          className="writing"
          ref={textarea}
          onBlur={methods.leaveWrite}
          onChange={(event) => methods.getText(event)}
          onCompositionStart={() => { stop = true }}
          onCompositionEnd={methods.onCompositionEnd}
          onKeyDown={methods.keyEvent} />
        { showCursor ? <div className="cursor" /> : undefined }
      </div>
      <div className="text-list">
        {
          textList.map((text, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className="text"><span>{text}</span></div>
          ))
        }
      </div>
      <span className="get-length" ref={getLength}></span>
    </div>
  )
}
