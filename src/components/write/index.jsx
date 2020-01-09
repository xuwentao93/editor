import React, { useState, useRef } from 'react'
import './index.css'

let stop = false // 中文输入的情况下让文本框的内容正确外弹. 放在函数内部每次渲染的时候都会重置
// 为false, 用于 state 的时候会有延迟性.
let timer = null // 光标显影的定时器.
// let chineseInput = true // 是否刚开始中文输入

export default function Write() { // conclusion: keyEvent 事件一定先于 onCange 事件.
  const [showCursor, setShowCursor] = useState(false) // 光标的显隐.
  const [showCursorController, setShowCursorController] = useState(true)
  const [cursorInterval, setCursorInterval] = useState(null) // 光标显隐的定时器。
  const [textList, setTextList] = useState(['']) // 储存文本内容的数组.
  const [line, setLine] = useState(0) // 光标的行数
  const [X, setX] = useState(0) // 光标, 输入框位置
  // const [chineseText, setChineseText] = useState(null)

  const textarea = useRef() // texaarea
  const caret = useRef() // textarea 和 caret 的父节点.
  const getLength = useRef() // 输入删除文本的长度的一个节点.
  const write = useRef() // 编辑框.
  const textListContainer = useRef() // 所有文本父节点.

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
      const { style } = caret.current
      if (ifAdd) style.left = parseFloat(left) + width + 'px'
      else style.left = parseFloat(left) - width + 'px'
    },
    setCaretLeft(x) {
      caret.current.style.left = utils.getStringLength(textList[line].slice(0, x)) + 'px'
    },
    setCaretTop(number) {
      caret.current.style.top = (line + number) * 20.8 + 'px'
    }
  }

  const methods = {
    editorMousedown(event) {
      textarea.current.focus()
      setShowCursor(false)
    },
    editorMouseup(event) { // 进入编辑器显示光标
      console.log(textList)
      const selection = document.getSelection()
      if (showCursorController) {
        setShowCursor(true)
        setShowCursorController(false)
        timer = setInterval(() => setShowCursor(prevCursor => !prevCursor), 500)
        setCursorInterval(timer)
        // setShowCursor 必须写成函数形式, 否则无法实时更新!
        console.log(selection)
        if (selection.isCollapsed) textarea.current.focus()
      }

      // 点击到页面后光标跳转至对应的地方.
      const height = parseFloat(window.getComputedStyle(textListContainer.current).height)
      const clientX = event.clientX - 30
      const clientY = event.clientY - 100
      const { style } = caret.current
      if (clientY > height) {
        setLine(textList.length - 1)
        setX(textList[textList.length - 1].length)
        style.top = height - 20.8 + 'px'
        style.left = utils.getStringLength(textList[textList.length - 1]) + 'px'
      } else if (clientY < 0) {
        setLine(0)
        setX(0)
        style.top = '0'
        style.left = '0'
      } else {
        const getLine = Math.min(Math.round(clientY / 20.8), textList.length - 1)
        setLine(getLine)
        style.top = getLine * 20.8 + 'px'
        if (clientX < 0) {
          setX(0)
          style.left = '0'
        } else if (clientX > utils.getStringLength(textList[getLine])) {
          setX(textList[getLine].length)
          style.left = utils.getStringLength(textList[getLine]) + 'px'
        } else {
          let str = ''
          for (let i = 0; i < textList[getLine].length; i++) {
            str += textList[getLine][i]
            if (utils.getStringLength(str) >= clientX) {
              if (utils.getStringLength(str) - clientX < clientX - utils.getStringLength(str.slice(0, -1))) {
                setX(i + 1)
                style.left = utils.getStringLength(str) + 'px'
              }
              else {
                setX(i)
                style.left = utils.getStringLength(str.slice(0, -1)) + 'px'
              }
              return
            }
          }
        }
      }
    },
    leaveWrite() { // 离开页面光标消失.
      setShowCursor(false)
      setShowCursorController(true)
      clearInterval(timer)
      clearInterval(cursorInterval)
    },
    getText(event) { // ------------------------------------- getText -------------------------------------
      const { value } = textarea.current
      if (stop) {
        // if (chineseInput) {
        //   chineseInput = false
        //   const prevChineseTest = Object.assign([], textList)
        //   setChineseText(prevChineseTest)
        // }
        // const newText = Object.assign([], textList)
        // if (event.key === 'backspace') {
        //   console.log(1)
        //   newText[line] = newText[line].slice(0, -1)
        // } else {
        //   console.log(event)
        //   newText[line] += value.slice(-1)
        // }
        // setTextList(newText)
        return
      }
      // chineseInput = true
      const { left } = window.getComputedStyle(caret.current)
      const width = utils.getStringLength(value) // 字符串在页面的长度.
      const textWidth = utils.getStringLength(textList[line]) // 当前行的长度.
      const wholeWidth = parseFloat(window.getComputedStyle(write.current).width) - 61 // 编辑框宽度
      if (width + textWidth > wholeWidth) { // 处理文本溢出.
        let str = textList[line].slice(0, X) + value + textList[line].slice(X)
        let changeLine = 1
        if (textList[line][textList[line].length - 1] !== '\n') {
          for (let i = line + 1; i < textList.length; i++) {
            str += textList[i]
            changeLine++
            if (textList[i][textList[i].length - 1] === '\n') break
          }
        }
        const insertText = []
        for (let i = 0; i <= str.length; true) {
          let strLength = ''
          while (utils.getStringLength(strLength + str[i]) < wholeWidth && i !== str.length) {
            strLength += str[i]
            if (str[i] === '\n') {
              i++
              break
            }
            i++
          }
          insertText.push(strLength)
          if (i === str.length) break
        }
        const newText = Object.assign([], textList)
        newText.splice(line, changeLine, ...insertText)
        setTextList(newText)
        const getLineWidth = Math.floor(utils.getStringLength(textList[line].slice(0, X) + value) / wholeWidth)
        const getXWidth = Math.floor(utils.getStringLength(textList[line].slice(0, X) + value) % wholeWidth)
        let xStr = ''
        for (let i = 0; i < newText[line + getLineWidth].length; i++) {
          if (utils.getStringLength(xStr) > getXWidth) break
          xStr += newText[line + getLineWidth][i]
        }
        setLine(line + getLineWidth)
        setX(xStr.length)
        const { style } = caret.current
        style.top = parseFloat(window.getComputedStyle(caret.current).top) + 20.8 * getLineWidth + 'px'
        style.left = utils.getStringLength(xStr) + 'px'
        textarea.current.value = ''
        return
      } 
      // else if ([value][0].includes('↵')) {
      //   console.log(1111)
      //   setLine(line + 1)
      //   setX(X + 1)
      //   const style = caret.current
      //   style.top = parseFloat(window.getComputedStyle(caret.current).top) + 20.8 + 'px'
      //   style.left = '0'
      //   return
      // }
      caret.current.style.left = parseFloat(left) + width + 'px'
      if (value !== '\n') {
        const newText = Object.assign([], textList)
        newText[line] = newText[line].slice(0, X) + value + newText[line].slice(X)
        setX(X + value.length)
        // 上述代码可以直接替换不用 setTextList, 不过更新起来会非常慢.
        setTextList(newText)
      }
      textarea.current.value = ''
    },
    keyEvent(event) {
      if (stop) return
      clearInterval(timer)
      setShowCursor(true)
      timer = setInterval(() => setShowCursor(prevCursor => !prevCursor), 500)
      const { style } = caret.current
      const key = {
        Backspace() {
          // console.log(X)
          if (X === 0) {
            if (line === 0) return
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
          const end = newText[line].slice(X)
          console.log(end)
          newText[line] = prev
          newText.splice(line + 1, 0, end)
          setTextList(newText)
          setLine(line + 1)
          setX(0)
          console.log(X)
          utils.setCaretTop(1)
          utils.setCaretLeft(0)
        },
        ArrowLeft() {
          if (event.metaKey && !event.ctrlKey) {
            if (X === 0) return
            setX(0)
            style.left = '0'
            return
          } else if (event.altKey && !event.metaKey) {
            if (X === 0) return
            let horizontalSite = X
            while (textList[line][horizontalSite - 1] === ' ') horizontalSite--
            const letter = /^[a-zA-Z0-9]$/
            while(letter.test(textList[line][horizontalSite - 1])) horizontalSite--
            if (horizontalSite === X) horizontalSite--
            setX(horizontalSite)
            style.left = parseFloat(utils.getStringLength(textList[line].slice(0, horizontalSite))) + 'px'
            return
          }
          if (X === 0) {
            if (line === 0) return
            setX(textList[line - 1].length)
            style.left = parseFloat(utils.getStringLength(textList[line - 1])) + 'px'
            setLine(line - 1)
            style.top = parseFloat(window.getComputedStyle(caret.current).top) - 20.8 + 'px'
            return
          }
          utils.caretHorizontalMove(X, false)
          setX(X - 1)
        },
        ArrowRight() {
          if (event.metaKey && !event.ctrlKey) {
            if (X === textList[line].length) return
            setX(textList[line].length)
            style.left = utils.getStringLength(textList[line]) + 'px'
            return
          } else if (event.altKey && !event.metaKey) {
            if (X === textList[line].length) return
            let horizontalSite = X
            while (textList[line][horizontalSite] === ' ') horizontalSite++
            const letter = /^[a-zA-Z0-9]$/
            while(letter.test(textList[line][horizontalSite])) horizontalSite++
            if (X === horizontalSite) horizontalSite++
            setX(horizontalSite)
            style.left = parseFloat(utils.getStringLength(textList[line].slice(0, horizontalSite))) + 'px'
            return
          }
          if (X === textList[line].length) {
            if (line === textList.length - 1) return
            setX(0)
            style.left = '0'
            setLine(line + 1)
            style.top = parseFloat(window.getComputedStyle(caret.current).top) + 20.8 + 'px'
            return
          }
          utils.caretHorizontalMove(X + 1)
          setX(X + 1)
        },
        ArrowUp() {
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
        },
      }
      if (key[event.key]) key[event.key]()
    },
    onCompositionEnd() { // 中文输入法结束后
      stop = false
      // console.log(chineseText)
      // while (textList.length > chineseText.length) textList.pop()
      // chineseText.forEach((text, index) => {
      //   textList[index] = text
      // })
      // textarea.current.value = ''
      methods.getText()
    }
  }
  return (
    <div
      ref={write}
      className="write"
      onMouseUp={(event) => methods.editorMouseup(event)}
      onMouseDown={(event) => methods.editorMousedown(event)}
    >
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
      <div className="text-list" ref={textListContainer}>
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
