import Webiny from 'Webiny';
const Ui = Webiny.Ui.Components;

class Input extends Webiny.Ui.FormComponent {

    onKeyDown(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }

        switch (e.key) {
            case 'Enter':
                if (this.props.onEnter && this.props.onEnter !== _.noop) {
                    e.preventDefault();
                    this.props.onEnter(e);
                }
                break;
            default:
                break;
        }
    }
}

Input.defaultProps = _.merge({}, Webiny.Ui.FormComponent.defaultProps, {
    delay: 400,
    name: null,
    onEnter: _.noop,
    onKeyDown: _.noop,
    onKeyUp: _.noop,
    placeholder: null,
    readOnly: false,
    type: 'text',
    renderer() {
        const cssConfig = {
            'form-group': true,
            'error': this.state.isValid === false,
            'success': this.state.isValid === true
        };

        const props = {
            onBlur: this.props.validateInput ? this.validate : this.props.onBlur,
            disabled: this.isDisabled(),
            readOnly: this.props.readOnly,
            type: this.props.type,
            className: 'form-control',
            value: this.getValue() || '',
            placeholder: _.get(this.props.placeholder, 'props.children', this.props.placeholder),
            onKeyUp: this.props.onKeyUp,
            onKeyDown: this.props.onKeyDown !== _.noop ? this.props.onKeyDown : this.onKeyDown.bind(this),
            onChange: this.props.onChange
        };

        return (
            <div className={this.classSet(cssConfig, this.props.className)}>
                {this.renderLabel()}
                {this.renderInfo()}

                <div className="input-group">
                    <Webiny.Ui.Components.DelayedOnChange>
                        <input {...props}/>
                    </Webiny.Ui.Components.DelayedOnChange>
                    {this.renderValidationIcon()}
                </div>
                {this.renderDescription()}
                <Webiny.Ui.Components.Animate
                    trigger={this.renderValidationMessage()}
                    show={this.props.showValidationAnimation}
                    hide={this.props.hideValidationAnimation}>
                    {this.renderValidationMessage()}
                </Webiny.Ui.Components.Animate>
            </div>
        );
    }
});

export default Input;
