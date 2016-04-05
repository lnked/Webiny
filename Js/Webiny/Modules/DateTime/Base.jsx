import Webiny from 'Webiny';

class Base extends Webiny.Ui.FormComponent {

    constructor(props) {
        super(props);

        _.assign(this.state, {
            selectedValue: null
        });

        this.bindMethods('onChangeSelectedValue');

        this.valueLink = this.bindTo('selectedValue', this.onChangeSelectedValue);
    }

    setValue() {
        let newValue = this.props.valueLink.value;

        if (this.props.component != 'time') {
            newValue = moment(newValue, this.props.modelFormat);
            newValue = newValue.isValid() ? newValue.format(this.props.inputFormat) : '';
        }

        this.input.val(newValue);

        if (this.props.minDate) {
            this.input.data('DateTimePicker').minDate(new Date(this.props.minDate));
        }
    }

    /**
     * Initialize DateTimePicker
     * @url https://eonasdan.github.io/bootstrap-datetimepicker/
     */
    componentDidMount() {
        super.componentDidMount();
        this.input = $(ReactDOM.findDOMNode(this)).find('input');
        this.input.datetimepicker({
            format: this.props.inputFormat,
            stepping: this.props.stepping,
            keepOpen: false,
            minDate: this.props.minDate ? new Date(this.props.minDate) : false,
            viewMode: this.props.viewMode
        }).on('dp.change', e => {
            let newValue = this.input.val() || null;

            if (newValue && this.props.component != 'time') {
                newValue = e.date.format(this.props.inputFormat);
            }
            this.valueLink.requestChange(newValue);
        });

        this.setValue();
    }

    componentDidUpdate() {
        super.componentDidUpdate();
        this.setValue();
    }

    onChangeSelectedValue(sel) {
        sel = sel || null;
        if (sel && this.props.component != 'time') {
            sel = moment(sel, this.props.inputFormat).format(this.props.modelFormat);
        }
        this.props.valueLink.requestChange(sel);
    }

    render() {
        const cssConfig = {
            'form-group': true,
            'error': this.state.isValid === false,
            'success': this.state.isValid === true
        };

        let label = null;
        if (this.props.label) {
            label = <label key="label" className="control-label">{this.props.label}</label>;
        }

        let validationMessage = null;
        if (this.state.isValid === false) {
            validationMessage = <span className="help-block">{this.state.validationMessage}</span>;
        }

        const props = {
            onBlur: this.validate,
            disabled: this.props.disabled,
            stepping: this.props.stepping,
            readOnly: this.props.readOnly,
            type: 'text',
            className: 'form-control',
            valueLink: this.valueLink,
            placeholder: this.props.placeholder
        };

        return (
            <div className={this.classSet(cssConfig)}>
                {label}
                <div className="input-group date">
                    <input {...props}/>
                    <span className="input-group-addon cursor">
                        <i className="icon-calendar icon_c"></i>
                    </span>
                </div>
                {validationMessage}
            </div>
        );
    }

}

export default Base;
