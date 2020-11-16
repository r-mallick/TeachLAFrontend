import React from "react";
import ReactModal from "react-modal";
import * as fetch from "../../../lib/fetch.js";
import sketch from "../../../lib/";
import { ControlledEditor } from "@monaco-editor/react";
import EditorRadio from "./EditorRadio.js";
import ShareSketchModal from "./ShareSketchModal";
import { Button } from "reactstrap";
import OpenPanelButtonContainer from "../../common/containers/OpenPanelButtonContainer";
import { EDITOR_WIDTH_BREAKPOINT } from "../../../constants";
import ViewportAwareButton from "../../common/ViewportAwareButton.js";
import DropdownButtonContainer from "../../common/containers/DropdownButtonContainer";
import { faDownload, faSave, faShare, faCodeBranch } from "@fortawesome/free-solid-svg-icons";
import { SketchThumbnailArray } from "../../Sketches/constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Redirect } from "react-router-dom";

class TextEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editorInstance: null,
      currentLine: 0,
      sketch: null,
      showForkModal: false,
      forking: false,
      forked: false,
      redirectToSketch: false,
      showShareModal: false,
    };
  }

  //==============React Lifecycle Functions===================//

  componentDidMount() {
    window.addEventListener("beforeunload", this.onLeave);
    window.addEventListener("close", this.onLeave);
  }

  componentWillUnmount = () => {
    window.removeEventListener("beforeunload", this.onLeave);
    window.removeEventListener("close", this.onLeave);
  };

  openForkModal = () => {
    this.setState({ showForkModal: true });
  };

  closeForkModal = () => {
    this.setState({ showForkModal: false });
  };

  checkDirty = async () => {
    if (!this.props.dirty) {
      return;
    }

    try {
      let programToUpdate = {};
      programToUpdate[this.props.mostRecentProgram] = {
        code: this.props.code,
      };

      await fetch.updatePrograms(this.props.uid, programToUpdate);
      //TODO: add functionality to be able to tell whether the fetch failed
    } catch (err) {
      console.log(err);
    }
  };

  onLeave = async (ev) => {
    if (this.props.dirty) {
      ev.returnValue = "";
    }
    return ev;
  };

  setEditorInstance = (editorInstance) => {
    this.setState({ editorInstance });
  };

  renderForkModal = () => {
    return (
      <ReactModal
        isOpen={this.state.showForkModal}
        onRequestClose={this.closeForkModal}
        className="fork-modal"
        overlayClassName="profile-image-overlay"
        ariaHideApp={false}
      >
        <h1 className="text-center">Fork This Sketch</h1>
        {!(this.state.forking || this.state.forked) && (
          <p className="text-center">Would you like to create your own copy of this sketch?</p>
        )}
        {this.state.forking ? (
          <p className="text-center">Forking...</p>
        ) : this.state.forked ? (
          <div>
            <p className="text-center">Sketch forked! Go to your sketches to see your new copy!</p>
            <Button color="danger" size="lg" onClick={this.closeForkModal} block>
              Close
            </Button>
            <Button color="success" size="lg" onClick={this.redirectSketch} block>
              Go to Sketches
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Button color="danger" size="lg" onClick={this.closeForkModal} block>
              Cancel
            </Button>
            <Button color="success" size="lg" onClick={this.handleFork} block>
              Fork
            </Button>
          </div>
        )}
      </ReactModal>
    );
  };

  handleFork = async () => {
    this.setState({ forking: true });
    let data = {
      uid: this.props.uid,
      thumbnail: this.props.vthumbnail,
      language: this.props.vlanguage,
      name: this.props.sketchName,
      code: this.props.code,
    };

    try {
      fetch
        .createSketch(data)
        .then((res) => {
          return res.json();
        })
        .then((json) => {
          if (!json.ok) {
            this.setState({
              error: json.error || "Failed to create sketch, please try again later",
            });
            return;
          }
          this.setState({ forking: false, forked: true });
          this.props.addProgram(json.data.key, json.data.programData || {});
        })
        .catch((err) => {
          this.setState({
            error: "Failed to create sketch, please try again later",
          });
          console.log(err);
        });
    } catch (err) {
      console.log(err);
    }
  };

  redirectSketch = () => {
    this.closeForkModal();
    this.setState({ redirectToSketch: true });
  };

  toggleShareModal = () => {
    this.setState((prevState) => ({ showShareModal: !prevState.showShareModal }));
  };

  //returns a theme based on light or dark mode for vs code name
  getCMTheme = (theme) => {
    switch (theme) {
      case "light":
        return "duotone-light";
      case "dark":
      default:
        return "vs-dark"; //%% these themes can be changed if you dont like the color
    }
  };

  renderDropdown = () => <DropdownButtonContainer />;

  renderSketchName = () => <div className="program-sketch-name">{this.props.sketchName}</div>;

  renderBanner = () => {
    let thumbnail =
      SketchThumbnailArray[this.props.viewOnly ? this.props.vthumbnail : this.props.thumbnail];
    return (
      <div className="code-section-banner">
        <OpenPanelButtonContainer />
        <img
          className="program-sketch-thumbnail"
          src={`${process.env.PUBLIC_URL}/img/sketch-thumbnails/${thumbnail}.svg`}
          alt="sketch thumbnail"
        />
        {this.props.viewOnly ? this.renderSketchName() : this.renderDropdown()}
        <div style={{ marginLeft: "auto", marginRight: ".5rem" }}>
          <EditorRadio
            viewMode={this.props.viewMode}
            updateViewMode={this.props.updateViewMode}
            isSmall={this.props.screenWidth <= EDITOR_WIDTH_BREAKPOINT}
          />
        </div>
        {this.props.viewOnly ? (
          this.props.uid ? (
            <ViewportAwareButton
              size="lg"
              onClick={this.openForkModal}
              isSmall={this.props.screenWidth <= EDITOR_WIDTH_BREAKPOINT}
              icon={<FontAwesomeIcon icon={faCodeBranch} />}
              text={"Fork"}
            />
          ) : null
        ) : (
          <ViewportAwareButton
            className="mx-2"
            color="success"
            size="lg"
            onClick={this.props.handleSave}
            isSmall={this.props.screenWidth <= EDITOR_WIDTH_BREAKPOINT}
            icon={<FontAwesomeIcon icon={faSave} />}
            text={this.props.saveText}
          />
        )}
        {!this.props.viewOnly && (
          <ViewportAwareButton
            className="mx-2"
            color="primary"
            size="lg"
            onClick={this.toggleShareModal}
            isSmall={this.props.screenWidth <= EDITOR_WIDTH_BREAKPOINT}
            icon={<FontAwesomeIcon icon={faShare} />}
            text={"Share"}
          />
        )}
        {
          <Button className="mx-2" color="success" size="lg" onClick={this.props.handleDownload}>
            <FontAwesomeIcon icon={faDownload} />
          </Button>
        }
      </div>
    );
  };
  updateCode = (e, newCode) => {
    //if the code's not yet dirty, and the old code is different from the new code, make it dirty
    if (!this.props.dirty && this.props.code !== newCode) {
      this.props.dirtyCode(this.props.mostRecentProgram);
    }
    this.props.setProgramCode(this.props.mostRecentProgram, newCode);
  };

  render() {
    if (this.state.redirectToSketch === true) {
      return <Redirect to="/sketches" />;
    }

    const options = {
      selectOnLineNumbers: true,
    };
    return (
      <div className={`theme-` + this.props.theme} style={{ height: "100%" }}>
        <div className="code-section">
          {this.renderBanner()}
          {this.renderForkModal()}
          <ShareSketchModal
            shareUrl={sketch.constructShareableSketchURL(this.props.mostRecentProgram)}
            showModal={this.state.showShareModal}
            toggleModal={this.toggleShareModal}
          />
          <div
            className="text-editor-container"
            style={{
              height: this.props.screenHeight - 61 - 20,
              minHeight: this.props.screenHeight - 61 - 20,
              maxHeight: this.props.screenHeight - 61 - 20,
            }}
          >
            <ControlledEditor
              language={this.props.viewOnly ? this.props.vlanguage : this.props.language}
              options={options}
              theme={this.getCMTheme(this.props.theme)}
              wrappingIndent="indent"
              value={this.props.code}
              editorDidMount={(editorInstance) => {
                this.setEditorInstance(editorInstance);
              }}
              onChange={this.updateCode}
              onBeforeChange={this.updateCode}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default TextEditor;
/*
  setCurrentLine = (cm) => { //%%set what line the code is currently on
    const { codeMirrorInstance, currentLine } = this.state;
    let { line } = cm.getCursor();
    if (codeMirrorInstance) {
      //removeLineClass removes the back highlight style from the last selected line
      codeMirrorInstance.removeLineClass(currentLine, "wrap", "selected-line");
      //addLineClass adds the style to the newly selected line
      codeMirrorInstance.addLineClass(line, "wrap", "selected-line");
    }
    this.setState({ currentLine: line });
  };
*/
/*

 <CodeMirror
              editorDidMount={(codeMirrorInstance) => {
                codeMirrorInstance.refresh();
                this.setCodeMirrorInstance(codeMirrorInstance);
              }}
              value={this.props.code}
              lineWrapping
              indentWithTabs={true}
              options={options}
              onCursor={(cm) => {
                this.setCurrentLine(cm);
              }}
              onBeforeChange={this.updateCode}
              onChange={this.updateCode}
            />
*/
//json required by CodeMirror
//%%change this up to affect the other
/*
    const options = {
      mode:
        CODEMIRROR_CONVERSIONS[{this.props.viewOnly ? this.props.vlanguage : this.props.language}],
      theme: this.getCMTheme(this.props.theme),
      lineNumbers: true, //text editor has line numbers
      lineWrapping: true, //text editor does not overflow in the x direction, uses word wrap (NOTE: it's like MO Word wrapping, so words are not cut in the middle, if a word overlaps, the whole word is brought to the next line)
      indentWithTabs: true,
    };
    */
/**
 * returns a theme string for the CodeMirror editor, based off of the app's current theme
 * @param {string} theme - the app's current theme
 * @returns {string} the codemirror theme - see https://codemirror.net/demo/theme.html for more info
 */
//%% will have to change theme on editor
/*  %%sets up codemirror and takes the requirements
let CodeMirror = null;
if (typeof window !== "undefined" && typeof window.navigator !== "undefined") {
  // import {Controlled as CodeMirror} from 'react-codemirror2'
  CodeMirror = require("react-codemirror2").Controlled;
  require("codemirror/mode/javascript/javascript.js");
  require("codemirror/mode/htmlmixed/htmlmixed.js");
  require("codemirror/mode/python/python.js");
  require("codemirror/mode/clike/clike.js");
}*/
/**----------Props--------
 * None
 */
/*
  setCodeMirrorInstance = (codeMirrorInstance) => {  //%%say that code mirror has been made
    this.setState({ codeMirrorInstance });
  };
*/
