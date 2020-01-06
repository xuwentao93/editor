import React, { useState, useRef } from 'react'
import './index.css'

let stop = false // 中文输入的情况下让文本框的内容正确外弹. 放在函数内部每次渲染的时候都会重置
// 为false, 用于 state 的时候会有延迟性.
let timer = null // 光标显影的定时器.
let staticX = 0
let prevText = ''
let endText = ''
// let staticLeft = 0
let N = 0

export default function Write() { // conclusion: keyEvent 事件一定先于 onCange 事件.
  const [showCursor, setShowCursor] = useState(false) // 光标的显隐.
  const [showCursorController, setShowCursorController] = useState(true)
  const [cursorInterval, setCursorInterval] = useState(null) // 光标显隐的定时器。
  const [textList, setTextList] = useState(['']) // 储存文本内容的数组.
  const [line, setLine] = useState(0) // 光标的行数
  const [X, setX] = useState(0) // 光标, 输入框位置

  const textarea = useRef() // texaarea
  const caret = useRef() // textarea 和 caret 的父节点.
  const getLength = useRef() // 输入删除文本的长度的一个节点.
  const write = useRef() // 编辑框.

  const utils = {
    getStringLength(str) { // 获取文本在实际页面中的长度.
      getLength.current.innerHTML = str
      const width = window.getComputedStyle(getLength.current).width
      getLength.current.innerHTML = ''
      return parseFloat(width)
    },
    caretHorizontalMove(x = X, ifAdd = true) { // 设置光标左右的位置.
      const width = utils.getStringLength(textList[line][x - 1])
      const left = window.getComputedStyle(caret.current).left
      if (ifAdd) caret.current.style.left = parseFloat(left) + width + 'px'
      else caret.current.style.left = parseFloat(left) - width + 'px'
    }
  }

  const methods = {
    toggleCursorState() { // 进入编辑器显示光标
      if (showCursorController) {
        setShowCursor(true)
        setShowCursorController(false)
        timer = setInterval(() => setShowCursor(prevCursor => !prevCursor), 500)
        setCursorInterval(timer)
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
      const value = textarea.current.value
      if (stop) {
        if (N === 0) {
          N = 1
          prevText = textList[line].slice(0, X)
          endText = textList[line].slice(X)
          staticX = X
        }
        const newText = Object.assign([], textList)
        newText[line] = prevText + value + endText
        setTextList(newText)
        setX(staticX + value.length)
        // utils.caretHorizontalMove(X + 1)
        return
      }
      const left = window.getComputedStyle(caret.current).left
      const width = utils.getStringLength(value) // 字符串在页面的长度.
      const textWidth = utils.getStringLength(textList[line]) // 当前行的长度.
      const wholeWidth = parseFloat(window.getComputedStyle(write.current).width) - 60 // 编辑框宽度
      if (width + textWidth > wholeWidth) { // 处理文本溢出.
        console.log(1)
        let str = textList[line].slice(0, X) + value + textList[line].slice(X)
        let changeLine = 1
        for (let i = line + 1; i < textList.length; i++) {
          str += i
          changeLine++
          if (textList[i][textList[i].length - 1] === '\n') break
        }
        // const strLength = utils.getStringLength(str)
        // let n = Math.ceil(strLength / wholeWidth) // 行数
        // console.log(n)
        const insertText = []
        for (let i = 0; i < str.length; i++) {
          let strLength = ''
          while (utils.getStringLength(strLength) < wholeWidth) {
            strLength += str[i]
            if (str[i] === '\n') {
              i++
              break
            }
            if (i === str.length - 1) break
            i++
          }
          insertText.push(strLength)
        }
        const newText = Object.assign([], textList)
        newText.splice(line, changeLine, ...insertText)
        setTextList(newText)
      }
      caret.current.style.left = parseFloat(left) + width + 'px'
      if (value !== '\n') {
        const newText = Object.assign([], textList)
        newText[line] = newText[line].slice(0, X) + value + newText[line].slice(X)
        setX(X + value.length)
        // 上述代码可以直接替换不用 setTextList, 不过更新起来会非常慢.
        setTextList(newText)
      }
      textarea.current.value = ''
      N = 0
    },
    keyEvent(event) {
      if (stop) return
      clearInterval(timer)
      setShowCursor(true)
      timer = setInterval(() => setShowCursor(prevCursor => !prevCursor), 500)
      const key = {
        Backspace() {
          // console.log(X)
          if (X === 0) {
            if (line === 0) return
            const style = caret.current.style
            const width = utils.getStringLength(textList[line - 1])
            style.top = parseFloat(window.getComputedStyle(caret.current).top) - 20.8 + 'px'
            style.left = width + 'px'
            const text = textList[line - 1]
            if (text.length === 0 || text[text.length - 1] !== '\n') setX(text.length)
            else {
              setX(text.length - 1)
            }
            setLine(line - 1)
            textList.splice(line, 1)
            return
          }
          const newText = Object.assign([], textList)
          utils.caretHorizontalMove(X, false)
          newText[line] = newText[line].slice(0, X - 1) + newText[line].slice(X)
          // console.log(newText)
          setTextList(newText)
          setX(X - 1)
        },
        Enter() {
          const newText = Object.assign([], textList)
          // newText[line] = newText[line] + '\n'
          // newText.splice(line + 1, 0, '')
          const prev = newText[line].slice(0, X) + '\n'
          const end = newText[line
          ].slice(X)
          console.log(end)
          newText[line] = prev
          newText.splice(line + 1, 0, end)
          setTextList(newText)
          setLine(line + 1)
          setX(0)
          const style = caret.current.style
          style.left = '0'
          style.top = parseFloat(window.getComputedStyle(caret.current).top) + 20.8 + 'px'
        },
        ArrowLeft() {
          if (X === 0) return
          utils.caretHorizontalMove(X, false)
          setX(X - 1)
        },
        ArrowRight() {
          if (X === textList[line].length || textList[line][X] === '\n') return
          utils.caretHorizontalMove(X + 1)
          setX(X + 1)
        },
        ArrowUp() {
          const style = caret.current.style
          if (line === 0) {
            style.left = '0'
            setX(0)
          } else if 
          (utils.getStringLength(textList[line].slice(0, X))
          >
          utils.getStringLength(textList[line - 1])
          || textList[line].slice(0, X).length > textList[line - 1].length) {
            style.top = parseFloat(window.getComputedStyle(caret.current).top) - 20.8 + 'px'
            style.left = utils.getStringLength(textList[line - 1]) + 'px'
            const text = textList[line - 1]
            if (text.length === 0 || text[text.length - 1] !== '\n') setX(text.length)
            else setX(text.length - 1)
            setLine(line - 1)
          } else {
            style.top = parseFloat(window.getComputedStyle(caret.current).top) - 20.8 + 'px'
            style.left = utils.getStringLength(textList[line - 1].slice(0, X)) + 'px'
            setLine(line - 1)
          }
        },
        ArrowDown() {
          const style = caret.current.style
          if (line === textList.length - 1) {
            style.left = utils.getStringLength(textList[line]) + 'px'
            setX(textList[line].length)
          } else if 
          (utils.getStringLength(textList[line].slice(0, X))
          >
          utils.getStringLength(textList[line + 1])
          || textList[line].slice(0, X).length > textList[line + 1].length) {
            style.top = parseFloat(window.getComputedStyle(caret.current).top) + 20.8 + 'px'
            style.left = utils.getStringLength(textList[line + 1]) + 'px'
            const text = textList[line + 1]
            if (text.length === 0 || text[text.length - 1] !== '\n') setX(text.length)
            else setX(text.length - 1)
            setLine(line + 1)
          } else {
            style.top = parseFloat(window.getComputedStyle(caret.current).top) + 20.8 + 'px'
            style.left = utils.getStringLength(textList[line + 1].slice(0, X)) + 'px'
            setLine(line + 1)
          }
        }
      }
      if (key[event.key]) key[event.key]()
    },
    onCompositionEnd() { // 中文输入法结束后
      stop = false
      textarea.current.value = ''
      // methods.getText()
    }
  }
  return (
    <div className="write" onClick={methods.toggleCursorState} ref={write}>
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
