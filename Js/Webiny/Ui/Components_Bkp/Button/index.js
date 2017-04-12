import Webiny from 'Webiny';

class Button extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.state = {
            enabled: true
        };
    }

    disable() {
        this.setState({enabled: false});
    }

    enable() {
        this.setState({enabled: true});
    }
}

Button.defaultProps = {
    size: 'normal',
    type: 'default',
    align: 'normal',
    icon: null,
    className: null,
    style: null,
    label: null,
    onClick: _.noop,
    tooltip: null,
    renderer() {
        const props = _.clone(this.props);
        const {Icon, Tooltip} = props;

        if (props.disabled || !this.state.enabled) {
            props['disabled'] = true;
        }

        const sizeClasses = {
            normal: '',
            large: 'btn-lg',
            small: 'btn-sm'
        };

        const alignClasses = {
            normal: '',
            left: 'pull-left',
            right: 'pull-right'
        };

        const typeClasses = {
            default: 'btn-default',
            primary: 'btn-primary',
            secondary: 'btn-success'
        };

        const classes = this.classSet(
            'btn',
            sizeClasses[props.size],
            alignClasses[props.align],
            typeClasses[props.type],
            props.className
        );

        const icon = this.props.icon && Icon ? <Icon icon={this.props.icon} className="right"/> : null;
        let content = props.children || props.label;
        if (icon) {
            content = <span>{content}</span>;
        }

        let button = <button {..._.pick(props, ['style', 'onClick', 'disabled'])} type="button" className={classes}>{icon} {content}</button>;

        if (this.props.tooltip && Tooltip) {
            button = <Tooltip target={button} placement="top">{this.props.tooltip}</Tooltip>;
        }

        return button;
    }
};

export default Webiny.createComponent(Button, {modules: ['Icon', 'Tooltip']});
