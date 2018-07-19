import React from 'react'
import {connect} from 'react-redux'
import Output from '../components/Output.js'
import Editor from '../index.js'
import {setWorkingLanguage, setMode} from '../../../actions/textEditorActions'
import {clearOutput} from '../../../actions/outputActions'
import {nameToMode} from '../../../constants/helpers.js'

const mapStateToProps = (state, ownProps) => {
  let focusedEditor = state.app.textEditorReducers.focusedEditor
  return {
    runResult: state.app.outputReducers.runResult,
    mode: focusedEditor && focusedEditor.program ? nameToMode(focusedEditor.program.language): "python",
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    clearOutput: () => {
      dispatch(clearOutput())
    }
  }
}

const OutputContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Output)

export default OutputContainer
