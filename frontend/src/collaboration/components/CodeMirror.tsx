// src/codemirror.tsx
import React, {useEffect, useRef} from 'react';
import {EditorState, Compartment, type Extension} from '@codemirror/state';
import {
  EditorView,
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  lineNumbers,
  highlightActiveLineGutter,
} from '@codemirror/view';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
} from '@codemirror/language';

import {javascript} from '@codemirror/lang-javascript';
import {python} from '@codemirror/lang-python';
import {cpp} from '@codemirror/lang-cpp';
import {java} from '@codemirror/lang-java';

import {defaultKeymap, history, historyKeymap, indentMore, indentLess} from '@codemirror/commands';
import {searchKeymap, highlightSelectionMatches} from '@codemirror/search';
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete';
import {lintKeymap} from '@codemirror/lint';
import {yCollab} from 'y-codemirror.next';
import * as Y from 'yjs';
import {Awareness} from 'y-protocols/awareness';

const languageCompartment = new Compartment();

const languageMap: { [key: string]: () => Extension } = {
  javascript: () => javascript(),
  python: () => python(),
  cpp: () => cpp(),
  java: () => java(),
  default: () => [], // plain text mode
};

interface CodeMirrorProps {
  ytext: Y.Text;
  awareness: Awareness;
  languageConfig: string;
}

export default function CodeMirror({ytext, awareness, languageConfig}: CodeMirrorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current || !ytext || !awareness) return;

    const lazyInitialLang = languageMap[languageConfig.toLowerCase()] || languageMap.default;
    const initialLanguageExtension = lazyInitialLang();

    // Create the editor view with yCollab extension
    const view = new EditorView({
      doc: ytext.toString(),
      parent: editorRef.current,
      extensions: [
        // A line number gutter
        lineNumbers(),
        // A gutter with code folding markers
        foldGutter(),
        // Replace non-printable characters with placeholders
        highlightSpecialChars(),
        // The undo history
        history(),
        // Replace native cursor/selection with our own
        drawSelection(),
        // Show a drop cursor when dragging over the editor
        dropCursor(),
        // Allow multiple cursors/selections
        EditorState.allowMultipleSelections.of(true),
        // Re-indent lines when typing specific input
        indentOnInput(),
        // Highlight syntax with a default style
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        // Dyanmic configuration for language mode
        languageCompartment.of(initialLanguageExtension),
        // Highlight matching brackets near cursor
        bracketMatching(),
        // Automatically close brackets
        closeBrackets(),
        // Load the autocompletion system
        autocompletion(),
        // Allow alt-drag to select rectangular regions
        rectangularSelection(),
        // Change the cursor to a crosshair when holding alt
        crosshairCursor(),
        // Style the current line specially
        highlightActiveLine(),
        // Style the gutter for current line specially
        highlightActiveLineGutter(),
        // Highlight text that matches the selected text
        highlightSelectionMatches(),
        // Yjs collaboration extension for CodeMirror 6
        yCollab(ytext, awareness),
        keymap.of([
          {
            key: "Tab",
            preventDefault: true,
            run: indentMore,
          },
          {
            key: "Shift-Tab",
            preventDefault: true,
            run: indentLess,
          },

          // Closed-brackets aware backspace
          ...closeBracketsKeymap,
          // A large set of basic bindings
          ...defaultKeymap,
          // Search-related keys
          ...searchKeymap,
          // Redo/undo keys
          ...historyKeymap,
          // Code folding bindings
          ...foldKeymap,
          // Autocompletion keys
          ...completionKeymap,
          // Keys related to the linter system
          ...lintKeymap,
        ]),
      ],
    });

    viewRef.current = view;

    // Cleanup function
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [ytext, awareness]);

  // Effect to handle language changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const newLazyLangFn = languageMap[languageConfig.toLowerCase()] || languageMap.default;
    const newExtension = newLazyLangFn();

    // Reconfigures compartment with the new language extension
    view.dispatch({
      effects: languageCompartment.reconfigure(newExtension),
    });
  }, [languageConfig]);

  return (
    <div
      ref={editorRef}
      style={{
        border: '1px solid #ccc',
        borderRadius: '4px',
        height: '400px',
        overflow: 'auto',
      }}
    />
  );
}
