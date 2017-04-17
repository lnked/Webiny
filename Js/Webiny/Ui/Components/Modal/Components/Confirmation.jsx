import Webiny from 'Webiny';
import Dialog from './Dialog';
import Body from './Body';
import Footer from './Footer';

import styles from '../styles/Modal.css';

class Confirmation extends Webiny.Ui.ModalComponent {

    constructor(props) {
        super(props);

        this.state = {
            loading: false
        };

        this.bindMethods('showLoading,renderContent,renderLoader,renderDialog,onCancel,onConfirm');
    }

    show() {
        this.setState({time: _.now()});
        return super.show();
    }

    showLoading() {
        this.setState({loading: true});
    }

    hideLoading() {
        this.setState({loading: false});
    }

    onCancel() {
        if (!this.isAnimating()) {
            if (_.isFunction(this.props.onCancel)) {
                return this.props.onCancel(this);
            }
            return this.hide();
        }
    }

    /**
     * This function is executed when dialog is confirmed, it handles all the maintenance stuff and executes `onConfirm` callback
     * passed through props and also passes optional `data` object to that callback.
     *
     * It can receive a `data` object containing arbitrary data from your custom form, for example.
     *
     * If no `data` is passed - Confirmation dialog will check if `data` prop is defined and use that as data payload for `onConfirm`
     * callbacks.
     *
     * @param data
     * @returns {Promise.<TResult>}
     */
    onConfirm(data = null) {
        if (!this.isAnimating() && _.isFunction(this.props.onConfirm)) {
            this.showLoading();
            data = _.isPlainObject(data) ? data : this.props.data;
            return Promise.resolve(this.props.onConfirm(data, this)).then(result => {
                if (this.isMounted()) {
                    this.hideLoading();
                }
                if (this.props.autoHide) {
                    return this.hide().then(() => {
                        // If the result of confirmation is a function, it means we need to hide the dialog before executing it.
                        // This is often necessary if the function will set a new state in the view - it will re-render itself and the modal
                        // animation will be aborted (most common case is delete confirmation).
                        if (_.isFunction(result)) {
                            // The result of the function will be passed to `onComplete` and not the function itself
                            result = result();
                        }
                        this.props.onComplete(result);
                    });
                }
            });
        }
    }

    renderLoader() {
        if (this.state.loading) {
            return this.props.renderLoader();
        }
        return null;
    }

    renderContent() {
        let content = this.props.message;
        if (!content) {
            content = this.props.children;
        }

        if (_.isFunction(content)) {
            content = content();
        }
        return content;
    }

    renderDialog() {
        return this.props.renderDialog.call(this, this.onConfirm, this.onCancel, this);
    }
}

Confirmation.defaultProps = _.merge({}, Webiny.Ui.ModalComponent.defaultProps, {
    title: 'Confirmation dialog',
    confirm: 'Yes',
    cancel: 'No',
    onConfirm: _.noop,
    onComplete: _.noop,
    onCancel: null,
    autoHide: true,
    closeOnClick: false,
    data: null,
    renderLoader() {
        const {Loader} = this.props;
        return <Loader/>;
    },
    renderDialog(confirm, cancel) {
        const {Button} = this.props;
        return (
            <Dialog
                modalContainerTag="confirmation-modal"
                className={styles.alertModal}
                onCancel={cancel}
                closeOnClick={this.props.closeOnClick}>
                {this.renderLoader()}
                <Body>
                    <div className="text-center">
                        <h4>{this.props.title}</h4>

                        <p>{this.renderContent()}</p>
                    </div>
                </Body>
                <Footer>
                    <Button type="default" label={this.props.cancel} onClick={cancel}/>
                    <Button type="primary" label={this.props.confirm} onClick={confirm}/>
                </Footer>
            </Dialog>
        );
    }
});

export default Webiny.createComponent(Confirmation, {
    modules: ['Button'],
    api: ['show', 'hide', 'isAnimating']
});