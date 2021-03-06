import React, { Component } from 'react';
import { Checkbox, FormElement } from '@jenkins-cd/design-language';
import { propTypes } from './commonProptypes';

export class Boolean extends Component {
    render() {
        const { defaultParameterValue: { value }, description, name, onChange } = this.props;
        return (<FormElement title={ name }>
            <Checkbox {...{ checked: value, label: description, name, onToggle: onChange }} />
        </FormElement>);
    }
}

Boolean.propTypes = propTypes;
