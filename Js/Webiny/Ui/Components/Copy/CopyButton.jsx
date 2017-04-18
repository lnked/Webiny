import Webiny from 'Webiny';

class CopyButton extends Webiny.Ui.Component {
    componentDidMount() {
        super.componentDidMount();
        this.interval = setInterval(() => {
            const dom = ReactDOM.findDOMNode(this);
            if (dom) {
                clearInterval(this.interval);
                this.interval = null;
                this.setup();
            }
        }, 100);
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.clipboard.destroy();
    }

    setup() {
        console.log('Button DOM', ReactDOM.findDOMNode(this));
        this.clipboard = new this.props.Clipboard(ReactDOM.findDOMNode(this), {
            text: () => {
                return this.props.value;
            }
        });

        this.clipboard.on('success', () => {
            const onSuccessMessage = this.props.onSuccessMessage;
            if (_.isFunction(onSuccessMessage)) {
                onSuccessMessage();
            } else if (_.isString(onSuccessMessage)) {
                Webiny.Growl.info(onSuccessMessage);
            }
        });
    }
}

CopyButton.defaultProps = {
    label: 'Copy',
    onSuccessMessage: 'Copied to clipboard!',
    onCopy: _.noop,
    style: null,
    value: null,
    renderer() {
        const props = _.omit(this.props, ['renderer', 'onSuccessMessage', 'onCopy', 'value']);
        const {Button} = props;

        return <Button {...props}/>;
    }
};

export default Webiny.createComponent(CopyButton, {
    modules: {
        Button: 'Button',
        Clipboard: () => import('clipboard')
    }
});
