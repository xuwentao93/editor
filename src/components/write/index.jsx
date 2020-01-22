import React, { useState, useRef, useEffect } from 'react'
import './index.css'

let stop = false // 中文输入的情况下让文本框的内容正确外弹. 放在函数内部每次渲染的时候都会重置
// 为false, 用于 state 的时候会有延迟性.
let timer = null // 光标显影的定时器.
// let chineseInput = true // 是否刚开始中文输入

export default function Write(props) { // conclusion: keyEvent 事件一定先于 onCange 事件.
  const [showCursor, setShowCursor] = useState(false) // 光标的显隐.
  const [showCursorController, setShowCursorController] = useState(true)
  const [cursorInterval, setCursorInterval] = useState(null) // 光标显隐的定时器。
  const [textList, setTextList] = useState(['']) // 储存文本内容的数组.
  const [line, setLine] = useState(0) // 光标的行数
  const [X, setX] = useState(0) // 输入框位置
  // const [chineseText, setChineseText] = useState(null)

  const textarea = useRef() // texaarea
  const caret = useRef() // textarea and caret parent node.
  const getLength = useRef() // 输入删除文本的长度的一个节点.
  const write = useRef() // editor.
  const textListContainer = useRef() // whole text parent node.

  const utils = {
    getStringLength(str) { // get string width in page.
      getLength.current.innerHTML = str
      const { width } = window.getComputedStyle(getLength.current)
      getLength.current.innerHTML = ''
      return parseFloat(width)
    },
    getStringHeight(str) {
      getLength.current.innerHTML = str
      const { height } = window.getComputedStyle(getLength.current)
      getLength.current.innerHTML = ''
      return parseFloat(height)
    },
    caretHorizontalMove(x = X, ifAdd = true) { // set caret horizontal site.
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
      caret.current.style.top = (line + number) * 22 + 'px'
    },
    binaryToGetReplaceTextArray(str, insertText) {
      const wholeWidth = parseFloat(window.getComputedStyle(write.current).width) - 61 // editor width
      for (let i = 0; i <= str.length; true) { // use binary search to optimize performance.
        let strLength = ''
        let prev = i
        let end = str.length - 1
        let mid = Math.floor((prev + end) / 2)
        while (end >= prev) {
          if (utils.getStringLength(str.slice(i, mid)) < wholeWidth
          && utils.getStringLength(str.slice(i, mid + 1)) < wholeWidth
          && utils.getStringHeight(str.slice(i, mid)) < 24) {
            prev = mid + 1
            mid = Math.floor((prev + end) / 2)
          } else if (utils.getStringLength(str.slice(i, mid)) > wholeWidth
          && utils.getStringLength(str.slice(i, mid + 1)) > wholeWidth) {
            end = mid - 1
            mid = Math.floor((prev + end) / 2)
          } else {
            if (str.slice(i, mid).indexOf('\n') !== -1) {
              const point = str.slice(i, mid).indexOf('\n') + i + 1
              strLength = str.slice(i, point)
              i = point
              break
            } else {
              strLength = str.slice(i, mid)
              i = mid
              break
            }
          }
        }
        if (prev > end || i >= str.length) {
          insertText.push(str.slice(i))
          break
        }
        insertText.push(strLength)
      }
    }
  }

  const methods = {
    editorMousedown(event) {
      textarea.current.focus()
      setShowCursor(false)
    },
    editorMouseup(event) { // enter editor to show caret
      console.log(textList)
      const selection = document.getSelection()
      if (showCursorController) {
        setShowCursor(true)
        setShowCursorController(false)
        timer = setInterval(() => setShowCursor(prevCursor => !prevCursor), 500)
        setCursorInterval(timer)
        // setShowCursor Must be wiriten by function! otherwise you can't update instantly!
        // console.log(selection)
        if (selection.isCollapsed) textarea.current.focus()
        else caret.current.focus()
      }

      setTimeout(() => {
        console.log(document.activeElement)
      }, 0);
      // click to check cursor position.
      const height = parseFloat(window.getComputedStyle(textListContainer.current).height)
      const clientX = event.clientX - 30
      const clientY = event.clientY - 100
      const { style } = caret.current
      if (clientY > height) {
        setLine(textList.length - 1)
        setX(textList[textList.length - 1].length)
        style.top = height - 22 + 'px'
        style.left = utils.getStringLength(textList[textList.length - 1]) + 'px'
      } else if (clientY < 0) {
        setLine(0)
        setX(0)
        style.top = '0'
        style.left = '0'
      } else {
        const getLine = Math.min(Math.round(clientY / 22), textList.length - 1)
        setLine(getLine)
        style.top = getLine * 22 + 'px'
        if (clientX < 0) {
          setX(0)
          style.left = '0'
        } else if (clientX > utils.getStringLength(textList[getLine])) {
          textList[getLine][textList[getLine].length - 1] === '\n'
          ? setX(textList[getLine].length - 1)
          : setX(textList[getLine].length)
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
      let { value } = textarea.current
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
      if (value[value.length - 1] === '\n') value = value.slice(0, -1)
      const { left } = window.getComputedStyle(caret.current)
      const width = utils.getStringLength(value) // input string width in page.
      const textWidth = utils.getStringLength(textList[line]) // current line width.
      const wholeWidth = parseFloat(window.getComputedStyle(write.current).width) - 61 // editor width
      const height = parseFloat(utils.getStringHeight(value))
      if (width + textWidth > wholeWidth || height > 22) { // deal with text overflow.
        console.log('text overflow')
        const current = textList[line]
        let str = current.slice(0, X) + value + current.slice(X) // str是当前行插入的文本.
        let changeLine = 1
        if (current[current.length - 1] !== '\n') {
          for (let i = line + 1; i < textList.length; i++) {
            str += textList[i]
            changeLine++
            if (textList[i][textList[i].length - 1] === '\n') break
          }
        }
        const insertText = []
        utils.binaryToGetReplaceTextArray(str, insertText)
        const newText = Object.assign([], textList)
        newText.splice(line, changeLine, ...insertText)
        setTextList(newText)
        const getCursorStr = current.slice(0, X) + value
        const testArray = []
        utils.binaryToGetReplaceTextArray(getCursorStr, testArray)
        console.log(testArray)
        const length2 = testArray.length - 1
        const x = testArray[testArray.length - 1].length
        setLine(line + length2)
        setX(x)
        const { style } = caret.current
        style.top = parseFloat(window.getComputedStyle(caret.current).top) + 22 * length2 + 'px'
        style.left = utils.getStringLength(testArray[testArray.length - 1]) + 'px'
        // console.log(value.length)
        // const getLineWidth = Math.floor(utils.getStringLength(textList[line].slice(0, X)
        //   + utils.getStringLength(value)) / wholeWidth)
        // const getXWidth = Math.floor(utils.getStringLength(textList[line].slice(0, X)
        //   + utils.getStringLength(value)) % wholeWidth)
        // let xStr = ''
        // for (let i = 0; i < newText[line + getLineWidth].length; i++) {
        //   if (utils.getStringLength(xStr) > getXWidth) break
        //   xStr += newText[line + getLineWidth][i]
        // }
        // setLine(line + getLineWidth)
        // console.log(getLineWidth)
        // setX(xStr.length)
        // const { style } = caret.current
        // style.top = parseFloat(window.getComputedStyle(caret.current).top) + 22 * getLineWidth + 'px'
        // style.left = utils.getStringLength(xStr) + 'px'
        textarea.current.value = ''
        return
      }
      caret.current.style.left = parseFloat(left) + width + 'px'
      if (value !== '\n') {
        const newText = Object.assign([], textList)
        newText[line] = newText[line].slice(0, X) + value + newText[line].slice(X)
        setX(X + value.length)
        setTextList(newText)
      }
      textarea.current.value = ''
    },
    keyEvent(event) {
      if (stop) return
      console.log(1)
      textarea.current.focus()
      clearInterval(timer)
      setShowCursor(true)
      timer = setInterval(() => setShowCursor(prevCursor => !prevCursor), 500)
      const { style } = caret.current
      const key = {
        Backspace() {
          if (event.metaKey && !event.ctrlKey) {
            if (X === 0) return
            const newText = Object.assign([], textList)
            newText[line] = newText[line].slice(X)
            setTextList(newText)
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
            const newText = Object.assign([], textList)
            newText[line] = newText[line].slice(0, horizontalSite) + newText[line].slice(X)
            setTextList(newText)
            setX(horizontalSite)
            style.left = parseFloat(utils.getStringLength(textList[line].slice(0, horizontalSite))) + 'px'
            return
          }
          // console.log(X)
          if (X === 0) {
            if (line === 0) return
            const width = utils.getStringLength(textList[line - 1])
            style.top = parseFloat(window.getComputedStyle(caret.current).top) - 22 + 'px'
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
        Delete() {
          if (event.metaKey && !event.ctrlKey) {
            if (X === textList[line].length) return
            const newText = Object.assign([], textList)
            newText[line] = newText[line].slice(0, X)
            setTextList(newText)
            return
          } else if (event.altKey && !event.metaKey) {
            if (X === textList[line].length) return
            let horizontalSite = X
            while (textList[line][horizontalSite] === ' ') horizontalSite++
            const letter = /^[a-zA-Z0-9]$/
            while(letter.test(textList[line][horizontalSite])) horizontalSite++
            if (X === horizontalSite) horizontalSite++
            const newText = Object.assign([], textList)
            newText[line] = newText[line].slice(0, X) +
            newText[line].slice(horizontalSite, newText[line].length)
            setTextList(newText)
            return
          }
          // console.log(X)
          if (X === textList[line].length) {
            if (line === 0) return
            const width = utils.getStringLength(textList[line - 1])
            style.top = parseFloat(window.getComputedStyle(caret.current).top) - 22 + 'px'
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
            textList[line - 1][textList[line - 1].length - 1] === '\n'
            ? setX(textList[line - 1].length - 1)
            : setX(textList[line - 1].length)
            style.left = parseFloat(utils.getStringLength(textList[line - 1])) + 'px'
            setLine(line - 1)
            style.top = parseFloat(window.getComputedStyle(caret.current).top) - 22 + 'px'
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
          if (X === textList[line].length || textList[line][X] === '\n') {
            if (line === textList.length - 1) return
            setX(0)
            style.left = '0'
            setLine(line + 1)
            style.top = parseFloat(window.getComputedStyle(caret.current).top) + 22 + 'px'
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
            style.top = parseFloat(window.getComputedStyle(caret.current).top) - 22 + 'px'
            style.left = utils.getStringLength(textList[line - 1]) + 'px'
            const text = textList[line - 1]
            if (text.length === 0 || text[text.length - 1] !== '\n') setX(text.length)
            else setX(text.length - 1)
            setLine(line - 1)
          } else {
            style.top = parseFloat(window.getComputedStyle(caret.current).top) - 22 + 'px'
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
            style.top = parseFloat(window.getComputedStyle(caret.current).top) + 22 + 'px'
            style.left = utils.getStringLength(textList[line + 1]) + 'px'
            const text = textList[line + 1]
            if (text.length === 0 || text[text.length - 1] !== '\n') setX(text.length)
            else setX(text.length - 1)
            setLine(line + 1)
          } else {
            style.top = parseFloat(window.getComputedStyle(caret.current).top) + 22 + 'px'
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

  useEffect(() => {
    props.setText(textList)
  }, [props, textList])

  return (
    <div
      ref={write}
      className="write"
      onMouseUp={(event) => methods.editorMouseup(event)}
      onMouseDown={(event) => methods.editorMousedown(event)}
    >
      <div className="caret" ref={caret} tabIndex="4" onKeyDown={() => textarea.current.focus()}>
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
