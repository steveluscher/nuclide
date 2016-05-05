'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {
  WatchExpression,
  WatchExpressionList,
} from './WatchExpressionListStore';

import {
  React,
} from 'react-for-atom';
import classnames from 'classnames';
import {AtomInput} from '../../nuclide-ui/lib/AtomInput';
import {injectObservableAsProps} from '../../nuclide-ui/lib/HOC';
import {DebuggerValueComponent} from './DebuggerValueComponent';

type WatchExpressionComponentProps = {
  watchExpressions: WatchExpressionList;
  onAddWatchExpression: (expression: string) => void;
  onRemoveWatchExpression: (index: number) => void;
  onUpdateWatchExpression: (index: number, newExpression: string) => void;
};

export class WatchExpressionComponent extends React.Component {
  // $FlowIssue `watchExpressions` is injected by a higher-order component.
  props: WatchExpressionComponentProps;
  state: {
    rowBeingEdited: ?number;
  };
  coreCancelDisposable: ?IDisposable;

  constructor(props: WatchExpressionComponentProps) {
    super(props);
    (this: any)._renderExpression = this._renderExpression.bind(this);
    (this: any)._onConfirmNewExpression = this._onConfirmNewExpression.bind(this);
    (this: any)._resetExpressionEditState = this._resetExpressionEditState.bind(this);
    (this: any)._onEditorCancel = this._onEditorCancel.bind(this);
    (this: any)._onEditorBlur = this._onEditorBlur.bind(this);
    this.state = {
      rowBeingEdited: null,
    };
  }

  removeExpression(index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.props.onRemoveWatchExpression(index);
  }

  addExpression(expression: string): void {
    this.props.onAddWatchExpression(expression);
  }

  _onConfirmNewExpression(): void {
    const text = this.refs.newExpressionEditor.getText();
    this.addExpression(text);
    this.refs.newExpressionEditor.setText('');
  }

  _onConfirmExpressionEdit(index: number): void {
    const text = this.refs.editExpressionEditor.getText();
    this.props.onUpdateWatchExpression(index, text);
    this._resetExpressionEditState();
  }

  _onEditorCancel(): void {
    this._resetExpressionEditState();
  }

  _onEditorBlur(): void {
    this._resetExpressionEditState();
  }

  _setRowBeingEdited(index: number): void {
    this.setState({
      rowBeingEdited: index,
    });
    if (this.coreCancelDisposable) {
      this.coreCancelDisposable.dispose();
    }
    this.coreCancelDisposable = atom.commands.add(
      'atom-workspace',
      {
        'core:cancel': () => this._resetExpressionEditState(),
      },
    );
    setTimeout(() => {
      if (this.refs.editExpressionEditor) {
        this.refs.editExpressionEditor.focus();
      }
    }, 16);
  }

  _resetExpressionEditState(): void {
    if (this.coreCancelDisposable) {
      this.coreCancelDisposable.dispose();
      this.coreCancelDisposable = null;
    }
    this.setState({rowBeingEdited: null});
  }

  _renderExpression(watchExpression: WatchExpression, index: number): React.Element {
    const {
      expression,
      value,
    } = watchExpression;
    if (index === this.state.rowBeingEdited) {
      return (
        <AtomInput
          className="nuclide-debugger-atom-watch-expression-input"
          key={index}
          onConfirm={this._onConfirmExpressionEdit.bind(this, index)}
          onCancel={this._onEditorCancel}
          onBlur={this._onEditorBlur}
          ref="editExpressionEditor"
          size="sm"
          initialValue={expression}
        />
      );
    }
    const ValueComponent = injectObservableAsProps(
      value.map(v => ({evaluationResult: v})),
      DebuggerValueComponent,
    );
    /* $FlowIssue `evaluationResult` prop is injected by a higher-order component. */
    const valueElement = <ValueComponent />;
    return (
      <div
        className="nuclide-debugger-atom-watch-expression-row"
        key={index}
        onMouseDown={this._setRowBeingEdited.bind(this, index)}>
        <div>
          <span className="nuclide-debugger-atom-watch-expression">
            {expression}
          </span>
          <span className="nuclide-debugger-atom-watch-expression-value">
            {valueElement}
          </span>
        </div>
        <i
          className="icon icon-x nuclide-debugger-atom-watch-expression-xout"
          onMouseDown={this.removeExpression.bind(this, index)}
        />
      </div>
    );
  }

  render(): ?React.Element {
    const {
      watchExpressions,
    } = this.props;
    const expressions = watchExpressions.map(this._renderExpression);
    const addNewExpressionInput = (
      <AtomInput
        className={classnames(
          'nuclide-debugger-atom-watch-expression-input',
          'nuclide-debugger-atom-watch-expression-add-new-input',
        )}
        onConfirm={this._onConfirmNewExpression}
        ref="newExpressionEditor"
        size="sm"
        placeholderText="add new watch expression"
      />
    );
    return (
      <div className="nuclide-debugger-atom-watch-expression-list">
        <h3>Watch Expressions</h3>
        {expressions}
        {addNewExpressionInput}
      </div>
    );
  }
}
