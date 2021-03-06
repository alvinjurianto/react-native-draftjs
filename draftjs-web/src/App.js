import React, { useState, createRef, useEffect } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  getDefaultKeyBinding,
  DefaultDraftBlockRenderMap,
  CompositeDecorator
} from "draft-js";
import { stateFromHTML } from "draft-js-import-html";
import { stateToHTML } from "draft-js-export-html";
import { Map } from "immutable";
import EditorController from "./Components/EditorController/EditorController";

/**
 * For testing the post messages
 * in web
 */
// window.ReactNativeWebView ={};
// window.ReactNativeWebView.postMessage = value => console.log(value);

function App() {
  const _draftEditorRef = createRef();

  const Linkah = props => {
    const { url } = props.contentState.getEntity(props.entityKey).getData();
    return (
      <a href={url} class={"linklink"}>
        {props.children}
      </a>
    );
  };

  const decorator = new CompositeDecorator([
    {
      strategy: findLinkEntities,
      component: Linkah
    }
  ]);

  const [editorState, setEditorState] = useState(
    EditorState.createEmpty(decorator)
  );
  const [placeholder, setPlaceholder] = useState("");
  const [editorStyle, setEditorStyle] = useState("");
  const [styleMap, setStyleMap] = useState({});
  const [blockRenderMap, setBlockRenderMap] = useState(Map({}));
  const [isMounted, setMountStatus] = useState(false);

  useEffect(() => {
    if (!isMounted) {
      setMountStatus(true);
      /**
       * componentDidMount action goes here...
       */
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            isMounted: true
          })
        );
      }
    }
  }, [isMounted]);

  const handleKeyCommand = (command, editorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return true;
    }
    return false;
  };

  const mapKeyToEditorCommand = e => {
    switch (e.keyCode) {
      case 9: // TAB
        const newEditorState = RichUtils.onTab(
          e,
          editorState,
          4 /* maxDepth */
        );
        if (newEditorState !== editorState) {
          setEditorState(newEditorState);
        }
        return;
      default:
        return getDefaultKeyBinding(e);
    }
  };

  const toggleBlockType = blockType => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  const toggleInlineStyle = inlineStyle => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  const setDefaultValue = html => {
    try {
      if (html) {
        setEditorState(EditorState.createWithContent(stateFromHTML(html)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const setEditorPlaceholder = placeholder => {
    setPlaceholder(placeholder);
  };

  const setEditorStyleSheet = styleSheet => {
    setEditorStyle(styleSheet);
  };

  const setEditorStyleMap = editorStyleMap => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        editorStyled: "yay"
      })
    );
    setStyleMap(editorStyleMap);
  };

  const focusTextEditor = () => {
    _draftEditorRef.current && _draftEditorRef.current.focus();
  };

  const blurTextEditor = () => {
    _draftEditorRef.current && _draftEditorRef.current.blur();
  };

  const setEditorBlockRenderMap = renderMapString => {
    try {
      setBlockRenderMap(Map(JSON.parse(renderMapString)));
    } catch (e) {
      setBlockRenderMap(Map({}));
      console.error(e);
    }
  };

  const toggleLink = urlValue => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      "LINK",
      "MUTABLE",
      { url: urlValue }
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(editorState, {
      currentContent: contentStateWithEntity
    });
    setEditorState(
      RichUtils.toggleLink(
        newEditorState,
        newEditorState.getSelection(),
        entityKey
      )
    );
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        url: urlValue
      })
    );
  };

  if (window.ReactNativeWebView) {
    const currentContent = editorState.getCurrentContent();
    const getSelected = editorState.getSelection();
    const anchorKey = getSelected.getAnchorKey();
    const currentContentBlock = currentContent.getBlockForKey(anchorKey);
    const start = getSelected.getStartOffset();
    const end = getSelected.getEndOffset();
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        getSelected: currentContentBlock.getText().slice(start, end)
      })
    );
  }

  window.toggleBlockType = toggleBlockType;
  window.toggleInlineStyle = toggleInlineStyle;
  window.setDefaultValue = setDefaultValue;
  window.setEditorPlaceholder = setEditorPlaceholder;
  window.setEditorStyleSheet = setEditorStyleSheet;
  window.setEditorStyleMap = setEditorStyleMap;
  window.focusTextEditor = focusTextEditor;
  window.blurTextEditor = blurTextEditor;
  window.setEditorBlockRenderMap = setEditorBlockRenderMap;
  window.toggleLink = toggleLink;

  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        editorState: stateToHTML(editorState.getCurrentContent())
      })
    );
  }

  const customBlockRenderMap = DefaultDraftBlockRenderMap.merge(blockRenderMap);

  function findLinkEntities(contentBlock, callback, contentState) {
    contentBlock.findEntityRanges(character => {
      const entityKey = character.getEntity();
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          resulting:
            entityKey !== null &&
            contentState.getEntity(entityKey).getType() === "LINK"
        })
      );
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === "LINK"
      );
    }, callback);
  }
  return (
    <>
      <style>
        {`a span{color:  rgb(48, 80, 192);} .public-DraftEditorPlaceholder-root{position: absolute;color: silver;pointer-events: none;z-index: -10000;}${editorStyle}`}
      </style>
      <Editor
        ref={_draftEditorRef}
        customStyleMap={styleMap}
        blockRenderMap={customBlockRenderMap}
        editorState={editorState}
        onChange={setEditorState}
        handleKeyCommand={handleKeyCommand}
        keyBindingFn={mapKeyToEditorCommand}
        placeholder={placeholder}
        autoCorrect="off"
        autoCapitalize="false"
      />
      <EditorController
        editorState={editorState}
        onToggleBlockType={toggleBlockType}
        onToggleInlineStyle={toggleInlineStyle}
      />
    </>
  );
}

export default App;
